/* =====================================================================
   NeuroPed · np-honesty.js · v9.9 — Auditoria fixada
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Substitui strings de inflação numérica no DOM em tempo real (React
   bundle congelado). Reativo a re-renders via MutationObserver.

   Substituições aplicadas:
     "340+ instrumentos"  →  "490 catalogados · 71 ativos"
     "490+ instrumentos"  →  "490 catalogados · 71 ativos"
     "490 instrumentos"   →  "490 catalogados · 71 ativos"
     "340+"  (isolado)    →  "490"
     "490+"  (isolado)    →  "490"
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npHonesty) return; window.__npHonesty = true;

  const REPLACEMENTS = [
    [/\b(340\+|490\+)\s*instrumentos/gi,  "490 catalogados · 71 ativos"],
    [/\b490\s*instrumentos\b/gi,           "490 catalogados · 71 ativos"],
    [/\b(340|490)\+(?=\s*$|\s*<|\s*\.)/g, "490"]
  ];

  function patchTextNode(node) {
    if (!node.nodeValue) return;
    let v = node.nodeValue, changed = false;
    REPLACEMENTS.forEach(([re, sub]) => {
      const nv = v.replace(re, sub);
      if (nv !== v) { v = nv; changed = true; }
    });
    if (changed) node.nodeValue = v;
  }

  function walk(root) {
    if (!root) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let n; while ((n = it.nextNode())) patchTextNode(n);
  }

  function init() {
    walk(document.body);
    const obs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) patchTextNode(n);
          else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
        });
        if (m.type === "characterData") patchTextNode(m.target);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
