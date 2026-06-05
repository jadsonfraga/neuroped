/* ============================================================================
   np-theme.js — Controlador de tema claro/escuro (Apple-grade) · reutilizável
   ----------------------------------------------------------------------------
   O app JÁ tem as paletas (tokens.css + np-tokens.css respondem a
   <html data-theme="light|dark">). Aqui só faltava o controlador: aplica o tema
   o quanto antes (sem flash), persiste a escolha, faz a transição suave e injeta
   um botão flutuante acessível. Sem dependências.
     window.NPTheme.get() | .set('light'|'dark') | .toggle()
   ============================================================================ */
(function (root) {
  'use strict';
  var KEY = 'np_theme';
  var DOC = typeof document !== 'undefined' ? document : null;
  if (!DOC) { if (root) root.NPTheme = { get: function () { return 'dark'; }, set: function () {}, toggle: function () {} }; return; }

  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function persist(t) { try { localStorage.setItem(KEY, t); } catch (e) {} }
  function current() { return DOC.documentElement.getAttribute('data-theme') || saved() || 'dark'; }

  // Aplica ANTES da pintura (chamado já na carga) → evita flash de tema errado.
  function apply(t) { DOC.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark'); }
  apply(saved() || 'dark');

  function set(t, opts) {
    t = (t === 'light') ? 'light' : 'dark';
    var html = DOC.documentElement;
    if (!(opts && opts.silent)) {
      html.classList.add('theme-transitioning');
      setTimeout(function () { html.classList.remove('theme-transitioning'); }, 360);
    }
    apply(t); persist(t);
    syncButtons(t);
    try { html.dispatchEvent(new CustomEvent('np:theme', { detail: { theme: t } })); } catch (e) {}
    return t;
  }
  function toggle() { return set(current() === 'light' ? 'dark' : 'light'); }

  // ── botão(ões) ─────────────────────────────────────────────────────────────
  var SUN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  function label(t) { return t === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'; }
  function syncButtons(t) {
    var btns = DOC.querySelectorAll('[data-np-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      b.innerHTML = t === 'light' ? MOON : SUN;   // mostra o destino
      b.setAttribute('aria-label', label(t));
      b.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
      b.setAttribute('title', label(t));
    }
  }

  function injectFloating() {
    if (DOC.querySelector('[data-np-theme-toggle].np-theme-fab') || DOC.querySelector('[data-np-theme-no-fab]')) return;
    var b = DOC.createElement('button');
    b.type = 'button';
    b.className = 'np-theme-fab';
    b.setAttribute('data-np-theme-toggle', '');
    DOC.body.appendChild(b);
    if (!DOC.getElementById('np-theme-fab-style')) {
      var s = DOC.createElement('style'); s.id = 'np-theme-fab-style';
      s.textContent = '.np-theme-fab{position:fixed;left:max(16px,env(safe-area-inset-left));bottom:calc(16px + env(safe-area-inset-bottom));z-index:60;width:44px;height:44px;display:grid;place-items:center;border-radius:var(--np-r-pill,999px);cursor:pointer;color:var(--np-text,#F5F3FF);background:var(--np-ink-2,#15152E);border:1px solid var(--np-edge-hi,rgba(255,255,255,.1));box-shadow:var(--np-shadow-2,0 8px 24px rgba(0,0,0,.4));transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s}'
        + '.np-theme-fab:hover{transform:translateY(-1px)}.np-theme-fab:active{transform:scale(.94)}'
        + '.np-theme-fab:focus-visible{outline:3px solid var(--np-accent-hi,#9D9BFF);outline-offset:2px}'
        + '@media print{.np-theme-fab{display:none}}';
      (DOC.head || DOC.documentElement).appendChild(s);
    }
  }

  function wire() {
    DOC.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-np-theme-toggle]') : null;
      if (t) { e.preventDefault(); toggle(); }
    });
    injectFloating();
    syncButtons(current());
  }
  if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', wire); else wire();

  root.NPTheme = { get: current, set: set, toggle: toggle };
})(typeof window !== 'undefined' ? window : null);
