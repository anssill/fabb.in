import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { writeAuditLog } from '@/lib/audit'

export function useInventory() {
  const supabase = createClient()
  const activeBranchId = useUserStore(state => state.activeBranchId)

  return useQuery({
    queryKey: ['inventory', activeBranchId],
    queryFn: async () => {
      // If no branch is active, we cannot fetch the isolated list
      if (!activeBranchId) return []
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId
  })
}

export function useAddItem() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore(state => state.activeBranchId)

  return useMutation({
    mutationFn: async (newItem: Record<string, unknown>) => {
      const { data: user } = await supabase.auth.getUser()
      const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.user?.id).single()
      
      const { data, error } = await supabase
        .from('items')
        .insert({
          ...newItem,
          branch_id: activeBranchId,
          business_id: staff?.business_id
        })
        .select()
        .single()
        
      if (error) throw error

      await writeAuditLog({
        action: 'CREATE',
        tableName: 'items',
        recordId: data.id,
        newValue: data,
        branchId: activeBranchId,
        businessId: staff?.business_id
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeBranchId] })
    }
  })
}
