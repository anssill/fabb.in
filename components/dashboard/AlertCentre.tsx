'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { DashboardStats } from '@/lib/queries/useDashboardStats'
import { AlertTriangle, BellRing, CheckCircle, Package, UserX } from 'lucide-react'
import Link from 'next/link'

interface Props {
  stats: DashboardStats | null | undefined
  isLoading: boolean
  role: string | undefined
}

interface AlertItem {
  id: string
  icon: React.ReactNode
  title: string
  count: number
  href: string
  severity: 'red' | 'amber' | 'blue' | 'purple'
}

export function AlertCentre({ stats, isLoading, role }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  const alerts: AlertItem[] = [
    {
      id: 'overdue',
      icon: <AlertTriangle className="w-4 h-4" />,
      title: 'Overdue rentals',
      count: stats?.returnsOverdue ?? 0,
      href: '/bookings?status=overdue',
      severity: 'red',
    },
    {
      id: 'washing',
      icon: <BellRing className="w-4 h-4" />,
      title: 'Urgent washing items',
      count: stats?.washingUrgentCount ?? 0,
      href: '/washing',
      severity: 'purple',
    },
    ...(role === 'manager' || role === 'super_admin'
      ? [
          {
            id: 'approvals',
            icon: <CheckCircle className="w-4 h-4" />,
            title: 'Pending staff approvals',
            count: stats?.pendingApprovals ?? 0,
            href: '/staff',
            severity: 'amber' as const,
          },
        ]
      : []),
  ]

  const active = alerts.filter((a) => a.count > 0)

  if (!active.length) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
          All clear — no alerts right now
        </p>
      </div>
    )
  }

  const severityClass: Record<AlertItem['severity'], string> = {
    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400',
    amber: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 text-purple-700 dark:text-purple-400',
  }

  const badgeClass: Record<AlertItem['severity'], string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className="space-y-2">
      {active.map((alert) => (
        <Link
          key={alert.id}
          href={alert.href}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity hover:opacity-80 ${severityClass[alert.severity]}`}
        >
          <span className="shrink-0">{alert.icon}</span>
          <span className="text-sm font-medium flex-1">{alert.title}</span>
          <Badge className={`${badgeClass[alert.severity]} text-white text-xs font-bold h-5 px-1.5`}>
            {alert.count}
          </Badge>
        </Link>
      ))}
    </div>
  )
}
