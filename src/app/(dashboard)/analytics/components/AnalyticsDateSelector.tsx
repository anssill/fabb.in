'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Period } from '../analytics-actions'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'This Week' },
  { key: '30d', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: '90d', label: 'Last 3 Months' },
]

export function AnalyticsDateSelector({ current }: { current: Period }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(period: Period) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    router.push(`/analytics?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white p-1 shadow-sm">
      {PERIODS.map(({ key, label }) => (
        <Button
          key={key}
          size="sm"
          variant={current === key ? 'default' : 'ghost'}
          onClick={() => handleSelect(key)}
          className={
            current === key
              ? 'h-8 px-3 text-xs bg-[#4f46e5] text-white shadow-sm hover:bg-[#4338ca]'
              : 'h-8 px-3 text-xs text-slate-600 hover:bg-slate-50'
          }
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
