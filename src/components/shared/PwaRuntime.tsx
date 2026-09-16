'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function PwaRuntime() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    let disposed = false
    let controller: AbortController | undefined
    let retry: ReturnType<typeof setTimeout> | undefined
    const checkConnection = async () => {
      controller?.abort()
      controller = undefined
      clearTimeout(retry)
      if (navigator.onLine) { setOnline(true); return }
      // Mobile browsers can retain an outdated offline flag after resuming.
      const request = new AbortController()
      controller = request
      const timeout = setTimeout(() => request.abort(), 5000)
      try {
        const response = await fetch('/api/health', { cache: 'no-store', signal: request.signal })
        if (!disposed && controller === request) setOnline(response.ok)
      } catch {
        if (!disposed && controller === request) setOnline(false)
      } finally {
        clearTimeout(timeout)
        if (!disposed && controller === request) retry = setTimeout(checkConnection, 15000)
      }
    }
    void checkConnection()
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
    window.addEventListener('pageshow', checkConnection)
    window.addEventListener('focus', checkConnection)
    return () => {
      disposed = true
      controller?.abort()
      clearTimeout(retry)
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
      window.removeEventListener('pageshow', checkConnection)
      window.removeEventListener('focus', checkConnection)
    }
  }, [])

  return online ? null : <div role="status" className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-black shadow-lg">
    <WifiOff className="h-4 w-4 shrink-0" />Connection lost. Reconnect before saving changes.
  </div>
}
