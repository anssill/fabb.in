import { AccountSettingsClient } from './AccountSettingsClient'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { StaffData } from '@/lib/store'

export const metadata = { title: 'My Account | Fabb.booking' }

export default async function AccountSettingsPage() {
  const currentStaff = await getCurrentStaffContext()
  const admin = getSupabaseAdmin()
  const { data: staff } = await admin
    .from('staff')
    .select('id, name, email, phone, role, status, business_id, branch_id, setup_completed, profile_photo_url, permissions, pin_hash')
    .eq('id', currentStaff.id)
    .single()

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">My Account</h2>
        <p className="text-sm text-slate-500">Manage your personal profile, password, and account security.</p>
      </div>
      <AccountSettingsClient initialStaff={staff as unknown as StaffData | null} />
    </div>
  )
}
