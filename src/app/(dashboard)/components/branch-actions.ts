'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function switchActiveBranch(branchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = getSupabaseAdmin()
  const { data: staff, error: staffError } = await adminClient
    .from('staff')
    .select('business_id, role, accessible_branch_ids')
    .eq('id', user.id)
    .single()

  if (staffError || !staff?.business_id) {
    throw new Error('Could not verify staff branch access')
  }

  const { data: branch, error: branchError } = await adminClient
    .from('branches')
    .select('id, business_id')
    .eq('id', branchId)
    .eq('business_id', staff.business_id)
    .eq('status', 'active')
    .maybeSingle()

  if (branchError || !branch) {
    throw new Error('Branch not found or inactive')
  }

  const allowedBranchIds = Array.isArray(staff.accessible_branch_ids) ? staff.accessible_branch_ids : []
  const hasFullBranchAccess = staff.role === 'owner' || staff.role === 'super_admin' || allowedBranchIds.length === 0
  if (!hasFullBranchAccess && !allowedBranchIds.includes(branchId)) {
    throw new Error('You do not have access to this branch')
  }
  
  const { error } = await adminClient
    .from('staff')
    .update({ branch_id: branchId })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to switch branch:', error)
    throw new Error('Could not switch branch: ' + error.message)
  }

  return { success: true }
}
