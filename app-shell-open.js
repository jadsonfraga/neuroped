(function(){
  'use strict';
  if(window.NP_APP_SHELL_OPEN)return;window.NP_APP_SHELL_OPEN=true;
  var PAGES={
    'consulta-livre.html':['🩺','Consulta','Atendimento'],
    'filtro-escalas.html':['🧠','Escalas','Escolha inteligente'],
    'mapa-escalas.html':['🗺️','Mapa','Instrumentos'],
    'instrumento.html':['📋','Teste','Aplicação'],
    'comunicacao-alternativa.html':['💬','CAA','Comunicação'],
    'diario-escola-terapias-v2.html':['📒','Diário','Escola e terapias'],
    'assinatura-digital.html':['🔏','Assinatura','Documento'],
    'portal-familia-livre.html':['👨‍👩‍👧','Família','Portal'],
    'escalas.html':['✨','Hub','NeuroPed EDJ'],
    'central-atalhos.html':['✨','Mais','Central']
  };
  function pageKey(){var p=location.pathname.split('/').pop()||'escalas.html';return PAGES[p]?p:(/consulta\.html/i.test(p)?'consulta-livre.html':'escalas.html')}
  function info(){return PAGES[pageKey()]||PAGES['escalas.html']}
  function css(){
    if(document.getElementById('npPwaCss'))return;
    var l=document.createElement('link');l.id='npPwaCss';l.rel='stylesheet';l.href='./pwa-app-shell.css';document.head.appendChild(l);
  }
  function topbar(){
    if(document.getElementById('npPwaTopbar'))return;
    var i=info();
    var bar=document.createElement('header');bar.id='npPwaTopbar';bar.className='np-pwa-topbar np-pwa-fade';
    bar.innerHTML='<div class="np-pwa-brand"><div class="np-pwa-logo">'+i[0]+'</div><div><div class="np-pwa-title">'+i[1]+'</div><div class="np-pwa-sub">'+i[2]+' · NeuroPed EDJ</div></div></div><a class="np-pwa-chip" href="./consulta-livre.html">Abrir consulta</a>';
    document.body.insertBefore(bar,document.body.firstChild);
  }
  function dock(){
    if(document.getElementById('npAppDock'))return;
    var cur=location.pathname;
    var items=[['./consulta-livre.html','🩺','Consulta'],['./filtro-escalas.html','🧠','Escalas'],['./comunicacao-alternativa.html','💬','CAA'],['./diario-escola-terapias-v2.html','📒','Diário'],['./central-atalhos.html','✨','Mais']];
    var nav=document.createElement('nav');nav.id='npAppDock';nav.className='np-pwa-dock';
    nav.innerHTML=items.map(function(it){var active=cur.indexOf(it[0].replace('./','/'))>-1?' active':'';return '<a class="'+active+'" href="'+it[0]+'"><span>'+it[1]+'</span>'+it[2]+'</a>'}).join('');
    document.body.appendChild(nav);
  }
  function replaceConsultLinks(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href')||'';
      if(/(^|\/)consulta\.html(\?|#|$)/i.test(href))a.setAttribute('href','./consulta-livre.html');
      var txt=(a.textContent||'').toLowerCase();
      if(txt.includes('pin')||txt.includes('senha'))a.textContent=a.textContent.replace(/pin|senha/ig,'acesso');
    });
  }
  function polish(){
    document.documentElement.style.background='#faf8f4';
    document.body&&document.body.classList.add('np-pwa-app','np-open-app-look');
    document.querySelectorAll('main,.app,.wrap,.container').forEach(function(el){el.classList.add('np-pwa-fade')});
  }
  function boot(){css();polish();replaceConsultLinks();topbar();dock()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(boot,300);setTimeout(boot,900);setTimeout(boot,1800);
})();
