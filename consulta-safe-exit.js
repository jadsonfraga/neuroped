(function(){
  'use strict';
  function focusPin(){
    var pin=document.getElementById('pin');
    if(pin){ pin.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(function(){pin.focus()},220); }
  }
  function removeInitialReturn(){
    var old=document.getElementById('consultaSafeExit');
    if(old && old.getAttribute('data-mode')!=='after-fail') old.remove();
  }
  function showReturnAfterFail(){
    if(!/consulta\.html/i.test(location.pathname)) return;
    var locked=document.querySelector('.locked-view');
    if(!locked) return;
    var existing=document.getElementById('consultaSafeExit');
    if(existing) return;
    var bar=document.createElement('div');
    bar.id='consultaSafeExit';
    bar.setAttribute('data-mode','after-fail');
    bar.style.cssText='margin:0 0 16px;padding:14px;border:1px solid #fecaca;border-radius:22px;background:#fff7f7;box-shadow:0 12px 32px rgba(45,41,38,.09);display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap';
    bar.innerHTML='<div style="font-weight:950;color:#7f1d1d;line-height:1.3">Senha não conferiu.<div style="font-size:12px;color:#6f6963;font-weight:700;margin-top:2px">Tente novamente ou volte ao conteúdo educacional.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="consultaTryPinAgain" type="button" style="border:0;background:#1a6b65;color:white;border-radius:14px;padding:12px 14px;font-weight:950;cursor:pointer">Tentar novamente</button><a href="./portal-familia-livre.html" style="text-decoration:none;background:#b8963e;color:white;border-radius:14px;padding:12px 14px;font-weight:950">Voltar para conteúdo educacional</a></div>';
    locked.insertBefore(bar, locked.firstChild);
    var btn=document.getElementById('consultaTryPinAgain');
    if(btn) btn.onclick=focusPin;
  }
  function watch(){
    removeInitialReturn();
    var msg=document.getElementById('pinMsg');
    if(!msg) return;
    var check=function(){ if(/não conferiu|nao conferiu|Senha não|Senha nao/i.test(msg.textContent||'')) showReturnAfterFail(); };
    check();
    new MutationObserver(check).observe(msg,{childList:true,subtree:true,characterData:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch); else watch();
  setTimeout(watch,600);
})();