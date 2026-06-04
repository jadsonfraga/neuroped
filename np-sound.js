/* ============================================================
   NeuroPed EDJ — np-sound.js · Camada de feedback sensorial
   ============================================================
   Som de interface premium (Web Audio — sintetizado, sem arquivos:
   funciona offline e ocupa ~0kb de assets), + háptico leve + um
   pulso visual sutil nos momentos de vitória.

   Princípios (contexto clínico):
     - OPT-IN: nasce DESLIGADO (consultório/sala de espera). Toggle flutuante
       persiste a escolha em localStorage (np_sound_v1).
     - Sutil e curto: tons suaves, ganho baixo, filtro warm. Nunca intrusivo.
     - Complementa, nunca substitui o feedback visual (acessibilidade).
     - Idempotente (window.__npSound), respeita PRINT e aba oculta.
     - API: window.npSound.{tap,nav,success,error,celebrate,toggle,on,off,enabled}

   Carrega via app-polish-mobile (injeção global) ou <script src="./np-sound.js" defer>.
   ============================================================ */
(function () {
  'use strict';
  if (window.__npSound) return; window.__npSound = true;

  var KEY = 'np_sound_v1';
  var enabled = false;
  try { enabled = localStorage.getItem(KEY) === '1'; } catch (e) {}

  var ctx = null, master = null, filt = null;
  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 5200; // warm
    master = ctx.createGain(); master.gain.value = 0.08;                                  // sempre baixo
    filt.connect(master); master.connect(ctx.destination);
    return ctx;
  }

  // Um tom curto com envelope (ataque/queda) suave.
  function tone(freq, dur, type, gain, delay) {
    var c = audio(); if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    var peak = (gain == null ? 0.6 : gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);          // ataque rápido
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);          // queda suave
    o.connect(g); g.connect(filt);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function chord(notes, dur, type, gain, stagger) {
    notes.forEach(function (f, i) { tone(f, dur, type, gain, (stagger || 0) * i); });
  }
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  function gate() { return enabled && !document.hidden && !matchMedia('print').matches; }

  var S = {
    tap:       function () { if (gate()) tone(660, 0.05, 'sine', 0.5); },
    nav:       function () { if (gate()) { tone(523, 0.06, 'sine', 0.5); tone(392, 0.10, 'sine', 0.4, 0.04); } },
    success:   function () { if (gate()) { chord([659.25, 987.77], 0.18, 'sine', 0.5, 0.06); haptic(12); } },
    error:     function () { if (gate()) { tone(196, 0.18, 'triangle', 0.5); tone(185, 0.22, 'triangle', 0.4, 0.06); haptic([8, 40, 8]); } },
    celebrate: function () { if (gate()) { chord([523.25, 659.25, 783.99, 1046.5], 0.22, 'sine', 0.55, 0.075); haptic(18); pulse(); } },
    welcome:   function () { if (gate()) chord([392.00, 523.25, 659.25, 783.99], 0.26, 'sine', 0.5, 0.09); }   // assinatura de boas-vindas
  };

  // Pulso visual sutil (só em vitórias grandes) — glow radial que aparece e some.
  function pulse() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:fixed;inset:0;z-index:99990;pointer-events:none;opacity:0;' +
      'background:radial-gradient(60% 50% at 50% 42%,rgba(124,118,210,.22),transparent 70%);' +
      'transition:opacity .25s ease';
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.style.opacity = '1'; });
    setTimeout(function () { d.style.opacity = '0'; }, 280);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 700);
  }

  function setEnabled(v, announce) {
    enabled = !!v;
    try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) {}
    paintToggle();
    if (enabled && announce) { audio(); S.success(); }   // confirma audível ao ligar
  }

  // Toggle flutuante premium (pílula de vidro), canto inferior-esquerdo.
  var btn = null;
  function paintToggle() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.setAttribute('aria-label', enabled ? 'Desativar sons da interface' : 'Ativar sons da interface');
    btn.title = enabled ? 'Som da interface: ligado' : 'Som da interface: desligado';
    btn.textContent = enabled ? '🔊' : '🔇';
    btn.style.opacity = enabled ? '1' : '.66';
  }
  function mountToggle() {
    if (btn || !document.body) return;
    if (document.body.hasAttribute('data-np-sound') && document.body.getAttribute('data-np-sound') === 'off') return;
    btn = document.createElement('button');
    btn.id = 'np-sound-toggle'; btn.type = 'button';
    btn.style.cssText = 'position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:99985;' +
      'width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:17px;cursor:pointer;' +
      'background:rgba(20,19,46,.66);color:#ECEAFF;border:1px solid rgba(169,164,255,.28);' +
      'backdrop-filter:blur(12px) saturate(130%);-webkit-backdrop-filter:blur(12px) saturate(130%);' +
      'box-shadow:0 12px 30px -12px rgba(4,3,18,.7);transition:transform .15s ease,opacity .2s,box-shadow .2s';
    btn.addEventListener('pointerdown', function () { btn.style.transform = 'scale(.92)'; });
    btn.addEventListener('pointerup', function () { btn.style.transform = ''; });
    btn.addEventListener('click', function () { setEnabled(!enabled, true); });
    document.body.appendChild(btn);
    paintToggle();
  }

  // Auto-wiring: cliques em CTAs → tap; toasts → success/error; evento de celebração.
  function wire() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('button, a.open, a.feat, .feat, .np-btn, .btn, .acts a, .tl-redo, .sh-tab');
      if (a && a.id !== 'np-sound-toggle') S.tap();
    }, true);

    // toca junto com o toast (npToast), inferindo sucesso/erro pelo texto/classe
    function hookToast() {
      var orig = window.npToast;
      if (typeof orig !== 'function' || orig.__npSoundWrapped) return false;
      var wrapped = function (msg, kind) {
        try {
          var s = ((kind || '') + ' ' + (msg || '')).toLowerCase();
          if (/erro|falh|inv[áa]lid|n[ãa]o foi|problema/.test(s)) S.error();
          else S.success();
        } catch (e) {}
        return orig.apply(this, arguments);
      };
      wrapped.__npSoundWrapped = true;
      window.npToast = wrapped;
      return true;
    }
    if (!hookToast()) { var n = 0, iv = setInterval(function () { if (hookToast() || n++ > 40) clearInterval(iv); }, 150); }

    // celebração (conclusão de escala etc.) — dispare window.dispatchEvent(new Event('np:celebrate'))
    window.addEventListener('np:celebrate', function () { S.celebrate(); });
    // primeira interação destrava o AudioContext (políticas de autoplay) e toca a
    // assinatura de boas-vindas uma vez por sessão (se o som estiver ligado).
    window.addEventListener('pointerdown', function once() {
      audio();
      try { if (enabled && !sessionStorage.getItem('np_welcomed')) { sessionStorage.setItem('np_welcomed', '1'); setTimeout(S.welcome, 140); } } catch (e) {}
      window.removeEventListener('pointerdown', once);
    }, { once: true });
  }

  window.npSound = {
    tap: S.tap, nav: S.nav, success: S.success, error: S.error, celebrate: S.celebrate, welcome: S.welcome,
    on: function () { setEnabled(true, true); }, off: function () { setEnabled(false); },
    toggle: function () { setEnabled(!enabled, true); },
    enabled: function () { return enabled; }
  };

  function init() { mountToggle(); wire(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
