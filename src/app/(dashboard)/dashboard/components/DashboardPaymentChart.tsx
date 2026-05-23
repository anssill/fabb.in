'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import { Wallet } from 'lucide-react'

interface Props {
  distribution: { name: string; value: number }[]
}

const COLORS = [
  'hsl(142 71% 45%)',  // emerald - Cash
  'hsl(221 83% 53%)',  // blue    - UPI
  'hsl(262 80% 58%)',  // violet  - Bank Transfer
  'hsl(38 92% 50%)',   // amber   - Card
]

export function DashboardPaymentChart({ distribution }: Props) {
  const total = distribution.reduce((s, d) => s + d.value, 0)

  const chartConfig = Object.fromEntries(
    distribution.map((d, i) => [d.name.toLowerCase().replace(' ', '_'), {
      label: d.name,
      color: COLORS[i % COLORS.length],
    }])
  ) as ChartConfig

  if (!distribution.length) {
    return (
      <Card className="min-w-0 rounded-[1.65rem] border-0 bg-white shadow-sm ring-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-violet-600" />
            Payment Methods
          </CardTitle>
          <CardDescription>This week&apos;s breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No payment data yet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-w-0 rounded-[1.65rem] border-0 bg-white shadow-sm ring-0">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-violet-600" />
              Payment Methods
            </CardTitle>
            <CardDescription>This week&apos;s breakdown</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              ₹{total.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground">total collected</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] min-h-[200px] min-w-[220px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                />
              }
            />
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              strokeWidth={0}
            >
              {distribution.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="flex-wrap gap-1"
            />
          </PieChart>
        </ChartContainer>
        <div className="space-y-2 mt-2">
          {distribution.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
              <span className="text-xs font-semibold tabular-nums">₹{item.value.toLocaleString('en-IN')}</span>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {total > 0 ? `${Math.round((item.value / total) * 100)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
