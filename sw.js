const CACHE_NAME = "neuroped-v7";

// ─── MEDICATION ALARM SYSTEM ───────────────────────────────────────────────
let medicationAlarms = []; // { id, medicamento, dose, horario, diasSemana, ativo }

// Listen for alarm data from the main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_ALARMS") {
    medicationAlarms = event.data.alarms || [];
    // Restart the check interval
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
        // Show notification
        self.registration.showNotification("💊 Hora da Medicação!", {
          body: `${alarm.medicamento} — ${alarm.dose}\nHorário: ${alarm.horario}`,
          icon: "./icon-192.png",
          badge: "./icon-192.png",
          tag: `med-${alarm.id}-${currentTime}`, // Prevent duplicates
          requireInteraction: true, // Stay visible until user interacts
          vibrate: [200, 100, 200, 100, 200], // Vibration pattern
          actions: [
            { action: "taken", title: "✅ Tomei" },
            { action: "snooze", title: "⏰ Adiar 30min" }
          ]
        }).catch(() => {});
      }
    });
  }, 30000); // Check every 30 seconds
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Open the app when notification is clicked
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

// Install: cache app shell + force activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./icon-192.png",
        "./icon-512.png",
      ]);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches + claim all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - JS/CSS assets: cache-first (immutable hashed filenames)
// - HTML/manifest: stale-while-revalidate (show cached instantly, update in background)
// - API calls: network-first with timeout, fallback to mailto
// - Fonts/images: cache-first
// - Everything else: stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== "GET") return;
  
  // API calls: network only (email sending needs live connection)
  if (url.pathname.includes("/api/")) return;

  // JS/CSS chunks (hashed names — immutable): cache-first
  if (url.pathname.match(/\/assets\/.*\.(js|css)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Images (including generated illustrations): cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Fonts: cache-first
  if (url.pathname.match(/\.(woff2?|ttf|eot)$/) ||
      url.hostname.includes("fonts.googleapis.com") ||
      url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // HTML, manifest, and everything else: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

// === STRATEGIES ===

// Cache-first: return from cache immediately, fetch only if not cached
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
    // Return a basic offline fallback for images
    return new Response("", { status: 408 });
  }
}

// Stale-while-revalidate: return cached immediately, update cache in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  // Start network fetch in background
  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached immediately if available, otherwise wait for network
  if (cached) {
    // Fire and forget the network update
    networkFetch;
    return cached;
  }

  // No cache — must wait for network
  const response = await networkFetch;
  if (response) return response;
  
  // Complete offline fallback — serve index.html for navigation
  const fallback = await cache.match("./index.html");
  return fallback || new Response("NeuroPed — Offline. Por favor, conecte-se à internet e recarregue.", {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
