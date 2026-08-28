const CACHE_NAME = 'gbp-ftms-v2'
const _ghBase = self.location.pathname.includes('/gbpfilesapp') ? '/gbpfilesapp' : ''
const CORE_ASSETS = [`${_ghBase}/`, `${_ghBase}/index.html`]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  // Never cache Supabase API calls
  if (url.hostname.includes('supabase')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {})
        return response
      })
      .catch(() =>
        caches.match(event.request).then(cached => cached || caches.match(`${_ghBase}/index.html`) || caches.match(`${_ghBase}/`))
      )
  )
})