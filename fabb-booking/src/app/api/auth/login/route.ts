import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const isServiceRoleValid = serviceRoleKey && serviceRoleKey !== 'YOUR_SERVICE_ROLE_KEY_HERE'
const supabaseClient = createClient(
  supabaseUrl,
  isServiceRoleValid ? serviceRoleKey : supabaseAnonKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const cleanEmail = email.toLowerCase()

    // Step 1: Rate limiting check
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: failCount } = await supabaseClient
      .from('login_attempts')
      .select('*', { count: 'exact' })
      .eq('email', cleanEmail)
      .eq('success', false)
      .gte('attempted_at', fifteenMinutesAgo)

    if ((failCount ?? 0) >= 10) { // Relaxed rate limit for dev
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Step 2: Find staff by email
    const { data: staffRecord, error: staffError } = await supabaseClient
      .from('staff')
      .select('id, email, password_hash, status, role, setup_completed, business_id, branch_id, name')
      .eq('email', cleanEmail)
      .single()

    const logAttempt = async (success: boolean) => {
      await supabaseClient.from('login_attempts').insert({
        email: cleanEmail,
        ip_address: ip,
        success,
      })
    }

    // Step 3: Validate email exists
    if (staffError || !staffRecord || !staffRecord.password_hash) {
      await logAttempt(false)
      return NextResponse.json(
        { error: 'No account found with this email.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // Step 4: Check account status
    if (staffRecord.status === 'suspended') {
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
          error: remaining > 0 ? `Incorrect password. ${remaining} attempts remaining.` : 'Incorrect password.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    // Step 6: Success
    await logAttempt(true)
    await supabaseClient
      .from('staff')
      .update({ last_login: new Date().toISOString(), failed_login_attempts: 0 })
      .eq('id', staffRecord.id)

    // Return info. Note: Client-side session creation should ideally happen via supabase.auth.signInWithPassword
    return NextResponse.json({
      success: true,
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
