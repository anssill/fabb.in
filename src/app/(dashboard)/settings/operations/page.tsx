import { createClient } from '@/lib/supabase/server'
import { OperationsSettingsClient } from './OperationsSettingsClient'

export default async function OperationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('business_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!staff) return null

  const [{ data: currentBranch }, { data: branches }] = await Promise.all([
    supabase
      .from('branches')
      .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
      .eq('id', staff.branch_id)
      .single(),
    supabase
      .from('branches')
      .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
      .eq('business_id', staff.business_id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true }),
  ])

  return (
    <OperationsSettingsClient
      initialBranch={currentBranch}
      initialBranches={branches || []}
    />
  )
}
