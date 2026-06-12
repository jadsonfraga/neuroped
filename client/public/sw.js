/**
 * NeuroPed Service Worker — v7
 * Estratégia de cache auditada e corrigida (sessão 2026-06-12)
 *
 * ESTRATÉGIAS:
 *  - APIs clínicas (/api/*)      → Network Only  (nunca cachear dados sensíveis)
 *  - JS/CSS hasheados            → Cache First   (imutáveis — nomes com hash)
 *  - Imagens / Fontes            → Cache First   (estáticas)
 *  - HTML / navegação / manifest → Network First (online traz sempre o deploy
 *    recém-publicado; offline cai no cache). Antes era Stale-While-Revalidate,
 *    que servia o index.html ANTIGO do cache e só atualizava na visita seguinte
 *    — causa do "fiz deploy e o app continua na versão antiga".
 *
 * LGPD: este SW NÃO cacheia nenhum dado de paciente ou resposta de API.
 */

const CACHE_NAME = "neuroped-v7";

// App shell — apenas recursos estáticos sem dados clínicos
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png",
];

// ---------- Install ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ---------- Activate ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => {
        self.clients.claim();
        // Notifica todas as abas que um novo SW está ativo
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((c) =>
            c.postMessage({ type: "SW_UPDATED", version: CACHE_NAME })
          );
        });
      })
  );
});

// ---------- Fetch ----------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== "GET") return;

  // ⚠️ APIs clínicas: NUNCA cachear — Network Only
  // Inclui /api/, /functions/, e paths de dados clínicos
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/functions/") ||
    url.pathname.includes("/patients") ||
    url.pathname.includes("/consultations") ||
    url.pathname.includes("/documents")
  ) {
    // Network Only — passa direto sem interceptar
    return;
  }

  // JS/CSS com hash (imutáveis) → Cache First
  if (url.pathname.match(/\/assets\/.*\.(js|css)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Imagens e ícones → Cache First
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Fontes → Cache First
  if (
    url.pathname.match(/\.(woff2?|ttf|eot)$/) ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML / navegação / manifest e tudo mais → Network First.
  // ONLINE, sempre entrega o build recém-publicado; offline cai no cache.
  event.respondWith(networkFirst(request));
});

// ---------- Mensagens do cliente ----------
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CHECK_ONLINE") {
    event.source?.postMessage({ type: "ONLINE_STATUS", online: true });
  }
});

// ============================================================
// ESTRATÉGIAS DE CACHE
// ============================================================

/**
 * Cache First — ideal para assets hasheados (imutáveis).
 * Retorna cache imediatamente; só vai à rede se não estiver no cache.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Recurso indisponível offline — 408 para imagens, evita crash
    return new Response("", { status: 408, statusText: "Request Timeout" });
  }
}

/**
 * Network First — ideal para HTML/navegação: ONLINE busca sempre a versão mais
 * recente (o deploy novo) e só recorre ao cache quando a rede falha (offline).
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline / falha de rede — recorre ao cache.
    const cached = await cache.match(request);
    if (cached) return cached;
  }

  // Fallback offline: serve index.html para navegação SPA
  const offlinePage = await cache.match("./offline.html");
  if (offlinePage && request.mode === "navigate") return offlinePage;

  const fallback = await cache.match("./index.html");
  if (fallback) return fallback;

  return new Response(
    `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>NeuroPed — Offline</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}
.card{text-align:center;padding:2rem;max-width:380px;}
h1{color:#a78bfa;font-size:1.5rem;margin-bottom:.5rem;}
p{color:#94a3b8;line-height:1.6;}
button{margin-top:1.5rem;padding:.75rem 1.5rem;background:#7c3aed;color:#fff;border:none;border-radius:.5rem;cursor:pointer;font-size:1rem;}
button:hover{background:#6d28d9;}</style></head>
<body><div class="card">
<h1>🧠 NeuroPed</h1>
<p>Você está offline. Verifique sua conexão e tente novamente.</p>
<button onclick="location.reload()">Tentar novamente</button>
</div></body></html>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
