'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onUpdate: () => void
  branchId: string | null
}

/**
 * Subscribes to Supabase Realtime channels for bookings, payments,
 * washing_queue, and notifications. Calls onUpdate() on any change,
 * which triggers dashboard stats refetch.
 */
export function RealtimeDashboard({ onUpdate, branchId }: Props) {
  useEffect(() => {
    if (!branchId) return

    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `branch_id=eq.${branchId}` },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booking_payments', filter: `branch_id=eq.${branchId}` },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'washing_queue', filter: `branch_id=eq.${branchId}` },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `branch_id=eq.${branchId}` },
        () => onUpdate()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [branchId, onUpdate])

  // Render nothing — this is a side-effect-only component
  return null
}
