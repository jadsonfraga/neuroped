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

  // Camada de feedback sensorial (som/háptico/pulso) — injeta np-sound.js uma vez
  // em toda página que carrega o polish. Opt-in (nasce desligado, com toggle).
  try {
    if (!document.querySelector('script[data-np-sound-src]')) {
      var npS = document.createElement('script');
      npS.src = './np-sound.js'; npS.defer = true; npS.setAttribute('data-np-sound-src', '1');
      (document.head || document.documentElement).appendChild(npS);
    }
  } catch (e) {}

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
    { label: 'CAA',      href: './comunicacao-alternativa.html', svg: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.3A8.4 8.4 0 1 1 21 11.5Z"/>' }
  ];
  function navStyle(){
    if (document.getElementById('np-nav-ico-style')) return;
    var s = document.createElement('style'); s.id = 'np-nav-ico-style';
    s.textContent = '.np-bottom-nav .ic{display:inline-flex;align-items:center;justify-content:center}'
      + '.np-bottom-nav .ic svg{width:23px;height:23px;display:block}';
    document.head.appendChild(s);
  }
  function bottomNav(){
    // opt-out por página (ex.: landing de vendas, foco em 1 ação)
    if (document.body && document.body.hasAttribute('data-no-bottom-nav')) return;
    if (document.querySelector('.np-bottom-nav')) return;
    if (document.getElementById('npFrameNav')) return;   // app-frame.js já provê o nav canônico — não duplicar
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
      '<div class="logo" style="width:104px;height:104px;border-radius:24px;overflow:hidden;' +
        'box-shadow:0 0 0 1px rgba(184,150,62,.45),0 20px 54px -14px rgba(0,0,0,.65)">' +
        '<img src="./logo-jadson.jpg" alt="Dr. Jadson Fraga" width="104" height="104" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block"></div>' +
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
     6) Viewport anti-zoom (corrige "zoom foge a cada toque" no iOS)
     Garante maximum-scale=1 em TODAS as telas, sem editar 28 HTMLs.
     ===================================================== */
  function fixViewport(){
    try {
      var vp = document.querySelector('meta[name="viewport"]');
      if (!vp) {
        vp = document.createElement('meta');
        vp.name = 'viewport';
        document.head.appendChild(vp);
      }
      var c = vp.getAttribute('content') || 'width=device-width, initial-scale=1';
      // a11y (WCAG 1.4.4): permite pinch-zoom. maximum-scale=1 bloqueava ampliar
      // (e na iOS 10+ é ignorado, só prejudicava Android). 5x mantém teto sano.
      if (/maximum-scale\s*=\s*1\b/.test(c)) {
        vp.setAttribute('content', c.replace(/maximum-scale\s*=\s*1\b/, 'maximum-scale=5'));
      } else if (!/maximum-scale/.test(c)) {
        vp.setAttribute('content', c.replace(/\s*$/, '') + (/,\s*$/.test(c) ? '' : ',') + 'maximum-scale=5');
      }
    } catch (e) {}
  }

  /* =====================================================
     7) Navegação premium: fade-in de entrada, scroll suave,
        tipografia harmonizada (Fraunces/Inter) — global, sem
        editar cada HTML. Eleva a sensação de app coeso.
     ===================================================== */
  function premiumNav(){
    try {
      if (document.getElementById('np-premium-nav-style')) return;
      // fontes premium (preconnect + stylesheet) se ainda não houver
      if (!document.querySelector('link[href*="fonts.googleapis"]')) {
        var pc1 = document.createElement('link'); pc1.rel = 'preconnect'; pc1.href = 'https://fonts.googleapis.com';
        var pc2 = document.createElement('link'); pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com'; pc2.crossOrigin = '';
        var f = document.createElement('link'); f.rel = 'stylesheet';
        f.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Inter:wght@400..800&display=swap';
        document.head.appendChild(pc1); document.head.appendChild(pc2); document.head.appendChild(f);
      }
      var s = document.createElement('style'); s.id = 'np-premium-nav-style';
      s.textContent =
        'html{scroll-behavior:smooth}' +
        // fade ao entrar na página — SÓ OPACIDADE. transform no body cria containing-block
        // p/ fixed/100vh e distorce a home (SPA) logo após o splash (bug "zoom"). Mesmo
        // motivo que a saída abaixo já evitava transform.
        '@keyframes npPageIn{from{opacity:0}to{opacity:1}}' +
        '@media(prefers-reduced-motion:no-preference){body{animation:npPageIn .42s ease both}}' +
        // saída suave ao navegar (fluxo guiado app-wide): só opacidade — nunca quebra
        // sticky/fixed (transform criaria containing block). Fade rápido pra não pesar.
        '@media(prefers-reduced-motion:no-preference){body.np-leaving{opacity:0;transition:opacity .19s ease}}' +
        // micro-feedback universal ao tocar links/cards/botões
        'a,button,.card,.chip,.scale-card,.btn,.pill,.tb-pill{ -webkit-tap-highlight-color:rgba(124,118,210,.18) }' +
        'a:active,button:active,.card:active,.scale-card:active{ transition:transform .08s }' +
        // foco visível premium e consistente (acessibilidade)
        'a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,.card:focus-visible{outline:2px solid #7c79ff;outline-offset:2px;border-radius:10px}' +
        // micro-tema premium universal (consistência sem tocar layout): seleção e
        // barra de rolagem temáticas em todas as telas. Scrollbar só no desktop
        // (no mobile a nativa é melhor). Não-invasivo: só decorativo.
        '::selection{background:rgba(124,118,210,.34);color:#fff}' +
        '@media(min-width:761px){html{scrollbar-width:thin;scrollbar-color:rgba(124,118,210,.45) transparent}' +
        '::-webkit-scrollbar{width:11px;height:11px}' +
        '::-webkit-scrollbar-thumb{background:rgba(124,118,210,.4);border-radius:9px;border:3px solid transparent;background-clip:content-box}' +
        '::-webkit-scrollbar-thumb:hover{background:rgba(124,118,210,.62);background-clip:content-box}' +
        '::-webkit-scrollbar-track{background:transparent}}' +
        // tipografia harmonizada: títulos editoriais usam Fraunces quando a página não definiu fonte própria
        'h1,h2,h3{font-feature-settings:"ss01","liga"}';
      document.head.appendChild(s);
    } catch (e) {}
  }

  /* =====================================================
     8) Bridge alert/confirm -> toast/sheet (opcional, opt-in)
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
      + 'NeuroPed · plataforma verificada · v' + (window.__NP_VERSION || '6.45.8') + '</span>'
      + '<div style="margin:6px auto 0;max-width:540px;font-size:10.5px;line-height:1.55;color:rgba(182,178,230,.55)">'
      + '<a href="./sobre-natureza.html" style="color:inherit;text-decoration:underline;text-underline-offset:2px">Ferramenta <strong>educacional de apoio</strong></a> — não é diagnóstico e não substitui avaliação profissional. '
      + 'Os dados ficam só neste aparelho.</div>';
    document.body.appendChild(seal);
  }

  /* Widget de indicacao (crescimento pai-para-pai). So em paginas de familia.
     Convida a compartilhar a plataforma — leva alcance a quem precisa, eticamente,
     sem coletar nenhum dado. */
  var REFERRAL_PAGES = ['comunicacao-alternativa.html','diario-escola-terapias-v2.html'];
  function referralWidget(){
    if (document.getElementById('npReferral')) return;
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (REFERRAL_PAGES.indexOf(here) < 0) return;
    var SHARE_URL = location.origin + (location.pathname.replace(/[^/]+$/, '')) + 'sobre-dr-jadson.html';
    var TXT = 'Conheça o NeuroPed, do Dr. Jadson Fraga — apoio à neuropediatria para famílias, escolas e terapeutas:';
    var box = document.createElement('div');
    box.id = 'npReferral';
    box.style.cssText = 'max-width:1020px;margin:22px auto 0;padding:16px 18px;border:1px solid rgba(169,164,255,.26);'
      + 'border-radius:18px;background:linear-gradient(180deg,rgba(124,118,210,.12),rgba(124,118,210,.05));display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between';
    box.innerHTML = '<div style="flex:1;min-width:220px">'
      + '<strong style="display:block;color:#ECEAFF;font:700 15px var(--np-font-display,Georgia,serif)">Conhece outra família que precisa disso?</strong>'
      + '<span style="color:#b6b2e6;font-size:13px">Compartilhar leva informação séria e acolhimento a quem precisa.</span></div>'
      + '<button id="npRefBtn" type="button" style="border:0;border-radius:13px;cursor:pointer;font-weight:800;font-size:14px;'
      + 'padding:12px 18px;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;display:inline-flex;gap:8px;align-items:center">'
      + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/></svg>Indicar</button>';
    var main = document.querySelector('main') || document.body;
    main.appendChild(box);
    document.getElementById('npRefBtn').addEventListener('click', function(){
      if (navigator.share) { navigator.share({ title:'NeuroPed · Dr. Jadson Fraga', text:TXT, url:SHARE_URL }).catch(function(){}); }
      else window.open('https://wa.me/?text=' + encodeURIComponent(TXT + ' ' + SHARE_URL), '_blank', 'noopener');
    });
  }

  /* =====================================================
     9) Aviso LGPD (1ª visita): app é 100% local, sem cookies
        de rastreamento. Honesto e mínimo. Some ao confirmar.
     ===================================================== */
  function lgpdBanner(){
    try { if (localStorage.getItem('np_lgpd_ack') === '1') return; } catch(e) { return; }
    if (document.getElementById('np-lgpd-banner')) return;
    if (!document.body) return;
    var b = document.createElement('div');
    b.id = 'np-lgpd-banner';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Aviso de privacidade');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:60;'
      + 'max-width:560px;margin:0 auto;background:rgba(20,19,42,.96);backdrop-filter:blur(12px);'
      + 'border:1px solid rgba(169,164,255,.28);border-radius:16px;padding:13px 15px;'
      + 'box-shadow:0 18px 48px -18px rgba(2,2,12,.8);color:#ECEAFF;font:500 13px/1.5 system-ui,sans-serif;'
      + 'display:flex;gap:12px;align-items:center;flex-wrap:wrap';
    var txt = document.createElement('div');
    txt.style.cssText = 'flex:1;min-width:200px';
    txt.innerHTML = '<strong style="color:#f2dca6">Natureza & privacidade</strong> — ferramenta '
      + '<strong>educacional de apoio</strong> (não substitui avaliação profissional). Os dados ficam '
      + '<strong>apenas no seu dispositivo</strong>; nenhum rastreamento é enviado a servidores. '
      + '<a href="./privacidade.html" style="color:#a9a4ff">Saber mais</a>.';
    var ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'Entendi';
    ok.style.cssText = 'border:0;border-radius:11px;background:linear-gradient(135deg,#6d6af5,#5b54e8);'
      + 'color:#fff;font-weight:800;font-size:13px;padding:10px 18px;cursor:pointer;min-height:40px';
    ok.addEventListener('click', function(){
      try { localStorage.setItem('np_lgpd_ack', '1'); } catch(e){}
      b.style.opacity = '0'; b.style.transform = 'translateY(8px)'; b.style.transition = 'opacity .25s, transform .25s';
      setTimeout(function(){ if (b.parentNode) b.parentNode.removeChild(b); }, 280);
    });
    b.appendChild(txt); b.appendChild(ok);
    document.body.appendChild(b);
  }

  /* =====================================================
     Fluxo guiado app-wide: transição de SAÍDA ao navegar.
     Cada clique de link/aba interna faz um fade suave e só então
     troca de tela — junto com o fade de ENTRADA (npPageIn), a
     navegação inteira vira um auto-avanço contínuo, sem corte seco.
     Opacidade apenas (não mexe em layout). Respeita reduced-motion,
     cliques modificados (ctrl/cmd/meio = nova aba), âncoras e externos.
     ===================================================== */
  function pageExit(){
    if (window.__npPageExit) return; window.__npPageExit = true;
    var reduce = false; try { reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
    if (reduce) return;                                   // sem animação → navegação normal
    var navigating = false;
    document.addEventListener('click', function(e){       // bubble: handlers da página têm prioridade
      if (e.defaultPrevented) return;                     // SPA/handler próprio já tratou
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // nova aba/etc.
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (a.target && a.target !== '_self') return;        // _blank etc.
      if (a.hasAttribute('download')) return;
      if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.origin && a.origin !== location.origin) return;        // externo
      if (a.href === location.href) return;                        // mesma URL → no-op
      if (a.pathname === location.pathname && a.hash) return;      // âncora interna → scroll suave nativo
      // navegação interna entre telas: fade-out e então troca
      e.preventDefault();
      if (navigating) return; navigating = true;
      var dest = a.href, done = false;
      var go = function(){ if (done) return; done = true; window.location.href = dest; };
      document.body.classList.add('np-leaving');
      document.body.addEventListener('transitionend', go, { once: true });
      setTimeout(go, 340);                                 // fallback se transitionend não vier
    }, false);
    // volta do bfcache: reexibe a página (senão voltaria “apagada”)
    window.addEventListener('pageshow', function(){ document.body.classList.remove('np-leaving'); });
  }

  /* =====================================================
     GUIA DE JORNADA — fluxo clínico contínuo e contextual.
     Em vez de telas soltas, o app mostra SEMPRE: onde você está,
     o que já concluiu e o PRÓXIMO PASSO (computado do contexto real
     via NPStore: criança ativa + avaliações). Cada etapa conduz à
     próxima — copiloto, não catálogo.
     Jornada: Paciente → Escala → Responder → Laudo → Síntese
     ===================================================== */
  function journeyGuide(){
    var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
    var PAGES = ['perfil-crianca.html','filtro-escalas.html','escala.html'];
    // telas-ramo (fora da linha escala): mostram contexto + próximo passo, sem o
    // stepper de 5 etapas. Eliminam becos sem saída — toda tela aponta a continuidade.
    var BRANCH = {
      'impacto-medicacao.html': function (c) { return c
        ? { label: 'Acompanhar resposta no Perfil', href: './perfil-crianca.html#synthSec' }
        : { label: 'Selecionar a criança no Perfil', href: './perfil-crianca.html' }; },
      'diario-escola-terapias-v2.html': function (c) { return c
        ? { label: 'Ver a síntese do caso', href: './perfil-crianca.html#synthSec' }
        : { label: 'Cadastrar a criança no Perfil', href: './perfil-crianca.html' }; },
      'consulta.html': function (c) { return c
        ? { label: 'Abrir o filtro de escalas', href: './filtro-escalas.html' }
        : { label: 'Selecionar a criança no Perfil', href: './perfil-crianca.html' }; }
    };
    var isMain = PAGES.indexOf(PAGE) >= 0, branchFn = BRANCH[PAGE];
    if (!isMain && !branchFn) return;
    var S = window.NPStore;
    if (!S) { setTimeout(journeyGuide, 150); return; }          // espera a espinha de dados

    var STEPS = ['Paciente','Escala','Responder','Laudo','Síntese'];

    function model(){
      var c = S.active();
      var results = (c && S.resultsFor) ? S.resultsFor(c) : [];
      var cur, next;
      if (branchFn) { return { child: c, results: results, branch: true, next: branchFn(c, results) }; }
      if (!c) {
        cur = 0;
        next = (PAGE === 'perfil-crianca.html')
          ? { hint: 'Cadastre a criança no formulário abaixo — ela conecta todo o fluxo.' }
          : { label: 'Cadastrar / escolher a criança', href: './perfil-crianca.html' };
      } else if (PAGE === 'escala.html') {
        cur = 2; next = { hint: 'Responda os itens — ao terminar, gere o laudo (salvo no histórico da criança).' };
      } else if (PAGE === 'filtro-escalas.html') {
        cur = 1; next = { hint: 'Toque idade + queixa → abra a escala mais indicada e responda.' };
      } else { // perfil com criança
        if (!results.length) { cur = 1; next = { label: 'Escolher a 1ª escala', href: './filtro-escalas.html' }; }
        else { cur = 4; next = { label: 'Ver a síntese do caso', href: '#synthSec' }; }
      }
      return { child: c, results: results, cur: cur, next: next };
    }

    function styleOnce(){
      if (document.getElementById('np-journey-style')) return;
      var s = document.createElement('style'); s.id = 'np-journey-style';
      s.textContent =
        '.np-journey{margin:0 0 16px;padding:13px 15px;border:1px solid rgba(169,164,255,.18);border-radius:18px;background:linear-gradient(180deg,rgba(124,118,210,.13),rgba(124,118,210,.05));-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
        '.np-journey .who{font:800 11px system-ui;letter-spacing:.04em;color:#c9c4f0;margin-bottom:9px;display:flex;align-items:center;gap:7px}' +
        '.np-journey .who .av{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font:800 10px Georgia,serif;color:#fff;background:linear-gradient(140deg,#6d6af5,#4f46e5)}' +
        '.np-journey .steps{display:flex;align-items:center;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}' +
        '.np-journey .steps::-webkit-scrollbar{display:none}' +
        '.np-journey .st{display:flex;align-items:center;gap:7px;flex:0 0 auto;color:#928ec6;font:800 12px system-ui;white-space:nowrap}' +
        '.np-journey .st .dot{width:23px;height:23px;border-radius:50%;display:grid;place-items:center;font-size:11px;background:rgba(169,164,255,.12);border:1px solid rgba(169,164,255,.2)}' +
        '.np-journey .st.done .dot{background:linear-gradient(180deg,#7C3AED,#4F46E5);color:#fff;border-color:transparent}' +
        '.np-journey .st.cur{color:#ECEAFF}' +
        '.np-journey .st.cur .dot{background:linear-gradient(180deg,#6d6af5,#4f46e5);color:#fff;border-color:transparent;box-shadow:0 0 0 4px rgba(109,106,245,.18)}' +
        '.np-journey .sep{flex:0 0 16px;height:2px;border-radius:2px;background:rgba(169,164,255,.16);margin:0 3px}' +
        '.np-journey .sep.done{background:linear-gradient(90deg,#7C3AED,rgba(169,164,255,.16))}' +
        '.np-journey .nx{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}' +
        '.np-journey .nx .lb{font:800 10px system-ui;text-transform:uppercase;letter-spacing:.08em;color:#928ec6}' +
        '.np-journey .nx .hint{color:#b6b2e6;font-size:13px;line-height:1.4}' +
        '.np-journey .nx a.cta{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:7px;text-decoration:none;border-radius:12px;padding:10px 15px;font:800 13px system-ui;color:#fff;background:linear-gradient(135deg,#7C3AED,#4F46E5);box-shadow:0 10px 24px -12px rgba(124,58,237,.6);transition:transform .15s,filter .2s,box-shadow .2s}' +
        '.np-journey .nx a.cta:hover{transform:translateY(-2px);filter:brightness(1.06);box-shadow:0 16px 32px -12px rgba(124,58,237,.78)}' +
        '.np-journey .nx a.cta::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-18deg);animation:npSheen 3.8s ease-in-out infinite;pointer-events:none}' +
        '@keyframes npSheen{0%,62%{left:-60%}82%,100%{left:130%}}' +
        '@media(prefers-reduced-motion:reduce){.np-journey .nx a.cta::after{display:none}}';
      document.head.appendChild(s);
    }

    function ini(n){ var p=(n||'').trim().split(/\s+/); return ((p[0]&&p[0][0]||'')+(p[1]&&p[1][0]||'')).toUpperCase()||'+'; }
    function esc(t){ return String(t==null?'':t).replace(/[<>&]/g,''); }

    function render(){
      var m = model();
      var host = document.getElementById('npJourney');
      if (!host) {
        styleOnce();
        host = document.createElement('section');
        host.id = 'npJourney'; host.className = 'np-journey';
        host.setAttribute('aria-label', 'Etapa do atendimento');
        var main = document.querySelector('main') || document.body;
        var topbar = main.querySelector(':scope > header, :scope > .topbar');
        if (topbar && topbar.nextSibling) main.insertBefore(host, topbar.nextSibling);
        else main.insertBefore(host, main.firstChild);
      }
      var who = m.child
        ? '<div class="who"><span class="av">'+ini(m.child.name)+'</span>Atendendo: '+esc(m.child.name)+'</div>'
        : '<div class="who"><span class="av" style="background:linear-gradient(140deg,#7C3AED,#4F46E5);color:#fff">+</span>Nenhuma criança ativa</div>';
      var steps = STEPS.map(function(lbl, i){
        var cls = i < m.cur ? 'done' : (i === m.cur ? 'cur' : '');
        var inner = '<span class="st '+cls+'"><span class="dot">'+(i < m.cur ? '✓' : (i+1))+'</span>'+lbl+'</span>';
        return inner + (i < STEPS.length-1 ? '<span class="sep'+(i < m.cur ? ' done' : '')+'"></span>' : '');
      }).join('');
      var nx = m.next.href
        ? '<span class="lb">Próximo passo</span><a class="cta" href="'+m.next.href+'">'+esc(m.next.label)+' ›</a>'
        : '<span class="lb">Próximo passo</span><span class="hint">'+esc(m.next.hint)+'</span>';
      var stepsHtml = m.branch ? '' : '<div class="steps">'+steps+'</div>';   // ramo: sem stepper
      host.innerHTML = who + stepsHtml + '<div class="nx">'+nx+'</div>';
      // prefetch proativo da próxima tela provável (não páginas-âncora)
      if (m.next.href && m.next.href.charAt(0) !== '#' && window.__npPrefetchNext) window.__npPrefetchNext(m.next.href);
    }

    render();
    window.addEventListener('np-child-change', render);
  }

  /* =====================================================
     PREFETCH PREDITIVO — a próxima tela carrega antes do clique.
     Ao passar o dedo/mouse/foco sobre um link interno, pré-busca a
     página (instant.page-style). A jornada também pré-carrega
     proativamente o próximo passo provável. Abertura ~instantânea.
     Respeita Save-Data. Cada URL é buscada no máximo 1×.
     ===================================================== */
  function predictivePrefetch(){
    if (window.__npPrefetch) return; window.__npPrefetch = true;
    try { if (navigator.connection && navigator.connection.saveData) return; } catch (e) {}
    var done = {};
    function prefetch(url){
      if (!url || done[url]) return; done[url] = 1;
      try {
        var l = document.createElement('link');
        l.rel = 'prefetch'; l.href = url; l.as = 'document';
        document.head.appendChild(l);
      } catch (e) {}
    }
    window.__npPrefetchNext = prefetch;                  // a jornada usa isto
    function fromEvent(e){
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.origin && a.origin !== location.origin) return;
      var href = a.getAttribute('href') || '';
      if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.pathname === location.pathname) return;        // mesma página
      prefetch(a.href);
    }
    document.addEventListener('pointerover', fromEvent, { passive: true });
    document.addEventListener('touchstart', fromEvent, { passive: true });
    document.addEventListener('focusin', fromEvent);
  }

  /* =====================================================
     MARCA EM TODA TELA — selo discreto da logo do Dr. Jadson
     Fixo no canto inferior esquerdo, acima da nav (mobile) ou
     rente à base (desktop). Decorativo (pointer-events:none): nunca
     bloqueia clique nem quebra layout. Some na impressão.
     ===================================================== */
  function brandMark(){
    if (document.getElementById('npBrandMark') || !document.body) return;
    if (!document.getElementById('np-brandmark-style')){
      var s = document.createElement('style'); s.id = 'np-brandmark-style';
      s.textContent =
        '.np-brandmark{position:fixed;z-index:40;left:max(12px,env(safe-area-inset-left,0px));' +
          'bottom:calc(76px + env(safe-area-inset-bottom,0px));width:44px;height:44px;border-radius:13px;' +
          'overflow:hidden;pointer-events:none;opacity:.9;background:#0e1222;' +
          'box-shadow:0 8px 22px -8px rgba(0,0,0,.6),0 0 0 1px rgba(231,201,139,.3)}' +
        '.np-brandmark img{width:100%;height:100%;object-fit:cover;display:block}' +
        '@media(min-width:761px){.np-brandmark{bottom:calc(16px + env(safe-area-inset-bottom,0px))}}' +
        '@media print{.np-brandmark{display:none!important}}';
      document.head.appendChild(s);
    }
    var b = document.createElement('div');
    b.id = 'npBrandMark'; b.className = 'np-brandmark'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<img src="./logo-jadson.jpg" alt="" width="44" height="44" loading="lazy" decoding="async" fetchpriority="low">';
    document.body.appendChild(b);
  }

  /* =====================================================
     ONBOARDING DE PRIMEIRO USO — ativação guiada (Camada I).
     Na Central, 1ª visita SEM criança cadastrada: convite premium em
     3 passos com CTA direto. Aparece 1× (np_onboarded). Quem já tem
     criança nunca vê. Não conflita com o tour do SPA (só no hub).
     ===================================================== */
  function onboarding(){
    var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();
    if (PAGE !== 'central-atalhos.html') return;
    try { if (localStorage.getItem('np_onboarded') === '1') return; } catch (e) { return; }
    if (!window.NPStore) { setTimeout(onboarding, 200); return; }
    if (window.NPStore.active && window.NPStore.active()) { try { localStorage.setItem('np_onboarded', '1'); } catch (e) {} return; }
    if (document.getElementById('npOnboard')) return;

    if (!document.getElementById('np-onboard-style')){
      var st = document.createElement('style'); st.id = 'np-onboard-style';
      st.textContent =
        '.np-onboard{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;padding:20px;' +
          'background:rgba(8,8,20,.7);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .25s}' +
        '.np-onboard.show{opacity:1}' +
        '.np-onboard .card{max-width:440px;width:100%;background:linear-gradient(160deg,#171536,#1d1a44 60%,#15133a);' +
          'border:1px solid rgba(169,164,255,.28);border-radius:24px;padding:26px 22px;box-shadow:0 30px 80px -24px rgba(0,0,0,.7);' +
          'transform:translateY(10px) scale(.98);transition:transform .3s cubic-bezier(.22,.9,.25,1)}' +
        '.np-onboard.show .card{transform:none}' +
        '.np-onboard .lg{width:64px;height:64px;border-radius:18px;overflow:hidden;margin:0 auto 12px;box-shadow:0 0 0 1px rgba(169,164,255,.4)}' +
        '.np-onboard .lg img{width:100%;height:100%;object-fit:cover;display:block}' +
        '.np-onboard h2{margin:0 0 4px;text-align:center;font:700 22px "Fraunces",Georgia,serif;color:#fbf6ea}' +
        '.np-onboard p.sub{margin:0 0 16px;text-align:center;color:#b6b2e6;font-size:13.5px}' +
        '.np-onboard .stp{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid rgba(169,164,255,.14)}' +
        '.np-onboard .stp:first-of-type{border-top:0}' +
        '.np-onboard .stp .n{flex:0 0 auto;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;' +
          'font:800 13px system-ui;color:#fff;background:linear-gradient(180deg,#7C3AED,#4F46E5)}' +
        '.np-onboard .stp b{display:block;color:#ECEAFF;font-size:14px}' +
        '.np-onboard .stp span{color:#928ec6;font-size:12.5px}' +
        '.np-onboard .acts{margin-top:18px;display:flex;flex-direction:column;gap:9px}' +
        '.np-onboard .cta{border:0;border-radius:14px;padding:14px;font:800 15px system-ui;cursor:pointer;color:#fff;' +
          'background:linear-gradient(135deg,#7C3AED,#4F46E5);box-shadow:0 12px 28px -10px rgba(124,58,237,.6)}' +
        '.np-onboard .skip{border:0;background:none;color:#928ec6;font:700 13px system-ui;cursor:pointer;padding:8px}';
      document.head.appendChild(st);
    }
    var ov = document.createElement('div');
    ov.id = 'npOnboard'; ov.className = 'np-onboard';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Bem-vindo ao NeuroPed');
    ov.innerHTML =
      '<div class="card">' +
        '<div class="lg"><img src="./logo-jadson.jpg" alt="" width="64" height="64" decoding="async"></div>' +
        '<h2>Bem-vindo ao NeuroPed</h2>' +
        '<p class="sub">Da triagem ao laudo, em um fluxo só. Veja como começar:</p>' +
        '<div class="stp"><span class="n">1</span><div><b>Cadastre a criança</b><span>Ela conecta filtro, escalas e histórico — fica só no seu aparelho.</span></div></div>' +
        '<div class="stp"><span class="n">2</span><div><b>Escolha a queixa e a idade</b><span>O app indica as 3 escalas mais apropriadas, com 1 toque.</span></div></div>' +
        '<div class="stp"><span class="n">3</span><div><b>Responda e gere o laudo</b><span>PDF com as respostas, salvo no histórico da criança.</span></div></div>' +
        '<div class="acts"><button type="button" class="cta">Começar agora — cadastrar criança</button>' +
        '<button type="button" class="skip">Explorar primeiro</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ ov.classList.add('show'); var c = ov.querySelector('.cta'); if (c) c.focus(); });
    function close(go){
      try { localStorage.setItem('np_onboarded', '1'); } catch (e) {}
      ov.classList.remove('show');
      setTimeout(function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); if (go) location.href = './perfil-crianca.html'; }, 240);
    }
    ov.querySelector('.cta').addEventListener('click', function(){ close(true); });
    ov.querySelector('.skip').addEventListener('click', function(){ close(false); });
    ov.addEventListener('click', function(e){ if (e.target === ov) close(false); });
    document.addEventListener('keydown', function esc(e){ if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); } });
  }

  /* =====================================================
     POLIMENTO PREMIUM GLOBAL — 3 ondas de refino visual, aplicadas
     como BASELINE não-destrutivo: todos os seletores usam :where()
     (especificidade 0), então qualquer estilo próprio da página SEMPRE
     vence. Páginas sem o estilo recebem o polimento; páginas que já têm
     (ex.: filtro-escalas com hover próprio) ficam intactas.
       1) Cabeçalhos (.topbar): transições suaves no voltar/pills.
       2) Microinterações nos cards de escala (.result-card/.scale-card).
       3) Acessibilidade: anel de foco visível (teclado · WCAG 2.4.7).
     Respeita prefers-reduced-motion. Não altera markup nem cores de marca.
     ===================================================== */
  function premiumPolish(){
    if (document.getElementById('np-premium-polish')) return;
    var s = document.createElement('style'); s.id = 'np-premium-polish';
    s.textContent =
      /* 3) Foco visível — só via teclado. outline + box-shadow: o anel
         (box-shadow) sobrevive a resets `outline:none` por ser outra
         propriedade, garantindo indicador visível mesmo nessas páginas. */
      ':where(a,button,input,select,textarea,summary,[role="button"],[tabindex]):focus-visible{' +
        'outline:2px solid #a9a4ff;outline-offset:2px;box-shadow:0 0 0 4px rgba(124,58,237,.28)}' +
      '@media(prefers-reduced-motion:no-preference){' +
        ':where(.topbar .back,.topbar .tb-pill){transition:transform .16s cubic-bezier(.34,1.56,.64,1),background .2s,box-shadow .2s}' +
        /* 2) Microinterações: elevação + sombra suave (cede a hover próprio da página) */
        ':where(.result-card,.scale-card){transition:transform .22s cubic-bezier(.22,.9,.25,1),box-shadow .25s,border-color .25s}' +
        ':where(.result-card,.scale-card):hover{transform:translateY(-3px);box-shadow:0 20px 44px -22px rgba(2,2,12,.85)}' +
        ':where(.result-card,.scale-card):active{transform:translateY(-1px) scale(.995)}' +
        ':where(button,.btn):active{transform:scale(.985)}' +
      '}';
    document.head.appendChild(s);
  }

  function boot(){
    themeColor();
    fixViewport();
    premiumNav();
    premiumPolish();
    if (!EMBEDDED) { splash(); bottomNav(); navProgress(); pageExit(); predictivePrefetch(); journeyGuide(); brandMark(); onboarding(); qualitySeal(); referralWidget(); lgpdBanner(); }   // dentro da casca (app-shell), o chrome é da casca
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
