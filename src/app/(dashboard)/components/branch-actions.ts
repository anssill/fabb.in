'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function switchActiveBranch(branchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client to bypass RLS for updating staff branch_id
  const adminClient = getSupabaseAdmin()
  
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
