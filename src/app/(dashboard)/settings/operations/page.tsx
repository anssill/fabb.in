import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/auth/get-current-staff'
import { OperationsSettingsClient } from './OperationsSettingsClient'

export default async function OperationsSettingsPage() {
  const supabase = await createClient()
  const { staff } = await getCurrentStaff()
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
      currentUserRole={staff.role}
    />
  )
}
