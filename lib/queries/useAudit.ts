import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

export function useSystemAuditLog() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['system-audit', activeBranchId],
    queryFn: async () => {
      // Combining multiple log tables for a unified stream
      const [auditRes, bookingRes, repairRes] = await Promise.all([
        supabase
          .from('audit_log')
          .select('*, staff(name)')
          .eq('branch_id', activeBranchId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('booking_timeline')
          .select('*, staff(name)')
          .order('timestamp', { ascending: false })
          .limit(50),
        supabase
          .from('item_repairs')
          .select('*, items(name)')
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      const logs = [
        ...(auditRes.data || []).map(l => ({ ...l, type: 'system', timestamp: l.created_at })),
        ...(bookingRes.data || []).map(l => ({ ...l, type: 'booking', timestamp: l.timestamp })),
        ...(repairRes.data || []).map(l => ({ ...l, type: 'repair', timestamp: l.created_at, action: 'Repair Dispatched/Returned' }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      return logs.slice(0, 50)
    },
    enabled: !!activeBranchId,
  })
}

export function useStaffPerformance() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['staff-performance', activeBranchId],
    queryFn: async () => {
      // Complex aggregation for performance leaderboard
      const { data: staff, error: sError } = await supabase
        .from('staff')
        .select(`
          id, 
          name, 
          role,
          staff_performance_targets(*)
        `)
        .eq('branch_id', activeBranchId)

      if (sError) throw sError

      const { data: bookings, error: bError } = await supabase
        .from('bookings')
        .select('id, staff_id, total_price, status')
        .eq('branch_id', activeBranchId)
      
      if (bError) throw bError

      // Calculate metrics per staff
      return staff.map(s => {
        const handledBookings = bookings.filter(b => b.staff_id === s.id)
        return {
          ...s,
          bookingCount: handledBookings.length,
          revenueGenerated: handledBookings.reduce((acc, b) => acc + (b.total_price || 0), 0),
          efficiency: handledBookings.length > 0 ? (handledBookings.filter(b => b.status === 'returned').length / handledBookings.length * 100).toFixed(0) : 0
        }
      }).sort((a, b) => b.revenueGenerated - a.revenueGenerated)
    },
    enabled: !!activeBranchId,
  })
}
