import { SmsSettingsClient } from './SmsSettingsClient'

export const metadata = { title: 'SMS Notifications | Fabb.booking' }

export default function SmsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">SMS Notifications</h2>
        <p className="text-sm text-slate-500">Configure MSG91 to send automated SMS to customers for booking events.</p>
      </div>
      <SmsSettingsClient />
    </div>
  )
}
