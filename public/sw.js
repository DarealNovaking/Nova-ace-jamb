const CACHE_NAME = 'nova-ace-static-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/nova-ace-icon.svg'];
const EXCLUDED_PREFIXES = ['/rest/', '/auth/', '/functions/', '/storage/', '/realtime/', '/api/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('nova-ace-static-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (EXCLUDED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) || url.pathname === '/sw.js') return;

  // Navigations are network-first. Offline fallback returns only the static app shell,
  // never cached account data, auth responses, payment state, or CBT answers.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/')) || Response.error()));
    return;
  }

  // Vite's content-hashed build assets can be cached for repeat visits. API and auth
  // requests are excluded above; arbitrary same-origin content is not cached.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
