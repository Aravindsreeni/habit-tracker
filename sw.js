// ── sw.js — Service Worker (app-shell cache, offline support) ──────
const CACHE    = 'ht-v11';
const SHELL    = [
  './',
  './index.html',
  './css/tokens.css',
  './css/base.css',
  './js/app.js',
  './js/store.js',
  './js/ui.js',
  './js/sync.js',
  './js/router.js',
  './js/views/daily.js',
  './js/views/weekly.js',
  './js/views/monthly.js',
  './js/views/quarterly.js',
  './js/views/yearly.js',
  './js/views/tasks.js',
  './js/views/notes.js',
  './js/views/_all.js',
  './js/views/inbox.js',
  './js/views/routine.js',
  './js/views/stats.js',
  './js/views/journal.js',
  './js/views/mood.js',
  './js/views/cbt.js',
  './js/views/settings.js',
  './js/reminders.js',
  './manifest.webmanifest',
  './icons/icon-192.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for app-shell; network-first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Skip non-GET and cross-origin (Drive API, Google GIS)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
