import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

// GET — validate token before showing the reset form
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })

  const { data } = await supabaseAdmin
    .from('password_reset_tokens')
    .select('id, expires_at, used_at')
    .eq('token', token)
    .maybeSingle()

  if (!data || data.used_at || new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true })
}

// POST — apply the new password
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Validate token
    const { data: tokenRecord } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, staff_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (!tokenRecord || tokenRecord.used_at || new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired or is invalid.' }, { status: 400 })
    }

    // Update Supabase auth password
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenRecord.staff_id,
      { password }
    )
    if (authError) {
      console.error('Auth password update error:', authError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Update bcrypt hash in staff table
    const passwordHash = await bcrypt.hash(password, 12)
    await supabaseAdmin
      .from('staff')
      .update({ password_hash: passwordHash })
      .eq('id', tokenRecord.staff_id)

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRecord.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
