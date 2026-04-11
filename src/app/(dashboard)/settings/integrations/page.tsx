import { IntegrationsSettingsClient } from './integrations-settings-client'

export const metadata = { title: 'External Integrations | Fabb.booking' }

export default function IntegrationsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">External Integrations</h2>
        <p className="text-sm text-slate-500">Connect third-party APIs to enhance your rental management operations.</p>
      </div>
      <IntegrationsSettingsClient />
    </div>
  )
}
