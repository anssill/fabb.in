import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useEffect } from 'react'

export type WashingStage = 'queue' | 'washing' | 'drying' | 'ironing' | 'qc' | 'ready'
export type WashingPriority = 'urgent' | 'high' | 'normal' | 'low'

export const STAGE_ORDER: WashingStage[] = ['queue', 'washing', 'drying', 'ironing', 'qc', 'ready']

export const STAGE_LABELS: Record<WashingStage, string> = {
  queue: 'Queue',
  washing: 'Washing',
  drying: 'Drying',
  ironing: 'Ironing',
  qc: 'QC',
  ready: 'Ready',
}

export const PRIORITY_CONFIG: Record<WashingPriority, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: '🔴' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400', icon: '🟠' },
  normal: { label: 'Normal', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400', icon: '🟡' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400', icon: '🟢' },
}

export interface WashingQueueItem {
  id: string
  branch_id: string
  item_id: string | null
  variant_id: string | null
  booking_id: string | null
  stage: WashingStage
  priority: WashingPriority
  assigned_to: string | null
  cost: number | null
  notes: string | null
  is_external: boolean
  external_vendor: string | null
  vendor_handover_date: string | null
  vendor_expected_return: string | null
  entered_at: string
  ready_at: string | null
  sla_deadline: string | null
  items?: {
    id: string
    name: string
    sku: string | null
    category: string
    cover_photo_url: string | null
  } | null
  staff?: {
    name: string
  } | null
}

export const useWashingQueue = (branchId?: string, stage?: WashingStage) => {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const resolvedBranchId = branchId || activeBranchId

  return useQuery({
    queryKey: ['washing', 'queue', resolvedBranchId, stage],
    queryFn: async () => {
      if (!resolvedBranchId) return []

      let query = supabase
        .from('washing_queue')
        .select(`
          *,
          items:item_id ( id, name, sku, category, cover_photo_url ),
          staff:assigned_to ( name )
        `)
        .eq('branch_id', resolvedBranchId)
        .order('entered_at', { ascending: true })

      if (stage) {
        query = query.eq('stage', stage)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as WashingQueueItem[]
    },
    staleTime: 10_000,
    enabled: !!resolvedBranchId,
  })
}

export const useWashingStats = () => {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['washing', 'stats', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return { total: 0, urgent: 0, ready: 0, byStage: {} as Record<string, number> }

      const { data, error } = await supabase
        .from('washing_queue')
        .select('stage, priority')
        .eq('branch_id', activeBranchId)

      if (error) throw error

      const items = data || []
      const byStage: Record<string, number> = {}
      let urgent = 0
      let ready = 0

      for (const item of items) {
        byStage[item.stage] = (byStage[item.stage] || 0) + 1
        if (item.priority === 'urgent') urgent++
        if (item.stage === 'ready') ready++
      }

      return { total: items.length, urgent, ready, byStage }
    },
    staleTime: 10_000,
    enabled: !!activeBranchId,
  })
}

export const useAdvanceStage = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async ({ id, currentStage, notes, cost }: {
      id: string
      currentStage: WashingStage
      notes?: string
      cost?: number
    }) => {
      const idx = STAGE_ORDER.indexOf(currentStage)
      if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
        throw new Error('Item is already at the final stage')
      }
      const nextStage = STAGE_ORDER[idx + 1]

      const updatePayload: Record<string, unknown> = { stage: nextStage }
      if (notes) updatePayload.notes = notes
      if (cost !== undefined) updatePayload.cost = cost
      if (nextStage === 'ready') updatePayload.ready_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('washing_queue')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // If ready, also update item status back to available
      if (nextStage === 'ready' && data.item_id) {
        await supabase
          .from('items')
          .update({ status: 'available' })
          .eq('id', data.item_id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export const useBulkAdvanceStage = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ids, currentStage }: { ids: string[]; currentStage: WashingStage }) => {
      const idx = STAGE_ORDER.indexOf(currentStage)
      if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
        throw new Error('Items are already at the final stage')
      }
      const nextStage = STAGE_ORDER[idx + 1]

      const updatePayload: Record<string, unknown> = { stage: nextStage }
      if (nextStage === 'ready') updatePayload.ready_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('washing_queue')
        .update(updatePayload)
        .in('id', ids)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing'] })
    },
  })
}

export const useAssignWashingItem = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, staffId }: { id: string; staffId: string }) => {
      const { data, error } = await supabase
        .from('washing_queue')
        .update({ assigned_to: staffId })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing'] })
    },
  })
}

export const useAddToWashingQueue = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async (payload: {
      item_id: string
      variant_id?: string
      booking_id?: string
      priority?: WashingPriority
      notes?: string
    }) => {
      if (!activeBranchId) throw new Error('No branch selected')

      const { data, error } = await supabase
        .from('washing_queue')
        .insert({
          branch_id: activeBranchId,
          item_id: payload.item_id,
          variant_id: payload.variant_id || null,
          booking_id: payload.booking_id || null,
          stage: 'queue' as WashingStage,
          priority: payload.priority || 'normal',
          notes: payload.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Update item status to in_washing
      await supabase
        .from('items')
        .update({ status: 'in_washing' })
        .eq('id', payload.item_id)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export const useSendToVendor = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, vendor, handoverDate, expectedReturn, cost }: {
      id: string
      vendor: string
      handoverDate: string
      expectedReturn: string
      cost?: number
    }) => {
      const { data, error } = await supabase
        .from('washing_queue')
        .update({
          is_external: true,
          external_vendor: vendor,
          vendor_handover_date: handoverDate,
          vendor_expected_return: expectedReturn,
          cost: cost || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing'] })
    },
  })
}

export const useWashingRealtime = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  useEffect(() => {
    if (!activeBranchId) return

    const channel = supabase
      .channel('washing-queue-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'washing_queue',
          filter: `branch_id=eq.${activeBranchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['washing', 'queue'] })
          queryClient.invalidateQueries({ queryKey: ['washing', 'stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeBranchId, supabase, queryClient])
}
