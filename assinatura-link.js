(function(){
  'use strict';
  const MASTER_KEY='neuroped_master_access_v1';
  const TTL=12*60*60*1000;
  function master(){try{const v=JSON.parse(localStorage.getItem(MASTER_KEY)||'{}');return v.ok&&Date.now()-Number(v.ts||0)<TTL}catch(e){return false}}
  function boot(){
    if(!/consulta\.html/i.test(location.pathname))return;
    if(!master())return;
    if(document.getElementById('assinaturaDigitalShortcut'))return;
    const grid=document.querySelector('#app .grid')||document.querySelector('section#app .grid');
    if(!grid)return;
    const card=document.createElement('div');
    card.id='assinaturaDigitalShortcut';
    card.className='card span12 no-print';
    card.style.border='2px solid rgba(26,107,101,.22)';
    card.innerHTML='<h2>Assinatura digital</h2><p class="muted">Prepare o documento, gere hash SHA-256, registre localmente e confira PDF assinado. A assinatura ICP-Brasil deve ser feita em ambiente seguro externo ou backend próprio.</p><div class="actions"><a class="btn gold" href="./assinatura-digital.html">🔏 Abrir central de assinatura digital</a></div>';
    grid.insertBefore(card,grid.firstChild);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setInterval(boot,1200);
})();