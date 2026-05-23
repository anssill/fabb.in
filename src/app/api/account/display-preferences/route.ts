import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const displayPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MMM-YYYY']),
  currencyFormat: z.enum(['indian', 'international']),
})

export async function PATCH(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    const body = await safeJsonParse(req)
    const validated = displayPreferencesSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: current, error: readError } = await admin
      .from('staff')
      .select('custom_permissions')
      .eq('id', currentStaff.id)
      .single()

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 })
    }

    const customPermissions =
      current?.custom_permissions && typeof current.custom_permissions === 'object' && !Array.isArray(current.custom_permissions)
        ? current.custom_permissions as Record<string, unknown>
        : {}

    const nextCustomPermissions = {
      ...customPermissions,
      display_preferences: validated.data,
    }

    const { error } = await admin
      .from('staff')
      .update({ custom_permissions: nextCustomPermissions, updated_at: new Date().toISOString() })
      .eq('id', currentStaff.id)
      .eq('business_id', currentStaff.business_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: validated.data })
  } catch (error) {
    console.error('Display preferences update error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
