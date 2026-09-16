const STATIC_CACHE = 'fabb-static-v3'
const STATIC_ASSETS = ['/brand/fabb-icon-180.png', '/brand/fabb-icon-512.png', '/brand/fabb-logo.png']
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
