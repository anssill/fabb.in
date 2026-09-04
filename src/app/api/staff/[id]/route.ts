import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isValidUuid } from '@/lib/api-utils'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!isValidUuid(id)) return NextResponse.json({ error: 'Valid staff ID is required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.id === id) return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 })
    const { data: requester } = await supabase.from('staff').select('id, business_id, branch_id, role, status, permissions').eq('id', user.id).single()
    if (!requester?.business_id || !['active', 'approved'].includes(requester.status)) return NextResponse.json({ error: 'Active staff account required' }, { status: 403 })
    let canManageStaff = ['owner', 'super_admin'].includes(requester.role) || Boolean((requester.permissions as Record<string, boolean> | null)?.manage_staff)
    if (!canManageStaff) {
      const { data: assignments } = await (supabase as any).from('staff_role_assignments').select('role:business_roles(permissions)').eq('staff_id', user.id)
      canManageStaff = (assignments ?? []).some((assignment: any) => { const role = Array.isArray(assignment.role) ? assignment.role[0] : assignment.role; return role?.permissions?.manage_staff === true })
    }
    if (!canManageStaff) return NextResponse.json({ error: 'Staff management permission required' }, { status: 403 })

    const { data: target } = await supabaseAdmin.from('staff').select('id, business_id, branch_id, name, email, role, status').eq('id', id).eq('business_id', requester.business_id).single()
    if (!target) return NextResponse.json({ error: 'Staff account not found in your business' }, { status: 404 })
    if (['owner', 'super_admin'].includes(target.role)) return NextResponse.json({ error: 'Owner accounts cannot be deactivated here' }, { status: 403 })

    // Preserve the staff row for booking, finance and audit history.
    const { error } = await supabaseAdmin.from('staff').update({ status: 'inactive' }).eq('id', id).eq('business_id', requester.business_id)

    if (error) {
      console.error('Error deactivating staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from('audit_log').insert({
      business_id: requester.business_id,
      branch_id: target.branch_id || requester.branch_id,
      staff_id: user.id,
      action: 'staff.deactivated',
      table_name: 'staff',
      record_id: target.id,
      old_value: target,
      new_value: { status: 'inactive' },
    })

    return NextResponse.json({ success: true, message: 'Staff account deactivated; history was retained' })
  } catch (error: any) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
