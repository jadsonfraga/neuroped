(function(){
  'use strict';
  function svg(kind){
    if(kind==='star')return '<svg viewBox="0 0 120 120"><path d="M60 14l12 30 32 3-24 21 7 32-27-17-27 17 7-32-24-21 32-3z" fill="#fff7d6" stroke="#b8963e" stroke-width="5"/><circle cx="47" cy="50" r="4" fill="#2d2926"/><circle cx="73" cy="50" r="4" fill="#2d2926"/><path d="M47 65q13 10 26 0" fill="none" stroke="#1a6b65" stroke-width="5" stroke-linecap="round"/><path d="M83 72c9 4 12 12 7 18-4 5-12 3-13-4" fill="none" stroke="#8b2e3b" stroke-width="4" stroke-linecap="round"/></svg>';
    if(kind==='neuron')return '<svg viewBox="0 0 120 120"><circle cx="60" cy="58" r="24" fill="#d8eae8" stroke="#1a6b65" stroke-width="5"/><circle cx="51" cy="53" r="4" fill="#2d2926"/><circle cx="70" cy="53" r="4" fill="#2d2926"/><path d="M51 66q9 8 19 0" fill="none" stroke="#8b2e3b" stroke-width="4" stroke-linecap="round"/><path d="M35 40L18 25M85 42l18-14M34 75L18 92M84 76l18 16M60 33V12M60 83v25" stroke="#b8963e" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="25" r="6" fill="#fff7d6" stroke="#b8963e" stroke-width="3"/><circle cx="102" cy="28" r="6" fill="#fff7d6" stroke="#b8963e" stroke-width="3"/><circle cx="18" cy="92" r="6" fill="#fff7d6" stroke="#b8963e" stroke-width="3"/><circle cx="102" cy="92" r="6" fill="#fff7d6" stroke="#b8963e" stroke-width="3"/></svg>';
    return '<svg viewBox="0 0 120 120"><path d="M36 31c-13 0-23 11-23 25 0 12 7 21 17 24-1 14 10 25 24 23 6-1 11-4 15-8 4 5 11 8 18 7 13-2 21-14 18-27 8-5 13-14 12-24-1-14-13-24-27-22-4-11-14-18-26-17-12 1-22 9-28 19z" fill="#d8eae8" stroke="#1a6b65" stroke-width="5"/><circle cx="47" cy="55" r="4" fill="#2d2926"/><circle cx="75" cy="55" r="4" fill="#2d2926"/><path d="M49 70q13 10 27 0" fill="none" stroke="#8b2e3b" stroke-width="5" stroke-linecap="round"/><path d="M34 42q7-12 21-14M82 34q12 4 16 15" fill="none" stroke="#b8963e" stroke-width="4" stroke-linecap="round"/></svg>';
  }
  function style(){
    if(document.getElementById('np-premium-js-style'))return;
    var s=document.createElement('style');
    s.id='np-premium-js-style';
    s.textContent='.np-premium-mascot{position:absolute;right:18px;top:12px;width:88px;height:88px;opacity:.20;pointer-events:none;filter:drop-shadow(0 8px 18px rgba(45,41,38,.16));transform:rotate(1deg)}.np-premium-splash{position:fixed;inset:0;background:radial-gradient(circle at 50% 34%,rgba(184,150,62,.18),transparent 30%),linear-gradient(135deg,#faf8f4,#fffdf9 48%,#ecdfc9);z-index:2147483000;display:grid;place-items:center;transition:opacity .45s ease,visibility .45s ease}.np-premium-splash.hide{opacity:0;visibility:hidden}.np-premium-splash-card{background:rgba(255,253,249,.94);border:1px solid #eadcc7;border-radius:32px;padding:28px 30px;box-shadow:0 22px 70px rgba(45,41,38,.18);text-align:center;max-width:340px;position:relative}.np-premium-splash-card:before{content:"";position:absolute;inset:10px;border:1px solid rgba(26,107,101,.22);border-radius:24px;pointer-events:none}.np-premium-splash-title{font:700 34px/1.05 Georgia,serif;color:#8b2e3b;margin:10px 0 4px}.np-premium-splash-sub{font-size:13px;color:#6f6963;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.np-premium-note{margin-top:8px;font-size:12px;color:#6f6963}.np-page-ready{opacity:1}.np-premium-watermark{position:fixed;right:12px;bottom:12px;width:86px;height:86px;opacity:.055;pointer-events:none;z-index:0}@media (prefers-reduced-motion:reduce){.np-premium-splash{display:none!important}.np-premium-mascot{transform:none!important}}@media(max-width:560px){.np-premium-mascot{width:70px;height:70px;opacity:.14}}';
    document.head.appendChild(s);
  }
  function splash(){
    if(sessionStorage.getItem('np_splash_seen'))return;
    var d=document.createElement('div');d.className='np-premium-splash';d.innerHTML='<div class="np-premium-splash-card"><div style="width:88px;margin:auto">'+svg('brain')+'</div><div class="np-premium-splash-title">NeuroPed EDJ</div><div class="np-premium-splash-sub">ambiente clínico familiar</div><div class="np-premium-note">carregando com cuidado</div></div>';
    document.body.appendChild(d);sessionStorage.setItem('np_splash_seen','1');
    setTimeout(function(){d.classList.add('hide');setTimeout(function(){d.remove()},520)},900);
  }
  function mascots(){
    var items=document.querySelectorAll('.hero,.today-summary,.np-consulta-hero,.card,.panel');
    for(var i=0;i<items.length&&i<5;i++){
      var el=items[i];if(el.querySelector('.np-premium-mascot'))continue;
      if(getComputedStyle(el).position==='static')el.style.position='relative';
      var m=document.createElement('div');m.className='np-premium-mascot';m.innerHTML=svg(i%3===0?'brain':i%3===1?'neuron':'star');el.appendChild(m);
    }
    if(!document.querySelector('.np-premium-watermark')){var w=document.createElement('div');w.className='np-premium-watermark';w.innerHTML=svg('star');document.body.appendChild(w)}
  }
  function boot(){style();splash();mascots();document.documentElement.classList.add('np-page-ready');setTimeout(mascots,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();