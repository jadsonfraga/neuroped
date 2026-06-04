/* ============================================================
   NeuroPed EDJ — retro-arcade.js · Bootstrapper estético global
   ============================================================
   Faz DUAS coisas, em toda página onde é carregado:

   1) UNIFORMIZA com a tela inicial: garante que a base visual da home
      (tokens.css + components.css + app-skin.css = DNA navy premium)
      esteja presente em qualquer tela auxiliar, mesmo as que não a
      carregavam. Assim todas "copiam" a página inicial.

   2) Camada VIDEO GAME RETRÔ (Super Mario Bros): injeta a fonte pixel
      (Press Start 2P), o retro-arcade.css, decoração 8-bit (moedas/
      estrelas ao fundo, scanline CRT, faixa de chão), moeda que salta
      no clique com "+1UP", e liga a camada de som 8-bit (np-sound).

   Idempotente, não-invasivo, respeita prefers-reduced-motion e impressão.
   Carrega via <script src="./retro-arcade.js" defer></script>.
   ============================================================ */
(function () {
  'use strict';
  if (window.__npRetroArcade) return;
  window.__npRetroArcade = true;

  var head = document.head || document.documentElement;

  // Caminho-base relativo a este próprio script (funciona em / e em subpastas)
  var BASE = (function () {
    try {
      var s = document.currentScript || document.querySelector('script[src*="retro-arcade.js"]');
      if (s && s.src) return s.src.replace(/[^/]*$/, '');
    } catch (e) {}
    return './';
  })();

  function hasLink(match) {
    return !!document.querySelector('link[href*="' + match + '"]');
  }
  function addCss(href) {
    if (hasLink(href)) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = BASE + href;
    head.appendChild(l);
  }
  /* ---------- 1) BASE DA HOME (uniformização) ---------- */
  // Ordem canônica: tokens → components → app-skin (DNA navy premium).
  addCss('tokens.css');
  addCss('components.css');
  addCss('app-skin.css');

  /* ---------- 2) Fonte pixel (Press Start 2P) ---------- */
  // CSP do app permite fonts.googleapis.com (style) e fonts.gstatic.com (font).
  if (!hasLink('Press+Start+2P')) {
    if (!hasLink('fonts.gstatic.com')) {
      var pc = document.createElement('link');
      pc.rel = 'preconnect'; pc.href = 'https://fonts.gstatic.com'; pc.crossOrigin = '';
      head.appendChild(pc);
    }
    var pf = document.createElement('link');
    pf.rel = 'stylesheet';
    pf.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    head.appendChild(pf);
  }

  /* ---------- 3) CSS da camada retrô ---------- */
  addCss('retro-arcade.css');

  /* ---------- 4) Som 8-bit (garante np-sound em páginas sem o polish) ---------- */
  // np-sound.js é idempotente (window.__npSound). Liga por padrão (ver np-sound.js).
  if (!window.__npSound && !document.querySelector('script[data-np-sound-src]')) {
    var ns = document.createElement('script');
    ns.src = BASE + 'np-sound.js'; ns.defer = true;
    ns.setAttribute('data-np-sound-src', '1');
    head.appendChild(ns);
  }

  /* ============================================================
     Liga o modo retrô e monta a decoração quando o DOM estiver pronto.
     ============================================================ */
  var reduceMotion = false;
  try { reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function start() {
    document.documentElement.setAttribute('data-retro', '1');
    buildDeco();
    wireClicks();
  }

  // Não decora em impressão.
  function isPrint() { try { return matchMedia('print').matches; } catch (e) { return false; } }

  function buildDeco() {
    if (!document.body || isPrint()) return;

    // Scanline / vinheta CRT
    if (!document.getElementById('np-retro-crt')) {
      var crt = document.createElement('div');
      crt.id = 'np-retro-crt'; crt.setAttribute('aria-hidden', 'true');
      document.body.appendChild(crt);
    }
    // Faixa de "chão" pixel no rodapé
    if (!document.getElementById('np-retro-ground')) {
      var gr = document.createElement('div');
      gr.id = 'np-retro-ground'; gr.setAttribute('aria-hidden', 'true');
      document.body.appendChild(gr);
    }
    // Céu com moedas/estrelas flutuando (sutil; desligado em reduced-motion)
    if (!reduceMotion && !document.getElementById('np-retro-sky')) {
      var sky = document.createElement('div');
      sky.id = 'np-retro-sky'; sky.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sky);
      spawnSky(sky);
    }
  }

  function spawnSky(sky) {
    var W = function () { return window.innerWidth || 360; };
    var N = W() < 560 ? 5 : 8;           // densidade baixa no mobile
    for (var i = 0; i < N; i++) {
      var isStar = (i % 3 === 0);
      var el = document.createElement('div');
      el.className = isStar ? 'np-retro-star' : 'np-retro-coin';
      el.style.left = Math.round(Math.random() * 96) + 'vw';
      el.style.bottom = '-24px';
      var dur = (isStar ? 4 : 9) + Math.random() * 7;
      el.style.animationDuration = dur.toFixed(1) + 's';
      el.style.animationDelay = (Math.random() * dur).toFixed(1) + 's';
      if (isStar) { el.style.top = Math.round(Math.random() * 80) + 'vh'; el.style.bottom = 'auto'; }
      sky.appendChild(el);
    }
  }

  /* ---------- Moeda que salta + "+1UP" no clique ---------- */
  var lastPop = 0;
  function coinPop(x, y) {
    if (reduceMotion || isPrint()) return;
    var now = Date.now();
    if (now - lastPop < 90) return;      // throttle
    lastPop = now;

    var coin = document.createElement('div');
    coin.className = 'np-coin-pop';
    coin.style.left = x + 'px'; coin.style.top = y + 'px';
    document.body.appendChild(coin);
    setTimeout(function () { if (coin.parentNode) coin.parentNode.removeChild(coin); }, 560);

    var up = document.createElement('div');
    up.className = 'np-score-float';
    up.textContent = '+1UP';
    up.style.left = x + 'px'; up.style.top = (y - 14) + 'px';
    document.body.appendChild(up);
    setTimeout(function () { if (up.parentNode) up.parentNode.removeChild(up); }, 820);
  }

  function wireClicks() {
    // Espelha o auto-wiring de som: dispara a moeda nos mesmos CTAs.
    document.addEventListener('click', function (e) {
      var t = e.target;
      var a = t && t.closest && t.closest('button, a.open, a.feat, .feat, .np-btn, .btn, .acts a, .sh-tab, .card, .scale-card, .chip, .pill');
      if (!a || a.id === 'np-sound-toggle') return;
      var x = (e.clientX != null && e.clientX) ? e.clientX : 0;
      var y = (e.clientY != null && e.clientY) ? e.clientY : 0;
      if (!x && !y) {                       // teclado: centro do elemento
        var r = a.getBoundingClientRect();
        x = r.left + r.width / 2; y = r.top + r.height / 2;
      }
      coinPop(x, y);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
