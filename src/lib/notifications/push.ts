// SETUP REQUIRED:
// 1. Run: npx web-push generate-vapid-keys
// 2. Add to .env.local: NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
// 3. Add to Vercel env vars: NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
// 4. Add to Supabase Edge Function secrets: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
// 5. Run: supabase functions deploy send-push-notification
'use client'

import { createClient } from '@/lib/supabase/client'

type RequestPushPermissionArgs = {
  userId: string
  businessId: string
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export async function initPushNotifications(userId: string, businessId: string) {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) return false

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission

  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready

  const readyRegistration = await navigator.serviceWorker.ready
  const existingSubscription = await readyRegistration.pushManager.getSubscription()
  const subscription = existingSubscription || await readyRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  })

  const supabase = createClient() as any
  const endpoint = subscription.endpoint

  const { data: existing } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('push_subscriptions')
      .update({
        business_id: businessId,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        business_id: businessId,
        endpoint,
        subscription: subscription.toJSON(),
      })
  }

  return true
}

export async function requestPushPermission({ userId, businessId }: RequestPushPermissionArgs) {
  return initPushNotifications(userId, businessId)
}
