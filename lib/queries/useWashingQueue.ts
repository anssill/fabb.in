import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { writeAuditLog } from '@/lib/audit'

export type WashingStage = 'queue' | 'washing' | 'drying' | 'ironing' | 'qc' | 'ready'
export type WashingPriority = 'urgent' | 'high' | 'normal' | 'low'

export const STAGE_ORDER: WashingStage[] = ['queue', 'washing', 'drying', 'ironing', 'qc', 'ready']

export const PRIORITY_ORDER: Record<WashingPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export const STAGE_LABELS: Record<WashingStage, string> = {
  queue: 'Queue',
  washing: 'Washing',
  drying: 'Drying',
  ironing: 'Ironing',
  qc: 'QC',
  ready: 'Ready',
}

export function useWashingQueue(stage?: WashingStage) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['washing', activeBranchId, stage],
    queryFn: async () => {
      if (!activeBranchId) return []

      let query = supabase
        .from('washing_queue')
        .select(`
          *,
          items ( id, name, sku, category, status ),
          assigned_staff:staff!washing_queue_assigned_to_fkey ( id, name ),
          booking:bookings ( id, pickup_date, return_date, status )
        `)
        .eq('branch_id', activeBranchId)
        .order('entered_at', { ascending: true })

      if (stage) {
        query = query.eq('stage', stage)
      }

      const { data, error } = await query
      if (error) throw error

      // Sort by priority (urgent first) on the client
      return (data || []).sort((a, b) => {
        const pa = PRIORITY_ORDER[(a.priority as WashingPriority) || 'normal'] ?? 2
        const pb = PRIORITY_ORDER[(b.priority as WashingPriority) || 'normal'] ?? 2
        return pa - pb
      })
    },
    enabled: !!activeBranchId,
  })
}

/**
 * Realtime subscription for the washing_queue table.
 * On any INSERT/UPDATE/DELETE it invalidates the TanStack query cache.
 */
export function useWashingRealtime() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  useEffect(() => {
    if (!activeBranchId) return

    const channel = supabase
      .channel('washing-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'washing_queue',
          filter: `branch_id=eq.${activeBranchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['washing', activeBranchId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeBranchId, queryClient, supabase])
}

export function useAdvanceWashingStage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async ({ id, currentStage }: { id: string; currentStage: WashingStage }) => {
      const idx = STAGE_ORDER.indexOf(currentStage)
      if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
        throw new Error('Item is already at the final stage')
      }
      const nextStage = STAGE_ORDER[idx + 1]

      const updateData: Record<string, unknown> = {
        stage: nextStage,
      }

      // If advancing to 'ready', set ready_at timestamp
      if (nextStage === 'ready') {
        updateData.ready_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('washing_queue')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // AUTO: When stage reaches 'ready', revert item status back to 'available'
      if (nextStage === 'ready' && data.item_id) {
        await supabase
          .from('items')
          .update({ status: 'available' })
          .eq('id', data.item_id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing', activeBranchId] })
      queryClient.invalidateQueries({ queryKey: ['items', activeBranchId] })
    },
  })
}

export function useBulkAdvanceStage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async (items: { id: string; currentStage: WashingStage }[]) => {
      const results = []
      for (const item of items) {
        const idx = STAGE_ORDER.indexOf(item.currentStage)
        if (idx === -1 || idx >= STAGE_ORDER.length - 1) continue

        const nextStage = STAGE_ORDER[idx + 1]
        const updateData: Record<string, unknown> = { stage: nextStage }
        if (nextStage === 'ready') updateData.ready_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('washing_queue')
          .update(updateData)
          .eq('id', item.id)
          .select()
          .single()

        if (error) throw error

        // Auto-revert item to available when ready
        if (nextStage === 'ready' && data.item_id) {
          await supabase.from('items').update({ status: 'available' }).eq('id', data.item_id)
        }

        results.push(data)
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing', activeBranchId] })
      queryClient.invalidateQueries({ queryKey: ['items', activeBranchId] })
    },
  })
}

export function useAssignWashingItem() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const profileId = useUserStore((s) => s.profile?.id)

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      if (!profileId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('washing_queue')
        .update({ assigned_to: profileId })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing', activeBranchId] })
    },
  })
}

export function useLogWashingExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const profileId = useUserStore((s) => s.profile?.id)

  return useMutation({
    mutationFn: async ({ washingId, cost, vendorName }: { washingId: string; cost: number; vendorName?: string }) => {
      // First update the cost on the washing_queue entry
      const { error: wErr } = await supabase
        .from('washing_queue')
        .update({ cost })
        .eq('id', washingId)

      if (wErr) throw wErr

      // Then auto-log to expenses
      const { data: businessRow } = await supabase
        .from('branches')
        .select('business_id')
        .eq('id', activeBranchId)
        .single()

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          business_id: businessRow?.business_id,
          branch_id: activeBranchId,
          category: 'washing',
          amount: cost,
          description: vendorName ? `Washing - ${vendorName}` : 'Washing cost',
          staff_id: profileId,
          date: new Date().toISOString().slice(0, 10),
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
      queryClient.invalidateQueries({ queryKey: ['washing', activeBranchId] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
