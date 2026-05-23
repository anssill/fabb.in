'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

export function DataRealtime() {
  const router = useRouter()
  const { business, activeBranch } = useAppStore()
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
      }, 1000)
    })

    if (!business?.id || !activeBranch?.id) {
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
      if (payload.new && 'branch_id' in payload.new && payload.new.branch_id) {
        if (payload.new.branch_id !== activeBranch.id) return
      }

      // Debounce the router.refresh to prevent excessive server calls
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      
      timeoutId.current = setTimeout(() => {
        router.refresh()
      }, 1000)
    }

    const branchScopedTables = [
      'bookings',
      'booking_payments',
      'customers',
      'items',
      'expenses',
      'washing_queue',
      'staff_attendance',
    ]

    const channels = branchScopedTables.map(table => 
      supabase
        .channel(`realtime-branch-${activeBranch.id}-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `branch_id=eq.${activeBranch.id}` },
          handleUpdate
        )
        .subscribe()
    )

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current)
      authSubscription.unsubscribe()
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [business?.id, activeBranch?.id, router])

  return null
}
