import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { canManageBusiness, getCurrentStaffContext } from '@/lib/auth/current-staff'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['owner', 'manager', 'staff']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
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
      .select('id, business_id')
      .eq('id', id)
      .single()

    if (targetError || !targetStaff || targetStaff.business_id !== currentStaff.business_id) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const updatePayload = {
      ...validated.data,
      ...(Object.prototype.hasOwnProperty.call(validated.data, 'phone')
        ? { phone: validated.data.phone?.trim() || null }
        : {}),
    }

    const { data: staff, error } = await supabaseAdmin
      .from('staff')
      .update(updatePayload)
      .eq('id', id)
      .eq('business_id', currentStaff.business_id)
      .select('id, name, email, phone, role, status, profile_photo_url, last_login, permissions')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
      .select('id, business_id')
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

    return NextResponse.json({ success: true, message: 'Staff deleted successfully' })
  } catch (error: any) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
