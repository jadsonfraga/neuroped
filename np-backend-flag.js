/* =====================================================================
   NeuroPed · np-backend-flag.js · MP9.0 WS1
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Detecta endpoints NOT_IMPLEMENTED via header x-neuroped-status e
   marca a UI dependente com badge "Em implantação" — substitui o
   "ar de feature pronta que dá 404".

   Estratégia:
     1. Probe rápido aos 9 endpoints conhecidos no boot
     2. Cache local (10 min) para não martelar
     3. Marca [data-needs-endpoint="..."] com class .np-pending
     4. Toda chamada fetch() para um endpoint pending é interceptada
        e dispara toast "Recurso em implantação"
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npBackendFlag) return; window.__npBackendFlag = true;

  const KNOWN = [
    "/api/certificado", "/api/certificado/salvar", "/api/laudo/salvar",
    "/api/patients", "/api/results", "/api/send-report",
    "/api/portal/diary", "/api/portal/messages"
  ];
  const CACHE_KEY = "neuroped.backend.status.v1";
  const TTL_MS = 10 * 60 * 1000;

  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!c || Date.now() - c.ts > TTL_MS) return null;
      return c.map;
    } catch (_) { return null; }
  }
  function writeCache(map) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), map })); } catch (_) {}
  }

  let statusMap = readCache() || {};
  const pending = new Set();

  async function probe(ep) {
    try {
      const r = await fetch(ep, { method: "OPTIONS", cache: "no-store" }).catch(() => null);
      if (!r) return "unknown";
      const status = r.headers.get("x-neuroped-status");
      if (status === "not-implemented") return "pending";
      if (r.status >= 200 && r.status < 400) return "ok";
      if (r.status === 501) return "pending";
      return "unknown";
    } catch (_) { return "unknown"; }
  }

  async function probeAll() {
    const updates = await Promise.all(KNOWN.map(async (ep) => {
      if (statusMap[ep]) return [ep, statusMap[ep]];
      return [ep, await probe(ep)];
    }));
    updates.forEach(([ep, st]) => { statusMap[ep] = st; if (st === "pending") pending.add(ep); });
    writeCache(statusMap);
    applyMarkers();
  }

  function applyMarkers() {
    document.querySelectorAll("[data-needs-endpoint]").forEach((el) => {
      const ep = el.getAttribute("data-needs-endpoint");
      if (pending.has(ep) || statusMap[ep] === "pending") {
        el.classList.add("np-pending");
        if (!el.querySelector(".np-pending-badge")) {
          const b = document.createElement("span");
          b.className = "np-pending-badge";
          b.textContent = "Em implantação";
          el.appendChild(b);
        }
        if (el.matches("button, a, [role=button]")) {
          el.setAttribute("aria-disabled", "true");
          el.setAttribute("title", "Recurso em implantação — backend ainda não disponível");
        }
      }
    });
  }

  function injectStyles() {
    if (document.getElementById("np-backend-flag-style")) return;
    const css = `
      .np-pending { opacity: .75; position: relative; }
      .np-pending[aria-disabled="true"] { cursor: not-allowed; pointer-events: auto; filter: grayscale(.3); }
      .np-pending-badge {
        display: inline-block; margin-left: 8px;
        padding: 2px 8px; border-radius: 999px;
        background: rgba(251,191,36,.18); color: #FBBF24;
        border: 1px solid rgba(251,191,36,.45);
        font: 600 10px/1.4 var(--np-font-text, "Inter", system-ui, sans-serif);
        letter-spacing: .12em; text-transform: uppercase; vertical-align: middle;
      }
      .np-pending-toast {
        position: fixed; left: 50%; bottom: 32px; transform: translateX(-50%);
        background: rgba(251,191,36,.15); border: 1px solid rgba(251,191,36,.5);
        color: #FBBF24; padding: 12px 18px; border-radius: 14px;
        font: 600 13px var(--np-font-text, "Inter", system-ui, sans-serif);
        z-index: 99999; backdrop-filter: blur(12px);
      }
    `;
    const s = document.createElement("style"); s.id = "np-backend-flag-style"; s.textContent = css;
    document.head.appendChild(s);
  }

  // Intercepta fetch para mostrar toast educativo em vez de 404 silencioso
  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = (typeof input === "string") ? input : (input && input.url) || "";
    const ep = KNOWN.find((k) => url.includes(k));
    if (ep && statusMap[ep] === "pending") {
      showToast("Recurso em implantação · " + ep);
      return Promise.resolve(new Response(JSON.stringify({ error: "not_implemented", endpoint: ep }), {
        status: 501,
        headers: { "content-type": "application/json", "x-neuroped-status": "not-implemented" }
      }));
    }
    return origFetch.apply(this, arguments);
  };

  function showToast(msg) {
    const t = document.createElement("div");
    t.className = "np-pending-toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function init() {
    injectStyles();
    applyMarkers();
    probeAll();
    const obs = new MutationObserver(() => applyMarkers());
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 30000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.NPBackendFlag = { statusMap, pending, probeAll, version: "MP9.0" };
})();
