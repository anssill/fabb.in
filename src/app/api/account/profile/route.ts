import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  profile_photo_url: z.string().url().nullable().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    const body = await safeJsonParse(req)
    const validated = profileSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const data = validated.data
    const updatePayload = {
      ...(Object.prototype.hasOwnProperty.call(data, 'name') ? { name: data.name } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'phone') ? { phone: data.phone?.trim() || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'profile_photo_url') ? { profile_photo_url: data.profile_photo_url } : {}),
      updated_at: new Date().toISOString(),
    }

    const admin = getSupabaseAdmin()
    const { data: staff, error } = await admin
      .from('staff')
      .update(updatePayload)
      .eq('id', currentStaff.id)
      .eq('business_id', currentStaff.business_id)
      .select('id, name, email, phone, role, status, business_id, branch_id, setup_completed, profile_photo_url, permissions, pin_hash')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Account profile update error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
