import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

export function useReconciliation() {
  const supabase = createClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useQuery({
    queryKey: ['reconciliation', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('cash_reconciliation')
        .select(`
          *,
          staff:approved_by (
            name,
            role
          )
        `)
        .eq('branch_id', activeBranchId)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}

export function useAddReconciliation() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useMutation({
    mutationFn: async (reconciliation: { 
      date: string;
      expected_amount: number;
      actual_amount: number;
      difference: number;
      notes?: string;
      approved_by: string;
    }) => {
      if (!activeBranchId) throw new Error('No active branch selected')

      // Get business_id from branch
      const { data: branchData } = await supabase
        .from('branches')
        .select('business_id')
        .eq('id', activeBranchId)
        .single()

      if (!branchData?.business_id) throw new Error('Business ID not found')

      const { data, error } = await supabase
        .from('cash_reconciliation')
        .insert({
          ...reconciliation,
          branch_id: activeBranchId,
          business_id: branchData.business_id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation', activeBranchId] })
    }
  })
}

export function useTodaysCashSummary() {
  const supabase = createClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useQuery({
    queryKey: ['cash-summary', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return { totalRevenue: 0, totalExpenses: 0 }

      const today = new Date().toISOString().split('T')[0]

      // Fetch all cash payments for today
      const { data: payments, error: pError } = await supabase
        .from('booking_payments')
        .select('amount')
        .eq('branch_id', activeBranchId)
        .eq('method', 'cash')
        .not('is_voided', 'eq', true)
        .gte('timestamp', `${today}T00:00:00Z`)

      // Fetch all cash expenses for today
      const { data: expenses, error: eError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('branch_id', activeBranchId)
        .eq('date', today)

      if (pError) throw pError
      if (eError) throw eError

      const totalRevenue = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
      const totalExpenses = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

      return { totalRevenue, totalExpenses }
    },
    enabled: !!activeBranchId,
  })
}
