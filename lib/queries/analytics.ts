'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useAnalyticsStore, type DateRange } from '@/lib/stores/analyticsStore'

// ── Revenue Over Time ──────────────────────────────────────────────
export function useRevenueOverTime() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateRange = useAnalyticsStore((s) => s.dateRange)

  return useQuery({
    queryKey: ['analytics-revenue', activeBranchId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('booking_payments')
        .select('amount, timestamp, type, is_voided')
        .eq('branch_id', activeBranchId)
        .eq('is_voided', false)
        .gte('timestamp', dateRange.start.toISOString())
        .lte('timestamp', dateRange.end.toISOString())
        .order('timestamp', { ascending: true })

      if (error) throw error

      // Group by date
      const grouped: Record<string, number> = {}
      for (const p of data || []) {
        if (p.type === 'deposit') continue
        const day = new Date(p.timestamp).toISOString().split('T')[0]
        grouped[day] = (grouped[day] || 0) + Number(p.amount)
      }

      return Object.entries(grouped).map(([date, revenue]) => ({
        date,
        revenue,
      }))
    },
    enabled: !!activeBranchId,
  })
}

// ── Booking Metrics ────────────────────────────────────────────────
export function useBookingMetrics() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateRange = useAnalyticsStore((s) => s.dateRange)

  return useQuery({
    queryKey: ['analytics-bookings', activeBranchId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!activeBranchId) return null

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, status, total_amount, occasion, booking_source, customer_id, created_at')
        .eq('branch_id', activeBranchId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())

      if (error) throw error
      const all = bookings || []
      const totalBookings = all.length
      const cancelled = all.filter((b) => b.status === 'cancelled').length
      const cancellationRate = totalBookings > 0 ? Math.round((cancelled / totalBookings) * 100) : 0
      const totalValue = all.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
      const avgBookingValue = totalBookings > 0 ? Math.round(totalValue / totalBookings) : 0

      // Occasion breakdown
      const occasions: Record<string, number> = {}
      for (const b of all) {
        if (b.occasion) occasions[b.occasion] = (occasions[b.occasion] || 0) + 1
      }
      const mostPopularOccasion = Object.keys(occasions).sort((a, b) => occasions[b] - occasions[a])[0] || 'N/A'

      // Source breakdown
      const sources: Record<string, number> = {}
      for (const b of all) {
        const src = b.booking_source || 'walk_in'
        sources[src] = (sources[src] || 0) + 1
      }

      // Unique customers
      const uniqueCustomers = new Set(all.map((b) => b.customer_id)).size

      return {
        totalBookings,
        cancellationRate,
        avgBookingValue,
        mostPopularOccasion,
        uniqueCustomers,
        sources: Object.entries(sources).map(([name, value]) => ({ name, value })),
      }
    },
    enabled: !!activeBranchId,
  })
}

// ── Item Utilisation ───────────────────────────────────────────────
export function useItemUtilisation() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateRange = useAnalyticsStore((s) => s.dateRange)

  return useQuery({
    queryKey: ['analytics-utilisation', activeBranchId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data: bookingItems, error } = await supabase
        .from('booking_items')
        .select('item_id, subtotal, bookings!inner(pickup_date, return_date, status, branch_id)')
        .eq('branch_id', activeBranchId)

      if (error) throw error

      const { data: items } = await supabase
        .from('items')
        .select('id, name, sku, category, created_at')
        .eq('branch_id', activeBranchId)

      const itemMap = new Map((items || []).map((i) => [i.id, i]))
      const utilisationMap: Record<string, { rentalCount: number; revenue: number; daysRented: number }> = {}

      for (const bi of bookingItems || []) {
        const id = bi.item_id
        if (!utilisationMap[id]) utilisationMap[id] = { rentalCount: 0, revenue: 0, daysRented: 0 }
        utilisationMap[id].rentalCount++
        utilisationMap[id].revenue += Number(bi.subtotal || 0)

        const booking = bi.bookings as unknown as { pickup_date: string; return_date: string }
        if (booking?.pickup_date && booking?.return_date) {
          const days = Math.max(1, Math.ceil(
            (new Date(booking.return_date).getTime() - new Date(booking.pickup_date).getTime()) / 86400000
          ))
          utilisationMap[id].daysRented += days
        }
      }

      const now = new Date()
      return Object.entries(utilisationMap)
        .map(([itemId, stats]) => {
          const item = itemMap.get(itemId)
          const availableDays = item
            ? Math.max(1, Math.ceil((now.getTime() - new Date(item.created_at).getTime()) / 86400000))
            : 1
          return {
            itemId,
            name: item?.name || 'Unknown',
            sku: item?.sku || '',
            category: item?.category || '',
            rentalCount: stats.rentalCount,
            revenue: stats.revenue,
            utilisation: Math.min(100, Math.round((stats.daysRented / availableDays) * 100)),
          }
        })
        .sort((a, b) => b.utilisation - a.utilisation)
    },
    enabled: !!activeBranchId,
  })
}

// ── Staff Performance ──────────────────────────────────────────────
export function useStaffPerformanceAnalytics() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateRange = useAnalyticsStore((s) => s.dateRange)

  return useQuery({
    queryKey: ['analytics-staff', activeBranchId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data: staff } = await supabase
        .from('staff')
        .select('id, name, role')
        .eq('branch_id', activeBranchId)
        .eq('status', 'approved')

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, created_by, total_amount')
        .eq('branch_id', activeBranchId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())

      const { data: targets } = await supabase
        .from('staff_performance_targets')
        .select('*')
        .eq('branch_id', activeBranchId)

      const { data: attendance } = await supabase
        .from('staff_attendance')
        .select('staff_id, date')
        .eq('branch_id', activeBranchId)
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0])

      return (staff || []).map((s) => {
        const staffBookings = (bookings || []).filter((b) => b.created_by === s.id)
        const totalRevenue = staffBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
        const target = (targets || []).find((t) => t.staff_id === s.id)
        const attendanceDays = (attendance || []).filter((a) => a.staff_id === s.id).length

        return {
          id: s.id,
          name: s.name,
          role: s.role,
          totalBookings: staffBookings.length,
          totalRevenue,
          avgBookingValue: staffBookings.length > 0 ? Math.round(totalRevenue / staffBookings.length) : 0,
          revenueTarget: target?.revenue_target || 0,
          bookingTarget: target?.booking_count_target || 0,
          attendanceDays,
        }
      })
    },
    enabled: !!activeBranchId,
  })
}

// ── Customer Metrics ───────────────────────────────────────────────
export function useCustomerMetrics() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateRange = useAnalyticsStore((s) => s.dateRange)

  return useQuery({
    queryKey: ['analytics-customers', activeBranchId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!activeBranchId) return null

      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, tier, risk_level, blacklist_level, total_spend, created_at')
        .eq('branch_id', activeBranchId)

      const allCustomers = customers || []
      const newCustomers = allCustomers.filter(
        (c) =>
          new Date(c.created_at) >= dateRange.start &&
          new Date(c.created_at) <= dateRange.end
      ).length

      const tierBreakdown: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
      for (const c of allCustomers) {
        tierBreakdown[c.tier || 'bronze'] = (tierBreakdown[c.tier || 'bronze'] || 0) + 1
      }

      const blacklisted = allCustomers.filter((c) => (c.blacklist_level || 0) > 0).length
      const highRisk = allCustomers.filter((c) => c.risk_level === 'high').length
      const topBySpend = [...allCustomers]
        .sort((a, b) => Number(b.total_spend || 0) - Number(a.total_spend || 0))
        .slice(0, 10)

      const totalLTV = allCustomers.reduce((sum, c) => sum + Number(c.total_spend || 0), 0)
      const avgLTV = allCustomers.length > 0 ? Math.round(totalLTV / allCustomers.length) : 0

      return {
        totalCustomers: allCustomers.length,
        newCustomers,
        tierBreakdown,
        blacklisted,
        highRisk,
        topBySpend,
        avgLTV,
      }
    },
    enabled: !!activeBranchId,
  })
}

// ── P&L Statement ──────────────────────────────────────────────────
export function usePLStatement() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateRange = useAnalyticsStore((s) => s.dateRange)

  return useQuery({
    queryKey: ['analytics-pl', activeBranchId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!activeBranchId)
        return { rentalRevenue: 0, penaltyIncome: 0, totalRevenue: 0, expenses: [], totalExpenses: 0, netProfit: 0, profitMargin: 0, depositsHeld: 0 }

      // Revenue
      const { data: payments } = await supabase
        .from('booking_payments')
        .select('amount, type, is_voided')
        .eq('branch_id', activeBranchId)
        .eq('is_voided', false)
        .gte('timestamp', dateRange.start.toISOString())
        .lte('timestamp', dateRange.end.toISOString())

      const allPayments = payments || []
      const rentalRevenue = allPayments
        .filter((p) => p.type === 'advance' || p.type === 'balance')
        .reduce((sum, p) => sum + Number(p.amount), 0)
      const penaltyIncome = allPayments
        .filter((p) => p.type === 'penalty')
        .reduce((sum, p) => sum + Number(p.amount), 0)
      const totalRevenue = rentalRevenue + penaltyIncome

      // Deposits
      const depositsHeld = allPayments
        .filter((p) => p.type === 'deposit')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      // Expenses
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('branch_id', activeBranchId)
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0])

      const expensesByCategory: Record<string, number> = {}
      for (const e of expenseData || []) {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount)
      }

      const expenses = Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
      }))
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      const netProfit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

      return { rentalRevenue, penaltyIncome, totalRevenue, expenses, totalExpenses, netProfit, profitMargin, depositsHeld }
    },
    enabled: !!activeBranchId,
  })
}

// ── NPS ────────────────────────────────────────────────────────────
export function useNPSScore() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateRange = useAnalyticsStore((s) => s.dateRange)

  return useQuery({
    queryKey: ['analytics-nps', activeBranchId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!activeBranchId) return { nps: 0, promoters: 0, detractors: 0, passives: 0, totalResponses: 0 }

      const { data, error } = await supabase
        .from('nps_responses')
        .select('score')
        .eq('branch_id', activeBranchId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())

      if (error) throw error
      const responses = data || []
      const totalResponses = responses.length
      if (totalResponses === 0) return { nps: 0, promoters: 0, detractors: 0, passives: 0, totalResponses: 0 }

      const promoters = responses.filter((r) => r.score >= 9).length
      const detractors = responses.filter((r) => r.score <= 6).length
      const passives = totalResponses - promoters - detractors
      const nps = Math.round(((promoters - detractors) / totalResponses) * 100)

      return { nps, promoters, detractors, passives, totalResponses }
    },
    enabled: !!activeBranchId,
  })
}
