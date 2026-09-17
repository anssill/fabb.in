const STATIC_CACHE = 'fabb-static-v5'
const STATIC_ASSETS = ['/brand/fabb-booking-icon-180.png', '/brand/fabb-booking-icon-512.png', '/brand/fabb-booking-logo.png']
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('fabb-static-') && key !== STATIC_CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin === self.location.origin && event.request.method === 'GET' && STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
  }
})

self.addEventListener('push', (event) => {
  let payload
  try { payload = event.data.json() } catch { return }
  if (!payload || typeof payload.title !== 'string') return
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: typeof payload.body === 'string' ? payload.body : 'FABB',
    icon: '/brand/fabb-booking-icon-180.png', badge: '/brand/fabb-booking-icon-180.png',
    tag: payload.tag || 'fabb', data: { url: payload.url },
  }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url
  const safePath = typeof path === 'string' && /^\/bookings\/[0-9a-f-]{36}$/.test(path) ? path : '/notifications'
  event.waitUntil(self.clients.openWindow(new URL(safePath, self.location.origin).href))
})
