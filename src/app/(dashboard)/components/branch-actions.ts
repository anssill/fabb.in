'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isValidUuid } from '@/lib/api-utils'

export async function switchActiveBranch(branchId: string) {
  if (!isValidUuid(branchId)) throw new Error('Invalid branch')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff, error: staffError } = await supabase.from('staff')
    .select('business_id, branch_id, role, status, permissions').eq('id', user.id).single()
  if (staffError || !staff?.business_id || !['active', 'approved'].includes(staff.status)) {
    throw new Error('An active staff account is required')
  }

  if (!['owner','super_admin'].includes(staff.role) && !(staff.permissions as Record<string,boolean>)?.switch_branches) throw new Error('Branch switching is not enabled for your account')

  // The user's RLS-scoped client must authorize the destination before any admin write.
  const { data: branch, error: branchError } = await supabase.from('branches')
    .select('id').eq('id', branchId).eq('business_id', staff.business_id)
    .eq('status', 'active').maybeSingle()
  if (branchError || !branch) throw new Error('You do not have access to this branch')

  const admin = getSupabaseAdmin()
  const { data: updated, error } = await admin.from('staff')
    .update({ branch_id: branch.id }).eq('id', user.id)
    .eq('business_id', staff.business_id).in('status', ['active', 'approved'])
    .select('id').single()
  if (error || !updated) throw new Error('Could not switch branch. Please try again.')
  return { success: true }
}
