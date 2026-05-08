(function(){
  'use strict';
  function focusPin(){
    var pin=document.getElementById('pin');
    if(pin){
      pin.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(function(){pin.focus()},250);
    }
  }
  function boot(){
    if(!/consulta\.html/i.test(location.pathname)) return;
    if(document.getElementById('consultaSafeExit')) return;
    var locked=document.querySelector('.locked-view');
    if(!locked) return;
    var bar=document.createElement('div');
    bar.id='consultaSafeExit';
    bar.style.cssText='margin:0 0 16px;padding:14px;border:1px solid #eadcc7;border-radius:22px;background:linear-gradient(135deg,#fffdf9,#fff7e8);box-shadow:0 12px 32px rgba(45,41,38,.09);display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap';
    bar.innerHTML='<div style="font-weight:950;color:#2d2926;line-height:1.3">Entrou aqui por engano?<div style="font-size:12px;color:#6f6963;font-weight:700;margin-top:2px">Escolha voltar ao conteúdo familiar ou digitar o PIN master.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a href="./portal-familia-livre.html" style="text-decoration:none;background:#b8963e;color:white;border-radius:14px;padding:12px 14px;font-weight:950;box-shadow:0 10px 24px rgba(184,150,62,.20)">← Voltar para conteúdo educacional</a><button id="consultaTryPin" type="button" style="border:0;background:#1a6b65;color:white;border-radius:14px;padding:12px 14px;font-weight:950;box-shadow:0 10px 24px rgba(26,107,101,.20);cursor:pointer">Digitar PIN master</button></div>';
    locked.insertBefore(bar, locked.firstChild);
    var btn=document.getElementById('consultaTryPin');
    if(btn) btn.onclick=focusPin;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot,600);
})();