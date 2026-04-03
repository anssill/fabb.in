'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ScheduleItem } from '@/lib/queries/useDashboardStats'
import { ArrowDownLeft, ArrowUpRight, Phone } from 'lucide-react'
import Link from 'next/link'

interface Props {
  items: ScheduleItem[]
  isLoading: boolean
}

export function ScheduleWidget({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
        <CalendarEmptyIcon />
        <p className="text-sm mt-3">No pickups or returns today</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/bookings/${item.id}`}
          className={`flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors rounded-lg group ${
            item.isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''
          }`}
        >
          {/* Type icon */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              item.type === 'pickup'
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : item.isOverdue
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
          >
            {item.type === 'pickup' ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownLeft className="w-4 h-4" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold truncate ${
                item.isOverdue
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-zinc-900 dark:text-zinc-50'
              }`}
            >
              {item.customerName}
            </p>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {item.customerPhone}
            </p>
          </div>

          {/* Badge */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs font-mono text-zinc-400">{item.bookingId}</span>
            {item.isOverdue ? (
              <Badge className="bg-red-500 text-white text-xs h-5 px-1.5 font-semibold">
                OVERDUE
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={`text-xs h-5 px-1.5 capitalize ${
                  item.type === 'pickup'
                    ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                    : 'border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400'
                }`}
              >
                {item.type}
              </Badge>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

function CalendarEmptyIcon() {
  return (
    <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
