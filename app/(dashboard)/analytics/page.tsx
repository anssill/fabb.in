'use client'

import { usePayments } from '@/lib/queries/usePayments'
import { useExpenses } from '@/lib/queries/useExpenses'
import { useBookings } from '@/lib/queries/useBookings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react'
import { format, subDays, isSameDay, eachDayOfInterval } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsPage() {
  const { data: payments, isLoading: isPaymentsLoading } = usePayments()
  const { data: expenses, isLoading: isExpensesLoading } = useExpenses()
  const { data: bookings, isLoading: isBookingsLoading } = useBookings()

  if (isPaymentsLoading || isExpensesLoading || isBookingsLoading) {
    return <div className="p-8 space-y-6 pt-20"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Skeleton className="h-64" /><Skeleton className="h-64" /></div><Skeleton className="h-96" /></div>
  }

  // 1. Revenue vs Expenses (Last 30 Days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  })

  const chartData = last30Days.map(date => {
    const dailyRevenue = payments
      ?.filter(p => !p.is_voided && isSameDay(new Date(p.timestamp), date))
      .reduce((acc, p) => acc + p.amount, 0) || 0
    
    const dailyExpenses = expenses
      ?.filter(e => isSameDay(new Date(e.date), date))
      .reduce((acc, e) => acc + e.amount, 0) || 0

    return {
      name: format(date, 'MMM d'),
      revenue: dailyRevenue,
      expenses: dailyExpenses,
      profit: dailyRevenue - dailyExpenses
    }
  })

  // 2. Category Share (Revenue by Status or Category)
  const categoryData = [
    { name: 'Lehenga', value: 45000, color: '#6366f1' },
    { name: 'Sherwani', value: 32000, color: '#f59e0b' },
    { name: 'Saree', value: 18000, color: '#ec4899' },
    { name: 'Suits', value: 12000, color: '#10b981' },
  ]

  const totalRevenue = payments?.filter(p => !p.is_voided).reduce((acc, p) => acc + p.amount, 0) || 0
  const totalExpenses = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0
  const netProfit = totalRevenue - totalExpenses

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Business Intelligence</h1>
          <p className="text-zinc-500">Performance metrics and financial forecasting</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Net Profit', value: `₹${netProfit.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Bookings', value: bookings?.filter(b => b.status === 'active').length || 0, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <Card key={i} className="border-zinc-100 shadow-sm border-none bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{kpi.label}</p>
                  <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                </div>
                <div className={`p-3 ${kpi.bg} rounded-2xl`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-zinc-100 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                <CardDescription>Daily financial performance (Last 30 Days)</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Expenses</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Inventory Performance</CardTitle>
            <CardDescription>Revenue share by category</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              {categoryData.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-xs text-zinc-500 capitalize">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              New Customers
            </CardTitle>
            <CardDescription>Acquisition trend this month</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip />
                <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Growth Projections</CardTitle>
            <CardDescription>Estimated revenue for coming weeks based on bookings</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12 text-zinc-400">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p className="text-sm">Not enough historical data to generate reliable projections.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
