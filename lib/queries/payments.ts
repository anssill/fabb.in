'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

// ── Types ──────────────────────────────────────────────────────────
export interface PaymentFilters {
  dateFrom?: string
  dateTo?: string
  bookingId?: string
  type?: string
  method?: string
  staffId?: string
}

export interface PaymentRecord {
  id: string
  business_id: string
  branch_id: string
  booking_id: string
  type: 'advance' | 'balance' | 'deposit' | 'penalty' | 'void'
  amount: number
  method: 'cash' | 'upi' | 'bank' | 'store_credit'
  staff_id: string | null
  timestamp: string
  void_reason: string | null
  is_voided: boolean
  bookings?: { booking_id_display: string; customer_id: string }
}

// ── Payments list (all branch payments) ────────────────────────────
export function usePayments(filters: PaymentFilters = {}) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['payments', activeBranchId, filters],
    queryFn: async () => {
      if (!activeBranchId) return []

      let query = supabase
        .from('booking_payments')
        .select('*, bookings(booking_id_display, customer_id, customers:customer_id(name))')
        .eq('branch_id', activeBranchId)
        .order('timestamp', { ascending: false })

      if (filters.type) query = query.eq('type', filters.type)
      if (filters.method) query = query.eq('method', filters.method)
      if (filters.staffId) query = query.eq('staff_id', filters.staffId)
      if (filters.dateFrom) query = query.gte('timestamp', filters.dateFrom)
      if (filters.dateTo) query = query.lte('timestamp', filters.dateTo)

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}

// ── Daily revenue ──────────────────────────────────────────────────
export function useDailyRevenue(date?: Date) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const targetDate = date || new Date()
  const dateStr = targetDate.toISOString().split('T')[0]

  return useQuery({
    queryKey: ['daily-revenue', activeBranchId, dateStr],
    queryFn: async () => {
      if (!activeBranchId) return { total: 0, cash: 0, upi: 0, bank: 0 }

      const startOfDay = `${dateStr}T00:00:00`
      const endOfDay = `${dateStr}T23:59:59`

      const { data, error } = await supabase
        .from('booking_payments')
        .select('amount, method, type, is_voided')
        .eq('branch_id', activeBranchId)
        .gte('timestamp', startOfDay)
        .lte('timestamp', endOfDay)
        .eq('is_voided', false)

      if (error) throw error
      const payments = data || []
      const revenue = payments.filter((p) => p.type !== 'deposit')

      return {
        total: revenue.reduce((sum, p) => sum + Number(p.amount), 0),
        cash: revenue.filter((p) => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0),
        upi: revenue.filter((p) => p.method === 'upi').reduce((sum, p) => sum + Number(p.amount), 0),
        bank: revenue.filter((p) => p.method === 'bank').reduce((sum, p) => sum + Number(p.amount), 0),
      }
    },
    enabled: !!activeBranchId,
  })
}

// ── Outstanding balance ────────────────────────────────────────────
export function useOutstandingBalance() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['outstanding-balance', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return 0

      const { data, error } = await supabase
        .from('bookings')
        .select('balance_due')
        .eq('branch_id', activeBranchId)
        .gt('balance_due', 0)

      if (error) throw error
      return (data || []).reduce((sum, b) => sum + Number(b.balance_due || 0), 0)
    },
    enabled: !!activeBranchId,
  })
}

// ── Deposit liability ──────────────────────────────────────────────
export function useDepositLiability() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['deposit-liability', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return 0

      const { data, error } = await supabase
        .from('bookings')
        .select('deposit_collected')
        .eq('branch_id', activeBranchId)
        .in('status', ['confirmed', 'picked_up'])

      if (error) throw error
      return (data || []).reduce(
        (sum, b) => sum + Number(b.deposit_collected || 0),
        0
      )
    },
    enabled: !!activeBranchId,
  })
}

// ── Void log ───────────────────────────────────────────────────────
export function useVoidedPayments() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['voided-payments', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('booking_payments')
        .select('*, bookings(booking_id_display)')
        .eq('branch_id', activeBranchId)
        .eq('is_voided', true)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}

// ── Cash reconciliation ────────────────────────────────────────────
export function useCashReconciliation(date?: string) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const dateStr = date || new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['cash-reconciliation', activeBranchId, dateStr],
    queryFn: async () => {
      if (!activeBranchId) return null

      const { data, error } = await supabase
        .from('cash_reconciliation')
        .select('*')
        .eq('branch_id', activeBranchId)
        .eq('date', dateStr)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!activeBranchId,
  })
}

export function useCreateReconciliation() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      branch_id: string
      business_id: string
      date: string
      expected_amount: number
      actual_amount: number
      difference: number
      notes?: string
      approved_by: string
    }) => {
      const { data, error } = await supabase
        .from('cash_reconciliation')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-reconciliation'] })
    },
  })
}
