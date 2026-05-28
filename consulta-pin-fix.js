(function(){
  'use strict';
  const MASTER_HASH='a327d31357810ae7bf2cc4f7c0bc7b332fd2a66a4afd2ab5a8ade69865b829cd';
  const MASTER_KEY='neuroped_master_access_v1';
  const TTL=12*60*60*1000;
  function normalizePin(v){return String(v||'').trim().toLowerCase()}
  async function sha(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalizePin(v)));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
  function setMaster(){localStorage.setItem(MASTER_KEY,JSON.stringify({ok:true,ts:Date.now()}))}
  function masterActive(){try{const v=JSON.parse(localStorage.getItem(MASTER_KEY)||'{}');return v.ok&&Date.now()-Number(v.ts||0)<TTL}catch(e){return false}}
  function fixKeyboard(){
    const pin=document.getElementById('pin');
    if(!pin)return;
    pin.type='password';
    pin.setAttribute('inputmode','text');
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
  window.unlock=async function(){
    const msg=document.getElementById('pinMsg');
    if(masterActive()){ if(typeof window.openApp==='function')window.openApp(); if(msg)msg.textContent='PIN master ativo. Consulta aberta.'; return; }
    const pin=document.getElementById('pin');
    if(msg)msg.textContent='Validando...';
    const h=await sha(pin&&pin.value);
    if(h===MASTER_HASH){
      setMaster();
      if(typeof window.openApp==='function')window.openApp();
      if(msg)msg.textContent='Master ativo.';
    }else{
      if(msg)msg.textContent='PIN não conferiu.';
    }
  };
  function boot(){
    if(!/consulta\.html/i.test(location.pathname))return;
    fixKeyboard();
    setTimeout(fixKeyboard,500);
    setTimeout(fixKeyboard,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();