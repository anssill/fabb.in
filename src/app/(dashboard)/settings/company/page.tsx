import { CompanySettingsClient } from './CompanySettingsClient'

export const metadata = {
  title: 'Company Settings | Fabb.booking',
}

export default function CompanySettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Company Profile</h2>
        <p className="text-sm text-slate-500">Manage your business contact details, logo and regional settings.</p>
      </div>

      <CompanySettingsClient />
    </div>
  )
}
