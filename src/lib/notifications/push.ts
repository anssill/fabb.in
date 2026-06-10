// Generate VAPID keys with: npx web-push generate-vapid-keys
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
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

export async function requestPushPermission({ userId, businessId }: RequestPushPermissionArgs) {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) return false

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission

  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.register('/sw.js')
  const existingSubscription = await registration.pushManager.getSubscription()
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
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
