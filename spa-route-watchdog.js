/* NeuroPed — Watchdog de rota morta da SPA (rede de segurança)
 *
 * Por que existe: a SPA (bundle compilado) às vezes cai numa tela sem saída
 * ("Did you forget to add the page to the router?") ou numa hash inválida
 * (#/undefined, #/escala/undefined). Como o fonte da SPA não está neste repo,
 * este watchdog resgata o usuário SEM tocar o bundle: detecta o beco sem saída
 * e leva ao filtro estático que funciona (filtro-escalas.html).
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

  function rescue(reason) {
    if (rescued) return;
    rescued = true;
    try { console.warn('[NeuroPed] rota morta detectada (' + reason + ') → indo ao filtro de escalas.'); } catch (e) {}
    location.replace(SAFE);
  }

  // 1) Hash inválida explícita
  function checkHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (/^\/(undefined|null)\b/i.test(h) || /^\/escala\/(undefined|null)?\s*$/i.test(h)) {
      rescue('hash ' + h);
    }
  }

  // 2) Tela de erro do router renderizada no DOM (texto característico do wouter/dev)
  var DEAD_RE = /forget to add the page to the router|404.*p[áa]gina n[ãa]o encontrada|page not found/i;
  function checkDom() {
    if (rescued) return;
    var body = document.body;
    if (!body) return;
    // só dispara se a tela é dominada pela mensagem de erro (evita falso positivo)
    var txt = (body.innerText || '').slice(0, 4000);
    if (DEAD_RE.test(txt)) {
      // confirma que não é um conteúdo legítimo com a frase: exige pouca densidade de UI
      var links = body.querySelectorAll('a,button').length;
      if (links < 12) rescue('tela de erro do router');
    }
  }

  function checkAll() { checkHash(); checkDom(); }

  window.addEventListener('hashchange', checkAll, false);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(checkAll, 400); });
  } else {
    setTimeout(checkAll, 400);
  }

  // observador leve: se a SPA navegar para o beco sem saída depois, pega também
  try {
    var mo = new MutationObserver(function () {
      if (rescued) { mo.disconnect(); return; }
      checkDom();
    });
    var start = function () { if (document.body) mo.observe(document.body, { childList: true, subtree: true }); else setTimeout(start, 200); };
    start();
    // para de observar após 20s (a SPA já estabilizou; evita custo perpétuo)
    setTimeout(function () { try { mo.disconnect(); } catch (e) {} }, 20000);
  } catch (e) {}
})();
