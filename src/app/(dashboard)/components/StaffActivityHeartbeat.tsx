'use client'

import { useEffect, useRef } from 'react'

export function StaffActivityHeartbeat() {
  const lastSentAt = useRef(0)

  useEffect(() => {
    const sendActivity = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastSentAt.current < 30_000) return
      lastSentAt.current = now
      void fetch('/api/staff/presence', { method: 'POST', cache: 'no-store' })
        .then(response => { if (!response.ok) lastSentAt.current = 0 })
        .catch(() => { lastSentAt.current = 0 })
    }

    // A visible tab alone is not proof of activity. The lease expires after inactivity.
    sendActivity()
    const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll'] as const
    events.forEach(event => window.addEventListener(event, sendActivity, { passive: true }))
    document.addEventListener('visibilitychange', sendActivity)
    window.addEventListener('focus', sendActivity)
    return () => {
      events.forEach(event => window.removeEventListener(event, sendActivity))
      document.removeEventListener('visibilitychange', sendActivity)
      window.removeEventListener('focus', sendActivity)
    }
  }, [])

  return null
}
