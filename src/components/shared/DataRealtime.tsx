'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

export function DataRealtime() {
  const router = useRouter()
  const { business } = useAppStore()
  // Use a ref to persist the timeout between renders without triggering them
  const timeoutId = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 1. Setup Auth state change listener
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      
      timeoutId.current = setTimeout(() => {
        router.refresh()
      }, 500)
    })

    if (!business?.id) {
      return () => {
        authSubscription.unsubscribe()
      }
    }

    // 2. Setup Postgres realtime listener
    const handleUpdate = (payload: any) => {
      // Basic filtering: if the record has a business_id, check if it matches the current business.
      if (payload.new && 'business_id' in payload.new && payload.new.business_id) {
        if (payload.new.business_id !== business.id) return
      }

      // Debounce the router.refresh to prevent excessive server calls
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      
      timeoutId.current = setTimeout(() => {
        router.refresh()
      }, 500)
    }

    const tables = [
      'bookings', 
      'booking_items', 
      'booking_payments', 
      'booking_timeline',
      'customers', 
      'items', 
      'item_variants', 
      'expenses', 
      'booking_item_fulfilments',
      'inventory_unavailability',
      'inventory_transfers',
      'financial_entries',
      'deposit_ledger',
      'staff_attendance'
    ]

    const channels = tables.map(table => 
      supabase
        .channel(`realtime-global-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          handleUpdate
        )
        .subscribe()
    )

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current)
      authSubscription.unsubscribe()
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [business?.id, router])

  return null
}
