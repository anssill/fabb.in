const STATIC_CACHE = 'fabb-static-v1'
const STATIC_ASSETS = ['/login', '/brand/fabb-icon-180.png', '/brand/fabb-icon-512.png', '/brand/fabb-logo.png']
const DB_NAME = 'fabb-offline-v1'
const STORE_NAME = 'attendance-queue'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})

function openQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function queueAttendance(body) {
  const db = await openQueue()
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ id: crypto.randomUUID(), body, queuedAt: Date.now() })
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}

async function syncAttendance() {
  const db = await openQueue()
  const entries = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  for (const entry of entries) {
    const response = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: entry.body })
    if (response.ok) {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(entry.id)
    }
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin === self.location.origin && url.pathname === '/api/attendance' && event.request.method === 'POST') {
    event.respondWith(fetch(event.request.clone()).catch(async () => {
      await queueAttendance(await event.request.clone().text())
      return new Response(JSON.stringify({ queued: true }), { status: 202, headers: { 'Content-Type': 'application/json' } })
    }))
    return
  }
  if (event.request.method === 'GET' && STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
  }
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'fabb-attendance') event.waitUntil(syncAttendance())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_ATTENDANCE') event.waitUntil(syncAttendance())
})
