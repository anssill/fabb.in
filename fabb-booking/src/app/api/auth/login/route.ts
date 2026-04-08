import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    // Step 1: Rate limiting check
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: failCount } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact' })
      .eq('email', email.toLowerCase())
      .eq('success', false)
      .gte('attempted_at', fifteenMinutesAgo)

    if ((failCount ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Step 2: Find staff by email
    const { data: staffRecord } = await supabaseAdmin
      .from('staff')
      .select('id, email, password_hash, status, role, setup_completed, business_id, branch_id, name')
      .eq('email', email.toLowerCase())
      .single()

    const logAttempt = async (success: boolean) => {
      await supabaseAdmin.from('login_attempts').insert({
        email: email.toLowerCase(),
        ip_address: ip,
        success,
      })
    }

    // Step 3: Validate email exists
    if (!staffRecord || !staffRecord.password_hash) {
      await logAttempt(false)
      const remaining = 5 - ((failCount ?? 0) + 1)
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `No account found with this email. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
              : 'No account found with this email.',
          code: 'INVALID_CREDENTIALS',
        },
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
          error:
            remaining > 0
              ? `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
              : 'Incorrect password. Account temporarily locked.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    // Step 6: Success — sign in via Supabase Auth
    await logAttempt(true)
    await supabaseAdmin
      .from('staff')
      .update({ last_login: new Date().toISOString(), failed_login_attempts: 0 })
      .eq('id', staffRecord.id)

    // Use signInWithPassword via the admin API workaround:
    // We sign in the user by generating a magic link and exchanging it
    const { data: { user: authUser }, error: signInError } = await supabaseAdmin.auth.admin.getUserById(staffRecord.id)

    if (signInError || !authUser) {
      return NextResponse.json(
        { error: 'Failed to authenticate. Please try again.', code: 'SESSION_ERROR' },
        { status: 500 }
      )
    }

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
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL' },
      { status: 500 }
    )
  }
}
