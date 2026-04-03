import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  isLoading?: boolean
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  highlight?: boolean
}

export function StatCard({ label, value, icon, isLoading, trend, trendLabel, highlight }: StatCardProps) {
  return (
    <Card
      className={`border shadow-sm hover:shadow-md transition-shadow ${
        highlight
          ? 'bg-[#ccff00] border-[#ccff00] text-black'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
        <CardTitle
          className={`text-xs font-semibold uppercase tracking-wider ${
            highlight ? 'text-black/60' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {label}
        </CardTitle>
        <div className={highlight ? 'text-black/60' : 'text-zinc-400'}>{icon}</div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <div className={`text-3xl font-bold tracking-tight ${highlight ? 'text-black' : 'text-zinc-950 dark:text-zinc-50'}`}>
            {value}
          </div>
        )}
        {trendLabel && !isLoading && (
          <p
            className={`text-xs mt-1.5 flex items-center gap-0.5 font-medium ${
              highlight
                ? 'text-black/50'
                : trend === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                ? 'text-red-500 dark:text-red-400'
                : 'text-zinc-400'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trendLabel}
          </p>
        )}
        {isLoading && trendLabel && <Skeleton className="h-3 w-16 mt-1.5" />}
      </CardContent>
    </Card>
  )
}
