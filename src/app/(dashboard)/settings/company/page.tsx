import { CompanySettingsClient } from './CompanySettingsClient'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { BusinessData } from '@/lib/store'

export const metadata = {
  title: 'Company Settings | Fabb.booking',
}

export default async function CompanySettingsPage() {
  const staff = await getCurrentStaffContext()
  const admin = getSupabaseAdmin()
  const { data: business } = await admin
    .from('businesses')
    .select('*')
    .eq('id', staff.business_id)
    .single()

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Company Profile</h1>
          <p className="text-sm text-slate-500">Manage your business contact details, logo and regional settings.</p>
        </div>
      </div>

      <CompanySettingsClient initialBusiness={business as unknown as BusinessData | null} />
    </div>
  )
}
