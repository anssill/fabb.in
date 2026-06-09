import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getCurrentStaff = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, staff: null }
  }

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, business_id, branch_id, accessible_branch_ids, role, email, name, permissions, status')
    .eq('id', user.id)
    .single()

  if (error || !staff) {
    return { user, staff: null }
  }

  return { user, staff }
})
