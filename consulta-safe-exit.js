(function(){
  'use strict';
  function boot(){
    if(!/consulta\.html/i.test(location.pathname)) return;
    if(document.getElementById('consultaSafeExit')) return;
    var locked=document.querySelector('.locked-view');
    if(!locked) return;
    var bar=document.createElement('div');
    bar.id='consultaSafeExit';
    bar.style.cssText='margin:0 0 16px;padding:14px;border:1px solid #eadcc7;border-radius:20px;background:linear-gradient(135deg,#fffdf9,#fff7e8);box-shadow:0 10px 28px rgba(45,41,38,.08);display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap';
    bar.innerHTML='<div style="font-weight:900;color:#2d2926">Entrou aqui por engano?</div><a href="./portal-familia-livre.html" style="text-decoration:none;background:#b8963e;color:white;border-radius:14px;padding:12px 14px;font-weight:950;box-shadow:0 10px 24px rgba(184,150,62,.20)">← Voltar para conteúdo educacional</a>';
    locked.insertBefore(bar, locked.firstChild);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot,600);
})();