/* =====================================================================
   NeuroPed · np-sidebar-canonical.js · v9.8 (M2 do prompt mestre)
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Adiciona os 3 hubs canônicos à sidebar React existente, sem tocar no
   bundle. Reativo via MutationObserver — sobrevive a renders do React.
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npSidebarCanonical) return; window.__npSidebarCanonical = true;

  const HUBS = [
    { id: "testes-diretos",        title: "Testes diretos",         desc: "Aplicados na criança em consulta",  emoji: "🎯", href: "./testes-diretos.html",        color: "#7C79FF" },
    { id: "escalas-questionarios", title: "Escalas e questionários", desc: "Pré-consulta — pais, escola, autoteste", emoji: "📋", href: "./escalas-questionarios.html", color: "#E7C98B" },
    { id: "diarios-clinicos",      title: "Diários clínicos",        desc: "Acompanhamento longitudinal",        emoji: "📔", href: "./diarios-clinicos.html",      color: "#9D9BFF" }
  ];

  function injectStyles() {
    if (document.getElementById("np-sidebar-canonical-style")) return;
    const css = `
      .np-hubs { padding: 16px 12px 4px; }
      .np-hubs__label {
        font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
        color: #7C79FF; padding: 0 8px 8px; opacity: .9;
      }
      .np-hub {
        display: grid; grid-template-columns: 32px 1fr; align-items: center; gap: 10px;
        padding: 10px 12px; margin: 4px 0; border-radius: 12px;
        text-decoration: none; color: inherit;
        transition: background .2s cubic-bezier(0.16, 1, 0.30, 1), transform .2s cubic-bezier(0.16, 1, 0.30, 1);
      }
      .np-hub:hover { background: rgba(124,121,255,.08); transform: translateX(2px); }
      .np-hub[aria-current="page"] {
        background: linear-gradient(90deg, rgba(124,121,255,.18), transparent);
        color: #fff;
      }
      .np-hub__emoji { font-size: 18px; line-height: 1; opacity: .9; }
      .np-hub__title { font-weight: 600; font-size: 14px; color: #F5F3FF; }
      .np-hub__desc  { font-size: 11px; color: #A8A5C8; line-height: 1.35; margin-top: 2px; }
    `;
    const s = document.createElement("style"); s.id = "np-sidebar-canonical-style"; s.textContent = css;
    document.head.appendChild(s);
  }

  function buildBlock() {
    const wrap = document.createElement("nav");
    wrap.className = "np-hubs"; wrap.setAttribute("aria-label", "Trabalho clínico");
    wrap.dataset.npCanonical = "1";
    wrap.innerHTML =
      '<div class="np-hubs__label">Trabalho clínico</div>' +
      HUBS.map(h => `
        <a class="np-hub" href="${h.href}" data-hub="${h.id}">
          <span class="np-hub__emoji" aria-hidden="true">${h.emoji}</span>
          <span class="np-hub__txt">
            <div class="np-hub__title">${h.title}</div>
            <div class="np-hub__desc">${h.desc}</div>
          </span>
        </a>`).join("");
    return wrap;
  }

  function markActive(block) {
    const path = location.pathname.split("/").pop() || "";
    block.querySelectorAll(".np-hub").forEach(a => {
      const href = a.getAttribute("href").replace("./", "");
      a.setAttribute("aria-current", href === path ? "page" : "false");
    });
  }

  function tryInject() {
    if (document.querySelector('[data-np-canonical="1"]')) return true;
    // Procura a sidebar do React (heurística: aside ou nav lateral com várias <a>)
    const candidates = [
      document.querySelector('aside nav'),
      document.querySelector('aside'),
      document.querySelector('nav[aria-label*="navega" i]'),
      document.querySelector('nav[role="navigation"]'),
      document.querySelector('[class*="sidebar" i]'),
      document.querySelector('[class*="drawer"  i]')
    ].filter(Boolean);
    const target = candidates[0];
    if (!target) return false;
    const block = buildBlock();
    // Insere no TOPO da sidebar (regra do prompt: hub canônico vem antes dos subtipos)
    target.insertBefore(block, target.firstChild);
    markActive(block);
    injectStyles();
    return true;
  }

  function init() {
    injectStyles();
    if (tryInject()) return;
    const obs = new MutationObserver(() => { if (tryInject()) { /* mantém observando para re-render */ } });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 30000); // para após 30s
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.NPSidebarCanonical = { HUBS, version: "9.8.0" };
})();
