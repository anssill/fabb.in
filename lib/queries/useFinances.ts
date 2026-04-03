import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { startOfDay, endOfDay } from 'date-fns'

export function useDebtLedger() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['debt-ledger', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .gt('debt_amount', 0)
        .order('debt_amount', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}

export function useDailyYield() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['daily-yield', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return { payments: 0, expenses: 0, net: 0, cashIn: 0 }
      
      const todayStart = startOfDay(new Date()).toISOString()
      const todayEnd = endOfDay(new Date()).toISOString()

      // Fetch today's payments (settled)
      const { data: payments, error: pError } = await supabase
        .from('payments')
        .select('amount, method, type')
        .eq('branch_id', activeBranchId)
        .gte('timestamp', todayStart)
        .lte('timestamp', todayEnd)
        .eq('is_voided', false)

      if (pError) throw pError

      // Fetch today's expenses
      const { data: expenses, error: eError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('branch_id', activeBranchId)
        .gte('date', todayStart)
        .lte('date', todayEnd)
        .eq('status', 'approved')

      if (eError) throw eError

      const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0)
      const cashPayments = payments.filter(p => p.method === 'cash').reduce((acc, p) => acc + p.amount, 0)
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)

      return {
        totalRevenue: totalPayments,
        cashInflow: cashPayments,
        totalExpenses: totalExpenses,
        netYield: totalPayments - totalExpenses,
        cashPosition: cashPayments - totalExpenses // Assuming expenses come from cash drawer
      }
    },
    enabled: !!activeBranchId,
  })
}
