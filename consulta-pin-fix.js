(function(){
  'use strict';
  function fixKeyboard(){
    const pin=document.getElementById('pin');
    if(!pin)return;
    pin.type='password';
    pin.setAttribute('inputmode','numeric');
    pin.setAttribute('autocomplete','current-password');
    pin.setAttribute('autocapitalize','none');
    pin.setAttribute('autocorrect','off');
    pin.setAttribute('spellcheck','false');
    pin.setAttribute('enterkeyhint','go');
    pin.placeholder='Digite o PIN master';
    if(!pin.dataset.pinFix){
      pin.dataset.pinFix='1';
      pin.addEventListener('keydown',function(e){if(e.key==='Enter'&&typeof window.unlock==='function')window.unlock()});
    }
  }
  function boot(){
    if(!/consulta\.html/i.test(location.pathname))return;
    fixKeyboard();
    setTimeout(fixKeyboard,500);
    setTimeout(fixKeyboard,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
