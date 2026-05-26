import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { canManageBusiness, getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const updateBranchSettingsSchema = z.object({
  branchId: z.string().uuid(),
  settings: z.record(z.string(), z.any()),
})

export async function PATCH(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    if (!canManageBusiness(currentStaff.role)) {
      return NextResponse.json({ error: 'You do not have permission to edit settings' }, { status: 403 })
    }

    const body = await safeJsonParse(req)
    const validated = updateBranchSettingsSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { branchId, settings } = validated.data
    if (
      Object.prototype.hasOwnProperty.call(settings, 'operations') &&
      !['owner', 'admin', 'super_admin'].includes(currentStaff.role)
    ) {
      return NextResponse.json({ error: 'Only owners and admins can edit operations settings' }, { status: 403 })
    }

    const { data: branch, error: branchError } = await admin
      .from('branches')
      .select('id, business_id')
      .eq('id', branchId)
      .single()

    if (branchError || !branch || branch.business_id !== currentStaff.business_id) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    const { data: updatedBranch, error } = await admin
      .from('branches')
      .update({ settings, updated_at: new Date().toISOString() })
      .eq('id', branchId)
      .eq('business_id', currentStaff.business_id)
      .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, branch: updatedBranch })
  } catch (error) {
    console.error('Branch settings update error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
