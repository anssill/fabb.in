import { DisplayPreferencesClient } from './DisplayPreferencesClient'

export const metadata = { title: 'Display Preferences | Fabb.booking' }

export default function DisplayPreferencesPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Display Preferences</h2>
        <p className="text-sm text-slate-500">Personalise your interface theme, date format, and currency display.</p>
      </div>
      <DisplayPreferencesClient />
    </div>
  )
}
