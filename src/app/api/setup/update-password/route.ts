// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Get authenticated user from session cookie
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Update Supabase auth password via admin
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
    if (authError) {
      console.error('Auth password update error:', authError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Update bcrypt hash in staff table
    const passwordHash = await bcrypt.hash(password, 12)
    const { error: staffError } = await supabaseAdmin
      .from('staff' as any)
      .update({ password_hash: passwordHash })
      .eq('id', user.id)

    if (staffError) {
      console.error('Staff password hash update error:', staffError)
      return NextResponse.json({ error: 'Failed to update staff record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

