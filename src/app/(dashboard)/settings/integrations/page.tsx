import { IntegrationsSettingsClient } from './integrations-settings-client'

export const metadata = { title: 'Messaging Integrations | Fabb' }

export default function IntegrationsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Messaging integrations</h2>
        <p className="text-sm text-slate-500">Only the approved Meta WhatsApp Cloud API and MSG91 providers are supported.</p>
      </div>
      <IntegrationsSettingsClient />
    </div>
  )
}
