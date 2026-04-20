import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { writeAuditLog } from '@/lib/audit'

export function useExpenses() {
  const supabase = createClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useQuery({
    queryKey: ['expenses', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}

export function useAddExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useMutation({
    mutationFn: async (expense: { 
      category: string; 
      amount: number; 
      description?: string; 
      date: string;
      receipt_url?: string;
    }) => {
      if (!activeBranchId) throw new Error('No active branch selected')

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          branch_id: activeBranchId,
          business_id: (await supabase.from('branches').select('business_id').eq('id', activeBranchId).single()).data?.business_id
        })
        .select()
        .single()

      if (error) throw error

      await writeAuditLog({
        action: 'CREATE',
        tableName: 'expenses',
        recordId: data.id,
        newValue: data,
        branchId: activeBranchId,
        businessId: data.business_id
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeBranchId] })
    }
  })
}
