/*
 * Ponte de migração Nesplora.
 *
 * Clientes que ainda tinham uma versão antiga do service worker do NeuroPed
 * podiam receber o shell SPA em /nesplora/. Esse shell tenta registrar
 * "./sw.js"; este worker assume somente o escopo do microsite e recarrega a
 * janela uma única vez, permitindo que o HTML estático seja buscado na rede.
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim().then(async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(
        windows.map((client) => {
          const path = new URL(client.url).pathname;
          return path === "/nesplora" || path.startsWith("/nesplora/")
            ? client.navigate(client.url)
            : undefined;
        }),
      );
    }),
  );
});
