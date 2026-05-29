/* ===========================================================
   NeuroPed EDJ — Service Worker
   Estratégia:
   - Navegação/HTML: network-first (evita servir index.html velho)
   - Assets com hash (imutáveis): cache-first
   - API/Supabase: network-first
   =========================================================== */

const CACHE_NAME = 'neuroped-edj-v4.3.0-premium';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './assets/index-CCN60Z39.js',
  './assets/index-CYKyYC_X.css',
  './premium-override.css',
  './premium-motion.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      // add tolerante por item: um recurso faltando não invalida o resto
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // API / Supabase: network-first
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Navegação (HTML do SPA): network-first com fallback ao index em cache
  const isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');
  if (isNavigation) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put('./index.html', clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Demais recursos (assets com hash, imagens, css/js): cache-first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

// Background sync (quando suportado)
self.addEventListener('sync', e => {
  if (e.tag === 'neuroped-sync') {
    e.waitUntil(self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'sync-now' }))));
  }
});
