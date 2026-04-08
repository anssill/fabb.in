'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

export function NotificationRealtime() {
  const { staff, setUnreadNotifications } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    if (!staff?.id) return

    // 1. Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
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
        () => {
          // Re-fetch count on any change to notifications for this user
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [staff?.id, setUnreadNotifications, supabase])

  return null // This component only handles logic
}
