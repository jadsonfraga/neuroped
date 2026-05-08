(function(){
'use strict';
function boot(){
  if(!/consulta\.html/i.test(location.pathname))return;
  if(document.getElementById('consultaTabs'))return;
  var app=document.getElementById('app');
  if(!app)return;
  var nav=document.createElement('div');
  nav.id='consultaTabs';
  nav.className='no-print';
  nav.style.cssText='position:sticky;top:10px;z-index:20;margin:14px 0;padding:10px;border:1px solid #eadcc7;border-radius:22px;background:rgba(255,253,249,.92);backdrop-filter:blur(14px);box-shadow:0 12px 30px rgba(45,41,38,.08);display:flex;gap:8px;overflow:auto';
  var items=[['Resumo médico','Resumo'],['História e demanda','Anamnese'],['Instrumentos','Escalas'],['Prescrição','Prescrição'],['Laudos e relatórios','Laudos'],['Passe Familiar','Passe'],['Documentos','Documentos']];
  items.forEach(function(pair){var b=document.createElement('button');b.type='button';b.textContent=pair[1];b.style.cssText='white-space:nowrap;border:0;border-radius:999px;background:#fff;color:#1a6b65;border:1px solid #eadcc7;padding:9px 12px;font-weight:950;cursor:pointer';b.onclick=function(){var cards=[].slice.call(document.querySelectorAll('#app .card'));var card=cards.find(function(c){return (c.textContent||'').toLowerCase().includes(pair[0].toLowerCase())});if(card)card.scrollIntoView({behavior:'smooth',block:'start'});};nav.appendChild(b)});
  app.insertBefore(nav,app.firstChild);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,1000);
})();