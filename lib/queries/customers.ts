'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import type { Customer } from '@/lib/stores/customerStore'

// ── Types ──────────────────────────────────────────────────────────
export interface CustomerFilters {
  search?: string
  tier?: string
  riskLevel?: string
  blacklistLevel?: number | null
  minSpend?: number
  maxSpend?: number
}

export interface CreateCustomerPayload {
  name: string
  phone: string
  email?: string
  branch_id: string
  business_id: string
  created_by?: string
}

// ── Customer list ──────────────────────────────────────────────────
export function useCustomerList(filters: CustomerFilters = {}) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['customers', activeBranchId, filters],
    queryFn: async () => {
      if (!activeBranchId) return []

      let query = supabase
        .from('customers')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (filters.tier) query = query.eq('tier', filters.tier)
      if (filters.riskLevel) query = query.eq('risk_level', filters.riskLevel)
      if (filters.blacklistLevel !== undefined && filters.blacklistLevel !== null) {
        query = query.eq('blacklist_level', filters.blacklistLevel)
      }
      if (filters.minSpend) query = query.gte('total_spend', filters.minSpend)
      if (filters.maxSpend) query = query.lte('total_spend', filters.maxSpend)
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Customer[]
    },
    enabled: !!activeBranchId,
  })
}

// ── Single customer ────────────────────────────────────────────────
export function useCustomerDetail(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Customer
    },
    enabled: !!id,
  })
}

// ── Customer bookings ──────────────────────────────────────────────
export function useCustomerBookings(customerId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer-bookings', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, booking_items(*, items:item_id(name, sku, category))')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!customerId,
  })
}

// ── Customer payments ──────────────────────────────────────────────
export function useCustomerPayments(customerId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer-payments', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_payments')
        .select('*, bookings!inner(customer_id, booking_id_display)')
        .eq('bookings.customer_id', customerId)
        .order('timestamp', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!customerId,
  })
}

// ── Loyalty ledger ─────────────────────────────────────────────────
export function useLoyaltyLedger(customerId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['loyalty-ledger', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_ledger')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!customerId,
  })
}

// ── Customer notes ─────────────────────────────────────────────────
export function useCustomerNotes(customerId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!customerId,
  })
}

// ── Create customer ────────────────────────────────────────────────
export function useCreateCustomer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      // Duplicate phone check
      const { data: existing } = await supabase
        .from('customers')
        .select('id, name')
        .eq('phone', payload.phone)
        .eq('branch_id', payload.branch_id)
        .limit(1)

      if (existing && existing.length > 0) {
        throw new Error(`Duplicate: A customer with this phone already exists (${existing[0].name})`)
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// ── Update customer ────────────────────────────────────────────────
export function useUpdateCustomer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] })
    },
  })
}

// ── Add customer note ──────────────────────────────────────────────
export function useAddCustomerNote() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { customer_id: string; content: string; created_by: string; branch_id: string; business_id: string }) => {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', variables.customer_id] })
    },
  })
}

// ── Risk score calculation ─────────────────────────────────────────
export async function calculateRiskScore(customerId: string): Promise<void> {
  const supabase = createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('status')
    .eq('customer_id', customerId)

  if (!bookings) return

  const lateReturns = bookings.filter((b) => b.status === 'overdue').length
  const cancellations = bookings.filter((b) => b.status === 'cancelled').length
  const damageIncidents = 0 // placeholder — read from damage reports when available
  const disputes = 0

  const score = Math.min(
    100,
    lateReturns * 25 + damageIncidents * 30 + cancellations * 15 + disputes * 30
  )
  const level = score <= 25 ? 'low' : score <= 60 ? 'medium' : 'high'

  await supabase
    .from('customers')
    .update({ risk_score: score, risk_level: level })
    .eq('id', customerId)
}

// ── Tier upgrade logic ─────────────────────────────────────────────
export async function updateCustomerTier(customerId: string): Promise<void> {
  const supabase = createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('total_spend, tier')
    .eq('id', customerId)
    .single()

  if (!customer) return

  // Default thresholds
  const thresholds = { silver: 5000, gold: 15000, platinum: 30000 }
  let tier = 'bronze'
  if (customer.total_spend >= thresholds.platinum) tier = 'platinum'
  else if (customer.total_spend >= thresholds.gold) tier = 'gold'
  else if (customer.total_spend >= thresholds.silver) tier = 'silver'

  if (tier !== customer.tier) {
    await supabase.from('customers').update({ tier }).eq('id', customerId)
  }
}
