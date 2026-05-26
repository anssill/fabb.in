'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { getOperationSettings } from '@/lib/operation-settings'

export function NotificationRealtime() {
  const { staff, activeBranch, setUnreadNotifications } = useAppStore()
  const supabase = useMemo(() => createClient(), [])
  const operationSettings = getOperationSettings(activeBranch?.settings)

  useEffect(() => {
    if (!staff?.id) return
    if (operationSettings.pushNotifications && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }

    // 1. Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('target_staff_id', staff.id)
        .eq('is_read', false)

      if (!error && count !== null) {
        setUnreadNotifications(count)
      }
    }

    fetchUnreadCount()

    // 2. Subscribe to new notifications
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `target_staff_id=eq.${staff.id}`
        },
        (payload) => {
          // Re-fetch count on any change to notifications for this user
          fetchUnreadCount()
          const next = payload.new as { title?: string; body?: string; action_url?: string } | null
          if (
            payload.eventType === 'INSERT' &&
            operationSettings.pushNotifications &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            const notification = new Notification(next?.title || 'Fabb update', {
              body: next?.body || 'New operation notification',
            })
            notification.onclick = () => {
              window.focus()
              if (next?.action_url) window.location.href = next.action_url
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [staff?.id, setUnreadNotifications, supabase, operationSettings.pushNotifications])

  return null // This component only handles logic
}
