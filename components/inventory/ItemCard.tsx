'use client'

import { formatDistanceToNow } from 'date-fns'
import { Package, QrCode, Clock, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  name: string
  sku: string | null
  category: string
  status: string
  condition_grade: string
  price: number
  cover_photo_url: string | null
  completeness_score: number
  last_scanned_at: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available:   { label: 'Available',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  in_booking:  { label: 'In Booking',  className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
  in_washing:  { label: 'In Washing',  className: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400' },
  in_repair:   { label: 'In Repair',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400' },
  paused:      { label: 'Paused',      className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  missing:     { label: 'Missing',     className: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' },
  retired:     { label: 'Retired',     className: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500' },
}

const GRADE_CONFIG: Record<string, { label: string; className: string }> = {
  A: { label: 'Grade A', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  B: { label: 'Grade B', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
  C: { label: 'Grade C', className: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' },
}

export function ItemCard({ item }: { item: Item }) {
  const status = STATUS_CONFIG[item.status] ?? { label: item.status, className: 'bg-zinc-100 text-zinc-500' }
  const grade = GRADE_CONFIG[item.condition_grade] ?? { label: item.condition_grade, className: '' }

  const completionColor =
    item.completeness_score >= 80
      ? 'bg-emerald-400'
      : item.completeness_score >= 50
      ? 'bg-amber-400'
      : 'bg-red-400'

  return (
    <Link href={`/inventory/${item.id}`} className="block group">
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5">
        {/* Photo */}
        <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          {item.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.cover_photo_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Package className="w-8 h-8" />
              <span className="text-xs">No photo</span>
            </div>
          )}
          {/* Completeness overlay bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200/60">
            <div
              className={cn('h-full transition-all', completionColor)}
              style={{ width: `${item.completeness_score}%` }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            {item.sku && (
              <div className="flex items-center gap-1 mt-0.5">
                <QrCode className="w-3 h-3 text-zinc-400" />
                <p className="text-xs font-mono text-zinc-400">{item.sku}</p>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            <Badge className={cn('text-[10px] font-semibold px-1.5 py-0 border-0 rounded-md', status.className)}>
              {status.label}
            </Badge>
            <Badge className={cn('text-[10px] font-semibold px-1.5 py-0 border-0 rounded-md', grade.className)}>
              {grade.label}
            </Badge>
          </div>

          {/* Price + Completeness */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              ₹{item.price.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-zinc-400">/day</span>
            </span>
            <div className="flex items-center gap-1 text-zinc-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">{item.completeness_score}%</span>
            </div>
          </div>

          {/* Last scanned */}
          {item.last_scanned_at && (
            <div className="flex items-center gap-1 text-zinc-400">
              <Clock className="w-3 h-3" />
              <span className="text-[10px]">
                Scanned {formatDistanceToNow(new Date(item.last_scanned_at), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
