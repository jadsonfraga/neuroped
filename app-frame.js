/* ============================================================
   NeuroPed EDJ — app-frame.js · Frame Premium Universal
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

  function shouldSkip(){
    var b = document.body;
    if (!b) return true;
    if (b.dataset.npFrame === 'off') return true;
    var p = (location.pathname.split('/').pop() || '').toLowerCase();
    // index.html tem shell SPA próprio — não injetar
    return p === 'index.html' || p === '' || p === '/' || p === 'app-shell.html';
  }

  /* ---------- Header brand (top) ---------- */
  function ensureHeader(){
    if (document.getElementById('npFrameHeader')) return;
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

  /* ---------- Boot ---------- */
  function boot(){
    if (shouldSkip()) return;
    document.body.classList.add('np-boot-fade');
    ensureHeader();
    ensureBottomNav();
    ensureDomainPill();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
