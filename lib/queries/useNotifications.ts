import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import type { Notification, WhatsAppLog } from '@/lib/types/echo'

export function useNotifications() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const profile = useUserStore((s) => s.profile)

  return useQuery({
    queryKey: ['notifications', activeBranchId, profile?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!activeBranchId || !profile?.id) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('branch_id', activeBranchId)
        .or(`target_staff_id.eq.${profile.id},target_staff_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data as Notification[]) || []
    },
    enabled: !!activeBranchId && !!profile?.id,
    refetchInterval: 30_000,
  })
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications()
  return data?.filter((n) => !n.is_read).length ?? 0
}

export function useMarkNotificationRead() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const supabase = createClient()
  const qc = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const profile = useUserStore((s) => s.profile)

  return useMutation({
    mutationFn: async () => {
      if (!activeBranchId || !profile?.id) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('branch_id', activeBranchId)
        .or(`target_staff_id.eq.${profile.id},target_staff_id.is.null`)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useWhatsAppLog() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['whatsapp-log', activeBranchId],
    queryFn: async (): Promise<WhatsAppLog[]> => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('whatsapp_log')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return (data as WhatsAppLog[]) || []
    },
    enabled: !!activeBranchId,
  })
}
