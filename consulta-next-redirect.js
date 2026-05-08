(function(){
  'use strict';
  const KEY='neuroped_master_access_v1';
  const TTL=12*60*60*1000;
  function active(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v.ok&&Date.now()-Number(v.ts||0)<TTL}catch(e){return false}}
  function nextPath(){try{return new URLSearchParams(location.search).get('next')||''}catch(e){return''}}
  function go(){
    if(!/consulta\.html/i.test(location.pathname))return;
    const next=nextPath();
    if(!next||!active())return;
    const clean=String(next).replace(/^#+/,'');
    const target='./index.html#'+clean;
    const msg=document.getElementById('pinMsg');
    if(msg)msg.textContent='PIN correto. Abrindo a área solicitada...';
    setTimeout(function(){location.replace(target)},250);
  }
  function boot(){go();let n=0;const t=setInterval(function(){n++;go();if(active()||n>60)clearInterval(t)},300)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();