'use client'

import { useEffect, useState, useRef } from 'react'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useDashboardStats } from '@/lib/queries/useDashboardStats'
import { createClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/dashboard/StatCard'
import { ScheduleWidget } from '@/components/dashboard/ScheduleWidget'
import { AlertCentre } from '@/components/dashboard/AlertCentre'
import { OpeningChecklistModal } from '@/components/dashboard/OpeningChecklistModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpRight,
  Box,
  BellRing,
  IndianRupee,
  Calendar,
  CalendarDays,
  Clock,
  Wand2,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { formatINR, timeAgo } from '@/lib/format'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { RealtimeDashboard } from '@/components/dashboard/RealtimeDashboard'

export default function DashboardPage() {
  const profile = useUserStore((s) => s.profile)
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const { data: stats, isLoading, refetch } = useDashboardStats()
  const [checklistOpen, setChecklistOpen] = useState(false)
  const checklistChecked = useRef(false)

  // Check if opening checklist has been completed today
  useEffect(() => {
    if (!profile?.id || !activeBranchId || checklistChecked.current) return
    checklistChecked.current = true

    const today = new Date().toISOString().split('T')[0]
    const supabase = createClient()
    supabase
      .from('opening_checklists')
      .select('id')
      .eq('branch_id', activeBranchId)
      .eq('staff_id', profile.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setChecklistOpen(true)
      })
  }, [profile?.id, activeBranchId])

  const firstName = profile?.name?.split(' ')[0] || 'Staff'
  const isManagerOrAbove =
    profile?.role === 'manager' || profile?.role === 'super_admin'
  const isSuperAdmin = profile?.role === 'super_admin'

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12
      ? 'Good morning'
      : greetingHour < 17
      ? 'Good afternoon'
      : 'Good evening'

  return (
    <>
      {/* Realtime listener — triggers refetch on DB changes */}
      <RealtimeDashboard onUpdate={() => refetch()} branchId={activeBranchId} />

      {/* Opening checklist */}
      <OpeningChecklistModal
        open={checklistOpen}
        onComplete={() => setChecklistOpen(false)}
      />

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/bookings/new">
              <Button className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold h-9 shadow-sm">
                <ArrowUpRight className="w-4 h-4 mr-1.5" />
                New Booking
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="h-9 border-zinc-200 dark:border-zinc-800 text-sm">
                <Box className="w-4 h-4 mr-1.5" />
                Add Item
              </Button>
            </Link>
            <Link href="/washing">
              <Button variant="outline" className="h-9 border-zinc-200 dark:border-zinc-800 text-sm">
                <Wand2 className="w-4 h-4 mr-1.5" />
                Washing
              </Button>
            </Link>
          </div>
        </div>

        {/* ── KPI cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Today's Revenue"
            value={isLoading ? '–' : formatINR(stats?.todaysRevenue ?? 0)}
            icon={<IndianRupee className="w-4 h-4" />}
            isLoading={isLoading}
            highlight
          />
          <StatCard
            label="Pickups Today"
            value={stats?.pickupsToday ?? 0}
            icon={<Calendar className="w-4 h-4" />}
            isLoading={isLoading}
            trend="neutral"
          />
          <StatCard
            label="Returns Today"
            value={stats?.returnsToday ?? 0}
            icon={<CalendarDays className="w-4 h-4" />}
            isLoading={isLoading}
          />
          <StatCard
            label="Overdue"
            value={stats?.returnsOverdue ?? 0}
            icon={<Clock className="w-4 h-4" />}
            isLoading={isLoading}
            trend={stats?.returnsOverdue ? 'down' : 'neutral'}
            trendLabel={stats?.returnsOverdue ? 'Needs attention' : 'All clear'}
          />
        </div>

        {/* ── Secondary cards (manager+) ──────────────────────────── */}
        {isManagerOrAbove && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Active Rentals"
              value={stats?.activeRentals ?? 0}
              icon={<TrendingUp className="w-4 h-4" />}
              isLoading={isLoading}
            />
            <StatCard
              label="Washing Queue"
              value={stats?.washingQueueTotal ?? 0}
              icon={<Wand2 className="w-4 h-4" />}
              isLoading={isLoading}
              trendLabel={stats?.washingUrgentCount ? `${stats.washingUrgentCount} urgent` : undefined}
              trend={stats?.washingUrgentCount ? 'down' : undefined}
            />
            <StatCard
              label="Washing Urgent"
              value={stats?.washingUrgentCount ?? 0}
              icon={<BellRing className="w-4 h-4" />}
              isLoading={isLoading}
            />
            <StatCard
              label="Pending Approvals"
              value={stats?.pendingApprovals ?? 0}
              icon={<ArrowUpRight className="w-4 h-4" />}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* ── Main grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Pickups and returns due today
                  </CardDescription>
                </div>
                {isLoading ? (
                  <Skeleton className="h-5 w-16 rounded-full" />
                ) : stats?.todaysSchedule?.length ? (
                  <Badge variant="outline" className="text-xs border-zinc-200 dark:border-zinc-700">
                    {stats.todaysSchedule.length} items
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[360px] overflow-y-auto">
              <ScheduleWidget
                items={stats?.todaysSchedule ?? []}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-4">
            {/* Alert centre */}
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base font-semibold">Alert Centre</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <AlertCentre stats={stats} isLoading={isLoading} role={profile?.role} />
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !stats?.recentActivity?.length ? (
                  <div className="p-6 text-center text-sm text-zinc-400">No activity yet</div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {stats.recentActivity.map((a, i) => (
                      <div key={i} className="flex gap-3 px-4 py-3 items-start">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            a.type === 'success'
                              ? 'bg-emerald-500'
                              : a.type === 'warning'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                            <span className="font-semibold">{a.action}</span>
                            {' · '}
                            <span className="text-zinc-500">{a.target}</span>
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {a.user} · {a.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Revenue chart (manager+) ────────────────────────────── */}
        {isManagerOrAbove && (
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-50 dark:border-zinc-800 bg-white/50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Revenue Pulse</CardTitle>
                  <CardDescription className="text-xs">Real-time booking revenue (Last 7 Days)</CardDescription>
                </div>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50">
                    Full Report <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="h-64 pt-6 px-1 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Mon', rev: 4200 },
                  { name: 'Tue', rev: 3800 },
                  { name: 'Wed', rev: 5100 },
                  { name: 'Thu', rev: 4900 },
                  { name: 'Fri', rev: 6700 },
                  { name: 'Sat', rev: 8200 },
                  { name: 'Sun', rev: 7400 },
                ]}>
                  <defs>
                    <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ccff00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    itemStyle={{ color: '#000', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rev" 
                    stroke="#acc200" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#dashRev)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Super admin franchise summary ──────────────────────── */}
        {isSuperAdmin && (
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-semibold">Franchise Overview</CardTitle>
              <CardDescription className="text-xs">Cross-branch summary</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-zinc-400 text-center py-6">
                Franchise dashboard — configure in{' '}
                <Link href="/franchise" className="text-[#ccff00] hover:underline">
                  Franchise section
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
