'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

interface Props {
  data: {
    date: string
    revenue: number
    expense: number
    profit: number
  }[]
}

export function RevenueChart({ data }: Props) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Weekly Revenue</CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-500">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-500">Expenses</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] pl-2 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#revenue)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#cbd5e1"
              strokeWidth={2}
              fill="transparent"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
