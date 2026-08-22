/* Ponte de migração Nesplora: assume /nesplora/ uma vez para escapar do cache legado do NeuroPed. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim().then(async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(windows.map((client) => {
      const path = new URL(client.url).pathname;
      return path === "/nesplora" || path.startsWith("/nesplora/") ? client.navigate(client.url) : undefined;
    }));
  }));
});
