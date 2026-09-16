'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { disableDevicePush } from '@/lib/push/client'

export function PushOptIn() {
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const available = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(available)
    if (available) navigator.serviceWorker.getRegistration().then(registration => registration?.pushManager.getSubscription()).then(subscription => setEnabled(!!subscription)).catch(() => setMessage('Could not check this device. Try enabling notifications again.'))
  }, [])
  async function toggle() {
    setBusy(true); setMessage('')
    try {
      if (enabled) { await disableDevicePush(); setEnabled(false); return }
      // Permission must be requested directly from a user gesture on iOS.
      if (await Notification.requestPermission() !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser or device settings, then try again.')
      const response = await fetch('/api/notifications/push/subscription')
      const config = await response.json()
      if (!response.ok || !config.publicKey) throw new Error(config.error || 'Push setup is not complete yet. In-app notifications remain available.')
      await navigator.serviceWorker.register('/sw.js')
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: config.publicKey })
      const saved = await fetch('/api/notifications/push/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) })
      if (!saved.ok) { await subscription.unsubscribe(); throw new Error((await saved.json()).error || 'Could not register device') }
      setEnabled(true); setMessage('This device is ready for alerts from your authorized branches.')
    } catch (error: any) { setMessage(error.message || 'Could not update notifications') }
    finally { setBusy(false) }
  }
  return <section className="mb-6 space-y-3 rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="font-semibold">Notifications on this device</h2>
    <p className="text-sm text-slate-600">Get booking, payment, pickup and return alerts for the branches you can access.</p>
    {supported ? <Button disabled={busy} onClick={toggle}>{busy ? 'Updating…' : enabled ? 'Disable on this device' : 'Enable notifications'}</Button> : <p className="text-sm">Push is unavailable in this browser. Your notifications still appear below.</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
    <details className="text-sm text-slate-600"><summary className="cursor-pointer font-medium">Device setup instructions</summary><ul className="mt-3 list-disc space-y-2 pl-5"><li>iPhone or iPad: open FABB in Safari, tap Share → Add to Home Screen. Open that app, sign in, then enable notifications here. Requires iOS/iPadOS 16.4 or later.</li><li>Android: open FABB in Chrome, enable notifications here and accept the browser prompt. You can also install the app from the browser menu.</li><li>Desktop: use a browser supporting Web Push and allow notifications. Check operating-system notification settings if alerts do not appear.</li><li>On shared devices, sign out when finished. Each staff member must enable notifications on their own device.</li></ul></details>
  </section>
}
