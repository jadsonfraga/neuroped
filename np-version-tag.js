/* =====================================================================
   NeuroPed · np-version-tag.js · v9.8 (M4 do prompt mestre)
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Lê window.__NP_VERSION__ (ou package.json via fetch) e SOBRESCREVE
   todo nó com [data-np-version], [data-np-version-tag], e strings
   v2.0.0 / vX.Y.Z literais em footer/header reconhecidos.
   ===================================================================== */
(function () {
  "use strict";
  async function readVersion() {
    if (window.__NP_VERSION__) return window.__NP_VERSION__;
    try {
      const r = await fetch("./package.json", { cache: "no-store" });
      const j = await r.json();
      return j.version || "?";
    } catch (_) { return null; }
  }
  async function init() {
    const v = await readVersion();
    if (!v) return;
    window.__NP_VERSION__ = v;
    // Atualiza elementos explicitamente marcados
    document.querySelectorAll("[data-np-version]").forEach(el => {
      el.textContent = "v" + v;
      el.setAttribute("title", "NeuroPed " + v);
    });
    // Tenta substituir v2.0.0 literal em header/footer
    document.querySelectorAll("header, footer, .topbar, .footer, [class*=topbar i], [class*=footer i]").forEach(el => {
      if (!el || !el.innerHTML) return;
      el.innerHTML = el.innerHTML.replace(/v2\.0\.0\b/g, "v" + v);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
