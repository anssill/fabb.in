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

  const staffSelect = '*, permissions'

  const { data: staffById, error: idError } = await supabase
    .from('staff')
    .select(staffSelect)
    .eq('id', user.id)
    .maybeSingle()

  if (staffById) {
    return { user, staff: staffById }
  }

  if (idError || !user.email) {
    return { user, staff: null }
  }

  const { data: staffByEmail } = await supabase
    .from('staff')
    .select(staffSelect)
    .eq('email', user.email)
    .maybeSingle()

  return { user, staff: staffByEmail ?? null }
})
