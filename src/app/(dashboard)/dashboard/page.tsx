import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  CalendarCheck,
  Package,
  Users,
  IndianRupee,
  AlertTriangle,
  Plus,
  TrendingUp,
  Clock,
  ShoppingBag,
  ArrowUpCircle,
  BarChart3,
  Wallet,
  Activity,
  Star,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { getRevenueStats } from '../analytics/analytics-actions'
import { DashboardRevenueChart } from './components/DashboardRevenueChart'
import { DashboardCalendar } from './components/DashboardCalendar'
import { DashboardActivity } from './components/DashboardActivity'
import { DashboardPaymentChart } from './components/DashboardPaymentChart'

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

  const today_obj = new Date()
  const today = today_obj.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(today_obj.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

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
    { data: weeklyRevenueData },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).in('status', ['booked', 'out']),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('status', 'out'),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('status', 'out').lt('return_date', today),
    supabase.from('items').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id).eq('is_active', true),
    supabase.from('customers').select('*', { count: 'exact', head: true })
      .eq('business_id', staff.business_id),
    supabase.from('booking_payments').select('amount')
      .eq('business_id', staff.business_id)
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59'),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), status, pickup_date')
      .eq('business_id', staff.business_id).eq('pickup_date', today).limit(8),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), status, return_date')
      .eq('business_id', staff.business_id).eq('return_date', today).limit(8),
    supabase.from('bookings').select('id, booking_number, customer:customers(name, phone), return_date')
      .eq('business_id', staff.business_id).eq('status', 'out').lt('return_date', today).limit(5),
    getRevenueStats('7d'),
    supabase.from('audit_log').select('id, action, entity_type, staff_name, created_at')
      .eq('business_id', staff.business_id)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase.from('washing_queue').select('id, stage, created_at, item:items(name)')
      .eq('business_id', staff.business_id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('bookings').select('id, booking_number, total_amount, status, created_at, customer:customers(name)')
      .eq('business_id', staff.business_id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('booking_payments').select('amount, created_at, method')
      .eq('business_id', staff.business_id)
      .gte('created_at', sevenDaysAgo)
      .eq('is_voided', false),
  ])

  const activities = (activitiesData || []).map(a => ({ ...a, staff_name: a.staff_name || 'System' }))
  const revenueToday = revenueTodayData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Payment method totals for the week
  const cashTotal = weeklyRevenueData?.filter(p => p.method === 'cash').reduce((s, p) => s + Number(p.amount), 0) || 0
  const upiTotal = weeklyRevenueData?.filter(p => p.method === 'upi').reduce((s, p) => s + Number(p.amount), 0) || 0
  const bankTotal = weeklyRevenueData?.filter(p => p.method === 'bank_transfer').reduce((s, p) => s + Number(p.amount), 0) || 0
  const weeklyTotal = cashTotal + upiTotal + bankTotal

  const statsCards = [
    {
      title: 'Active Bookings',
      value: activeBookingsCount ?? 0,
      icon: ShoppingBag,
      href: '/bookings',
      trend: '+12%',
      trendUp: true,
      color: 'blue',
      bg: 'bg-blue-50 dark:bg-blue-950',
      iconColor: 'text-blue-600',
    },
    {
      title: "Today&apos;s Revenue",
      value: `₹${revenueToday.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      href: '/analytics',
      trend: '+8%',
      trendUp: true,
      color: 'emerald',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Items Out',
      value: itemsOutCount ?? 0,
      icon: ArrowUpCircle,
      href: '/bookings?status=out',
      trend: null,
      trendUp: null,
      color: 'violet',
      bg: 'bg-violet-50 dark:bg-violet-950',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Overdue',
      value: overdueCount ?? 0,
      icon: AlertTriangle,
      href: '/bookings?status=overdue',
      trend: null,
      trendUp: false,
      color: 'rose',
      bg: 'bg-rose-50 dark:bg-rose-950',
      iconColor: 'text-rose-600',
    },
    {
      title: 'Total Items',
      value: totalItemsCount ?? 0,
      icon: Package,
      href: '/inventory',
      trend: null,
      trendUp: null,
      color: 'amber',
      bg: 'bg-amber-50 dark:bg-amber-950',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Customers',
      value: totalCustomersCount ?? 0,
      icon: Users,
      href: '/customers',
      trend: '+3',
      trendUp: true,
      color: 'indigo',
      bg: 'bg-indigo-50 dark:bg-indigo-950',
      iconColor: 'text-indigo-600',
    },
  ]

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      booked: 'bg-blue-100 text-blue-700 border-blue-200',
      out: 'bg-violet-100 text-violet-700 border-violet-200',
      returned: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
    }
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const greetHour = new Date().getHours()
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {greeting}, {staff.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" asChild>
              <Link href="/bookings/new">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Overdue Alert ── */}
        {overdueBookings && overdueBookings.length > 0 && (
          <Alert className="border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <AlertTitle className="text-rose-800 dark:text-rose-300">
              {overdueBookings.length} overdue return{overdueBookings.length !== 1 ? 's' : ''}
            </AlertTitle>
            <AlertDescription className="text-rose-600 dark:text-rose-400 flex items-center justify-between mt-1">
              <span>Items past their due date — contact customers immediately.</span>
              <Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-100 h-7 ml-4 shrink-0" asChild>
                <Link href="/bookings?status=overdue">View All <ChevronRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Tooltip key={stat.title}>
                <TooltipTrigger asChild>
                  <Link href={stat.href}>
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border hover:border-slate-300 dark:hover:border-slate-600">
                      <CardContent className="p-4 space-y-3">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{stat.value}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.title}</p>
                          {stat.trend && (
                            <span className={`text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {stat.trendUp ? '↑' : '↓'} {stat.trend} this week
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Go to {stat.title}</p></TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* ── Payment Methods Strip ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">7-Day Collections</span>
              </div>
              <Separator orientation="vertical" className="hidden sm:block h-8" />
              <div className="flex flex-wrap gap-6 flex-1">
                {[
                  { label: 'Cash', value: cashTotal, color: 'bg-emerald-500', pct: weeklyTotal > 0 ? (cashTotal / weeklyTotal) * 100 : 0 },
                  { label: 'UPI', value: upiTotal, color: 'bg-blue-500', pct: weeklyTotal > 0 ? (upiTotal / weeklyTotal) * 100 : 0 },
                  { label: 'Bank Transfer', value: bankTotal, color: 'bg-violet-500', pct: weeklyTotal > 0 ? (bankTotal / weeklyTotal) * 100 : 0 },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-3 min-w-[140px]">
                    <div className={`w-2.5 h-2.5 rounded-full ${m.color} shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{m.label}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">₹{m.value.toLocaleString('en-IN')}</span>
                      </div>
                      <Progress value={m.pct} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">₹{weeklyTotal.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Main 3-col grid: Chart | Calendar | Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart — 2 cols */}
          <DashboardRevenueChart data={revenueData.dailyData} />

          {/* Calendar — 1 col */}
          <DashboardCalendar
            pickupDates={(todayPickups || []).map(b => b.pickup_date).filter(Boolean) as string[]}
            returnDates={(todayReturns || []).map(b => b.return_date).filter(Boolean) as string[]}
          />
        </div>

        {/* ── Payment Methods Pie + Activity Feed ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardPaymentChart distribution={revenueData.methodDistribution} />
          <div className="lg:col-span-2">
            <DashboardActivity activities={activities} />
          </div>
        </div>

        {/* ── Tabs: Today's Schedule / Recent Bookings / Washing Queue ── */}
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              Today&apos;s Schedule
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Recent Bookings
            </TabsTrigger>
            <TabsTrigger value="washing" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Wash Queue
            </TabsTrigger>
          </TabsList>

          {/* ── TODAY's SCHEDULE ── */}
          <TabsContent value="schedule" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickups */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Pickups Today
                    </CardTitle>
                    <Badge variant="secondary">{todayPickups?.length ?? 0}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {todayPickups && todayPickups.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs pl-4">Booking #</TableHead>
                          <TableHead className="text-xs">Customer</TableHead>
                          <TableHead className="text-xs text-right pr-4">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayPickups.map((booking) => {
                          const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                          return (
                            <TableRow key={booking.id} className="hover:bg-muted/50 cursor-pointer">
                              <TableCell className="pl-4">
                                <Link href={`/bookings/${booking.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                                  {booking.booking_number}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">{customer?.name?.charAt(0) ?? 'C'}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{customer?.name ?? 'Customer'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mb-2 text-slate-300" />
                      <p className="text-sm">No pickups today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Returns */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      Returns Today
                    </CardTitle>
                    <Badge variant="secondary">{todayReturns?.length ?? 0}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {todayReturns && todayReturns.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs pl-4">Booking #</TableHead>
                          <TableHead className="text-xs">Customer</TableHead>
                          <TableHead className="text-xs text-right pr-4">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayReturns.map((booking) => {
                          const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                          return (
                            <TableRow key={booking.id} className="hover:bg-muted/50 cursor-pointer">
                              <TableCell className="pl-4">
                                <Link href={`/bookings/${booking.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                                  {booking.booking_number}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">{customer?.name?.charAt(0) ?? 'C'}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{customer?.name ?? 'Customer'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mb-2 text-slate-300" />
                      <p className="text-sm">No returns today</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── RECENT BOOKINGS ── */}
          <TabsContent value="bookings" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Bookings</CardTitle>
                    <CardDescription>Last 6 bookings created</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/bookings">View All <ChevronRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentBookingsData || []).map((booking) => {
                      const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                      return (
                        <TableRow key={booking.id} className="hover:bg-muted/50">
                          <TableCell className="pl-4">
                            <Link href={`/bookings/${booking.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                              {booking.booking_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs bg-slate-100">{customer?.name?.charAt(0) ?? 'C'}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">{customer?.name ?? '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900 dark:text-white">
                            ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(booking.status)}`}>
                              {booking.status}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                            {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {(!recentBookingsData || recentBookingsData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No bookings yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── WASHING QUEUE ── */}
          <TabsContent value="washing" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Washing & Maintenance Queue</CardTitle>
                    <CardDescription>Items requiring attention</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/washing">View All <ChevronRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Item</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="pr-4 text-right">Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(washingQueueData || []).map((entry) => {
                      const item = Array.isArray(entry.item) ? entry.item[0] : entry.item
                      const stageColor: Record<string, string> = {
                        washing: 'bg-blue-100 text-blue-700 border-blue-200',
                        drying: 'bg-amber-100 text-amber-700 border-amber-200',
                        ironing: 'bg-orange-100 text-orange-700 border-orange-200',
                        maintenance: 'bg-rose-100 text-rose-700 border-rose-200',
                        ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      }
                      return (
                        <TableRow key={entry.id} className="hover:bg-muted/50">
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-sm font-medium">{item?.name ?? 'Item'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${stageColor[entry.stage] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {entry.stage}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {(!washingQueueData || washingQueueData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Queue is empty — great job! 🎉</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Quick Actions ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'New Booking', href: '/bookings/new', icon: CalendarCheck, color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' },
                { label: 'Add Item', href: '/inventory/new', icon: Package, color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' },
                { label: 'Add Customer', href: '/customers/new', icon: Users, color: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200' },
                { label: 'Record Payment', href: '/payments/new', icon: IndianRupee, color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}>
                    <div className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all cursor-pointer ${action.color}`}>
                      <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold">{action.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
