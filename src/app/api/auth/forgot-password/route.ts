import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getAdmin()
    const { email } = await safeJsonParse(req)

    // Check if staff exists
    const { data: staffRecord } = await supabaseAdmin
      .from('staff')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (!staffRecord) {
      return NextResponse.json(
        { error: 'No account found for this email.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Send native Supbase email which doesn't require SMTP/Resend setup!
    const origin = req.headers.get('origin') || new URL(req.url).origin
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })

    if (resetError) {
      console.error('Supabase naive reset error:', resetError)
      return NextResponse.json({ error: 'Failed to send reset email via Supabase' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
