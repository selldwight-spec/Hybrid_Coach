const CACHE = 'hybrid-coach-v1'
const PRECACHE = ['/', '/dashboard', '/program', '/exercises', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Cache-first for immutable Next.js static assets
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ??
          fetch(e.request).then((res) => {
            caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
            return res
          })
      )
    )
    return
  }

  // Network-only for API and auth routes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  // Network-first with cache fallback for pages
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Hybrid Coach', {
      body: data.body ?? "Time for today's session",
      data: { url: data.url ?? '/dashboard' },
      tag: 'hybrid-coach-reminder',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = e.notification.data?.url ?? '/dashboard'
  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((wins) => {
        const existing = wins.find((w) => 'focus' in w)
        return existing ? existing.focus() : clients.openWindow(target)
      })
  )
})
