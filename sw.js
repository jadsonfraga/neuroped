const CACHE_NAME = "neuroped-v33-consulta-docs";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./auditoria-operacional.html",
  "./design-system-premium.css",
  "./premium-experience.js",
  "./premium-polish-overrides.css",
  "./premium-polish.js",
  "./editorial-impact.css",
  "./family-pass.js",
  "./family-pass-generator.js",
  "./family-pass-portal.js",
  "./consulta-documentos.js",
  "./family-voucher.js",
  "./family-voucher-ui.js",
  "./ativar-passe-familiar.html",
  "./central-atalhos.html",
  "./verificar-app.html",
  "./portal-familia-livre.html",
  "./area-filho.html",
  "./politica-acesso-familiar.html",
  "./consulta.html",
  "./assets/pre-consulta-CiPJ7HHP.js",
  "./master-access-policy.js",
  "./safe-public-layer.js",
  "./safe-public-layer.css",
  "./caa-sidebar.js",
  "./escalas.html",
  "./mapa-escalas.html",
  "./filtro-escalas.html",
  "./scales-index.json",
  "./scales-editorial.js",
  "./comunicacao-alternativa.html",
  "./caa-hotfix.js",
  "./diario-escola-terapias-v2.html",
  "./diario-hotfix.js",
  "./qa-smoke-test.html",
  "./banco-escalas.html",
  "./banco-escalas-lote1.html",
  "./banco-escalas-lote2-80.html",
  "./banco-escalas-lote3-100.html",
  "./banco-escalas-lote4-200.html",
  "./banco-escalas-lote5-90.html",
  "./icon-192.png",
  "./icon-512.png"
];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", event => { if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.pathname.includes("/api/")) return;
  if (url.pathname.endsWith(".html") || url.pathname.endsWith("/neuroped/") || url.pathname === "/neuroped") { event.respondWith(htmlPremium(event.request, url.pathname)); return; }
  if (url.pathname.match(/\/assets\/.*\.(js|css)$/)) { event.respondWith(cacheFirst(event.request)); return; }
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/)) { event.respondWith(cacheFirst(event.request)); return; }
  if (url.pathname.match(/\.(woff2?|ttf|eot|json|js|css)$/)) { event.respondWith(cacheFirst(event.request)); return; }
  event.respondWith(staleWhileRevalidate(event.request));
});
async function cacheFirst(request) { const cached = await caches.match(request); if (cached) return cached; try { const response = await fetch(request); if (response.ok) { const cache = await caches.open(CACHE_NAME); cache.put(request, response.clone()); } return response; } catch { return new Response("", { status: 408 }); } }
function addHead(out, href){ if(!out.includes(href)) out = out.replace("</head>", '<link rel="stylesheet" href="'+href+'">\n</head>'); return out; }
function addBody(out, src){ if(!out.includes(src)) out = out.replace("</body>", '<script src="'+src+'" defer></script>\n</body>'); return out; }
function injectPremium(html, path) {
  let out = html;
  out = addHead(out,"./design-system-premium.css");
  out = addHead(out,"./premium-polish-overrides.css");
  out = addHead(out,"./editorial-impact.css");
  out = addBody(out,"./premium-experience.js");
  out = addBody(out,"./premium-polish.js");
  if (/consulta\.html/i.test(path)) { out = addBody(out,"./family-pass.js"); out = addBody(out,"./family-pass-generator.js"); out = addBody(out,"./consulta-documentos.js"); }
  if (/portal-familia-livre\.html/i.test(path)) { out = addBody(out,"./family-pass.js"); out = addBody(out,"./family-pass-portal.js"); }
  if (!out.includes("portal-familia-livre.html")) out = out.replace("</body>", `<script>(function(){function p(){var h=location.hash||'';h=h.charAt(0)==='#'?h.slice(1):h;if(/^\\/portal-familias?(\\/|$|\\?)/i.test(h)){location.replace('./portal-familia-livre.html')}}p();window.addEventListener('hashchange',p);})();</script>\n</body>`);
  return out;
}
async function htmlPremium(request, path) { const response = await staleWhileRevalidate(request); try { const html = await response.clone().text(); const patched = injectPremium(html, path); return new Response(patched, { status: response.status, statusText: response.statusText, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" } }); } catch { return response; } }
async function staleWhileRevalidate(request) { const cache = await caches.open(CACHE_NAME); const cached = await cache.match(request); const networkFetch = fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; }).catch(() => null); if (cached) { networkFetch; return cached; } const response = await networkFetch; if (response) return response; const fallback = await cache.match("./index.html"); return fallback || new Response("NeuroPed offline. Conecte-se e recarregue.", { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }); }
