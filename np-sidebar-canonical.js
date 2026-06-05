/* =====================================================================
   NeuroPed · np-sidebar-canonical.js · v9.9 (M2 — refino premium)
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Sidebar canônica do TRABALHO CLÍNICO: 3 hubs (testes diretos, escalas,
   diários) injetados no topo da sidebar da SPA, SEM tocar no bundle.
   Refino v9.9:
     · Ícones SVG (sem emoji — UI clínica formal, regra §5 do prompt mestre)
     · Cores TOKENIZADAS (tokens.css → claro/escuro automático, uniforme)
     · Densidade/hover/estado-ativo refinados (silêncio visual)
     · Guarda anti-duplicação robusta + dedupe dos itens React redundantes
       que o hub canônico já cobre (escopado à sidebar, reversível)
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npSidebarCanonical) return; window.__npSidebarCanonical = true;

  // Ícones inline (stroke currentColor → herdam a cor do tema). Sem emoji.
  var ICON = {
    target: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
    list:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    book:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22.5Z"/><path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H19"/></svg>'
  };

  var HUBS = [
    { id: "testes-diretos",        title: "Testes diretos",          desc: "Aplicados na criança em consulta",        icon: ICON.target, href: "./testes-diretos.html" },
    { id: "escalas-questionarios", title: "Escalas e questionários", desc: "Pré-consulta — pais, escola, autoteste",   icon: ICON.list,   href: "./escalas-questionarios.html" },
    { id: "diarios-clinicos",      title: "Diários clínicos",        desc: "Acompanhamento longitudinal",             icon: ICON.book,   href: "./diarios-clinicos.html" }
  ];

  // Conceitos que o hub canônico JÁ cobre → escondemos o item React duplicado
  // (match por texto normalizado EXATO, escopado à sidebar; reversível).
  var REDUNDANT = ["escalas", "acadêmico interativo", "testes com a criança"];

  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); }

  function injectStyles() {
    if (document.getElementById("np-sidebar-canonical-style")) return;
    var css =
      ".np-hubs{padding:14px 10px 6px;border-bottom:1px solid var(--border,rgba(255,255,255,.08));margin-bottom:6px}" +
      ".np-hubs__label{font:700 11px/1 system-ui;letter-spacing:.16em;text-transform:uppercase;color:var(--text-muted,#94A3B8);padding:0 10px 10px}" +
      ".np-hub{display:grid;grid-template-columns:22px 1fr;align-items:center;gap:12px;padding:9px 10px;margin:2px 0;border-radius:12px;text-decoration:none;color:inherit;position:relative;transition:background .18s cubic-bezier(.16,1,.3,1),color .18s cubic-bezier(.16,1,.3,1)}" +
      ".np-hub__icon{display:inline-flex;align-items:center;justify-content:center;color:var(--text-muted,#94A3B8);transition:color .18s}" +
      ".np-hub__title{font:600 13.5px/1.2 system-ui;color:var(--text,#E5E7EB);letter-spacing:-.01em}" +
      ".np-hub__desc{font:400 11px/1.35 system-ui;color:var(--text-muted,#94A3B8);margin-top:2px}" +
      ".np-hub:hover{background:color-mix(in srgb,var(--primary,#7C79FF) 9%,transparent)}" +
      ".np-hub:hover .np-hub__icon{color:var(--primary,#7C79FF)}" +
      ".np-hub:focus-visible{outline:2px solid var(--primary,#7C79FF);outline-offset:2px}" +
      ".np-hub[aria-current=page]{background:color-mix(in srgb,var(--primary,#7C79FF) 14%,transparent)}" +
      ".np-hub[aria-current=page]::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--primary,#7C79FF)}" +
      ".np-hub[aria-current=page] .np-hub__icon,.np-hub[aria-current=page] .np-hub__title{color:var(--primary,#7C79FF)}" +
      "@media(prefers-reduced-motion:reduce){.np-hub{transition:none}}";
    var s = document.createElement("style"); s.id = "np-sidebar-canonical-style"; s.textContent = css;
    document.head.appendChild(s);
  }

  function buildBlock() {
    var wrap = document.createElement("nav");
    wrap.className = "np-hubs"; wrap.setAttribute("aria-label", "Trabalho clínico");
    wrap.dataset.npCanonical = "1";
    wrap.innerHTML =
      '<div class="np-hubs__label">Trabalho clínico</div>' +
      HUBS.map(function (h) {
        return '<a class="np-hub" href="' + h.href + '" data-hub="' + h.id + '">' +
          '<span class="np-hub__icon">' + h.icon + '</span>' +
          '<span class="np-hub__txt"><span class="np-hub__title">' + h.title + '</span>' +
          '<span class="np-hub__desc">' + h.desc + '</span></span></a>';
      }).join("");
    return wrap;
  }

  function markActive(block) {
    var path = location.pathname.split("/").pop() || "";
    block.querySelectorAll(".np-hub").forEach(function (a) {
      var href = a.getAttribute("href").replace("./", "");
      a.setAttribute("aria-current", href === path ? "page" : "false");
    });
  }

  // Esconde itens React redundantes DENTRO da sidebar (não some com Início/Portal etc.).
  function dedupe(sidebar) {
    if (!sidebar) return;
    var items = sidebar.querySelectorAll('a,button,[role="menuitem"]');
    items.forEach(function (el) {
      if (el.closest('[data-np-canonical="1"]')) return;     // nunca toca nos hubs canônicos
      if (el.dataset.npDeduped) return;
      var t = norm(el.textContent);
      // remove sufixos de contagem ("escalas 490") para casar o conceito
      var concept = t.replace(/\s*\d+\s*$/, "");
      if (REDUNDANT.indexOf(concept) >= 0) {
        el.dataset.npDeduped = "1";
        el.style.display = "none";
      }
    });
  }

  function findSidebar() {
    var c = [
      document.querySelector('aside nav'),
      document.querySelector('aside'),
      document.querySelector('nav[aria-label*="navega" i]'),
      document.querySelector('nav[role="navigation"]'),
      document.querySelector('[class*="sidebar" i]'),
      document.querySelector('[class*="drawer"  i]')
    ].filter(Boolean);
    return c[0] || null;
  }

  function tryInject() {
    var sidebar = findSidebar();
    if (!sidebar) return false;
    // guarda anti-duplicação: se o React removeu o bloco num re-render, recoloca; nunca 2.
    var existing = sidebar.querySelector('[data-np-canonical="1"]');
    if (!existing) {
      // limpa órfãos fora da sidebar atual (paranoia anti-duplicata)
      document.querySelectorAll('[data-np-canonical="1"]').forEach(function (n) { n.remove(); });
      sidebar.insertBefore(buildBlock(), sidebar.firstChild);
    }
    var block = sidebar.querySelector('[data-np-canonical="1"]');
    markActive(block);
    dedupe(sidebar);
    return true;
  }

  function init() {
    injectStyles();
    tryInject();
    var obs = new MutationObserver(function () { tryInject(); });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 30000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.NPSidebarCanonical = { HUBS: HUBS, REDUNDANT: REDUNDANT, version: "9.9.0" };
})();
