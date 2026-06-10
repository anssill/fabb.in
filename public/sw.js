self.addEventListener('push', (event) => {
  let data = { title: 'Fabb', body: 'New update', url: '/bookings' }

  try {
    data = event.data?.json() ?? data
  } catch {
    data = { ...data, body: event.data?.text() || data.body }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Fabb', {
      body: data.body || 'New update',
      icon: '/brand/fabb-icon-192.png',
      badge: '/brand/fabb-icon-72.png',
      tag: data.tag || 'fabb-notification',
      renotify: true,
      data: { url: data.url || '/bookings' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/dashboard'
  const absoluteUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url === absoluteUrl) {
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl)
      }
    })
  )
})
