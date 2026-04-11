'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface Props {
  data: {
    date: string
    revenue: number
    expense: number
    profit: number
  }[]
}

const chartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(221 83% 53%)' },
  expense: { label: 'Expenses', color: 'hsl(0 84% 60%)' },
  profit:  { label: 'Profit',   color: 'hsl(142 71% 45%)' },
} satisfies ChartConfig

export function DashboardRevenueChart({ data }: Props) {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalProfit  = data.reduce((s, d) => s + d.profit, 0)

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              7-Day Revenue
            </CardTitle>
            <CardDescription>Revenue vs expenses over the last week</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className={`text-xs font-medium ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Net ₹{totalProfit.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(221 83% 53%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(142 71% 45%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              width={48}
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(221 83% 53%)"
              strokeWidth={2}
              fill="url(#fillRevenue)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="hsl(0 84% 60%)"
              strokeWidth={1.5}
              fill="transparent"
              strokeDasharray="5 4"
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              fill="url(#fillProfit)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
