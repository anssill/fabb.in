import { AccountSettingsClient } from './AccountSettingsClient'

export const metadata = { title: 'My Account | Fabb.booking' }

export default function AccountSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">My Account</h2>
        <p className="text-sm text-slate-500">Manage your personal profile, password, and account security.</p>
      </div>
      <AccountSettingsClient />
    </div>
  )
}
