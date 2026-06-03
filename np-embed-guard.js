/* NeuroPed EDJ — np-embed-guard.js
 * Garante que as páginas auxiliares abram SEMPRE dentro do app (a casca
 * app-shell.html), nunca como página HTML solta. Para páginas que NÃO usam
 * app-frame.js (arquitetura V3: testes-diretos, escalas-questionarios,
 * diarios-clinicos, menu-instrumentos, etc.). Em app-frame.js há a mesma lógica.
 *
 * - Se a página foi aberta no topo (deep-link/bookmark) → reabre embutida:
 *   ./app-shell.html#v=<arquivo+query+hash>.
 * - Se já está embutida (self!==top) → marca <html class="np-embedded"> para
 *   o CSS poder suprimir chrome próprio; não redireciona (loop-safe).
 * Carregar o MAIS CEDO possível no <head> (script síncrono) p/ evitar flash.
 */
(function () {
  'use strict';
  var EMBEDDED;
  try { EMBEDDED = window.self !== window.top; } catch (e) { EMBEDDED = true; }
  if (EMBEDDED) {
    try {
      var mark = function () { document.documentElement.classList.add('np-embedded'); };
      if (document.documentElement) mark();
      else document.addEventListener('DOMContentLoaded', mark);
    } catch (e) {}
    return;
  }
  // Páginas que devem permanecer autônomas (mesma lista do app-frame.js).
  var STANDALONE = {
    'index.html': 1, 'app-shell.html': 1, '': 1, '/': 1, '404.html': 1, 'ds-pilot.html': 1,
    'restricted.html': 1, 'verificar.html': 1, 'verificar-documento.html': 1, 'verificar-app.html': 1,
    'assinatura-digital.html': 1, 'qa-smoke-test.html': 1, 'teste-e2e-manual.html': 1,
    'teste-ouro-pin.html': 1, 'privacy-policy.html': 1
  };
  var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (STANDALONE[f]) return;
  try {
    var b = document.body;
    if (b && (b.getAttribute('data-np-frame') === 'off' || b.getAttribute('data-np-standalone') === '1')) return;
  } catch (e) {}
  var view = f + location.search + location.hash;
  var to = './app-shell.html#v=' + encodeURIComponent(view);
  try { location.replace(to); } catch (e) { location.href = to; }
})();
