import { BookingRulesClient } from './BookingRulesClient'

export const metadata = { title: 'Booking Rules | Fabb.booking' }

export default function BookingRulesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Booking Rules</h2>
        <p className="text-sm text-slate-500">Configure payment requirements, buffer days, and scheduling policies for this branch.</p>
      </div>
      <BookingRulesClient />
    </div>
  )
}
