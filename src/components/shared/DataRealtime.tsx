'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { getOperationSettings } from '@/lib/operation-settings'

const DEFAULT_TABLES = ['bookings', 'booking_payments', 'customers', 'items', 'expenses', 'washing_queue', 'staff_attendance']

function getRelevantTables(pathname: string) {
  if (pathname.startsWith('/bookings')) return ['bookings', 'booking_payments', 'customers', 'items']
  if (pathname.startsWith('/inventory')) return ['items', 'bookings']
  if (pathname.startsWith('/customers')) return ['customers', 'bookings']
  if (pathname.startsWith('/payments')) return ['booking_payments', 'bookings']
  if (pathname.startsWith('/washing')) return ['washing_queue', 'items']
  if (pathname.startsWith('/expenses')) return ['expenses']
  if (pathname.startsWith('/staff')) return ['staff_attendance']
  if (pathname.startsWith('/operations')) return ['bookings', 'washing_queue', 'staff_attendance']
  if (pathname.startsWith('/dashboard')) return ['bookings', 'booking_payments', 'expenses', 'washing_queue']
  return DEFAULT_TABLES
}

export function DataRealtime() {
  const router = useRouter()
  const pathname = usePathname()
  const { business, activeBranch } = useAppStore()
  const operationSettings = getOperationSettings(activeBranch?.settings)
  // Use a ref to persist the timeout between renders without triggering them
  const timeoutId = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 1. Setup Auth state change listener
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return

      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      
      timeoutId.current = setTimeout(() => {
        router.refresh()
      }, 1000)
    })

    if (!business?.id || !activeBranch?.id || !operationSettings.realtimeUpdates) {
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

    const branchScopedTables = getRelevantTables(pathname)

    const channels = branchScopedTables.map(table => 
      supabase
        .channel(`realtime-branch-${activeBranch.id}-${pathname.replace(/[^a-z0-9-]/gi, '-')}-${table}`)
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
  }, [business?.id, activeBranch?.id, operationSettings.realtimeUpdates, pathname, router])

  return null
}
