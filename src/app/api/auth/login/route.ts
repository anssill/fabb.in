import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { safeJsonParse } from '@/lib/api-utils'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await safeJsonParse(req)
    const validated = loginSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid email or password format', code: 'INVALID_INPUT' }, { status: 400 })
    }

    const { email, password } = validated.data
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const cleanEmail = email.toLowerCase()

    // Step 1: Rate limiting check
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: failCount } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact' })
      .eq('email', cleanEmail)
      .eq('success', false)
      .gte('attempted_at', fifteenMinutesAgo)

    if ((failCount ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Your account is locked for 15 minutes.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    const logAttempt = async (success: boolean) => {
      await supabaseAdmin.from('login_attempts').insert({
        email: cleanEmail,
        ip_address: ip,
        success,
      })
    }

    // Step 2: Find staff by email
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, email, password_hash, status, role, setup_completed, business_id, branch_id, name')
      .eq('email', cleanEmail)
      .maybeSingle()

    // Step 3: Branching Logic - Check if we use bcrypt or direct Supabase Auth
    let skipBcrypt = false

    if (staffRecord) {
      // Check account status
      if (staffRecord.status === 'suspended' || staffRecord.status === 'rejected') {
        return NextResponse.json(
          { error: 'Your account has been suspended. Contact your administrator.', code: 'SUSPENDED' },
          { status: 403 }
        )
      }

      // If they have a hash, verify it
      if (staffRecord.password_hash) {
        const passwordValid = await bcrypt.compare(password, staffRecord.password_hash)
        if (!passwordValid) {
          await logAttempt(false)
          const remaining = 5 - ((failCount ?? 0) + 1)
          return NextResponse.json(
            {
              error: remaining > 0
                ? `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
                : 'Incorrect password. Account temporarily locked.',
              code: 'INVALID_CREDENTIALS',
            },
            { status: 401 }
          )
        }
      } else {
        // Staff exists but no password_hash (manual user setup)
        skipBcrypt = true
      }
    } else {
      // No staff record - might be a manual user in Supabase
      skipBcrypt = true
    }

    // Step 4: Create Supabase session via signInWithPassword
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (sessionError || !sessionData?.session) {
      await logAttempt(false)
      // If we skipped bcrypt and this failed, it's definitely invalid credentials
      return NextResponse.json(
        { error: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // Step 5: Post-login synchronization (The "Auto-Sync")
    let finalStaff = staffRecord
    const supabaseUser = sessionData.user

    if (!finalStaff) {
      // Auto-create staff record for manual Supabase users
      const { data: newStaff, error: createError } = await supabaseAdmin
        .from('staff')
        .insert({
          id: supabaseUser.id,
          email: cleanEmail,
          name: supabaseUser.user_metadata?.name || email.split('@')[0],
          status: 'active',
          role: 'admin', // Default for manual sync users
          setup_completed: false,
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Failed to auto-create staff record:', createError)
        // We still allow login but they might have issues in the dashboard
      } else {
        finalStaff = newStaff
      }
    } else if (!finalStaff.password_hash) {
      // Update missing password hash for future bcrypt checks
      const newHash = await bcrypt.hash(password, 12)
      await supabaseAdmin
        .from('staff')
        .update({ password_hash: newHash })
        .eq('id', finalStaff.id)
    }

    // Step 6: Log success and update last login
    await logAttempt(true)
    if (finalStaff) {
      await supabaseAdmin
        .from('staff')
        .update({ last_login: new Date().toISOString(), failed_login_attempts: 0 })
        .eq('id', finalStaff.id)
    }

    // Step 7: Determine setup status
    // If business_id or branch_id is missing, they definitely haven't completed setup
    const isSetupCompleted = finalStaff?.setup_completed && finalStaff?.business_id && finalStaff?.branch_id

    return NextResponse.json({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
      staff: finalStaff ? {
        id: finalStaff.id,
        name: finalStaff.name,
        role: finalStaff.role,
        setup_completed: !!isSetupCompleted,
        business_id: finalStaff.business_id,
        branch_id: finalStaff.branch_id,
      } : {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || email.split('@')[0],
        role: 'admin',
        setup_completed: false,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 })
  }
}


