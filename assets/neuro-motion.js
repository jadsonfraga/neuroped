/* =====================================================================
   NeuroPed SDG — neuro-motion.js  ·  entrada fade-up (vanilla, sem libs)
   ---------------------------------------------------------------------
   Progressive enhancement SEGURO: o JS é quem ESCONDE (data-neuro-animate)
   e depois revela (.neuro-in). Se o JS não rodar, ou se o usuário pediu
   menos movimento, nada fica escondido — o conteúdo aparece normalmente.

   Stagger: via atributo data-stagger="<ms>" no elemento ou no container.
   Respeita @media (prefers-reduced-motion: reduce) — OBRIGATÓRIO.
   ===================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Sem suporte a IntersectionObserver ou movimento reduzido: não esconde nada.
  if (reduce || !('IntersectionObserver' in window)) return;

  function collect() {
    var set = [];
    var seen = new Set();
    // alvos explícitos + auto-realce de cards e blocos marcados
    var nodes = document.querySelectorAll('[data-neuro-animate],[data-stagger],.neuro-card');
    nodes.forEach(function (el) {
      if (seen.has(el)) return;
      seen.add(el);
      set.push(el);
    });
    return set;
  }

  function staggerFor(el, indexInParent) {
    var own = parseInt(el.getAttribute('data-stagger'), 10);
    if (!isNaN(own)) return own;
    var parentStep = el.parentElement && parseInt(el.parentElement.getAttribute('data-stagger'), 10);
    if (!isNaN(parentStep)) return Math.min(indexInParent, 8) * parentStep;
    return Math.min(indexInParent, 8) * 70; /* padrão: 70ms por irmão */
  }

  function start() {
    var els = collect();
    if (!els.length) return;

    // marca para esconder (CSS aplica opacity:0/translateY) e calcula delay
    var counts = new Map();
    els.forEach(function (el) {
      el.setAttribute('data-neuro-animate', '');
      var p = el.parentElement || document.body;
      var i = counts.get(p) || 0; counts.set(p, i + 1);
      el.style.transitionDelay = staggerFor(el, i) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('neuro-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    els.forEach(function (el) { io.observe(el); });

    // Failsafe: garante visibilidade após 3s, mesmo se o observer não disparar.
    setTimeout(function () {
      els.forEach(function (el) { el.classList.add('neuro-in'); });
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
