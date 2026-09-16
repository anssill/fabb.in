'use client'
export async function disableDevicePush() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager?.getSubscription()
  if (!subscription) return
  const response = await fetch('/api/notifications/push/subscription', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) })
  const unsubscribed = await subscription.unsubscribe()
  if (!response.ok && !unsubscribed) throw new Error('Could not disable this device. Check your connection and retry.')
}
