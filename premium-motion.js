/* =====================================================================
   NeuroPed EDJ — Premium Motion  ·  troca de rota fluida ("app interligado")
   Reanima suavemente a view principal a cada mudança de rota (hash),
   dando a sensação de app que flui em vez de páginas estáticas.
   Defensivo: respeita prefers-reduced-motion, tudo em try/catch,
   nunca interfere se a estrutura esperada não existir.
   ===================================================================== */
(function () {
  "use strict";
  try {
    if (window.__npPremiumMotion) return;
    window.__npPremiumMotion = true;

    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) return;

    function viewNode() {
      var root = document.getElementById('root');
      if (!root) return null;
      // alvo preferencial: <main>; senão, o maior contêiner de conteúdo
      return root.querySelector('main') || root.firstElementChild;
    }

    function animateView() {
      try {
        var node = viewNode();
        if (!node) return;
        node.style.animation = 'none';
        // força reflow para reiniciar a animação
        void node.offsetWidth;
        node.style.animation = 'npPageIn .42s cubic-bezier(.22,.8,.2,1)';
      } catch (e) { /* no-op */ }
    }

    var last = location.hash;
    window.addEventListener('hashchange', function () {
      if (location.hash === last) return;
      last = location.hash;
      // aguarda o React pintar a nova rota antes de animar
      requestAnimationFrame(function () { setTimeout(animateView, 0); });
    }, { passive: true });
  } catch (e) { /* falha silenciosa: jamais quebrar o app */ }
})();
