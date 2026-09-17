'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

const TABLES = [
  'bookings', 'booking_items', 'booking_payments', 'booking_timeline',
  'customers', 'items', 'item_variants', 'expenses',
  'booking_item_fulfilments', 'inventory_unavailability',
  'financial_entries', 'deposit_ledger',
] as const

export function DataRealtime() {
  const router = useRouter()
  const businessId = useAppStore(state => state.business?.id)
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let needsRefresh = false
    const scheduleRefresh = () => {
      if (document.visibilityState !== 'visible') {
        needsRefresh = true
        return
      }
      if (timeoutId.current) clearTimeout(timeoutId.current)
      timeoutId.current = setTimeout(() => {
        timeoutId.current = null
        needsRefresh = false
        router.refresh()
      }, 900)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && needsRefresh) scheduleRefresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    // INITIAL_SESSION, token refreshes, and refocus sign-ins happen without data
    // changes. Refreshing every route for them causes visible navigation stalls.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') scheduleRefresh()
    })

    const channel = businessId ? TABLES.reduce((activeChannel, table) =>
      activeChannel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        const row = payload.new as Record<string, unknown> | null
        if (row?.business_id && row.business_id !== businessId) return
        scheduleRefresh()
      }), supabase.channel('realtime-business-data')).subscribe() : null

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current)
      document.removeEventListener('visibilitychange', onVisible)
      subscription.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [businessId, router])

  return null
}
