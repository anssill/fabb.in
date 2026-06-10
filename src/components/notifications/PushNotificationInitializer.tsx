'use client'

import { useEffect } from 'react'
import { initPushNotifications } from '@/lib/notifications/push'

export function PushNotificationInitializer({
  userId,
  businessId,
}: {
  userId: string
  businessId: string
}) {
  useEffect(() => {
    if (!userId || !businessId) return
    void initPushNotifications(userId, businessId)
  }, [businessId, userId])

  return null
}
