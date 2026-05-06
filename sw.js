const CACHE_NAME = "neuroped-v8-security";

// ─── MEDICATION ALARM SYSTEM ───────────────────────────────────────────────
let medicationAlarms = []; // { id, medicamento, dose, horario, diasSemana, ativo }

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_ALARMS") {
    medicationAlarms = event.data.alarms || [];
    scheduleAlarmCheck();
  }
  if (event.data && event.data.type === "CLEAR_ALARMS") {
    medicationAlarms = [];
  }
});

let alarmCheckInterval = null;
function scheduleAlarmCheck() {
  if (alarmCheckInterval) clearInterval(alarmCheckInterval);
  if (medicationAlarms.length === 0) return;

  alarmCheckInterval = setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const currentDay = now.getDay();

    medicationAlarms.forEach((alarm) => {
      if (alarm.ativo && alarm.horario === currentTime && alarm.diasSemana.includes(currentDay)) {
        self.registration.showNotification("Hora da Medicação", {
          body: `${alarm.medicamento} — ${alarm.dose}\nHorário: ${alarm.horario}`,
          icon: "./icon-192.png",
          badge: "./icon-192.png",
          tag: `med-${alarm.id}-${currentTime}`,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          actions: [
            { action: "taken", title: "Tomei" },
            { action: "snooze", title: "Adiar 30min" }
          ]
        }).catch(() => {});
      }
    });
  }, 30000);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow("./");
      }
    })
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      "./",
      "./index.html",
      "./manifest.json",
      "./icon-192.png",
      "./icon-512.png"
    ]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.pathname.includes("/api/")) return;

  if (url.pathname.match(/\/assets\/.*\.(js|css)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (url.pathname.match(/\.(woff2?|ttf|eot)$/) || url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  event.respondWith(staleWhileRevalidate(event.request));
});

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
    return new Response("", { status: 408 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  if (cached) {
    networkFetch;
    return cached;
  }

  const response = await networkFetch;
  if (response) return response;

  const fallback = await cache.match("./index.html");
  return fallback || new Response("NeuroPed EDJ offline. Conecte-se à internet e recarregue.", {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
