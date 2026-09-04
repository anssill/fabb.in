'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function PwaRuntime() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    const handleOnline = () => {
      setOnline(true)
      navigator.serviceWorker.controller?.postMessage({ type: 'SYNC_ATTENDANCE' })
    }
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online ? null : <div role="status" className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-black shadow-lg">
    <WifiOff className="h-4 w-4" />Offline: schedules and inventory are read-only; only attendance can be queued.
  </div>
}
