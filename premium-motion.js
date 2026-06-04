/* =====================================================================
   NeuroPed EDJ — Premium Motion 2.0 (Apple-Class)
   Físicas de mola, transições elásticas e continuidade espacial.
   ===================================================================== */
(function () {
  "use strict";
  try {
    if (window.__npPremiumMotionV2) return;
    window.__npPremiumMotionV2 = true;

    const APPLE_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
    const SPRING_EASE = 'cubic-bezier(0.4, 0, 0.2, 1.4)';

    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) return;

    function viewNode() {
      var root = document.getElementById('root');
      if (!root) return null;
      return root.querySelector('main') || root.firstElementChild;
    }

    function animateView() {
      try {
        var node = viewNode();
        if (!node) return;
        
        node.style.opacity = '0';
        node.style.transform = 'translateY(12px) scale(0.99)';
        node.style.transition = 'none';

        requestAnimationFrame(() => {
          node.style.transition = `opacity 400ms ${APPLE_EASE}, transform 500ms ${APPLE_EASE}`;
          node.style.opacity = '1';
          node.style.transform = 'translateY(0) scale(1)';
        });
      } catch (e) { /* no-op */ }
    }

    // Interceptar cliques em links para feedback tátil visual
    document.addEventListener('mousedown', function(e) {
      const btn = e.target.closest('.np-btn, .np-card, button');
      if (btn) {
        btn.style.transform = 'scale(0.97)';
        btn.style.transition = 'transform 80ms ease-out';
      }
    });

    document.addEventListener('mouseup', function(e) {
      const btn = e.target.closest('.np-btn, .np-card, button');
      if (btn) {
        btn.style.transform = '';
        btn.style.transition = `transform 400ms ${SPRING_EASE}`;
      }
    });

    var last = location.hash;
    window.addEventListener('hashchange', function () {
      if (location.hash === last) return;
      last = location.hash;
      requestAnimationFrame(function () { setTimeout(animateView, 0); });
    }, { passive: true });

    // Inicialização
    animateView();

  } catch (e) { /* falha silenciosa */ }
})();
