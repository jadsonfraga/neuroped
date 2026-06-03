/* ============================================================
   NeuroPed EDJ — instrumento-celebrations.js
   ------------------------------------------------------------
   Micro-celebrações de progresso em instrumento.html / escala.html.

   Hook: monitora a contagem de respostas e dispara um pulse + frase
   em 25 %, 50 %, 75 % e 100 % do total — sem interromper o fluxo,
   sem auto-fechar caixa, sem áudio.

   Filosofia:
     - Toque sutil (fade in/out de 2 s)
     - Respeita prefers-reduced-motion (sem animação)
     - Idempotente (cada milestone só dispara uma vez por sessão)
     - Aria-live polite para acessibilidade
   ============================================================ */
(function(){
  'use strict';
  if (window.__npInstCelebrate) return;
  window.__npInstCelebrate = true;

  var MILESTONES = [
    { pct: 25,  emoji: '🌱', msg: 'Boa! 1/4 das perguntas respondidas.' },
    { pct: 50,  emoji: '⭐', msg: 'Metade do caminho. Já dá pra ver o desenho.' },
    { pct: 75,  emoji: '🚀', msg: 'Quase lá — 3/4 prontos!' },
    { pct: 100, emoji: '🏆', msg: 'Pronto! Tudo respondido. Gera o laudo embaixo.' }
  ];
  var fired = {};
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pulse(emoji, msg){
    var existing = document.getElementById('npCelebToast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.id = 'npCelebToast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.style.cssText = [
      'position:fixed','top:50%','left:50%','transform:translate(-50%,-50%) scale(.85)',
      'z-index:99999','padding:20px 28px',
      'background:linear-gradient(135deg,rgba(124,118,210,.92),rgba(91,84,232,.95))',
      'color:#fff','border-radius:24px',
      'box-shadow:0 30px 70px -15px rgba(91,84,232,.6),inset 0 1px 0 rgba(255,255,255,.18)',
      'font:800 16px/1.3 "Inter",system-ui',
      'display:flex','flex-direction:column','align-items:center','gap:10px',
      'min-width:240px','max-width:80vw','text-align:center',
      'opacity:0',
      reducedMotion ? '' : 'transition:opacity .35s ease,transform .55s cubic-bezier(.18,.89,.32,1.28)',
      'pointer-events:none','backdrop-filter:blur(20px)','-webkit-backdrop-filter:blur(20px)'
    ].join(';');
    t.innerHTML =
      '<span aria-hidden="true" style="font-size:46px;line-height:1">' + emoji + '</span>' +
      '<span>' + msg + '</span>';
    document.body.appendChild(t);
    requestAnimationFrame(function(){
      t.style.opacity = '1';
      t.style.transform = 'translate(-50%,-50%) scale(1)';
    });
    setTimeout(function(){
      t.style.opacity = '0';
      t.style.transform = 'translate(-50%,-50%) scale(.95)';
      setTimeout(function(){ if (t.parentNode) t.remove(); }, 400);
    }, 1900);
  }

  function checkMilestones(){
    var ans = document.getElementById('answered');
    var total = (window.inst && window.inst.plain_questions && window.inst.plain_questions.length) ||
                document.querySelectorAll('#questions .item').length || 0;
    if (!ans || !total) return;
    var done = parseInt(ans.textContent, 10) || 0;
    var pct = Math.round(100 * done / total);
    MILESTONES.forEach(function(m){
      if (!fired[m.pct] && pct >= m.pct) {
        fired[m.pct] = true;
        pulse(m.emoji, m.msg);
      }
    });
  }

  function observe(){
    var ans = document.getElementById('answered');
    if (!ans) return;
    var mo = new MutationObserver(function(){
      // debounce — várias mutations agrupadas em 1 check
      clearTimeout(mo.__t);
      mo.__t = setTimeout(checkMilestones, 80);
    });
    mo.observe(ans, { childList: true, characterData: true, subtree: true });
    window.addEventListener('pagehide', function(){
      try { mo.disconnect(); } catch(e){}
    }, { once: true });
  }

  function boot(){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (document.getElementById('answered')) {
        observe();
        clearInterval(t);
      } else if (tries > 50) clearInterval(t);
    }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
