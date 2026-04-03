'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

// ── Types ──────────────────────────────────────────────────────────
export interface Expense {
  id: string
  business_id: string
  branch_id: string
  category: 'rent' | 'salary' | 'utility' | 'repair' | 'washing' | 'misc'
  amount: number
  description: string | null
  receipt_url: string | null
  staff_id: string | null
  date: string
  created_at: string
}

// ── Expenses list ──────────────────────────────────────────────────
export function useExpenses(month?: Date) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const now = month || new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`

  return useQuery({
    queryKey: ['expenses', activeBranchId, startOfMonth],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('branch_id', activeBranchId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false })

      if (error) throw error
      return (data || []) as Expense[]
    },
    enabled: !!activeBranchId,
  })
}

// ── Expense summary by category ────────────────────────────────────
export function useExpenseSummary(month?: Date) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const now = month || new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`

  return useQuery({
    queryKey: ['expense-summary', activeBranchId, startOfMonth],
    queryFn: async () => {
      if (!activeBranchId) return { total: 0, byCategory: {} as Record<string, number> }

      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('branch_id', activeBranchId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      if (error) throw error

      const byCategory: Record<string, number> = {}
      let total = 0
      for (const e of data || []) {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
        total += Number(e.amount)
      }

      return { total, byCategory }
    },
    enabled: !!activeBranchId,
  })
}

// ── Create expense ─────────────────────────────────────────────────
export function useCreateExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      branch_id: string
      business_id: string
      category: string
      amount: number
      description?: string
      receipt_url?: string
      staff_id?: string
      date?: string
    }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...payload,
          date: payload.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] })
    },
  })
}
