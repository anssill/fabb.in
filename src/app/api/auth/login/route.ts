import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
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

    // Step 2: Find staff by email
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, email, password_hash, status, role, setup_completed, business_id, branch_id, name')
      .eq('email', cleanEmail)
      .single()

    const logAttempt = async (success: boolean) => {
      await supabaseAdmin.from('login_attempts').insert({
        email: cleanEmail,
        ip_address: ip,
        success,
      })
    }

    // Step 3: Validate email exists
    if (staffError || !staffRecord || !staffRecord.password_hash) {
      await logAttempt(false)
      return NextResponse.json(
        { error: 'No account found with this email. Contact your business admin.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // Step 4: Check account status
    if (staffRecord.status === 'suspended' || staffRecord.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Contact your administrator.', code: 'SUSPENDED' },
        { status: 403 }
      )
    }

    // Step 5: Verify password
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

    // Step 6: Log success and update last login
    await logAttempt(true)
    await supabaseAdmin
      .from('staff')
      .update({ last_login: new Date().toISOString(), failed_login_attempts: 0 })
      .eq('id', staffRecord.id)

    // Step 7: Create Supabase session via signInWithPassword
    // The Supabase auth password is kept in sync with our bcrypt hash
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (sessionError || !sessionData?.session) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json({ error: 'Failed to create session', code: 'SESSION_ERROR' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
      staff: {
        id: staffRecord.id,
        name: staffRecord.name,
        role: staffRecord.role,
        setup_completed: staffRecord.setup_completed,
        business_id: staffRecord.business_id,
        branch_id: staffRecord.branch_id,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 })
  }
}
