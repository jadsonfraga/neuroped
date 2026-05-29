/* =====================================================================
   NeuroPed EDJ — Splash Premium  ·  abertura cinematográfica + mascotes
   Overlay injetado o quanto antes; cobre o carregamento (e o splash interno
   do app) e revela o dashboard com fade. Aurora animada, logo com glow,
   mascotes fofinhos flutuando, shimmer. Some sozinho (com timeout de
   segurança) — jamais trava o app.
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npSplash) return; window.__npSplash = true;

  var css = ''
    + '#np-splash{position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;'
    +   'background:radial-gradient(1100px 700px at 12% -10%,hsl(243 85% 56% / .55),transparent 60%),'
    +   'radial-gradient(1000px 700px at 100% 0%,hsl(266 80% 56% / .45),transparent 56%),'
    +   'radial-gradient(1200px 900px at 50% 120%,hsl(206 92% 56% / .35),transparent 60%),'
    +   'linear-gradient(160deg,#0a0a16,#0e0e22 60%,#0a0a16);background-size:200% 200%;animation:npsAurora 12s ease-in-out infinite;'
    +   'opacity:1;transition:opacity .7s ease,visibility .7s ease}'
    + '#np-splash.np-hide{opacity:0;visibility:hidden;pointer-events:none}'
    + '#np-splash .nps-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:18px;animation:npsRise .9s cubic-bezier(.22,.8,.2,1) both}'
    + '#np-splash .nps-logo{width:108px;height:108px;border-radius:30px;object-fit:cover;box-shadow:0 22px 60px -10px hsl(243 85% 55% / .8),0 0 0 1px rgba(255,255,255,.08) inset;animation:npsPop .8s cubic-bezier(.16,1,.3,1) both,npsFloat 4.5s ease-in-out 1s infinite}'
    + '#np-splash .nps-ring{position:absolute;top:-14px;left:50%;width:160px;height:160px;margin-left:-80px;border-radius:50%;border:2px solid hsl(243 85% 70% / .5);box-shadow:0 0 40px hsl(243 85% 66% / .5);animation:npsRing 2.4s ease-in-out infinite;pointer-events:none}'
    + '#np-splash .nps-name{font:800 30px/1 "DM Sans",Inter,system-ui,sans-serif;letter-spacing:-.02em;background:linear-gradient(110deg,#a9a4ff,#d9b3ff 50%,#a9a4ff);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:200% auto;animation:npsShine 3s linear infinite,npsRise .9s .15s both}'
    + '#np-splash .nps-sub{font:600 13px "DM Sans",Inter,sans-serif;color:#b9b9e6;letter-spacing:.02em;margin-top:-8px;animation:npsRise .9s .25s both}'
    + '#np-splash .nps-mascots{display:flex;gap:14px;font-size:26px;margin-top:4px}'
    + '#np-splash .nps-mascots span{display:inline-block;animation:npsBounce 1.8s ease-in-out infinite}'
    + '#np-splash .nps-mascots span:nth-child(2){animation-delay:.2s}'
    + '#np-splash .nps-mascots span:nth-child(3){animation-delay:.4s}'
    + '#np-splash .nps-mascots span:nth-child(4){animation-delay:.6s}'
    + '#np-splash .nps-mascots span:nth-child(5){animation-delay:.8s}'
    + '#np-splash .nps-bar{width:170px;height:5px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:6px}'
    + '#np-splash .nps-bar i{display:block;height:100%;width:40%;border-radius:99px;background:linear-gradient(90deg,transparent,hsl(243 90% 72%),transparent);animation:npsBar 1.3s ease-in-out infinite}'
    + '#np-splash .nps-p{position:absolute;pointer-events:none;opacity:0;animation:npsParticle linear infinite}'
    + '@keyframes npsAurora{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}'
    + '@keyframes npsRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'
    + '@keyframes npsPop{from{opacity:0;transform:scale(.6) rotate(-8deg)}to{opacity:1;transform:scale(1) rotate(0)}}'
    + '@keyframes npsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}'
    + '@keyframes npsRing{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.12);opacity:.85}}'
    + '@keyframes npsShine{to{background-position:200% center}}'
    + '@keyframes npsBounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.12)}}'
    + '@keyframes npsBar{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}'
    + '@keyframes npsParticle{0%{opacity:0;transform:translateY(20px) scale(.6)}15%{opacity:.9}100%{opacity:0;transform:translateY(-120px) scale(1.1)}}'
    + '@media(prefers-reduced-motion:reduce){#np-splash *{animation:none!important}}';

  var style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  var s = document.createElement('div');
  s.id = 'np-splash';
  s.setAttribute('role', 'status');
  s.setAttribute('aria-label', 'Carregando NeuroPed EDJ');
  var mascots = ['🧠','🌟','🧩','🌈','⭐'];
  s.innerHTML =
      '<div class="nps-stage">'
    +   '<div style="position:relative"><div class="nps-ring"></div>'
    +   '<img class="nps-logo" src="./icon-512.png" alt="" onerror="this.style.display=\'none\'"></div>'
    +   '<div class="nps-name">NeuroPed EDJ</div>'
    +   '<div class="nps-sub">Dr. Jadson Fraga · Neuropediatria</div>'
    +   '<div class="nps-mascots">' + mascots.map(function(m){return '<span>'+m+'</span>';}).join('') + '</div>'
    +   '<div class="nps-bar"><i></i></div>'
    + '</div>';
  (document.body || document.documentElement).appendChild(s);

  // partículas fofas flutuando
  try {
    var glyphs = ['✨','⭐','🌟','💫','🫧'];
    for (var i = 0; i < 14; i++) {
      var p = document.createElement('div');
      p.className = 'nps-p';
      p.textContent = glyphs[i % glyphs.length];
      p.style.left = (Math.random()*100) + '%';
      p.style.bottom = '-30px';
      p.style.fontSize = (12 + Math.random()*16) + 'px';
      p.style.animationDuration = (4 + Math.random()*4) + 's';
      p.style.animationDelay = (Math.random()*3) + 's';
      s.appendChild(p);
    }
  } catch (e) {}

  function appReady(){
    var r = document.getElementById('root');
    if (!r) return false;
    var t = (document.body && document.body.innerText) || '';
    return r.children.length > 0 && r.innerText.trim().length > 60 && t.indexOf('143 Medicações') < 0;
  }

  var started = Date.now(), MIN = 1400, MAX = 5000, done = false;
  function hide(){
    if (done) return; done = true;
    var splash = document.getElementById('np-splash');
    if (!splash) return;
    splash.classList.add('np-hide');
    setTimeout(function(){ if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 800);
  }
  function tick(){
    var waited = Date.now() - started;
    if ((appReady() && waited >= MIN) || waited >= MAX) hide();
    else setTimeout(tick, 200);
  }
  if (document.readyState !== 'loading') setTimeout(tick, MIN);
  else window.addEventListener('DOMContentLoaded', function(){ setTimeout(tick, MIN); });
  // segurança absoluta
  window.addEventListener('load', function(){ setTimeout(hide, MAX); });
})();
