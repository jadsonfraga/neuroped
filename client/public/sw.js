/**
 * NeuroPed Service Worker — cache versionado pelo build
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

try {
  importScripts("./sw-build.js");
} catch {
  // Desenvolvimento/primeira instalação: usa um identificador seguro abaixo.
}
try {
  importScripts("./sw-assets.js");
} catch {
  // Em desenvolvimento o manifesto só existe depois do build do Vite.
}

const BUILD_ID = String(self.__NEUROPED_BUILD_ID__ || "development").replace(/[^a-zA-Z0-9._-]/g, "-");
const CACHE_NAME = `neuroped-${BUILD_ID}`;
const PRECACHE_ASSETS = Array.isArray(self.__NEUROPED_PRECACHE_ASSETS__)
  ? self.__NEUROPED_PRECACHE_ASSETS__
  : [];

// App shell — apenas recursos estáticos sem dados clínicos
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png",
  ...PRECACHE_ASSETS,
];

// ---------- Install ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map(async (asset) => {
          const response = await fetch(asset, { cache: "reload" });
          if (!response.ok) {
            throw new Error(`Falha ao instalar recurso obrigatório: ${asset}`);
          }
          await cache.put(asset, response);
        }),
      ),
    ),
  );
  self.skipWaiting();
});

// ---------- Activate ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        // Mantém o cache imediatamente anterior: abas ainda abertas podem
        // solicitar chunks lazy do build antigo antes de aceitar o reload.
        const previousCaches = keys.filter(
          (key) => key.startsWith("neuroped-") && key !== CACHE_NAME,
        );
        const obsoleteCaches = previousCaches.slice(0, -1);
        return Promise.all(obsoleteCaches.map((key) => caches.delete(key)));
      })
      .then(() => {
        // A ativação só termina depois de assumir e avisar as abas. Sem retornar
        // estas promessas, o runtime podia encerrar o worker antes da mensagem.
        return Promise.all([
          self.clients.claim(),
          self.clients.matchAll({ type: "window" }).then((clients) => {
            clients.forEach((client) =>
              client.postMessage({ type: "SW_UPDATED", version: CACHE_NAME })
            );
          }),
        ]);
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
  if (event.data?.type === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: CACHE_NAME });
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
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      return response;
    }

    // Compatibilidade com uma aba que ainda executa o build anterior: um
    // chunk hasheado antigo pode já ter saído da origem, mas continua no único
    // cache legado preservado durante a ativação. Recursos não hasheados nunca
    // usam esse atalho quando a rede respondeu com a versão atual.
    const legacy = await caches.match(request);
    return legacy ?? response;
  } catch {
    const legacy = await caches.match(request);
    if (legacy) return legacy;
    // Recurso indisponível offline — 408 para imagens, evita crash.
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
      await cache.put(request, response.clone());
    } else if (request.mode === "navigate" && response.status >= 500) {
      // Uma falha transitória do host não deve inutilizar um shell já instalado.
      const cached = await cache.match(request);
      if (cached) return cached;
      const appShell = await cache.match("./index.html");
      if (appShell) return appShell;
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
a{display:inline-block;margin-top:1.5rem;padding:.75rem 1.5rem;background:#7c3aed;color:#fff;border:none;border-radius:.5rem;cursor:pointer;font-size:1rem;text-decoration:none;}
a:hover{background:#6d28d9;}</style></head>
<body><div class="card">
<h1>🧠 NeuroPed</h1>
<p>Você está offline. Verifique sua conexão e tente novamente.</p>
<a href="./">Tentar novamente</a>
</div></body></html>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
