/* NeuroPed — Watchdog de rota morta da SPA (rede de segurança PROATIVA)
 *
 * Por que existe: a SPA (bundle compilado) às vezes navega para uma hash inválida
 * (#/undefined, #/escala/undefined) e mostra a tela "Did you forget to add the page".
 * Como o fonte da SPA não está neste repo, este watchdog protege o usuário SEM
 * tocar o bundle. Camadas:
 *   PROATIVO  — intercepta clique e hashchange ANTES do router renderizar e
 *               redireciona ao filtro estático, evitando o flash da tela morta.
 *   REATIVO   — se algo escapar, detecta a tela morta no DOM e resgata.
 *   ERROS     — captura erros silenciosos (ex.: PDF que falha) e avisa o usuário
 *               com um toast, em vez de não acontecer nada.
 *
 * Carregado por <script src> no index.html, após o bundle.
 */
(function () {
  'use strict';
  if (window.__npRouteWatchdog) return;
  window.__npRouteWatchdog = true;

  var base = location.pathname.replace(/[^/]*$/, '');
  var SAFE = base + 'filtro-escalas.html';
  var rescued = false;

  var BAD_HASH = /^#?\/(undefined|null)\b/i;
  var BAD_SCALE = /^#?\/escala\/(undefined|null)?\s*$/i;
  function isBadHash(h) { h = h || ''; return BAD_HASH.test(h) || BAD_SCALE.test(h); }

  function rescue(reason) {
    if (rescued) return;
    rescued = true;
    try { console.warn('[NeuroPed] rota morta (' + reason + ') → filtro de escalas.'); } catch (e) {}
    location.replace(SAFE);
  }

  /* ---------- toast leve (não depende de nada da SPA) ---------- */
  function toast(msg) {
    try {
      if (window.npToast) { window.npToast(msg); return; }
      var t = document.createElement('div');
      t.textContent = msg;
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:100000;max-width:90vw;' +
        'background:rgba(20,18,46,.96);color:#f2dca6;border:1px solid rgba(231,201,139,.4);border-radius:14px;' +
        'padding:12px 16px;font:600 13.5px system-ui,sans-serif;box-shadow:0 14px 40px -12px rgba(0,0,0,.6);backdrop-filter:blur(8px)';
      document.body.appendChild(t);
      setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.remove(); }, 400); }, 4200);
    } catch (e) {}
  }

  /* ---------- 1) PROATIVO: intercepta clique em link quebrado ---------- */
  // Antes do router da SPA processar, se o destino do clique é #/undefined ou
  // #/escala/<vazio>, aborta e manda ao filtro — sem flash da tela morta.
  document.addEventListener('click', function (ev) {
    if (rescued) return;
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var hashPart = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
    if (isBadHash(hashPart) || /\/escala\/(undefined|null)?$/i.test(href)) {
      ev.preventDefault();
      ev.stopPropagation();
      rescue('clique em link quebrado');
    }
  }, true); // capture: roda antes dos handlers da SPA

  /* ---------- 2) PROATIVO: intercepta hashchange ANTES de renderizar ---------- */
  window.addEventListener('hashchange', function () {
    if (rescued) return;
    if (isBadHash(location.hash)) rescue('hashchange inválido');
  }, true);

  /* ---------- 3) REATIVO: tela morta no DOM (fallback) ---------- */
  var DEAD_RE = /forget to add the page to the router|404.*p[áa]gina n[ãa]o encontrada|page not found/i;
  function checkDom() {
    if (rescued) return;
    var body = document.body;
    if (!body) return;
    var txt = (body.innerText || '').slice(0, 4000);
    if (DEAD_RE.test(txt) && body.querySelectorAll('a,button').length < 12) {
      rescue('tela de erro do router');
    }
  }

  function checkHashNow() { if (!rescued && isBadHash(location.hash)) rescue('hash inválida'); }
  function checkAll() { checkHashNow(); checkDom(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(checkAll, 350); });
  } else {
    setTimeout(checkAll, 350);
  }

  try {
    var mo = new MutationObserver(function () { if (rescued) { mo.disconnect(); return; } checkDom(); });
    var start = function () { if (document.body) mo.observe(document.body, { childList: true, subtree: true }); else setTimeout(start, 200); };
    start();
    setTimeout(function () { try { mo.disconnect(); } catch (e) {} }, 20000);
  } catch (e) {}

  /* ---------- 4) ERROS SILENCIOSOS: avisa em vez de nada acontecer ---------- */
  // Ex.: o chunk de PDF falha ao importar/gerar → o usuário clicava e nada acontecia.
  window.addEventListener('error', function (ev) {
    try {
      var src = (ev && ev.filename) || '';
      var msg = (ev && ev.message) || '';
      if (/pdf-generator|PDFButton|pdf/i.test(src) || /pdf/i.test(msg)) {
        toast('Não consegui gerar o PDF agora. Tente novamente — se persistir, use "Copiar" ou o Filtro de Escalas.');
      }
    } catch (e) {}
  }, true);
  window.addEventListener('unhandledrejection', function (ev) {
    try {
      var r = ev && ev.reason;
      var s = (r && (r.stack || r.message)) || String(r || '');
      if (/pdf-generator|PDFButton|pdf|chunk/i.test(s)) {
        toast('Falha ao gerar o documento. Tente de novo ou use o Filtro de Escalas para imprimir.');
      }
    } catch (e) {}
  });
})();
