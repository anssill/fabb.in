'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface OccasionChartProps {
  data: { name: string; value: number }[]
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669', '#0891b2', '#dc2626', '#65a30d']

export function OccasionChart({ data }: OccasionChartProps) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => [`${value} bookings`, 'Count']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
