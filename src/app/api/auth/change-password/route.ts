import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

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

    // Validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]

    // Verify token to get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await safeJsonParse(req)

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    // Fetch the staff record to verify current password
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, password_hash')
      .eq('id', user.id)
      .maybeSingle()

    if (staffError || !staffRecord) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
    }

    // Verify current password against stored hash
    const isValid = await bcrypt.compare(currentPassword, staffRecord.password_hash ?? '')
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Update password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })
    if (authError) {
      console.error('Auth password update error:', authError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Update bcrypt hash in staff table
    const newHash = await bcrypt.hash(newPassword, 12)
    await supabaseAdmin.from('staff').update({ password_hash: newHash }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Change password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
