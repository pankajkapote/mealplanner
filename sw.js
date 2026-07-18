// Minimal service worker: caches the app shell so it opens even with a
// flaky connection, and satisfies the installability requirement some
// browsers check for before showing the "Install app" prompt.
const CACHE_NAME = 'akb-cache-v1';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for navigation requests (so meal plans stay fresh),
  // falling back to the cached shell if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  // Cache-first for everything else (icons, fonts, etc.)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
