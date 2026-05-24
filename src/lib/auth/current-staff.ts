import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export interface CurrentStaffContext {
  userId: string
  id: string
  business_id: string
  branch_id: string | null
  accessible_branch_ids: string[] | null
  role: string
  email: string
  name: string | null
  permissions: Record<string, boolean>
}

export async function getCurrentStaffContext(): Promise<CurrentStaffContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const admin = getSupabaseAdmin()
  const { data: staff, error } = await admin
    .from('staff')
    .select('id, business_id, branch_id, accessible_branch_ids, role, email, name, permissions, status')
    .eq('id', user.id)
    .single()

  if (error || !staff) {
    throw new Error(error?.message || 'Staff record not found')
  }

  if (staff.status === 'suspended') {
    throw new Error('This staff account is suspended')
  }

  if (!staff.business_id) {
    throw new Error('Staff business is not assigned')
  }

  return {
    userId: user.id,
    id: staff.id,
    business_id: staff.business_id,
    branch_id: staff.branch_id,
    accessible_branch_ids: staff.accessible_branch_ids,
    role: staff.role,
    email: staff.email,
    name: staff.name,
    permissions: (staff.permissions || {}) as Record<string, boolean>,
  }
}

export function canManageBusiness(role: string) {
  return role === 'owner' || role === 'admin' || role === 'manager' || role === 'super_admin'
}
