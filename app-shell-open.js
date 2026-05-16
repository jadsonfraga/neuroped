(function(){
  'use strict';
  if(window.NP_APP_SHELL_OPEN)return;window.NP_APP_SHELL_OPEN=true;
  function isProdPage(){return /\/(consulta|portal-familia-livre|filtro-escalas|mapa-escalas|instrumento|comunicacao-alternativa|diario-escola-terapias-v2|assinatura-digital|escalas|central-atalhos)\.html/i.test(location.pathname)}
  function dock(){
    if(!isProdPage()||document.getElementById('npAppDock'))return;
    var style=document.createElement('style');style.id='npAppDockStyle';style.textContent='body{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}.np-app-dock{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9999;background:rgba(250,248,244,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid #eadcc7;border-radius:26px;padding:8px;display:flex;gap:6px;box-shadow:0 18px 52px rgba(45,41,38,.14);max-width:calc(100vw - 18px);font-family:system-ui,-apple-system,Segoe UI,sans-serif}.np-app-dock a{min-width:72px;min-height:54px;border-radius:18px;text-decoration:none;color:#6f6963;font-size:11px;font-weight:900;display:grid;place-items:center;text-align:center}.np-app-dock a span{font-size:20px}.np-app-dock a.active{background:rgba(26,107,101,.09);color:#1a6b65}@media(max-width:680px){.np-app-dock{width:calc(100vw - 18px);justify-content:space-around}.np-app-dock a{min-width:0;flex:1}}';document.head.appendChild(style);
    var cur=location.pathname;
    var items=[['./consulta-livre.html','🩺','Consulta'],['./filtro-escalas.html','🧠','Escalas'],['./comunicacao-alternativa.html','💬','CAA'],['./diario-escola-terapias-v2.html','📒','Diário'],['./central-atalhos.html','✨','Mais']];
    var nav=document.createElement('nav');nav.id='npAppDock';nav.className='np-app-dock';nav.innerHTML=items.map(function(it){var active=cur.indexOf(it[0].replace('./','/'))>-1?' active':'';return '<a class="'+active+'" href="'+it[0]+'"><span>'+it[1]+'</span>'+it[2]+'</a>'}).join('');document.body.appendChild(nav);
  }
  function replaceConsultLinks(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href')||'';
      if(/(^|\/)consulta\.html(\?|#|$)/i.test(href))a.setAttribute('href','./consulta-livre.html');
      var txt=(a.textContent||'').toLowerCase();
      if(txt.includes('pin')||txt.includes('senha')){a.textContent=a.textContent.replace(/pin|senha/ig,'acesso');}
    });
  }
  function appLike(){
    document.documentElement.style.background='#faf8f4';
    document.body&&document.body.classList.add('np-open-app-look');
  }
  function boot(){appLike();replaceConsultLinks();dock()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(boot,500);setTimeout(boot,1500);
})();
