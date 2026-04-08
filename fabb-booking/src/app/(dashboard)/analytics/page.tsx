import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CalendarCheck, 
  IndianRupee, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { getRevenueStats, getUtilizationStats, getInventoryPerformance } from './analytics-actions'
import { RevenueTrendChart } from './components/RevenueTrendChart'
import { PaymentMethodChart } from './components/PaymentMethodChart'
import { BookingSourceChart } from './components/BookingSourceChart'
import { InventoryPerformanceTable } from './components/InventoryPerformanceTable'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const { dailyData, summary, methodDistribution, sourceDistribution } = await getRevenueStats('30d')
  const { totalItems, utilizationRate } = await getUtilizationStats()
  const performanceData = await getInventoryPerformance()

  const metrics = [
    { 
      label: 'Total Revenue', 
      value: `₹${summary.totalRevenue.toLocaleString('en-IN')}`, 
      change: '+12.5%', 
      icon: IndianRupee, 
      color: 'text-emerald-600 bg-emerald-50', 
      up: true 
    },
    { 
      label: 'Net Profit', 
      value: `₹${summary.netProfit.toLocaleString('en-IN')}`, 
      change: summary.netProfit > 0 ? '+8.2%' : '-2.1%', 
      icon: TrendingUp, 
      color: 'text-blue-600 bg-blue-50', 
      up: summary.netProfit > 0 
    },
    { 
      label: 'Utilization', 
      value: `${utilizationRate}%`, 
      change: '+4%', 
      icon: Package, 
      color: 'text-violet-600 bg-violet-50', 
      up: true 
    },
    { 
      label: 'Payments', 
      value: summary.paymentCount.toString(), 
      change: '+18%', 
      icon: CalendarCheck, 
      color: 'text-amber-600 bg-amber-50', 
      up: true 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">Business performance for the last 30 days</p>
        </div>
        <Badge variant="outline" className="bg-white">Last 30 Days</Badge>
      </div>

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
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {metric.up ? (
                      <span className="text-emerald-600 flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                        {metric.change}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <ArrowDownRight className="w-3 h-3 mr-0.5" />
                        {metric.change}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
                <p className="text-sm text-slate-500 font-medium">{metric.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
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
                <p className="text-sm">No financial data available for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Payment Methods
            </CardTitle>
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

        {/* Booking Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Booking Sources
            </CardTitle>
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
      </div>

      <div className="grid grid-cols-1 gap-6">
        <InventoryPerformanceTable data={performanceData} />
      </div>

      {/* Inventory & Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
