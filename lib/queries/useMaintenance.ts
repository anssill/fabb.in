import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

export function useWashingQueue() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['washing-queue', activeBranchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('washing_queue')
        .select('*, items(name, category), item_variants(color, size)')
        .eq('branch_id', activeBranchId)
        .order('entered_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!activeBranchId,
  })
}

export function useItemROI() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['inventory-roi', activeBranchId],
    queryFn: async () => {
      // Aggregate data for ROI calculation
      const { data: items, error: iErr } = await supabase
        .from('items')
        .select('id, name, purchase_cost, category')
        .eq('branch_id', activeBranchId)

      if (iErr) throw iErr

      const { data: bookings, error: bErr } = await supabase
        .from('booking_items')
        .select('item_id, price')
      
      if (bErr) throw bErr

      const { data: repairs, error: rErr } = await supabase
        .from('item_repairs')
        .select('item_id, cost')

      if (rErr) throw rErr

      return items.map(item => {
        const itemBookings = bookings.filter(b => b.item_id === item.id)
        const itemRepairs = repairs.filter(r => r.item_id === item.id)
        
        const totalRevenue = itemBookings.reduce((acc, b) => acc + (b.price || 0), 0)
        const totalRepairCost = itemRepairs.reduce((acc, r) => acc + Number(r.cost || 0), 0)
        const netProfit = totalRevenue - totalRepairCost
        const roi = item.purchase_cost > 0 ? (netProfit / item.purchase_cost) * 100 : 0

        return {
          ...item,
          totalRevenue,
          totalRepairCost,
          netProfit,
          roi: roi.toFixed(1),
          usageCount: itemBookings.length,
          depreciationStatus: totalRepairCost > (item.purchase_cost * 0.5) ? 'Critical' : 'Healthy'
        }
      }).sort((a, b) => b.netProfit - a.netProfit)
    },
    enabled: !!activeBranchId,
  })
}

export function useUpdateWashingStage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string, stage: string }) => {
      const { data, error } = await supabase
        .from('washing_queue')
        .update({ 
          stage,
          ready_at: stage === 'sterile' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing-queue'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    }
  })
}
