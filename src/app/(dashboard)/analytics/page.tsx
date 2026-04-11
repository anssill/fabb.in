import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  TrendingUp,
  CalendarCheck,
  IndianRupee,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  getRevenueStats,
  getUtilizationStats,
  getInventoryPerformance,
  getOccasionStats,
  getStaffPerformance,
  getPLStatement,
  getBookingStats,
  type Period
} from './analytics-actions'
import { RevenueTrendChart } from './components/RevenueTrendChart'
import { PaymentMethodChart } from './components/PaymentMethodChart'
import { BookingSourceChart } from './components/BookingSourceChart'
import { OccasionChart } from './components/OccasionChart'
import { InventoryPerformanceTable } from './components/InventoryPerformanceTable'
import { StaffPerformanceSection } from './components/StaffPerformanceSection'
import { PLStatement } from './components/PLStatement'
import { AnalyticsDateSelector } from './components/AnalyticsDateSelector'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  last_month: 'Last Month',
  '90d': 'Last 3 Months',
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period = (['today', '7d', '30d', 'last_month', '90d'].includes(rawPeriod || '') ? rawPeriod : '30d') as Period

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffRecord } = user
    ? await supabase.from('staff').select('role').eq('id', user.id).single()
    : { data: null }
  const isOwner = staffRecord?.role === 'owner' || staffRecord?.role === 'super_admin'
  const isManager = isOwner || staffRecord?.role === 'manager'

  const [
    { dailyData, summary, methodDistribution, sourceDistribution },
    { totalItems, utilizationRate },
    performanceData,
    occasionData,
    bookingStats,
    staffPerf,
    plData,
  ] = await Promise.all([
    getRevenueStats(period),
    getUtilizationStats(),
    getInventoryPerformance(),
    getOccasionStats(period),
    getBookingStats(period),
    isManager ? getStaffPerformance(period) : Promise.resolve([]),
    isOwner ? getPLStatement(period) : Promise.resolve(null),
  ])

  const metrics = [
    {
      label: 'Total Revenue',
      value: `₹${summary.totalRevenue.toLocaleString('en-IN')}`,
      sub: `Cash ₹${summary.cashTotal.toLocaleString('en-IN')} · UPI ₹${summary.upiTotal.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'text-emerald-600 bg-emerald-50',
      up: true,
    },
    {
      label: 'Net Profit',
      value: `₹${summary.netProfit.toLocaleString('en-IN')}`,
      sub: `${summary.totalExpenses > 0 ? `Expenses ₹${summary.totalExpenses.toLocaleString('en-IN')}` : 'No expenses recorded'}`,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
      up: summary.netProfit >= 0,
    },
    {
      label: 'Utilization',
      value: `${utilizationRate}%`,
      sub: `${totalItems} total units`,
      icon: Package,
      color: 'text-violet-600 bg-violet-50',
      up: utilizationRate > 40,
    },
    {
      label: 'Total Bookings',
      value: bookingStats.total.toString(),
      sub: `${bookingStats.newCustomers} new · ${bookingStats.repeatCustomers} repeat`,
      icon: CalendarCheck,
      color: 'text-amber-600 bg-amber-50',
      up: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header + Date selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">Business performance — {PERIOD_LABELS[period]}</p>
        </div>
        <Suspense fallback={null}>
          <AnalyticsDateSelector current={period} />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {metric.up
                    ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    : <ArrowDownRight className="w-4 h-4 text-red-500" />
                  }
                </div>
                <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{metric.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{metric.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Booking stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Bookings', value: bookingStats.total },
          { label: 'New Customers', value: bookingStats.newCustomers },
          { label: 'Repeat Customers', value: bookingStats.repeatCustomers },
          { label: 'Avg Booking Value', value: `₹${bookingStats.avgValue.toLocaleString('en-IN')}` },
          { label: 'Cancellation Rate', value: `${bookingStats.cancellationRate}%` },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart + Payment methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Revenue & Expense Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <RevenueTrendChart data={dailyData} />
            ) : (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <p className="text-sm">No financial data for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {methodDistribution.length > 0 ? (
              <PaymentMethodChart data={methodDistribution} />
            ) : (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <p className="text-sm">No payments recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Source + Occasion breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Booking Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceDistribution.length > 0 ? (
              <BookingSourceChart data={sourceDistribution} />
            ) : (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <p className="text-sm">No source data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Occasion Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {occasionData.length > 0 ? (
              <OccasionChart data={occasionData} />
            ) : (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <p className="text-sm">No occasion data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Performance */}
      <InventoryPerformanceTable data={performanceData} />

      {/* Staff Performance + P&L (role-gated) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isManager && staffPerf.length > 0 && (
          <StaffPerformanceSection data={staffPerf} />
        )}

        {isOwner && plData && (
          <PLStatement data={plData} />
        )}

        {/* Inventory Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Total Stock</span>
                </div>
                <span className="font-semibold text-slate-900">{totalItems} units</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Utilization Rate</span>
                  <span className="text-blue-600">{utilizationRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${utilizationRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
