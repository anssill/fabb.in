import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const resetPasswordSchema = z.object({
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await safeJsonParse(req)
    const validated = resetPasswordSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token)

    if (userError || !user?.id || !user.email) {
      return NextResponse.json({ error: 'Reset link is invalid or expired' }, { status: 401 })
    }

    const { data: staff } = await admin
      .from('staff')
      .select('id, status')
      .or(`id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle()

    if (!staff) {
      return NextResponse.json({ error: 'No staff account found for this email' }, { status: 403 })
    }

    if (staff.status === 'suspended') {
      return NextResponse.json({ error: 'This staff account is suspended' }, { status: 403 })
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: validated.data.password,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
