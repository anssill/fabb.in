import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { formatInTimeZone } from 'date-fns-tz'

export interface DashboardStats {
  activeRentals: number
  pickupsToday: number
  returnsToday: number
  returnsOverdue: number
  todaysRevenue: number
  washingUrgentCount: number
  washingQueueTotal: number
  pendingApprovals: number
  recentActivity: ActivityItem[]
  todaysSchedule: ScheduleItem[]
}

export interface ActivityItem {
  id: string
  action: string
  target: string
  user: string
  time: string
  type: 'success' | 'info' | 'warning'
}

export interface ScheduleItem {
  id: string
  type: 'pickup' | 'return'
  customerName: string
  customerPhone: string
  bookingId: string
  date: string
  isOverdue: boolean
  status: string
}

export function useDashboardStats() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['dashboard-stats', activeBranchId],
    queryFn: async (): Promise<DashboardStats | null> => {
      if (!activeBranchId) return null

      const today = formatInTimeZone(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd')

      const [
        activeResult,
        pickupsResult,
        returnsResult,
        overdueResult,
        revenueResult,
        washingResult,
        approvalsResult,
        activityResult,
        schedulePickupsResult,
        scheduleReturnsResult,
      ] = await Promise.all([
        // Active rentals
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', activeBranchId)
          .eq('status', 'active'),

        // Pickups today
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', activeBranchId)
          .eq('pickup_date', today)
          .in('status', ['confirmed', 'active']),

        // Returns today
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', activeBranchId)
          .eq('return_date', today)
          .eq('status', 'active'),

        // Overdue
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', activeBranchId)
          .eq('status', 'overdue'),

        // Today's revenue from payments
        supabase
          .from('booking_payments')
          .select('amount')
          .eq('branch_id', activeBranchId)
          .gte('created_at', `${today}T00:00:00+05:30`)
          .eq('void', false),

        // Washing queue stats
        supabase
          .from('washing_queue')
          .select('priority', { count: 'exact' })
          .eq('branch_id', activeBranchId)
          .neq('stage', 'ready'),

        // Pending staff approvals (manager+)
        supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', activeBranchId)
          .eq('status', 'pending'),

        // Recent activity from booking_timeline
        supabase
          .from('bookings')
          .select('id, status, created_at, customers!inner(name), created_by_staff:staff!bookings_created_by_fkey(name)')
          .eq('branch_id', activeBranchId)
          .order('created_at', { ascending: false })
          .limit(8),

        // Today's pickups for schedule
        supabase
          .from('bookings')
          .select('id, status, pickup_date, customers!inner(name, phone)')
          .eq('branch_id', activeBranchId)
          .eq('pickup_date', today)
          .in('status', ['confirmed', 'active', 'overdue'])
          .order('pickup_date'),

        // Today's returns for schedule
        supabase
          .from('bookings')
          .select('id, status, return_date, customers!inner(name, phone)')
          .eq('branch_id', activeBranchId)
          .eq('return_date', today)
          .in('status', ['active', 'overdue'])
          .order('return_date'),
      ])

      const revenue = (revenueResult.data || []).reduce(
        (sum, p: { amount: number }) => sum + Number(p.amount || 0),
        0
      )

      const washingUrgent = (washingResult.data || []).filter(
        (w: { priority: string }) => w.priority === 'urgent'
      ).length

      const recentActivity: ActivityItem[] = ((activityResult.data as unknown as {
        id: string
        status: string
        created_at: string
        customers: { name: string } | null
        created_by_staff: { name: string } | null
      }[]) || []).map((b) => ({
        id: b.id,
        action: `Booking ${b.status}`,
        target: b.customers?.name || 'Walk-in',
        user: b.created_by_staff?.name || 'System',
        time: formatInTimeZone(new Date(b.created_at), 'Asia/Kolkata', 'h:mm a'),
        type:
          b.status === 'confirmed' || b.status === 'returned'
            ? 'success'
            : b.status === 'overdue'
            ? 'warning'
            : 'info',
      }))

      const pickupSchedule: ScheduleItem[] = ((schedulePickupsResult.data as unknown as {
        id: string
        status: string
        pickup_date: string
        customers: { name: string; phone: string } | null
      }[]) || []).map((b) => ({
        id: b.id,
        type: 'pickup',
        customerName: b.customers?.name || 'Unknown',
        customerPhone: b.customers?.phone || '',
        bookingId: b.id.slice(-6).toUpperCase(),
        date: b.pickup_date,
        isOverdue: b.status === 'overdue',
        status: b.status,
      }))

      const returnSchedule: ScheduleItem[] = ((scheduleReturnsResult.data as unknown as {
        id: string
        status: string
        return_date: string
        customers: { name: string; phone: string } | null
      }[]) || []).map((b) => ({
        id: b.id,
        type: 'return',
        customerName: b.customers?.name || 'Unknown',
        customerPhone: b.customers?.phone || '',
        bookingId: b.id.slice(-6).toUpperCase(),
        date: b.return_date,
        isOverdue: b.status === 'overdue',
        status: b.status,
      }))

      return {
        activeRentals: activeResult.count || 0,
        pickupsToday: pickupsResult.count || 0,
        returnsToday: returnsResult.count || 0,
        returnsOverdue: overdueResult.count || 0,
        todaysRevenue: revenue,
        washingUrgentCount: washingUrgent,
        washingQueueTotal: washingResult.count || 0,
        pendingApprovals: approvalsResult.count || 0,
        recentActivity,
        todaysSchedule: [
          ...pickupSchedule.filter((s) => s.isOverdue),
          ...returnSchedule.filter((s) => s.isOverdue),
          ...pickupSchedule.filter((s) => !s.isOverdue),
          ...returnSchedule.filter((s) => !s.isOverdue),
        ],
      }
    },
    enabled: !!activeBranchId,
    refetchInterval: 30_000,
  })
}
