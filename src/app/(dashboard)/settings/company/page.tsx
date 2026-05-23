import { CompanySettingsClient } from './CompanySettingsClient'

export const metadata = {
  title: 'Company Settings | Fabb.booking',
}

export default function CompanySettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Company Profile</h1>
          <p className="text-sm text-slate-500">Manage your business contact details, logo and regional settings.</p>
        </div>
      </div>

      <CompanySettingsClient />
    </div>
  )
}
