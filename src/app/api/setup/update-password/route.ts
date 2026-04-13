import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await safeJsonParse(req)
    const validated = passwordSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        error: validated.error.issues[0]?.message || 'Invalid password' 
      }, { status: 400 })
    }


    const { password } = validated.data

    // Get authenticated user from session cookie
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Update Supabase auth password via admin client to bypass email confirmation if needed
    // or just to ensure it's synced correctly in our staff table too
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
    
    if (authError) {
      console.error('Auth password update error:', authError)
      return NextResponse.json({ error: 'Failed to update authentication password' }, { status: 500 })
    }

    // Update bcrypt hash in staff table
    const passwordHash = await bcrypt.hash(password, 12)
    const { error: staffError } = await supabaseAdmin
      .from('staff')
      .update({ 
        password_hash: passwordHash,
        setup_completed: true // Usually this is part of the first-time setup
      })
      .eq('id', user.id)

    if (staffError) {
      console.error('Staff password hash update error:', staffError)
      return NextResponse.json({ error: 'Failed to update local staff record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

