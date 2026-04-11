import { InventorySettingsClient } from './InventorySettingsClient'

export const metadata = { title: 'Inventory Settings | Fabb.booking' }

export default function InventorySettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Inventory Settings</h2>
        <p className="text-sm text-slate-500">Manage item categories, SKU prefixes, and low stock alert thresholds.</p>
      </div>
      <InventorySettingsClient />
    </div>
  )
}
