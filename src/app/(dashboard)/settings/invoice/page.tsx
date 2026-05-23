import { InvoiceSettingsClient } from './InvoiceSettingsClient'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { BranchData, BusinessData } from '@/lib/store'

export const metadata = { title: 'Invoice Settings | Fabb.booking' }

export default async function InvoiceSettingsPage() {
  const staff = await getCurrentStaffContext()
  const admin = getSupabaseAdmin()
  const [{ data: business }, { data: branches }] = await Promise.all([
    admin.from('businesses').select('*').eq('id', staff.business_id).single(),
    admin
      .from('branches')
      .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
      .eq('business_id', staff.business_id)
      .eq('status', 'active')
      .order('is_default', { ascending: false }),
  ])
  const activeBranch = branches?.find(branch => branch.id === staff.branch_id) || branches?.[0] || null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Invoice Settings</h2>
        <p className="text-sm text-slate-500">Customise invoice numbering, GST, footer content, and bank details.</p>
      </div>
      <InvoiceSettingsClient
        initialBranch={activeBranch as unknown as BranchData | null}
        initialBranches={(branches || []) as unknown as BranchData[]}
        initialBusiness={business as unknown as BusinessData | null}
      />
    </div>
  )
}
