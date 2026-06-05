/* =====================================================================
   NeuroPed · np-version-tag.js · v9.9 — Sweep universal
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Lê package.json (fonte única) e:
     1. Atualiza [data-np-version]
     2. Substitui v2.0.0 / vX.YY.ZZ literais em header/footer
     3. Sweep universal: substitui texto "v6.XX.YY" em qualquer lugar
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npVersionTag) return; window.__npVersionTag = true;

  async function readVersion() {
    if (window.__NP_VERSION__) return window.__NP_VERSION__;
    try {
      const r = await fetch("./package.json", { cache: "no-store" });
      const j = await r.json();
      return j.version || null;
    } catch (_) { return null; }
  }

  function sweepText(root, current, target) {
    if (!root) return;
    const rx = new RegExp("v" + "(\\d+)\\.(\\d+)\\.(\\d+)", "g");
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let n; while ((n = it.nextNode())) {
      const v = n.nodeValue;
      if (!v || !rx.test(v)) { rx.lastIndex = 0; continue; }
      rx.lastIndex = 0;
      // Só sobrescreve em contexto que parece versão de app (perto de "NeuroPed" ou rodapé)
      const parent = n.parentElement;
      if (!parent) continue;
      const ctx = (parent.closest("footer, header, .footer, .topbar, [class*=footer i], [class*=topbar i]") ||
                   /NeuroPed/i.test(parent.textContent || ""));
      if (!ctx) continue;
      n.nodeValue = v.replace(/v\d+\.\d+\.\d+/g, "v" + target);
    }
  }

  async function init() {
    const v = await readVersion();
    if (!v) return;
    window.__NP_VERSION__ = v;
    document.querySelectorAll("[data-np-version]").forEach((el) => {
      el.textContent = "v" + v; el.title = "NeuroPed " + v;
    });
    sweepText(document.body, null, v);
    // re-aplica em mutations
    const obs = new MutationObserver(() => sweepText(document.body, null, v));
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 15000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
