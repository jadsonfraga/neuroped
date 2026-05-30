/* NeuroPed EDJ - app-polish-mobile.js
 * Aspira "cara de app": bottom nav fixo no mobile, toast/sheet uniformes
 * (em vez de alert/confirm), splash boot, micro-interacoes.
 *
 * Idempotente. Carrega via <script src="./app-polish-mobile.js" defer>.
 * Nao toca os modulos existentes (master-access, scales-enhance, etc).
 */
(function(){
  'use strict';
  if (window.__npPolishMobile) return;
  window.__npPolishMobile = true;

  /* =====================================================
     1) Toast manager (substitui alert)
     ===================================================== */
  function toastStack(){
    var el = document.getElementById('npToastStack');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'npToastStack';
    el.className = 'np-toast-stack';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'false');
    document.body.appendChild(el);
    return el;
  }
  function toast(msg, kind){
    if (!msg) return;
    var stack = toastStack();
    var t = document.createElement('div');
    t.className = 'np-toast' + (kind ? ' ' + kind : '');
    t.textContent = String(msg);
    stack.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    var ttl = Math.max(2200, Math.min(6000, String(msg).length * 60));
    setTimeout(function(){
      t.classList.remove('show');
      setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, ttl);
  }
  window.npToast = toast;

  /* =====================================================
     2) Bottom sheet (substitui confirm)
     ===================================================== */
  function sheet(opts){
    return new Promise(function(resolve){
      var bg = document.createElement('div');
      bg.className = 'np-sheet-backdrop';
      var box = document.createElement('div');
      box.className = 'np-sheet';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      if (opts.titleId) box.setAttribute('aria-labelledby', opts.titleId);
      var h = document.createElement('h3'); h.textContent = opts.title || 'Confirmar';
      var p = document.createElement('p'); p.textContent = opts.body || '';
      var row = document.createElement('div'); row.className = 'row';
      var cancel = document.createElement('button'); cancel.className = 'cancel'; cancel.textContent = opts.cancelLabel || 'Cancelar';
      var ok = document.createElement('button'); ok.className = opts.danger ? 'danger' : 'ok'; ok.textContent = opts.okLabel || 'OK';
      row.appendChild(cancel); row.appendChild(ok);
      box.appendChild(h); if (opts.body) box.appendChild(p); box.appendChild(row);
      bg.appendChild(box);
      document.body.appendChild(bg);
      requestAnimationFrame(function(){ bg.classList.add('show'); ok.focus(); });
      function close(value){
        bg.classList.remove('show');
        setTimeout(function(){ if (bg.parentNode) bg.parentNode.removeChild(bg); }, 220);
        resolve(value);
      }
      cancel.addEventListener('click', function(){ close(false); });
      ok.addEventListener('click', function(){ close(true); });
      bg.addEventListener('click', function(ev){ if (ev.target === bg) close(false); });
      document.addEventListener('keydown', function esc(ev){
        if (ev.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); }
      });
    });
  }
  window.npConfirm = sheet;

  /* =====================================================
     3) Bottom nav (so no mobile)
     ===================================================== */
  var NAV_ITEMS = [
    { label: 'Início',   href: './index.html',                  svg: '<path d="m3 11 9-8 9 8"/><path d="M5 9v11h14V9"/>' },
    { label: 'Consulta', href: './consulta.html',               svg: '<path d="M6 3v6a6 6 0 0 0 12 0V3"/><path d="M6 3H4M18 3h2"/><circle cx="18" cy="16" r="3"/><path d="M18 11v2"/>' },
    { label: 'Escalas',  href: './filtro-escalas.html',         svg: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>' },
    { label: 'CAA',      href: './comunicacao-alternativa.html', svg: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.3A8.4 8.4 0 1 1 21 11.5Z"/>' },
    { label: 'Família',  href: './portal-familia-livre.html',   svg: '<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 7-9s7 4 7 9a7 7 0 0 1-7 7Z"/><path d="M11 20v-7"/>' }
  ];
  function navStyle(){
    if (document.getElementById('np-nav-ico-style')) return;
    var s = document.createElement('style'); s.id = 'np-nav-ico-style';
    s.textContent = '.np-bottom-nav .ic{display:inline-flex;align-items:center;justify-content:center}'
      + '.np-bottom-nav .ic svg{width:23px;height:23px;display:block}';
    document.head.appendChild(s);
  }
  function bottomNav(){
    if (document.querySelector('.np-bottom-nav')) return;
    navStyle();
    var nav = document.createElement('nav');
    nav.className = 'np-bottom-nav';
    nav.setAttribute('aria-label', 'Navegação principal');
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    NAV_ITEMS.forEach(function(it){
      var hrefName = it.href.split('/').pop().toLowerCase();
      var a = document.createElement('a');
      a.href = it.href;
      a.setAttribute('aria-label', it.label);
      if (hrefName === here) a.setAttribute('aria-current', 'page');
      var ic = document.createElement('span'); ic.className = 'ic'; ic.setAttribute('aria-hidden', 'true');
      ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + it.svg + '</svg>';
      var lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = it.label;
      a.appendChild(ic); a.appendChild(lbl);
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
  }

  /* =====================================================
     4) Splash boot (so primeira visita por sessao)
     ===================================================== */
  function splash(){
    try {
      if (sessionStorage.getItem('np_splash_shown')) return;
      sessionStorage.setItem('np_splash_shown', '1');
    } catch (e) {}
    var el = document.createElement('div');
    el.className = 'np-splash';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="logo" style="font:700 32px/1 Georgia,serif;letter-spacing:.04em;color:#f2dca6;' +
        'width:84px;height:84px;border:2px solid rgba(184,150,62,.85);border-radius:20px;' +
        'display:grid;place-items:center;box-shadow:0 0 0 1px rgba(184,150,62,.25),0 14px 40px -12px rgba(0,0,0,.5)">NP</div>' +
      '<div class="name">NeuroPed EDJ</div>' +
      '<div class="tag">Dr. Jadson Fraga · Neuropediatria</div>' +
      '<div class="spinner"></div>';
    document.body.appendChild(el);
    setTimeout(function(){
      el.classList.add('hide');
      setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, 650);
  }

  /* =====================================================
     5) Theme color dinamica (status bar do iOS/Android)
     ===================================================== */
  function themeColor(){
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#0e0e22';
      document.head.appendChild(meta);
    }
  }

  /* =====================================================
     6) Bridge alert/confirm -> toast/sheet (opcional, opt-in)
     Por padrao NAO sobrescreve para nao quebrar contratos
     existentes. Codigo novo pode usar npToast / npConfirm.
     ===================================================== */

  /* =====================================================
     Boot
     ===================================================== */
  var EMBEDDED = (function(){ try { return window.self !== window.top; } catch(e){ return true; } })();

  /* Barra de progresso de navegação — dá sensação de app (não de site
     estático) ao clicar em qualquer link interno. Funciona junto com a
     View Transitions API do CSS. */
  function navProgress(){
    var bar = document.createElement('div');
    bar.className = 'np-navbar';
    document.body.appendChild(bar);
    var timer = null;
    function start(){
      clearTimeout(timer);
      bar.style.opacity = '1';
      bar.style.width = '0';
      // força reflow para reiniciar a animação
      void bar.offsetWidth;
      bar.style.width = '82%';
      timer = setTimeout(function(){ bar.style.width = '92%'; }, 450);
    }
    function done(){
      clearTimeout(timer);
      bar.style.width = '100%';
      setTimeout(function(){ bar.style.opacity = '0'; bar.style.width = '0'; }, 250);
    }
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.origin && a.origin !== location.origin) return;     // externo
      if (a.pathname === location.pathname && a.hash) return;    // âncora interna
      start();
    }, true);
    window.addEventListener('pageshow', done);          // volta do bfcache
    window.addEventListener('pagehide', function(){ bar.style.opacity = '0'; });
    window.addEventListener('beforeunload', function(){ clearTimeout(timer); });
  }

  /* Selo de qualidade discreto no rodape (robustez/manutencao ativa).
     Injetado uma vez por pagina; le a versao do manifest se disponivel. */
  function qualitySeal(){
    if (EMBEDDED || document.getElementById('npQualitySeal')) return;
    var seal = document.createElement('div');
    seal.id = 'npQualitySeal';
    seal.style.cssText = 'text-align:center;font-size:11px;color:rgba(182,178,230,.6);padding:18px 12px calc(18px + var(--np-safe-bottom));letter-spacing:.02em';
    seal.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a9a4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.8"><path d="M12 2 4 5v6c0 5 3.5 7.8 8 9 4.5-1.2 8-4 8-9V5z"/><path d="m9 12 2 2 4-4"/></svg>'
      + 'NeuroPed · plataforma verificada · v' + (window.__NP_VERSION || '6.4.0') + '</span>';
    document.body.appendChild(seal);
  }

  function boot(){
    themeColor();
    if (!EMBEDDED) { splash(); bottomNav(); navProgress(); qualitySeal(); }   // dentro da casca (app-shell), o chrome é da casca
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ============================================================
   Mascotes ambiente POR CONTEXTO — inteligência visual de rota.
   Lúdico onde fala com a criança (CAA, família, área do filho, home);
   AUSENTE em todas as áreas profissionais e editoriais (Consulta,
   Secretaria, Laudos, NeuroPed Master, etc.). Sombra neutra, discreto,
   respeita prefers-reduced-motion. window.NeuroPedVisual expõe o contexto.
   ============================================================ */
(function () {
  "use strict";
  if (window.__npMascots) return; window.__npMascots = true;
  var reduce = false;
  try { reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  /* rotas profissionais/editoriais da SPA (hash) onde a ludicidade não entra */
  var PRO_HASH = /prontuario|laudo|prescric|secretaria|pacientes|portal-documentos|portal-chat|portal-acompanhamento|relatorio|consulta/;

  /* configuração lúdica por página (estática). Ausência = sem mascotes. */
  var PLAYFUL = {
    'comunicacao-alternativa.html': { count: 4, op: 0.30, min: 24, max: 40, set: ['🦊','🧸','🐻','🐥','🦄','🌈'] },
    'area-filho.html':              { count: 3, op: 0.24, min: 22, max: 36, set: ['🧸','🐻','🐥','⭐','🌈'] },
    'portal-familia-livre.html':    { count: 2, op: 0.18, min: 22, max: 32, set: ['🌿','✨','🌈'] },
    'index.html':                   { count: 2, op: 0.14, min: 20, max: 30, set: ['✨','⭐'], homeOnly: true },
    '':                             { count: 2, op: 0.14, min: 20, max: 30, set: ['✨','⭐'], homeOnly: true }
  };

  function visualContext(){
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var cfg = PLAYFUL[page];
    if (!cfg) return null;
    if (cfg.homeOnly && PRO_HASH.test((location.hash || '').toLowerCase())) return null;
    return cfg;
  }
  window.NeuroPedVisual = { context: visualContext, isPlayful: function(){ return !!visualContext(); } };

  var css = ''
    + '.np-mascot-layer{position:fixed;inset:0;z-index:9990;pointer-events:none;overflow:hidden}'
    + '.np-mascot{position:absolute;will-change:transform;filter:drop-shadow(0 4px 10px rgba(45,41,38,.12));'
    +   'animation:npMascFloat var(--d,10s) ease-in-out var(--dl,0s) infinite}'
    + '@keyframes npMascFloat{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}'
    +   '50%{transform:translateY(-16px) rotate(calc(var(--r,0deg) * -1))}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  var SPOTS = [[6,16],[91,12],[5,62],[93,58],[14,82],[80,80],[48,8],[24,40]];

  function clear(){
    var l = document.querySelector('.np-mascot-layer');
    if (l && l.parentNode) l.parentNode.removeChild(l);
  }
  function render(){
    clear();
    if (reduce) return;
    var cfg = visualContext(); if (!cfg) return;
    var layer = document.createElement('div'); layer.className = 'np-mascot-layer'; layer.setAttribute('aria-hidden','true');
    for (var i = 0; i < cfg.count; i++){
      var g = cfg.set[i % cfg.set.length];
      var m = document.createElement('div'); m.className = 'np-mascot'; m.textContent = g;
      m.style.left = SPOTS[i % SPOTS.length][0] + '%';
      m.style.top  = SPOTS[i % SPOTS.length][1] + '%';
      m.style.fontSize = (cfg.min + Math.random() * (cfg.max - cfg.min)) + 'px';
      m.style.opacity = cfg.op;
      m.style.setProperty('--d', (9 + Math.random() * 5) + 's');
      m.style.setProperty('--dl', (Math.random() * 4) + 's');
      m.style.setProperty('--r', ((Math.random() * 12) - 6) + 'deg');
      layer.appendChild(m);
    }
    (document.body || document.documentElement).appendChild(layer);
  }
  /* re-avalia ao navegar na SPA (mantém telas clínicas limpas) */
  window.addEventListener('hashchange', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();

/* ============================================================
   Navegação fluida — faz o ecossistema parecer UM app único.
   Crossfade entre páginas estáticas (fade-out → navega → fade-in),
   chrome persistente (bottom nav). Respeita prefers-reduced-motion,
   bfcache e não intercepta links externos, hash, _blank ou download.
   ============================================================ */
(function () {
  "use strict";
  if (window.__npFluid) return; window.__npFluid = true;
  var reduce = false;
  try { reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  var st = document.createElement('style');
  st.textContent =
      'html.np-fluid body{animation:npFadeIn .30s cubic-bezier(.22,.8,.2,1) both}'
    + 'html.np-fluid.np-leaving body{opacity:0;transform:translateY(-6px);transition:opacity .2s ease,transform .2s ease}'
    + '@keyframes npFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'
    + '@media(prefers-reduced-motion:reduce){html.np-fluid body,html.np-fluid.np-leaving body{animation:none!important;transition:none!important;transform:none!important}}';
  (document.head || document.documentElement).appendChild(st);
  if (!reduce) document.documentElement.classList.add('np-fluid');

  function internal(a){
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#') return false;
    if (/^(javascript:|mailto:|tel:|data:)/i.test(raw)) return false;
    if (a.origin && a.origin !== location.origin) return false;            // externo
    if (a.pathname === location.pathname && a.hash) return false;          // âncora interna
    return /\.html(\?|#|$)/.test(raw) || raw === './' || raw === '/' || raw === './index.html';
  }

  document.addEventListener('click', function (e) {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!internal(a)) return;
    e.preventDefault();
    var href = a.href;
    document.documentElement.classList.add('np-leaving');
    setTimeout(function () { location.href = href; }, 195);
    setTimeout(function () { document.documentElement.classList.remove('np-leaving'); }, 1200); // segurança se a navegação falhar
  }, true);

  // bfcache: ao voltar, garante a página visível
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) document.documentElement.classList.remove('np-leaving'); });
  window.addEventListener('pagehide', function () { document.documentElement.classList.remove('np-leaving'); });
})();
