'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { requestPushPermission } from '@/lib/notifications/push'

type Props = {
  channelName: string
  businessId: string
  userId?: string
  tables: string[]
  enablePushRegistration?: boolean
  className?: string
}

export function RealtimeRefreshIndicator({
  channelName,
  businessId,
  userId,
  tables,
  enablePushRegistration = false,
  className,
}: Props) {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!businessId || tables.length === 0) return

    const supabase = createClient()
    const channel = supabase.channel(channelName)

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          if (refreshTimer.current) clearTimeout(refreshTimer.current)
          refreshTimer.current = setTimeout(() => router.refresh(), 500)
        }
      )
    })

    channel.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED')
    })

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      setConnected(false)
      void supabase.removeChannel(channel)
    }
  }, [businessId, channelName, router, tables])

  useEffect(() => {
    if (!enablePushRegistration || !userId || !businessId) return
    void requestPushPermission({ userId, businessId })
  }, [businessId, enablePushRegistration, userId])

  return (
    <span
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 text-xs font-semibold text-emerald-700 shadow-sm',
        className
      )}
      aria-live="polite"
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', connected ? 'animate-pulse bg-emerald-500' : 'bg-slate-300')} />
      {connected ? 'Live' : 'Connecting'}
    </span>
  )
}
