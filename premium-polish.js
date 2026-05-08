(function(){
  'use strict';
  function addCaption(){
    if(document.getElementById('npPremiumCaption'))return;
    var target=document.querySelector('.hero,.today-summary,.np-consulta-hero,.wrap .card,.panel');
    if(!target)return;
    var cap=document.createElement('div');
    cap.id='npPremiumCaption';
    cap.className='np-premium-quiet-caption';
    cap.textContent='NeuroPed EDJ · cuidado, clareza e organização';
    target.insertBefore(cap,target.firstChild);
  }
  function refineCards(){
    var cards=document.querySelectorAll('.card,.tool,.panel');
    for(var i=0;i<cards.length&&i<14;i++){
      var c=cards[i];
      if(c.dataset.npPolished)return;
      c.dataset.npPolished='1';
      if(i%4===0){var d=document.createElement('div');d.className='np-premium-divider';c.appendChild(d)}
    }
  }
  function addContextChips(){
    if(document.getElementById('npPremiumChipline'))return;
    var isFamily=/portal|area-filho/i.test(location.pathname);
    var isClinic=/consulta/i.test(location.pathname);
    var isScale=/filtro|mapa|escala/i.test(location.pathname);
    var labels=isClinic?['PIN master','uso médico','consulta organizada']:isFamily?['sem CPF','ferramentas locais','dados sensíveis protegidos']:isScale?['idade','sintoma','respondente']:['premium','offline','clínico'];
    var hero=document.querySelector('.hero,.np-consulta-hero,.wrap .card,.panel');
    if(!hero)return;
    var line=document.createElement('div');line.id='npPremiumChipline';line.className='np-premium-chipline';
    labels.forEach(function(x){var s=document.createElement('span');s.textContent=x;line.appendChild(s)});
    hero.appendChild(line);
  }
  function externalSafe(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href')||'';
      if(/^https?:\/\//.test(href)&&!a.hasAttribute('rel'))a.setAttribute('rel','noopener noreferrer');
    });
  }
  function boot(){addCaption();addContextChips();refineCards();externalSafe();setTimeout(function(){addCaption();addContextChips();refineCards()},1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();