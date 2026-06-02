/* =====================================================================
   NeuroPed EDJ · Unified Runtime  v2.3 (refinado)
   Dr. Jadson Fraga · Neuropediatria · CRM-PE 25227

   Responsabilidades:
   1) Tema claro/escuro com persistência + system sync + View Transitions
   2) Auto-detect de páginas dark editoriais (luminância + tokens + CSS)
   3) Toggle minimalista flutuante (acessível, animado, ESC fecha)
   4) MutationObserver para re-aplicar detect quando SPA troca rota
   5) Recuperação de path 404 (lê sessionStorage e ajusta hash)
   6) Idle-time prefetch dos atalhos mais clicados (heurística leve)
   ===================================================================== */
(function () {
  'use strict';

  // Anti-double-load defensivo
  if (window.__NP_UNIFIED_LOADED) return;
  window.__NP_UNIFIED_LOADED = true;

  var KEY_THEME = 'np-theme';
  var html = document.documentElement;

  // ── Utilidades ───────────────────────────────────────────────────
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function luminanceFromRGB(r, g, b) {
    var a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  function parseRGB(str) {
    var m = String(str || '').match(/\d+(?:\.\d+)?/g);
    if (!m || m.length < 3) return null;
    return { r: +m[0], g: +m[1], b: +m[2] };
  }

  // ── 1. TEMA CLARO/ESCURO ─────────────────────────────────────────
  function applyTheme(theme, animate) {
    var t = theme === 'dark' ? 'dark' : 'light';

    var apply = function () {
      html.setAttribute('data-theme', t);
      html.classList.toggle('dark', t === 'dark');
      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute('content', t === 'dark' ? '#0e0e22' : '#4f46e5');
    };

    // View Transitions API (Chrome 111+, Safari 18+) — transição cinematográfica
    if (animate && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { document.startViewTransition(apply); return; } catch (e) {}
    }
    apply();
  }

  // ── 2. AUTO-DETECT DE DESIGN DARK EDITORIAL ──────────────────────
  function detectDarkEditorial() {
    try {
      var bodyStyle = getComputedStyle(document.body);
      var bg = parseRGB(bodyStyle.backgroundColor);
      var htmlStyle = getComputedStyle(html);
      var tokenBg = htmlStyle.getPropertyValue('--bg').trim();
      var tokenInk = htmlStyle.getPropertyValue('--ink').trim();
      var tokenForeground = htmlStyle.getPropertyValue('--foreground').trim();

      var isDark = false;

      // Sinal 1: token --bg começa com hex muito escuro (0–3 na primeira casa)
      if (/^#(0[0-9a-f]|1[0-3])/i.test(tokenBg)) isDark = true;

      // Sinal 2: token --ink claro (página foi desenhada light-on-dark)
      if (/^#[EeFf]/.test(tokenInk)) isDark = true;

      // Sinal 3: body bg com luminância < 0.18 (quase preto)
      if (bg) {
        var L = luminanceFromRGB(bg.r, bg.g, bg.b);
        if (L < 0.18) isDark = true;
      }

      // Sinal 4: classe ou attribute explícito do dev
      if (html.classList.contains('dark') ||
          document.body.classList.contains('dark') ||
          document.body.dataset.theme === 'dark' ||
          html.getAttribute('data-theme') === 'dark-editorial') {
        isDark = true;
      }

      if (isDark) {
        html.setAttribute('data-design', 'dark-editorial');
      } else {
        // Mantém limpo para páginas light (SPA, setup, verificar)
        if (html.getAttribute('data-design') === 'dark-editorial') {
          html.removeAttribute('data-design');
        }
      }
    } catch (e) {}
  }

  // ── 3. TOGGLE FLUTUANTE ──────────────────────────────────────────
  function mountToggle() {
    if (document.querySelector('.np-theme-toggle')) return;

    var btn = document.createElement('button');
    btn.className = 'np-theme-toggle no-print';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Alternar tema claro e escuro');
    btn.setAttribute('aria-pressed', html.classList.contains('dark') ? 'true' : 'false');
    btn.title = 'Alternar tema (Ctrl+Shift+L)';
    btn.innerHTML =
      '<span class="sun" aria-hidden="true">☼</span>' +
      '<span cl