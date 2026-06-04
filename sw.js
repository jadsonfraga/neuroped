/* ===========================================================
   NeuroPed EDJ — Service Worker
   Estratégia:
   - Navegação/HTML: network-first (evita servir index.html velho)
   - Assets com hash (imutáveis): cache-first
   - API/Supabase: network-first
   =========================================================== */

const CACHE_NAME = 'neuroped-edj-v6.45.5';
const SHELL = [
  './',
  './app-shell.html',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './logo-jadson.jpg',
  './assets/index-CCN60Z39.js',
  './assets/index-CYKyYC_X.css',
  './premium-override.css',
  './premium-motion.js',
  './tour.js',
  './splash-premium.js',
  './filtro-escalas.html','./escala.html','./mapa-escalas.html','./escalas.html','./instrumento.html','./instrumento-autoral.html','./impacto-medicacao.html',
  './diario-escola-terapias-v2.html','./consulta.html','./banco-escalas.html','./banco-escalas-lote1.html','./banco-escalas-lote2-80.html','./banco-escalas-lote3-100.html','./banco-escalas-lote4-200.html','./banco-escalas-lote5-90.html',
  './neuroped-master-biblioteca.html','./neuroped-master-biblioteca.css','./neuroped-master-biblioteca.js','./neuroped-master-biblioteca-data.js','./neuroped-master-protegido-data.js',
  './neuroped-master-vitrine.html','./neuroped-master-vitrine.css','./perfil-crianca.html','./np-store.js','./central-atalhos.html','./comunicacao-alternativa.html','./portal-familia-livre.html','./gerador-cards.html','./gerador-cards.js',
  './neuroped-shell.css','./np-cards.css','./escalas-card-premium.css','./escalas-card-premium.js','./app-polish-mobile.css','./app-polish-mobile.js','./tokens.css','./components.css','./ds-bridge.css','./np-frame.js','./np-sound.js','./np-embed-guard.js','./np-embedded.css','./clinical-meta.js','./evidence-registry.json','./clinical-ontology.json','./master-access-policy.js','./consulta-bridge.js','./spa-route-watchdog.js',
  './scales-editorial.js','./scales-453-authorial.js','./scales-global-max.js','./scales-featured-extra.js','./scales-featured-10.js','./scales-priority-uploaded.js','./scales-diarios-uteis.js','./scales-autorais-npe.js','./scales-sensorial-perfil.js','./scales-tempo-tela.js','./scales-coordenacao-motora.js','./scales-impacto-medicacao.js','./neuroped-pro.html','./pro-license.js','./pro-hashes.js','./sobre-dr-jadson.html','./guia-lancamento.html','./scales-oficiais.js','./scales-oficiais-lote2.js','./scales-curate.js','./scales-red-flags.js','./scales-enhance.js','./scales-taxonomy.js','./scales-smart-rank.js','./scales-questions.js','./scales-preconsulta-gate.js','./scales-progress.js','./scales-bundle.js','./scales-question-coach.js','./scales-direct-tasks.js','./scales-index.json','./scales-clinical-signals.js',
  './intake.html','./testes-diretos.html','./testes-diretos-engine.js','./instrumento-celebrations.js','./diarios.html','./entrevista-autismo-adir.html','./sobre-natureza.html',
  './clinical-explainability.js','./clinical-normalization.js','./clinical-timeline-engine.js','./phenotype-engine.js','./therapeutic-burden-engine.js','./response-engine.js','./contradiction-engine.js','./clinical-decision-support.js','./clinical-visual-schema.js','./clinical-config.example.js','./clinical-config.js','./clinical-config-adapter.js','./clinical-trajectory-explain.js','./clinical-trajetoria.html','./clinical-trajetoria-demo.html',
  './scales-evidence-panel.js','./curated-evidence/instruments.json',
  './ds-tokens.css','./ds-pilot.html',
  './retro-arcade.css','./retro-arcade.js','./app-skin.css','./np-lgpd-consent.js'
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

  // Google Fonts (CSS + arquivos de fonte): cache-first com revalidação.
  // A fonte premium (Fraunces/Inter) é injetada via app-polish; sem isto ela
  // dependeria da rede e sumiria offline. As respostas têm CORS (cacheáveis).
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(hit => {
        const network = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        }).catch(() => hit);
        return hit || network;
      })
    );
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
            // Só a RAIZ/SPA atualiza o cache de './index.html'. Antes, QUALQUER
            // navegação (filtro, perfil…) sobrescrevia index.html com a página
            // visitada → o fallback offline do SPA virava a última página aberta.
            const isIndex = url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
            caches.open(CACHE_NAME).then(c => {
              c.put(req, res.clone());                            // a própria página (offline)
              if (isIndex) c.put('./index.html', res.clone());    // index só pela raiz
            });
          }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // PATCH UNIVERSAL do pdf-lib (núcleo no chunk PDFButton): o encoder WinAnsi
  // (Helvetica) LANÇA erro ao topar com emoji/char fora do Latin-1 — quebra TODOS
  // os geradores de PDF do SPA (laudo de escala, teste, receita…). Aqui tornamos o
  // encoder tolerante: caractere não-codificável vira espaço (ou '?') em vez de throw.
  // Cobre desenho E medição de largura de uma vez. Auto-validável (no-op se a âncora sumir).
  if (url.origin === self.location.origin && /\/PDFButton-[^/]*\.js$/.test(url.pathname)) {
    e.respondWith(patchPdfLibEncoder(req));
    return;
  }

  // PATCH do gerador de PDF da SPA: o chunk usa fonte WinAnsi (Helvetica) e quebra
  // ao desenhar emoji/caracteres não-Latin1 → o PDF não gerava. Aqui injetamos uma
  // sanitização no ponto de entrada (title/content), SEM tocar a lógica. É
  // auto-validável: se a âncora exata não existir, serve o arquivo intacto (no-op).
  if (url.origin === self.location.origin && /\/pdf-generator-[^/]*\.js$/.test(url.pathname)) {
    e.respondWith(patchPdfGenerator(req));
    return;
  }

  // JS e CSS internos (sem hash no nome): STALE-WHILE-REVALIDATE.
  // Serve rápido do cache, mas SEMPRE busca a versão nova em paralelo e atualiza
  // o cache. Sem isto, JS/CSS antigos ficavam presos para sempre (correções nunca
  // chegavam ao usuário). Próxima abertura já pega o arquivo novo.
  const isCode = url.origin === self.location.origin && /\.(js|css)$/i.test(url.pathname);
  if (isCode) {
    e.respondWith(
      caches.match(req).then(hit => {
        const network = fetch(req).then(res => {
          if (res && res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        }).catch(() => hit);
        return hit || network;
      })
    );
    return;
  }

  // Demais recursos (imagens, fontes, assets com hash): cache-first
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

// Sanitiza title/content do gerador de PDF da SPA para não quebrar no WinAnsi.
// Injeta no início de `async function xt(n){` (entry de generatePDF). Se a âncora
// não existir (chunk mudou), serve o original — nunca quebra.
async function patchPdfGenerator(req) {
  try {
    const res = await fetch(req);
    if (!res || !res.ok) return res;
    let code = await res.text();
    const anchor = 'async function xt(n){';
    if (code.indexOf(anchor) !== -1 && code.indexOf('__npPdfSafe') === -1) {
      const inject = anchor +
        'try{var __s=function(v){return (v==null?v:String(v)' +
        // remove emojis e símbolos fora do Latin-1, normaliza acentos compostos
        '.normalize("NFC")' +
        '.replace(/[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE00}-\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}\\u{2190}-\\u{21FF}\\u{2300}-\\u{23FF}\\u{25A0}-\\u{25FF}\\u{2B00}-\\u{2BFF}]/gu,"")' +
        // qualquer resíduo fora do imprimível Latin-1 vira espaço
        '.replace(/[^\\u0000-\\u00FF]/g," ").replace(/[ ]{2,}/g," ").trim());};' +
        'if(n&&typeof n==="object"){n.title=__s(n.title);n.subtitle=__s(n.subtitle);n.content=__s(n.content);n.patientName=__s(n.patientName);n.extraFooter=__s(n.extraFooter);}}catch(__e){}var __npPdfSafe=1;';
      code = code.replace(anchor, inject);
      return new Response(code, { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
    }
    return new Response(code, { headers: res.headers });
  } catch (err) {
    return fetch(req);
  }
}

// Torna o encoder WinAnsi do pdf-lib TOLERANTE a emoji/char fora do Latin-1:
// onde ele lançaria erro (codepoint sem mapeamento), passamos a usar espaço (32)
// ou '?' (63) — assim NENHUM gerador de PDF do SPA quebra. Cobre todas as cópias
// do encoder (WinAnsi/Symbol/ZapfDingbats). No-op seguro se a âncora não existir.
async function patchPdfLibEncoder(req) {
  try {
    const res = await fetch(req);
    if (!res || !res.ok) return res;
    let code = await res.text();
    const anchor = 'this.encodeUnicodeCodePoint=function(i){var o=n.unicodeMappings[i];if(!o){';
    if (code.indexOf(anchor) !== -1) {
      const repl = 'this.encodeUnicodeCodePoint=function(i){var o=n.unicodeMappings[i];if(!o)o=n.unicodeMappings[32]||n.unicodeMappings[63];if(!o){';
      code = code.split(anchor).join(repl);
      return new Response(code, { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
    }
    return new Response(code, { headers: res.headers });
  } catch (err) {
    return fetch(req);
  }
}

// Background sync (quando suportado)
self.addEventListener('sync', e => {
  if (e.tag === 'neuroped-sync') {
    e.waitUntil(self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'sync-now' }))));
  }
});