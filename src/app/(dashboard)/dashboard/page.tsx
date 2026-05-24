import { createClient } from '@/lib/supabase/server'
import type { ElementType } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  IndianRupee,
  Package,
  Plus,
  Shirt,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
  Waves,
} from 'lucide-react'
import Link from 'next/link'
import { getRevenueStats } from '../analytics/analytics-actions'
import { DashboardCalendar } from './components/DashboardCalendar'
import { DashboardPaymentChart } from './components/DashboardPaymentChart'
import { DashboardActivity } from './components/DashboardActivity'

const formatMoney = (value: number) => `Rs ${value.toLocaleString('en-IN')}`

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('role, business_id, branch_id, name')
    .eq('id', user.id)
    .single()

  if (!staff) return null

  const todayObj = new Date()
  const today = todayObj.toISOString().split('T')[0]

  const [
    { count: activeBookingsCount },
    { count: itemsOutCount },
    { count: overdueCount },
    { count: totalItemsCount },
    { count: totalCustomersCount },
    { data: revenueTodayData },
    { data: todayPickups },
    { data: todayReturns },
    { data: overdueBookings },
    revenueData,
    { data: activitiesData },
    { data: washingQueueData },
    { data: recentBookingsData },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).in('status', ['booked', 'out']),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('status', 'out'),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('status', 'out').lt('return_date', today),
    supabase.from('items').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('is_active', true),
    supabase.from('customers').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id),
    supabase.from('booking_payments').select('amount')
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59'),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), status, pickup_date')
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('pickup_date', today).limit(8),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), status, return_date')
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('return_date', today).limit(8),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), return_date')
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('status', 'out').lt('return_date', today).limit(5),
    getRevenueStats('7d'),
    supabase.from('audit_log').select('id, action, entity_type, staff_name, created_at')
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase.from('washing_queue').select('id, stage, created_at, item:items(name)')
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('bookings').select('id, booking_number, total_amount, status, created_at, customer:customers(name)')
      .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const activities = (activitiesData || []).map((a) => ({ ...a, staff_name: a.staff_name || 'System' }))
  const revenueToday = revenueTodayData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const statCards = [
    {
      title: 'Today Revenue',
      value: formatMoney(revenueToday),
      helper: 'Payments collected today',
      href: '/analytics',
      icon: IndianRupee,
      tone: 'from-[#4f46e5] to-[#5d5fef]',
      chip: '+8.2%',
      featured: true,
    },
    {
      title: 'Active Orders',
      value: (activeBookingsCount ?? 0).toLocaleString('en-IN'),
      helper: 'Bookings in progress',
      href: '/bookings',
      icon: ShoppingBag,
      chip: '+12.4%',
    },
    {
      title: 'Visitors',
      value: (totalCustomersCount ?? 0).toLocaleString('en-IN'),
      helper: 'Customers in branch',
      href: '/customers',
      icon: Users,
      chip: '+5.7%',
    },
    {
      title: 'Items Out',
      value: (itemsOutCount ?? 0).toLocaleString('en-IN'),
      helper: 'Products with customers',
      href: '/bookings?status=out',
      icon: Package,
      chip: overdueCount ? `${overdueCount} overdue` : '+2.1%',
      danger: Boolean(overdueCount),
    },
  ]

  const categoryStats = [
    { label: 'Occasion Wear', value: totalItemsCount ?? 0, color: 'bg-[#4f46e5]', trend: '+1.9%' },
    { label: 'Active Rentals', value: activeBookingsCount ?? 0, color: 'bg-[#ef4444]', trend: '+2.3%' },
    { label: 'Wash Queue', value: washingQueueData?.length ?? 0, color: 'bg-[#9ca3af]', trend: '-1.4%', down: true },
  ]

  const barData = revenueData.dailyData.slice(-7)
  const maxRevenue = Math.max(...barData.map((item) => item.revenue), 1)
  const maxProfit = Math.max(...barData.map((item) => item.profit), 1)

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      booked: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      out: 'bg-blue-50 text-blue-700 border-blue-100',
      returned: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
    }
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const weekday = todayObj.toLocaleDateString('en-IN', { weekday: 'long' })
  const reportDate = todayObj.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
      <div className="mx-auto max-w-[1440px] space-y-5 text-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Sales Report</h1>
            <p className="text-sm text-slate-500">{weekday}, {reportDate}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 rounded-full border-white bg-white px-4 shadow-sm" asChild>
              <Link href="/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button size="sm" className="h-10 rounded-full bg-[#4f46e5] px-4 text-white shadow-sm hover:bg-[#4338ca]" asChild>
              <Link href="/bookings/new">
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </Link>
            </Button>
          </div>
        </div>

        {overdueBookings && overdueBookings.length > 0 && (
          <Alert className="rounded-2xl border-rose-100 bg-rose-50 text-rose-900">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <AlertTitle>{overdueBookings.length} overdue return{overdueBookings.length !== 1 ? 's' : ''}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 text-rose-700 sm:flex-row sm:items-center sm:justify-between">
              <span>Items are past their due date. Contact customers before the day gets busy.</span>
              <Button variant="outline" size="sm" className="h-8 rounded-full border-rose-200 bg-white text-rose-700" asChild>
                <Link href="/bookings?status=overdue">View all <ChevronRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Link key={stat.title} href={stat.href} className="block">
                    <Card
                      className={`min-h-[132px] rounded-[1.25rem] border-0 shadow-sm ring-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-[146px] sm:rounded-[1.65rem] ${
                        stat.featured
                          ? `bg-gradient-to-br ${stat.tone} text-white`
                          : 'bg-white text-slate-950'
                      }`}
                    >
                      <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.featured ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-700'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge className={`rounded-full border-0 px-2.5 py-1 text-[11px] ${stat.danger ? 'bg-rose-100 text-rose-700' : stat.featured ? 'bg-emerald-300 text-emerald-950' : 'bg-emerald-50 text-emerald-700'}`}>
                            {stat.chip}
                          </Badge>
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${stat.featured ? 'text-white/75' : 'text-slate-500'}`}>{stat.title}</p>
                          <div className="mt-1 flex items-end gap-2">
                            <p className="text-2xl font-bold tracking-normal tabular-nums sm:text-3xl">{stat.value}</p>
                          </div>
                          <p className={`mt-1 max-w-[13rem] text-xs ${stat.featured ? 'text-white/65' : 'text-slate-500'}`}>{stat.helper}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            <Card className="rounded-[1.25rem] border-0 bg-white shadow-sm ring-0 sm:rounded-[1.65rem]">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Customer Habits</h2>
                    <p className="text-xs text-slate-500">Track revenue and profit by day</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full bg-slate-50 px-3 text-xs text-slate-600">
                    This week
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mb-4 flex items-center gap-5 text-xs text-slate-500">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> Revenue</span>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#4f46e5]" /> Profit</span>
                </div>
                <div className="overflow-x-auto">
                <div className="flex h-[230px] min-w-[460px] items-end gap-3 overflow-hidden sm:gap-5">
                  {barData.map((item) => {
                    const revenueHeight = Math.max(18, Math.round((item.revenue / maxRevenue) * 160))
                    const profitHeight = Math.max(14, Math.round((item.profit / maxProfit) * 140))
                    return (
                      <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                        <div className="flex h-[172px] items-end gap-1.5">
                          <div className="w-4 rounded-full bg-slate-200 sm:w-5" style={{ height: `${revenueHeight}px` }} />
                          <div className="w-4 rounded-full bg-[#4f46e5] sm:w-5" style={{ height: `${profitHeight}px` }} />
                        </div>
                        <span className="text-[11px] text-slate-400">{item.date}</span>
                      </div>
                    )
                  })}
                </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="rounded-[1.25rem] border-0 bg-white shadow-sm ring-0 sm:rounded-[1.65rem]">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Product Statistic</h2>
                    <p className="text-xs text-slate-500">Track your product sales</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full bg-slate-50 px-3 text-xs">
                    Today
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="relative mx-auto my-6 grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#4f46e5_0_72%,#e5e7eb_72%_100%)]">
                  <div className="absolute h-[8.5rem] w-[8.5rem] rounded-full bg-[conic-gradient(#ef4444_0_54%,#e5e7eb_54%_100%)]" />
                  <div className="absolute h-24 w-24 rounded-full bg-[conic-gradient(#4f46e5_0_38%,#e5e7eb_38%_100%)]" />
                  <div className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-white text-center shadow-sm">
                    <Shirt className="h-5 w-5 text-[#4f46e5]" />
                  </div>
                </div>
                <div className="mb-5 text-center">
                  <p className="text-2xl font-bold tabular-nums">{(totalItemsCount ?? 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-500">Products listed</p>
                  <Badge className="mt-2 rounded-full border-0 bg-emerald-50 text-emerald-700">+5.34%</Badge>
                </div>
                <div className="space-y-3">
                  {categoryStats.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="flex-1 text-slate-600">{item.label}</span>
                      <span className="font-semibold tabular-nums">{Number(item.value).toLocaleString('en-IN')}</span>
                      <Badge className={`rounded-full border-0 px-2 py-0 text-[10px] ${item.down ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.trend}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.25rem] border-0 bg-white shadow-sm ring-0 sm:rounded-[1.65rem]">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Customer Growth</h2>
                    <p className="text-xs text-slate-500">Track customer locations</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full bg-slate-50 px-3 text-xs">
                    Today
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_120px] sm:items-center">
                  <div className="relative h-36">
                    <div className="absolute left-4 top-6 grid h-20 w-20 place-items-center rounded-full bg-[#7c72ff] text-sm font-bold text-white shadow-sm">{totalCustomersCount ?? 0}</div>
                    <div className="absolute left-20 top-2 grid h-24 w-24 place-items-center rounded-full bg-[#4f46e5] text-sm font-bold text-white shadow-sm">{activeBookingsCount ?? 0}</div>
                    <div className="absolute left-24 top-20 grid h-16 w-16 place-items-center rounded-full bg-[#8b7cf6] text-xs font-bold text-white shadow-sm">{itemsOutCount ?? 0}</div>
                  </div>
                  <div className="space-y-3 text-xs">
                    {['Ahmedabad', 'Surat', 'Vadodara', 'Mumbai'].map((city, index) => (
                      <div key={city} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-[#4f46e5]' : index === 1 ? 'bg-[#ef4444]' : index === 2 ? 'bg-[#f59e0b]' : 'bg-[#94a3b8]'}`} />
                        <span className="text-slate-600">{city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <DashboardCalendar
            pickupDates={(todayPickups || []).map((b) => b.pickup_date).filter(Boolean) as string[]}
            returnDates={(todayReturns || []).map((b) => b.return_date).filter(Boolean) as string[]}
          />
          <DashboardPaymentChart distribution={revenueData.methodDistribution} />
          <DashboardActivity activities={activities} />
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-white p-1 shadow-sm sm:h-12 sm:w-auto sm:inline-grid">
            <TabsTrigger value="schedule" className="rounded-xl data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white">
              <CalendarCheck className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-xl data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white">
              <CircleDollarSign className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="washing" className="rounded-xl data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white">
              <Waves className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Washing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4">
            <div className="grid gap-5 md:grid-cols-2">
              <ScheduleCard
                title="Pickups Today"
                icon={ArrowUpCircle}
                rows={todayPickups || []}
                emptyIcon={CheckCircle2}
                emptyText="No pickups today"
                accent="text-emerald-600"
                dateKey="pickup_date"
                getStatusBadge={getStatusBadge}
              />
              <ScheduleCard
                title="Returns Today"
                icon={ArrowDownCircle}
                rows={todayReturns || []}
                emptyIcon={Package}
                emptyText="No returns today"
                accent="text-orange-600"
                dateKey="return_date"
                getStatusBadge={getStatusBadge}
              />
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-4">
            <Card className="rounded-[1.65rem] border-0 bg-white shadow-sm ring-0">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h2 className="font-semibold">Recent Bookings</h2>
                    <p className="text-xs text-slate-500">Last 6 bookings created</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <Link href="/bookings">View all <ChevronRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
                <div className="overflow-x-auto">
                <Table className="min-w-[620px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-5 text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentBookingsData || []).map((booking) => {
                      const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                      return (
                        <TableRow key={booking.id} className="hover:bg-slate-50">
                          <TableCell className="pl-5">
                            <Link href={`/bookings/${booking.id}`} className="font-medium text-[#4f46e5] hover:underline">
                              {booking.booking_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-slate-100 text-xs">{customer?.name?.charAt(0) ?? 'C'}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-slate-600">{customer?.name ?? '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{formatMoney(Number(booking.total_amount))}</TableCell>
                          <TableCell>
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadge(booking.status)}`}>
                              {booking.status}
                            </span>
                          </TableCell>
                          <TableCell className="pr-5 text-right text-xs text-slate-500">
                            {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {(!recentBookingsData || recentBookingsData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-slate-500">No bookings yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="washing" className="mt-4">
            <Card className="rounded-[1.65rem] border-0 bg-white shadow-sm ring-0">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h2 className="font-semibold">Washing & Maintenance Queue</h2>
                    <p className="text-xs text-slate-500">Items requiring attention</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <Link href="/washing">View all <ChevronRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
                <div className="overflow-x-auto">
                <Table className="min-w-[460px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Item</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="pr-5 text-right">Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(washingQueueData || []).map((entry) => {
                      const item = Array.isArray(entry.item) ? entry.item[0] : entry.item
                      const stageColor: Record<string, string> = {
                        washing: 'bg-blue-50 text-blue-700 border-blue-100',
                        drying: 'bg-amber-50 text-amber-700 border-amber-100',
                        ironing: 'bg-orange-50 text-orange-700 border-orange-100',
                        maintenance: 'bg-rose-50 text-rose-700 border-rose-100',
                        ready: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      }
                      return (
                        <TableRow key={entry.id} className="hover:bg-slate-50">
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-amber-400" />
                              <span className="font-medium">{item?.name ?? 'Item'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${stageColor[entry.stage] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {entry.stage}
                            </span>
                          </TableCell>
                          <TableCell className="pr-5 text-right text-xs text-slate-500">
                            {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {(!washingQueueData || washingQueueData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-slate-500">Queue is empty. Great job.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="rounded-[1.25rem] border-0 bg-white shadow-sm ring-0 sm:rounded-[1.65rem]">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold">Quick Actions</h2>
              <p className="text-xs text-slate-500">Core store workflows</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'New Booking', href: '/bookings/new', icon: CalendarCheck },
                { label: 'Add Item', href: '/inventory/new', icon: Package },
                { label: 'Add Customer', href: '/customers/new', icon: Users },
                { label: 'View Payments', href: '/payments', icon: Wallet },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-[#4f46e5]/20 hover:bg-white">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#4f46e5] shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-medium">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}

function ScheduleCard({
  title,
  icon: Icon,
  rows,
  emptyIcon: EmptyIcon,
  emptyText,
  accent,
  getStatusBadge,
}: {
  title: string
  icon: ElementType
  rows: ScheduleBooking[]
  emptyIcon: ElementType
  emptyText: string
  accent: string
  dateKey: string
  getStatusBadge: (status: string) => string
}) {
  return (
    <Card className="rounded-[1.25rem] border-0 bg-white shadow-sm ring-0 sm:rounded-[1.65rem]">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-4 sm:px-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon className={`h-4 w-4 ${accent}`} />
            {title}
          </h2>
          <Badge variant="secondary" className="rounded-full">{rows.length}</Badge>
        </div>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
          <Table className="min-w-[520px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="pr-5 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((booking) => {
                const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                return (
                  <TableRow key={booking.id} className="hover:bg-slate-50">
                    <TableCell className="pl-5">
                      <Link href={`/bookings/${booking.id}`} className="font-medium text-[#4f46e5] hover:underline">
                        {booking.booking_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-slate-100 text-xs">{customer?.name?.charAt(0) ?? 'C'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-slate-600">{customer?.name ?? 'Customer'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-10 text-center text-slate-500">
            <EmptyIcon className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm">{emptyText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ScheduleBooking = {
  id: string
  booking_number: string | null
  status: string
  customer: { name?: string | null } | { name?: string | null }[] | null
}
