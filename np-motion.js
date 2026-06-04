/* ============================================================================
   np-motion.js — Motion system Apple-grade (Web Animations API + haptic)
   ----------------------------------------------------------------------------
   Spec: PROMPT MESTRE 7.8→9.8, §3.4. Puro, sem dependências.
   window.NPMotion (browser) + module.exports (teste em Node).
   Curvas/durações leem de np-tokens.css; constantes-espelho aqui como fallback.
   Honra prefers-reduced-motion: troca movimento por crossfade ≤120ms, nunca
   desliga tudo. Toda chamada é defensiva (no-op fora do browser).
   ============================================================================ */
(function (root) {
  'use strict';

  // Espelho das curvas/durações dos tokens (fallback fora do browser/CSS).
  var EASE = {
    out:    'cubic-bezier(0.16, 1, 0.3, 1)',
    in:     'cubic-bezier(0.7, 0, 0.84, 0)',
    spring: 'cubic-bezier(0.32, 0.72, 0, 1)'
  };
  var DUR = { d1: 120, d2: 200, d3: 320, d4: 520, stagger: 60 };

  var hasDOM = typeof document !== 'undefined' && typeof window !== 'undefined';
  var canAnimate = hasDOM && typeof Element !== 'undefined' && !!Element.prototype.animate;

  // prefers-reduced-motion (reativo): o usuário pediu menos movimento.
  function reduced() {
    try { return !!(hasDOM && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }

  // animate(el, keyframes, opts): wrapper sobre el.animate com defaults Apple.
  // Em reduced-motion, colapsa para crossfade curto (sem transform/movimento).
  function animate(el, keyframes, opts) {
    if (!canAnimate || !el) return null;
    opts = opts || {};
    var dur = opts.duration != null ? opts.duration : DUR.d2;
    var easing = opts.easing || EASE.out;
    var kf = keyframes;
    if (reduced()) {
      // remove movimento: mantém só opacidade, encurta tempo.
      kf = stripMotion(keyframes);
      dur = Math.min(dur, DUR.d1);
      easing = EASE.out;
    }
    var anim = el.animate(kf, { duration: dur, easing: easing, fill: opts.fill || 'both', delay: opts.delay || 0 });
    // will-change só durante a transição (remove ao terminar) — perf.
    try {
      el.style.willChange = 'transform, opacity';
      anim.finished.then(clear, clear);
      function clear() { el.style.willChange = ''; }
    } catch (e) { /* finished pode rejeitar ao cancelar — ok */ }
    return anim;
  }

  // Remove propriedades de movimento (transform/translate) dos keyframes,
  // preservando opacidade — base do fallback de reduced-motion.
  function stripMotion(keyframes) {
    if (!Array.isArray(keyframes)) return keyframes;
    return keyframes.map(function (k) {
      var o = {};
      for (var p in k) if (p === 'opacity' || p === 'offset' || p === 'easing') o[p] = k[p];
      if (o.opacity == null) o.opacity = 1;
      return o;
    });
  }

  // stagger(els, opts): entrada em cascata (mount) — translateY+fade por filho.
  function stagger(els, opts) {
    if (!canAnimate) return;
    opts = opts || {};
    var list = toArray(els);
    var y = opts.y != null ? opts.y : 8;
    var dur = opts.duration || DUR.d3;
    var step = opts.step || DUR.stagger;
    list.forEach(function (el, i) {
      animate(el,
        [{ opacity: 0, transform: 'translateY(' + y + 'px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: dur, easing: EASE.out, delay: reduced() ? 0 : i * step });
    });
  }

  // pressable(el): feedback de toque (scale spring no press) + haptic leve.
  function pressable(el, opts) {
    if (!hasDOM || !el || el.__npPressable) return;
    el.__npPressable = true;
    opts = opts || {};
    var scale = opts.scale || 0.97;
    var down = function () {
      if (canAnimate && !reduced()) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + scale + ')' }], { duration: 80, easing: EASE.spring, fill: 'forwards' });
      if (opts.haptic !== false) haptic(8);
    };
    var up = function () {
      if (canAnimate && !reduced()) el.animate([{ transform: 'scale(' + scale + ')' }, { transform: 'scale(1)' }], { duration: DUR.d2, easing: EASE.out, fill: 'forwards' });
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  // countUp(el, to, opts): anima o número 0→to (scores, idades, contagens).
  function countUp(el, to, opts) {
    if (!hasDOM || !el) return;
    to = Number(to) || 0;
    opts = opts || {};
    var dur = opts.duration || 800;
    var prefix = opts.prefix || '', suffix = opts.suffix || '';
    if (reduced() || typeof requestAnimationFrame === 'undefined') { el.textContent = prefix + to + suffix; return; }
    var t0 = null;
    function frame(ts) {
      if (t0 == null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      // ease-out cúbico (espelha --np-ease-out)
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(to * e) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // haptic(pattern): vibração curta no PWA. Sempre defensivo.
  function haptic(pattern) {
    try { if (hasDOM && navigator && navigator.vibrate && !reduced()) navigator.vibrate(pattern); }
    catch (e) { /* sem suporte — ok */ }
  }

  function toArray(x) {
    if (!x) return [];
    if (typeof x.length === 'number' && typeof x !== 'string') return Array.prototype.slice.call(x);
    return [x];
  }

  var api = { version: '1.0.0', EASE: EASE, DUR: DUR, reduced: reduced, animate: animate, stagger: stagger, pressable: pressable, countUp: countUp, haptic: haptic };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NPMotion = api;
})(typeof window !== 'undefined' ? window : null);
