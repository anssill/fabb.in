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

    // Verify token to get the user ID
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const { password } = await safeJsonParse(req)

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Invalid password format' }, { status: 400 })
    }

    // Since they are authenticated via a recovery link, we can update their Auth password directly
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    )
    if (authError) {
      console.error('Auth password update error:', authError)
      return NextResponse.json({ error: 'Failed to update authentication password' }, { status: 500 })
    }

    // Now update bcrypt hash in staff table to keep local login parity
    const passwordHash = await bcrypt.hash(password, 12)
    await supabaseAdmin
      .from('staff')
      .update({ password_hash: passwordHash })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
