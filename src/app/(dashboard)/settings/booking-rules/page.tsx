import { BookingRulesClient } from './BookingRulesClient'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { BranchData } from '@/lib/store'

export const metadata = { title: 'Booking Rules | Fabb.booking' }

export default async function BookingRulesPage() {
  const staff = await getCurrentStaffContext()
  const admin = getSupabaseAdmin()
  const { data: branches } = await admin
    .from('branches')
    .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
    .eq('business_id', staff.business_id)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
  const activeBranch = branches?.find(branch => branch.id === staff.branch_id) || branches?.[0] || null

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Booking Rules</h2>
        <p className="text-sm text-slate-500">Configure payment requirements, buffer days, and scheduling policies for this branch.</p>
      </div>
      <BookingRulesClient
        initialBranch={activeBranch as unknown as BranchData | null}
        initialBranches={(branches || []) as unknown as BranchData[]}
      />
    </div>
  )
}
