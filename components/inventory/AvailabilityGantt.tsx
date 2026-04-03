import { useMemo } from 'react'
import { format, addDays, startOfToday, isWithinInterval, differenceInDays } from 'date-fns'

interface BookingAllocation {
  id: string
  pickup_date: string
  return_date: string
  status: string
  customer?: { name: string }
}

export function AvailabilityGantt({ bookings = [] }: { bookings: any[] }) {
  // Map booking data correctly depending on the join
  const mappedBookings: BookingAllocation[] = bookings.map(b => ({
    id: b.id,
    pickup_date: b.booking?.pickup_date,
    return_date: b.booking?.return_date,
    status: b.booking?.status,
    customer: b.booking?.customer
  })).filter(b => b.pickup_date && b.return_date && b.status !== 'cancelled')

  const today = startOfToday()
  const days = Array.from({ length: 30 }).map((_, i) => addDays(today, i))

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">30-Day Availability Outlook</h3>
      
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
        
        {/* Header Dates */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 pb-2 pt-3 hide-scrollbar overflow-x-auto relative">
          <div className="w-[150px] shrink-0 px-4 flex items-center border-r border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500">Timeline</span>
          </div>
          <div className="flex flex-1 relative min-w-[900px]">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center border-r border-zinc-200 dark:border-zinc-800 last:border-0 relative">
                <span className="text-[10px] text-zinc-500 uppercase font-medium">{format(d, 'EEE')}</span>
                <span className={`text-sm font-semibold ${i === 0 ? 'text-[#aacc00]' : ''}`}>{format(d, 'dd')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Row */}
        <div className="flex relative overflow-x-auto">
          <div className="w-[150px] shrink-0 px-4 py-6 border-r border-zinc-200 dark:border-zinc-800 flex items-center bg-white dark:bg-zinc-950 z-10">
            <span className="text-sm font-medium">Bookings</span>
          </div>

          <div className="flex flex-1 relative min-w-[900px] bg-zinc-50/50 dark:bg-zinc-900/20 py-4">
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {days.map((_, i) => (
                <div key={i} className="flex-1 border-r border-zinc-200/50 dark:border-zinc-800/50 last:border-0" />
              ))}
            </div>

            {/* Bars */}
            {mappedBookings.map((b, idx) => {
              const start = new Date(b.pickup_date)
              const end = new Date(b.return_date)
              
              const startOffset = Math.max(0, differenceInDays(start, today))
              const duration = differenceInDays(end, start) + 1
              const maxVisibleDuration = Math.min(duration, 30 - startOffset)
              
              if (startOffset >= 30 || startOffset + duration <= 0) return null

              return (
                <div 
                  key={b.id}
                  className="absolute top-4 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-md shadow-sm border border-black/10 dark:border-white/10 flex items-center px-2 cursor-pointer hover:scale-[1.02] transition-transform z-10 overflow-hidden"
                  style={{
                    left: `calc(${(startOffset / 30) * 100}% + 4px)`,
                    width: `calc(${(maxVisibleDuration / 30) * 100}% - 8px)`,
                    marginTop: `${idx * 40}px`
                  }}
                  title={`${b.customer?.name} (${format(start, 'dd MMM')} - ${format(end, 'dd MMM')})`}
                >
                  <span className="text-xs font-semibold text-white dark:text-black truncate">
                    {b.customer?.name || 'Reserved'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
