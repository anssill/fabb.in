import { InvoiceSettingsClient } from './InvoiceSettingsClient'

export const metadata = { title: 'Invoice Settings | Fabb.booking' }

export default function InvoiceSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Invoice Settings</h2>
        <p className="text-sm text-slate-500">Customise invoice numbering, GST, footer content, and bank details.</p>
      </div>
      <InvoiceSettingsClient />
    </div>
  )
}
