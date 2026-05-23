import { DisplayPreferencesClient } from './DisplayPreferencesClient'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const metadata = { title: 'Display Preferences | Fabb.booking' }

export default async function DisplayPreferencesPage() {
  const currentStaff = await getCurrentStaffContext()
  const admin = getSupabaseAdmin()
  const { data: staff } = await admin
    .from('staff')
    .select('custom_permissions')
    .eq('id', currentStaff.id)
    .single()

  const customPermissions = staff?.custom_permissions && typeof staff.custom_permissions === 'object' && !Array.isArray(staff.custom_permissions)
    ? staff.custom_permissions as Record<string, unknown>
    : {}

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Display Preferences</h2>
        <p className="text-sm text-slate-500">Personalise your interface theme, date format, and currency display.</p>
      </div>
      <DisplayPreferencesClient initialPreferences={customPermissions.display_preferences as any} />
    </div>
  )
}
