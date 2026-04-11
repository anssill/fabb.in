'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface RevenueTrendChartProps {
  data: {
    date: string
    revenue: number
    expense: number
  }[]
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
            formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Revenue']}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#2563eb" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
