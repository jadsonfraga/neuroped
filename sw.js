/* ===========================================================
   NeuroPed EDJ — Service Worker
   Estratégia:
   - Navegação/HTML: network-first (evita servir index.html velho)
   - Assets com hash (imutáveis): cache-first
   - API/Supabase: network-first
   =========================================================== */

const CACHE_NAME = 'neuroped-edj-v6.8.1';
const SHELL = [
  './',
  './app-shell.html',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './assets/index-CCN60Z39.js',
  './assets/index-CYKyYC_X.css',
  './premium-override.css',
  './premium-motion.js',
  './tour.js',
  './splash-premium.js',
  './filtro-escalas.html','./mapa-escalas.html','./escalas.html','./instrumento.html','./instrumento-autoral.html','./impacto-medicacao.html',
  './neuroped-master-biblioteca.html','./neuroped-master-biblioteca.css','./neuroped-master-biblioteca.js','./neuroped-master-biblioteca-data.js','./neuroped-master-protegido-data.js',
  './neuroped-master-vitrine.html','./neuroped-master-vitrine.css','./central-atalhos.html','./comunicacao-alternativa.html','./portal-familia-livre.html','./gerador-cards.html','./gerador-cards.js',
  './app-polish-mobile.css','./app-polish-mobile.js','./master-access-policy.js',
  './scales-editorial.js','./scales-453-authorial.js','./scales-global-max.js','./scales-featured-extra.js','./scales-featured-10.js','./scales-priority-uploaded.js','./scales-diarios-uteis.js','./scales-autorais-npe.js','./scales-impacto-medicacao.js','./neuroped-pro.html','./pro-license.js','./pro-hashes.js','./sobre-dr-jadson.html','./guia-lancamento.html','./scales-oficiais.js','./scales-oficiais-lote2.js','./scales-curate.js','./scales-red-flags.js','./scales-enhance.js','./scales-index.json'
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