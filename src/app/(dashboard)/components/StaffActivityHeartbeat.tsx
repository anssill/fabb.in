'use client'

import { useEffect, useRef } from 'react'

export function StaffActivityHeartbeat() {
  const lastSentAt = useRef(0)

  useEffect(() => {
    const sendActivity = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastSentAt.current < 45_000) return
      lastSentAt.current = now
      void fetch('/api/staff/presence', { method: 'POST', cache: 'no-store' }).catch(() => {
        lastSentAt.current = 0
      })
    }

    sendActivity()
    const timer = window.setInterval(sendActivity, 60_000)
    document.addEventListener('visibilitychange', sendActivity)
    window.addEventListener('focus', sendActivity)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', sendActivity)
      window.removeEventListener('focus', sendActivity)
    }
  }, [])

  return null
}
