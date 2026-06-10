self.addEventListener('push', (event) => {
  const fallback = {
    title: 'Fabb Booking',
    body: 'You have a new update.',
    url: '/dashboard',
  }

  const data = event.data ? event.data.json() : fallback
  const title = data.title || fallback.title
  const options = {
    body: data.body || fallback.body,
    icon: '/brand/fabb-icon-192.png',
    badge: '/brand/fabb-icon-72.png',
    data: {
      url: data.url || fallback.url,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
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
