/* ============================================================
   NeuroPed EDJ — ambient-effects.js · Camada Apple Secret Lab
   ============================================================
   Adiciona em qualquer HTML:
     - Breathing gradient overlay (aurora respira lentamente)
     - Noise cinematográfico ultrassutil (SVG fractal, opacity .03)
     - Particle drift mínimo (5-7 pontos de glow flutuantes)
     - Bloom interno reativo a hover em cards
   Todos os efeitos:
     - Idempotentes (window.__npAmbient guard)
     - Respeitam prefers-reduced-motion (ficam parados)
     - Não bloqueiam scroll, não capturam ponteiro (pointer-events: none)
     - Opt-out: <body data-np-ambient="off">
     - Skip auto em PRINT
   ============================================================ */
(function(){
  'use strict';
  if (window.__npAmbient) return;
  window.__npAmbient = true;

  function shouldSkip(){
    if (!document.body) return true;
    if (document.body.dataset.npAmbient === 'off') return true;
    if (window.matchMedia && window.matchMedia('print').matches) return true;
    return false;
  }
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Breathing aurora ---------- */
  /* Camada fixa atrás de tudo que pulsa muito devagar.
     Substituível por aurora estática em prefers-reduced-motion. */
  function ensureBreathingAurora(){
    if (document.getElementById('npAmbientAurora')) return;
    var d = document.createElement('div');
    d.id = 'npAmbientAurora';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = [
      'position:fixed','inset:0','pointer-events:none','z-index:-1',
      'background:'+
        'radial-gradient(900px 540px at 12% 6%, rgba(124,92,255,.14), transparent 60%),'+
        'radial-gradient(800px 500px at 92% 12%, rgba(56,189,248,.08), transparent 56%),'+
        'radial-gradient(900px 600px at 50% 110%, rgba(34,211,238,.06), transparent 60%)',
      'opacity:.85',
      reducedMotion ? '' : 'animation: npBreathe 14s ease-in-out infinite'
    ].join(';');
    document.body.appendChild(d);
    if (!document.getElementById('npAmbientKeyframes')) {
      var s = document.createElement('style');
      s.id = 'npAmbientKeyframes';
      s.textContent = '@keyframes npBreathe{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:.95;transform:scale(1.04)}}'
        + '@keyframes npDrift{0%{transform:translate(0,0)}50%{transform:translate(12px,-18px)}100%{transform:translate(0,0)}}'
        + '@media (prefers-reduced-motion: reduce){#npAmbientAurora,.np-particle{animation:none!important}}';
      document.head.appendChild(s);
    }
  }

  /* ---------- Noise overlay cinematográfico ---------- */
  /* SVG fractalNoise em base64 (~3KB), opacity .03, blend-mode overlay.
     Sutil o suficiente para ser sentido sem ser percebido. */
  function ensureNoise(){
    if (document.getElementById('npAmbientNoise')) return;
    var d = document.createElement('div');
    d.id = 'npAmbientNoise';
    d.setAttribute('aria-hidden', 'true');
    var svg = 'data:image/svg+xml;utf8,'+encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">'+
      '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>'+
      '<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 0"/></filter>'+
      '<rect width="100%" height="100%" filter="url(%23n)"/></svg>'
    );
    d.style.cssText = [
      'position:fixed','inset:0','pointer-events:none','z-index:-1',
      'background-image:url("'+svg+'")',
      'background-size:180px 180px',
      'opacity:.035',
      'mix-blend-mode:overlay'
    ].join(';');
    document.body.appendChild(d);
  }

  /* ---------- Partículas neurodigitais (5 pontos drift) ---------- */
  /* Sutis pontos de glow que flutuam vagarosamente. Pure CSS, sem RAF. */
  function ensureParticles(){
    if (document.getElementById('npAmbientParticles')) return;
    if (reducedMotion) return; // não cria em motion reduzido
    var wrap = document.createElement('div');
    wrap.id = 'npAmbientParticles';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden';
    var palette = ['rgba(167,139,250,.5)', 'rgba(56,189,248,.4)', 'rgba(34,211,238,.35)', 'rgba(124,92,255,.45)', 'rgba(139,92,246,.4)'];
    // Em telas pequenas (~mobile baixo-end), reduz para 3 partículas — cada
    // partícula tem filter:blur(40px) e 5 podem pesar em GPU modesta.
    var maxParticles = (window.innerWidth < 520) ? 3 : 5;
    for (var i = 0; i < maxParticles; i++) {
      var p = document.createElement('div');
      p.className = 'np-particle';
      var x = (12 + i * 21 + (i % 2 ? 4 : -3)) + '%';
      var y = (8 + i * 18) + '%';
      var size = 220 + (i % 3) * 90; // px
      var color = palette[i % palette.length];
      var dur = 16 + i * 3; // 16..28s
      p.style.cssText = [
        'position:absolute',
        'left:'+x,'top:'+y,
        'width:'+size+'px','height:'+size+'px',
        'border-radius:50%',
        'background:radial-gradient(circle, '+color+', transparent 65%)',
        'filter:blur(40px)',
        'animation: npDrift '+dur+'s ease-in-out infinite',
        'animation-delay: '+(i*-2.4)+'s'
      ].join(';');
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
  }

  /* ---------- Bloom interno em cards (hover-reativo) ---------- */
  /* Em cards .card, .panel, .np-card, .scale-card etc. com data-np-bloom="on"
     (ou auto-detectado), adiciona um pseudo via class .np-bloom.
     Implementado via CSS para zero JS por frame. */
  function ensureBloomStyles(){
    if (document.getElementById('npAmbientBloomStyle')) return;
    var s = document.createElement('style');
    s.id = 'npAmbientBloomStyle';
    s.textContent = [
      '.np-bloom{position:relative;isolation:isolate}',
      '.np-bloom::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:linear-gradient(135deg,rgba(167,139,250,.0),rgba(56,189,248,.0));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;transition:background var(--motion-base, 200ms) var(--motion-ease, cubic-bezier(.2,.8,.2,1));pointer-events:none;z-index:1}',
      '.np-bloom:hover::before{background:linear-gradient(135deg,rgba(167,139,250,.55),rgba(56,189,248,.35))}',
      '.np-bloom::after{content:"";position:absolute;inset:auto -20% -40% -20%;height:60%;border-radius:50%;background:radial-gradient(circle, rgba(124,92,255,.18), transparent 60%);filter:blur(40px);opacity:0;transition:opacity var(--motion-base, 200ms) var(--motion-ease, cubic-bezier(.2,.8,.2,1));pointer-events:none;z-index:0}',
      '.np-bloom:hover::after{opacity:1}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function autoApplyBloom(){
    // Aplica .np-bloom em cards comuns sem opt-out
    var sel = '.card, .panel, .np-card, .scale-card, .result-card, .module-card, .entry-card';
    document.querySelectorAll(sel).forEach(function(el){
      if (el.dataset.npBloom === 'off') return;
      el.classList.add('np-bloom');
    });
  }

  function boot(){
    if (shouldSkip()) return;
    ensureBreathingAurora();
    ensureNoise();
    ensureParticles();
    ensureBloomStyles();
    autoApplyBloom();
    // re-aplica bloom em DOM dinâmico (cards injetados depois).
    // Debounce + auto-disconnect após 30s sem mudanças relevantes para evitar
    // leak em SPAs com churn de DOM contínuo.
    var debounceTimer = null;
    var disconnectTimer = null;
    var mo = new MutationObserver(function(muts){
      var added = muts.some(function(m){ return m.addedNodes && m.addedNodes.length; });
      if (!added) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(autoApplyBloom, 180);
      // reseta o timer de auto-disconnect
      clearTimeout(disconnectTimer);
      disconnectTimer = setTimeout(function(){
        try { mo.disconnect(); } catch (e) {}
      }, 30000);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // Limpeza definitiva no unload
    window.addEventListener('pagehide', function(){
      try { mo.disconnect(); } catch (e) {}
      clearTimeout(debounceTimer); clearTimeout(disconnectTimer);
    }, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
