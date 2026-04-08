import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarCheck,
  Package,
  Users,
  IndianRupee,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { getRevenueStats } from '../analytics/analytics-actions'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { AttendanceWidget } from '../components/AttendanceWidget'


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('role, business_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!staff) return null

  const today = new Date().toISOString().split('T')[0]

  // Fetch dashboard stats
  const [
    { count: activeBookings },
    { count: totalItems },
    { count: totalCustomers },
    { data: todayPickups },
    { data: todayReturns },
    { data: overdueBookings },
    analytics
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).in('status', ['booked', 'out']),
    supabase.from('items').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('is_active', true),
    supabase.from('customers').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), status, pickup_date')
      .eq('business_id', staff.business_id).eq('pickup_date', today).limit(10),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), status, return_date')
      .eq('business_id', staff.business_id).eq('return_date', today).limit(10),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), return_date')
      .eq('business_id', staff.business_id).eq('status', 'out').lt('return_date', today).limit(10),
    getRevenueStats('7d')
  ])

  const stats = [
    {
      title: 'Active Bookings',
      value: activeBookings ?? 0,
      icon: CalendarCheck,
      color: 'text-blue-600 bg-blue-50',
      href: '/bookings',
    },
    {
      title: 'Total Items',
      value: totalItems ?? 0,
      icon: Package,
      color: 'text-emerald-600 bg-emerald-50',
      href: '/inventory',
    },
    {
      title: 'Customers',
      value: totalCustomers ?? 0,
      icon: Users,
      color: 'text-violet-600 bg-violet-50',
      href: '/customers',
    },
    {
      title: 'Revenue (7d)',
      value: `₹${analytics.summary.totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'text-amber-600 bg-amber-50',
      href: '/payments',
      isRevenue: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        
        <div className="w-full md:w-auto md:min-w-[240px] flex flex-col gap-2">
          <WeatherWidget />
          <AttendanceWidget />
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 h-10" asChild>
          <Link href="/bookings/new">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Overdue Alert */}
      {overdueBookings && overdueBookings.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  {overdueBookings.length} overdue booking{overdueBookings.length !== 1 ? 's' : ''} need attention
                </p>
                <p className="text-xs text-red-600 mt-0.5">Items past return date that haven&apos;t been returned yet</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-100" asChild>
                <Link href="/bookings?status=overdue">View All</Link>
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {overdueBookings.slice(0, 3).map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="flex items-center justify-between py-1.5 px-3 bg-white rounded border border-red-100 hover:bg-red-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-900">{booking.booking_number}</span>
                  <span className="text-xs text-red-600">
                    Due: {new Date(booking.return_date).toLocaleDateString('en-IN')}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Pickups */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Today&apos;s Pickups
              </CardTitle>
              <Badge variant="secondary">{todayPickups?.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todayPickups && todayPickups.length > 0 ? (
              <div className="space-y-2">
                {todayPickups.map((booking) => {
                  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                  return (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}`}
                      className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{booking.booking_number}</p>
                        <p className="text-xs text-slate-500">{customer?.name || 'Customer'}</p>
                      </div>
                      <Badge variant={booking.status === 'booked' ? 'default' : 'secondary'} className="text-xs">
                        {booking.status}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-400">
                <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No pickups scheduled for today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Returns */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                Today&apos;s Returns
              </CardTitle>
              <Badge variant="secondary">{todayReturns?.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todayReturns && todayReturns.length > 0 ? (
              <div className="space-y-2">
                {todayReturns.map((booking) => {
                  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                  return (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}`}
                      className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{booking.booking_number}</p>
                        <p className="text-xs text-slate-500">{customer?.name || 'Customer'}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{booking.status}</Badge>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No returns expected today
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'New Booking', href: '/bookings/new', icon: CalendarCheck, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Add Item', href: '/inventory/new', icon: Package, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { label: 'Add Customer', href: '/customers/new', icon: Users, color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
              { label: 'Record Payment', href: '/payments/new', icon: IndianRupee, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.label} href={action.href}>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors cursor-pointer ${action.color}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
