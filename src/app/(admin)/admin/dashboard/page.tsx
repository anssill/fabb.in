import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2,
  Users,
  IndianRupee,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GlobalCharts } from './components/GlobalCharts'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. Core Metrics
  const { count: businessCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true })
  const { count: activeBusinessCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true })
  const { data: recentPayments } = await supabase.from('booking_payments').select('amount').limit(500)
  
  const totalRevenue = recentPayments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0

  // 2. Fetch Growth Data (Last 6 Months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const { data: businessesForGrowth } = await supabase
    .from('businesses')
    .select('created_at')
    .filter('created_at', 'gte', sixMonthsAgo.toISOString())

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const growthMap = new Map()
  
  // Initialize last 6 months
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    growthMap.set(months[d.getMonth()], 0)
  }

  businessesForGrowth?.forEach(b => {
    const month = months[new Date(b.created_at).getMonth()]
    if (growthMap.has(month)) {
      growthMap.set(month, (growthMap.get(month) || 0) + 1)
    }
  })

  const growthData = Array.from(growthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .reverse()

  // 3. Fetch Revenue Data (Last 30 Days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: revenuePoints } = await supabase
    .from('booking_payments')
    .select('amount, created_at')
    .filter('created_at', 'gte', thirtyDaysAgo.toISOString())

  const revenueByDay = new Map()
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    revenueByDay.set(d.toISOString().split('T')[0], 0)
  }

  revenuePoints?.forEach(p => {
    const day = p.created_at.split('T')[0]
    if (revenueByDay.has(day)) {
      revenueByDay.set(day, revenueByDay.get(day) + Number(p.amount))
    }
  })

  const revenueData = Array.from(revenueByDay.entries())
    .map(([date, amount]) => ({ 
      date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), 
      amount 
    }))
    .reverse()

  const { data: recentBusinesses } = await supabase
    .from('businesses')
    .select('id, name, slug, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Total Businesses',
      value: businessCount || 0,
      icon: Building2,
      trend: '+12%',
      trendUp: true,
      color: 'blue'
    },
    {
      title: 'Global Staff',
      value: staffCount || 0,
      icon: Users,
      trend: '+5%',
      trendUp: true,
      color: 'purple'
    },
    {
      title: 'Platform Revenue',
      value: `₹${(totalRevenue / 1000).toFixed(1)}k`,
      icon: IndianRupee,
      trend: '+18%',
      trendUp: true,
      color: 'emerald'
    },
    {
      title: 'Active Businesses',
      value: activeBusinessCount || 0,
      icon: Activity,
      trend: '',
      trendUp: true,
      color: 'orange'
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Overview</h1>
          <p className="text-slate-500 mt-1">Real-time health of the Fabb.booking network.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Live
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trend}
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </CardContent>
            <div className={`h-1 w-full bg-${stat.color}-500/20`} />
          </Card>
        ))}
      </div>

      <GlobalCharts revenueData={revenueData} growthData={growthData} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Onboarding</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/businesses">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentBusinesses?.map((biz) => (
                <div key={biz.id} className="py-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {biz.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{biz.name}</p>
                      <p className="text-xs text-slate-500">{new Date(biz.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={biz.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {biz.status}
                    </Badge>
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={`/admin/businesses`}>Manage</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <span className="text-xs text-slate-500">99.9% Uptime</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium">Authentication</span>
              </div>
              <span className="text-xs text-slate-500">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium">Realtime Service</span>
              </div>
              <span className="text-xs text-slate-500">Connected</span>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Maintenance Scheduled</p>
                  <p className="mt-1 opacity-80">Database migration scheduled for April 12, 02:00 IST.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

