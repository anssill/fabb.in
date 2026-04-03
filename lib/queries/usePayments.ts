import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

export function usePayments() {
  const supabase = createClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useQuery({
    queryKey: ['payments', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('booking_payments')
        .select(`
          *,
          bookings (
            booking_id_display,
            id,
            total_amount,
            balance_due
          )
        `)
        .eq('branch_id', activeBranchId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}

export function useAddBookingPayment() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useMutation({
    mutationFn: async (payment: { 
      booking_id: string; 
      amount: number; 
      method: string; 
      type: string; 
      staff_id: string 
    }) => {
      if (!activeBranchId) throw new Error('No active branch selected')

      const { data, error } = await supabase
        .from('booking_payments')
        .insert({
          ...payment,
          branch_id: activeBranchId,
          business_id: (await supabase.from('branches').select('business_id').eq('id', activeBranchId).single()).data?.business_id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', activeBranchId] })
      queryClient.invalidateQueries({ queryKey: ['booking', variables.booking_id] })
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] })
    }
  })
}

export function useVoidPayment() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('booking_payments')
        .update({ is_voided: true, void_reason: reason })
        .eq('id', paymentId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments', activeBranchId] })
      if (data?.booking_id) {
        queryClient.invalidateQueries({ queryKey: ['booking', data.booking_id] })
      }
    }
  })
}
