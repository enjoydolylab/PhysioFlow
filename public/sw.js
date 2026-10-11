// Offline workspace shell; online navigation always loads the current build.
const CACHE = 'physioflow-v0.6.0-desk2';
const PRECACHE = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('physioflow-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || e.request.headers.has('authorization') || /^\/(v1|api)(\/|$)/.test(url.pathname) || ['/metrics', '/health', '/ready'].includes(url.pathname)) return;
  const remember = async response => {
    if (response.ok && response.type !== 'opaque' && !/\bno-store\b/i.test(response.headers.get('cache-control') || '') && /(text\/|javascript|css)/.test(response.headers.get('content-type') || '')) {
      const cache = await caches.open(CACHE); await cache.put(e.request, response.clone()).catch(() => {});
    }
    return response;
  };
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(remember).catch(async () => await caches.match(e.request) || new Response('Offline — page unavailable', { status: 503 })));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(remember)).catch(() => new Response('Offline — content unavailable', { status: 503 })));
});
