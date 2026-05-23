import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    const body = await safeJsonParse(req)
    const validated = changePasswordSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: 'Please enter your current password and a new password of at least 8 characters' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase auth is not configured' }, { status: 500 })
    }

    const verifier = createSupabaseClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: currentStaff.email,
      password: validated.data.currentPassword,
    })

    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin.auth.admin.updateUserById(currentStaff.id, {
      password: validated.data.newPassword,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
