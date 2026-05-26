import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { canManageBusiness, getCurrentStaffContext } from '@/lib/auth/current-staff'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['owner', 'admin', 'manager', 'staff', 'washing_staff']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  branch_id: z.string().uuid().nullable().optional(),
  accessible_branch_ids: z.array(z.string().uuid()).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentStaff = await getCurrentStaffContext()
    if (!canManageBusiness(currentStaff.role)) {
      return NextResponse.json({ error: 'You do not have permission to update staff' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const body = await safeJsonParse(req)
    const validated = updateStaffSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: targetStaff, error: targetError } = await supabaseAdmin
      .from('staff')
      .select('id, business_id, branch_id, name, email, role, status, permissions, accessible_branch_ids')
      .eq('id', id)
      .single()

    if (targetError || !targetStaff || targetStaff.business_id !== currentStaff.business_id) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const { branch_id, accessible_branch_ids, ...staffFields } = validated.data
    const updatePayload = {
      ...staffFields,
      ...validated.data,
      ...(Object.prototype.hasOwnProperty.call(validated.data, 'phone')
        ? { phone: validated.data.phone?.trim() || null }
        : {}),
    }

    delete (updatePayload as Record<string, unknown>).accessible_branch_ids
    delete (updatePayload as Record<string, unknown>).branch_id

    if (accessible_branch_ids !== undefined || branch_id !== undefined) {
      const { data: activeBranches, error: branchError } = await supabaseAdmin
        .from('branches')
        .select('id')
        .eq('business_id', currentStaff.business_id)
        .eq('status', 'active')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (branchError || !activeBranches || activeBranches.length === 0) {
        return NextResponse.json({ error: 'No active branch found for this business' }, { status: 400 })
      }

      const validBranchIds = new Set(activeBranches.map(branch => branch.id))
      const requestedBranchIds = Array.from(new Set(accessible_branch_ids || []))
      const invalidBranchIds = requestedBranchIds.filter(branchId => !validBranchIds.has(branchId))
      if (invalidBranchIds.length > 0) {
        return NextResponse.json({ error: 'One or more selected branches are invalid' }, { status: 400 })
      }

      const resolvedAccessibleBranchIds = requestedBranchIds.length > 0
        ? requestedBranchIds
        : targetStaff.branch_id && validBranchIds.has(targetStaff.branch_id)
          ? [targetStaff.branch_id]
          : [activeBranches[0].id]
      const resolvedBranchId = branch_id && resolvedAccessibleBranchIds.includes(branch_id)
        ? branch_id
        : resolvedAccessibleBranchIds[0]

      Object.assign(updatePayload, {
        branch_id: resolvedBranchId,
        accessible_branch_ids: resolvedAccessibleBranchIds,
      })
    }

    const { data: staff, error } = await supabaseAdmin
      .from('staff')
      .update(updatePayload)
      .eq('id', id)
      .eq('business_id', currentStaff.business_id)
      .select('id, name, email, phone, role, status, branch_id, accessible_branch_ids, profile_photo_url, last_login, permissions')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from('audit_log').insert({
      business_id: currentStaff.business_id,
      branch_id: currentStaff.branch_id,
      staff_id: currentStaff.id,
      staff_name: currentStaff.name,
      action: 'UPDATE_STAFF',
      table_name: 'staff',
      record_id: staff.id,
      old_value: targetStaff,
      new_value: updatePayload,
    })

    return NextResponse.json({ success: true, staff })
  } catch (error: any) {
    console.error('Staff update error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentStaff = await getCurrentStaffContext()
    if (!canManageBusiness(currentStaff.role)) {
      return NextResponse.json({ error: 'You do not have permission to delete staff' }, { status: 403 })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    if (id === currentStaff.id) {
      return NextResponse.json({ error: 'You cannot delete your own staff account here' }, { status: 400 })
    }

    const { data: targetStaff, error: targetError } = await supabaseAdmin
      .from('staff')
      .select('id, business_id, name, email, role, status')
      .eq('id', id)
      .single()

    if (targetError || !targetStaff || targetStaff.business_id !== currentStaff.business_id) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Use Supabase Admin to delete the user from auth.users.
    // This will cascade and delete the record from public.staff as well.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (error) {
      console.error('Error deleting auth user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from('audit_log').insert({
      business_id: currentStaff.business_id,
      branch_id: currentStaff.branch_id,
      staff_id: currentStaff.id,
      staff_name: currentStaff.name,
      action: 'DELETE_STAFF',
      table_name: 'staff',
      record_id: id,
      old_value: targetStaff,
    })

    return NextResponse.json({ success: true, message: 'Staff deleted successfully' })
  } catch (error: any) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
