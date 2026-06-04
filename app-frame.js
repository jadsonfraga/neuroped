/* ============================================================
   NeuroPed SDG — app-frame.js · Frame Premium Universal
   ============================================================
   Injeta automaticamente em qualquer HTML auxiliar:
     - Header brand "Dr. Jadson Fraga · NeuroPed" (top)
     - Bottom nav fixa com ícones (links principais)
     - Pill flutuante "jadsonfraga.github.io" no rodapé
     - Body recebe class `np-boot-fade` para entrada cinematográfica
   Idempotente. Respeita prefers-reduced-motion.
   Não roda em: index.html (que tem seu próprio shell SPA), nem em
   páginas que opt-out com <body data-np-frame="off">.
   ============================================================ */
(function(){
  'use strict';
  if (window.__npFrame) return;
  window.__npFrame = true;

  // Está dentro da casca (app-shell)? Então o chrome é da casca.
  var EMBEDDED = (function(){ try { return window.self !== window.top; } catch (e) { return true; } })();
  // Auxiliares NÃO abrem soltas: páginas abaixo permanecem autônomas; o resto,
  // aberto no topo, é reaberto embutido em ./app-shell.html#v=<arquivo>.
  var NP_STANDALONE = {
    'index.html':1, 'app-shell.html':1, '':1, '/':1, '404.html':1, 'ds-pilot.html':1,
    'restricted.html':1, 'verificar.html':1, 'verificar-documento.html':1, 'verificar-app.html':1,
    'assinatura-digital.html':1, 'qa-smoke-test.html':1, 'teste-e2e-manual.html':1,
    'teste-ouro-pin.html':1, 'privacy-policy.html':1
  };
  function maybeEmbedRedirect(){
    if (EMBEDDED) return false;
    var b = document.body;
    if (b && (b.dataset.npFrame === 'off' || b.dataset.npStandalone === '1')) return false;
    var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (NP_STANDALONE[f]) return false;
    var to = './app-shell.html#v=' + encodeURIComponent(f + location.search + location.hash);
    try { location.replace(to); } catch (e) { location.href = to; }
    return true;
  }

  function shouldSkip(){
    var b = document.body;
    if (!b) return true;
    if (b.dataset.npFrame === 'off') return true;
    var p = (location.pathname.split('/').pop() || '').toLowerCase();
    // index.html tem shell SPA próprio — não injetar
    return p === 'index.html' || p === '' || p === '/' || p === 'app-shell.html';
  }

  function pageAlreadyHasFixedHeader(){
    // Não injeta header se a página já tem um <header> próprio sticky/fixed
    // no topo do DOM (evita 2 headers empilhados).
    var existing = document.querySelector('header, [role="banner"], .top, .app-shell');
    if (!existing) return false;
    var pos = getComputedStyle(existing).position;
    if (pos === 'sticky' || pos === 'fixed') return true;
    // Heurística: <header> declarado no topo do <body> antes de qualquer
    // <main>/<section> tipicamente serve como header do app.
    var firstChild = document.body.firstElementChild;
    if (existing === firstChild && existing.matches('header')) return true;
    return false;
  }

  /* ---------- Header brand (top) ---------- */
  function ensureHeader(){
    if (document.getElementById('npFrameHeader')) return;
    if (pageAlreadyHasFixedHeader()) return; // skip: evita header duplicado
    var h = document.createElement('header');
    h.id = 'npFrameHeader';
    h.setAttribute('role', 'banner');
    h.style.cssText = 'position:sticky;top:0;z-index:9990;background:linear-gradient(180deg,rgba(3,7,18,.92),rgba(3,7,18,.78));backdrop-filter:blur(16px) saturate(140%);-webkit-backdrop-filter:blur(16px) saturate(140%);border-bottom:1px solid var(--border);padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));display:flex;align-items:center;gap:10px';
    h.innerHTML =
      '<a href="./index.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit">' +
        '<span style="width:34px;height:34px;border-radius:10px;background:var(--primary-gradient);display:grid;place-items:center;font-size:18px;box-shadow:var(--shadow-glow-violet)">🧠</span>' +
        '<span style="display:flex;flex-direction:column;line-height:1.1">' +
          '<strong style="font-size:13px;color:var(--text-strong);font-weight:600;letter-spacing:-.01em">Dr. Jadson Fraga</strong>' +
          '<small style="font-size:10px;color:var(--text-muted);letter-spacing:.06em;text-transform:uppercase;font-weight:600">NeuroPed</small>' +
        '</span>' +
      '</a>' +
      '<span style="flex:1"></span>' +
      '<a href="./central-atalhos.html" aria-label="Central" style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid var(--border);display:grid;place-items:center;color:var(--text);text-decoration:none">≡</a>';
    document.body.insertBefore(h, document.body.firstChild);
  }

  /* ---------- Bottom nav (mobile + tablet) ---------- */
  var NAV = [
    { ic: '🏠', lbl: 'Início',   href: './index.html' },
    { ic: '🩺', lbl: 'Consulta', href: './consulta.html' },
    { ic: '📋', lbl: 'Escalas',  href: './filtro-escalas.html' },
    { ic: '💬', lbl: 'CAA',      href: './comunicacao-alternativa.html' },
    { ic: '🌿', lbl: 'Família',  href: './portal-familia-livre.html' }
  ];
  function ensureBottomNav(){
    if (document.getElementById('npFrameNav')) return;
    // Dedup: este é o nav canônico. Remove o nav legado do app-polish-mobile.js
    // (.np-bottom-nav) se ele já foi injetado, evitando duas barras no mobile.
    var legacy = document.querySelector('.np-bottom-nav');
    if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var nav = document.createElement('nav');
    nav.id = 'npFrameNav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navegação principal NeuroPed');
    nav.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9990;background:rgba(3,7,18,.85);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);border-top:1px solid var(--border);padding:6px calc(env(safe-area-inset-right) + 6px) calc(env(safe-area-inset-bottom) + 6px) calc(env(safe-area-inset-left) + 6px);display:grid;grid-template-columns:repeat(5,1fr);gap:2px';
    NAV.forEach(function(it){
      var n = it.href.split('/').pop().toLowerCase();
      var a = document.createElement('a');
      a.href = it.href;
      a.setAttribute('aria-label', it.lbl);
      if (n === here) a.setAttribute('aria-current', 'page');
      a.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 4px;border-radius:12px;color:' + (n === here ? 'var(--primary-light)' : 'var(--text-muted)') + ';background:' + (n === here ? 'var(--primary-tint)' : 'transparent') + ';text-decoration:none;font:600 10px var(--font-sans);min-height:48px;-webkit-tap-highlight-color:transparent;touch-action:manipulation';
      a.innerHTML = '<span aria-hidden="true" style="font-size:18px;line-height:1">' + it.ic + '</span><span>' + it.lbl + '</span>';
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    // body padding-bottom para não sobrepor conteúdo
    if (!document.getElementById('npFrameBodyPad')) {
      var s = document.createElement('style');
      s.id = 'npFrameBodyPad';
      s.textContent = 'body{padding-bottom:calc(env(safe-area-inset-bottom) + 78px) !important}';
      document.head.appendChild(s);
    }
  }

  /* ---------- Pill flutuante de domínio (canto inferior) ---------- */
  function ensureDomainPill(){
    if (document.getElementById('npFrameDomain')) return;
    if (location.hostname === 'localhost' || location.hostname.startsWith('127.')) return;
    var d = document.createElement('div');
    d.id = 'npFrameDomain';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 88px);z-index:9985;background:rgba(15,18,35,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--border);border-radius:9999px;padding:6px 14px;font:600 12px var(--font-sans);color:var(--text-muted);pointer-events:none;opacity:.7';
    d.textContent = location.hostname || 'jadsonfraga.github.io';
    document.body.appendChild(d);
    setTimeout(function(){ if (d.parentNode) d.remove(); }, 6000); // some após 6s pra não atrapalhar
  }

  /* ---------- Polimento premium (mesmo baseline do app-polish-mobile.js) ----------
     Espelha o <style id="np-premium-polish"> para cobrir as páginas que carregam
     este frame mas NÃO o app-polish-mobile.js (ex.: testes-diretos.html). O guard
     por id garante injeção única — no-op onde o app-polish já injetou. Apenas CSS:
     foco visível (WCAG 2.4.7) + microinterações em cards, como baseline :where()
     (especificidade 0), que cede a qualquer estilo próprio da página. */
  function ensurePremiumPolish(){
    if (document.getElementById('np-premium-polish')) return;
    var s = document.createElement('style'); s.id = 'np-premium-polish';
    s.textContent =
      ':where(a,button,input,select,textarea,summary,[role="button"],[tabindex]):focus-visible{' +
        'outline:2px solid #a9a4ff;outline-offset:2px;box-shadow:0 0 0 4px rgba(124,58,237,.28)}' +
      '@media(prefers-reduced-motion:no-preference){' +
        ':where(.topbar .back,.topbar .tb-pill){transition:transform .16s cubic-bezier(.34,1.56,.64,1),background .2s,box-shadow .2s}' +
        ':where(.result-card,.scale-card){transition:transform .22s cubic-bezier(.22,.9,.25,1),box-shadow .25s,border-color .25s}' +
        ':where(.result-card,.scale-card):hover{transform:translateY(-3px);box-shadow:0 20px 44px -22px rgba(2,2,12,.85)}' +
        ':where(.result-card,.scale-card):active{transform:translateY(-1px) scale(.995)}' +
        ':where(button,.btn):active{transform:scale(.985)}' +
      '}';
    document.head.appendChild(s);
  }

  /* ---------- Boot ---------- */
  function boot(){
    if (maybeEmbedRedirect()) return;                 // auxiliar solta → reabre na casca
    if (EMBEDDED) {                                   // chrome é da casca
      try {
        document.documentElement.classList.add('np-embedded');
        if (!document.getElementById('np-embedded-css')) {
          var l = document.createElement('link'); l.id = 'np-embedded-css'; l.rel = 'stylesheet'; l.href = './np-embedded.css';
          (document.head || document.documentElement).appendChild(l);
        }
      } catch (e) {}
      ensurePremiumPolish(); return;
    }
    if (shouldSkip()) { ensurePremiumPolish(); return; }
    document.body.classList.add('np-boot-fade');
    ensureHeader();
    ensureBottomNav();
    ensureDomainPill();
    ensurePremiumPolish();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
