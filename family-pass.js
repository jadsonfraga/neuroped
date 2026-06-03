(function(){
  'use strict';
  const PASS_KEY='neuroped_family_pass_v1';
  const PASS_VERSION='NFAM1';
  const PASS_SALT='neuro-ped-edj-family-pass-public-content-v1';
  const DAYS=120;
  function b64url(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function fromB64url(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return decodeURIComponent(escape(atob(s)))}
  async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function fmtDate(iso){try{return new Date(iso).toLocaleDateString('pt-BR')}catch(e){return iso||''}}
  async function makePass(data){
    const now=new Date();
    const payload={v:PASS_VERSION,child:norm(data.child||'Família'),responsible:norm(data.responsible||''),issued:now.toISOString(),expires:addDays(now,DAYS).toISOString(),scope:'public-family-navigation',note:'Nao libera documentos, mensagens, prontuario, linha do tempo clinica ou dados sensiveis.'};
    const raw=b64url(JSON.stringify(payload));
    const sig=(await sha(raw+'|'+PASS_SALT)).slice(0,16).toUpperCase();
    return PASS_VERSION+'-'+raw+'-'+sig;
  }
  async function validatePass(code){
    try{
      code=String(code||'').trim().replace(/\s+/g,'');
      const parts=code.split('-');
      if(parts.length<3||parts[0]!==PASS_VERSION)throw new Error('Formato inválido.');
      const raw=parts.slice(1,-1).join('-');
      const sig=parts[parts.length-1].toUpperCase();
      const expected=(await sha(raw+'|'+PASS_SALT)).slice(0,16).toUpperCase();
      if(sig!==expected)throw new Error('Código não conferiu.');
      const payload=JSON.parse(fromB64url(raw));
      if(payload.v!==PASS_VERSION)throw new Error('Versão incompatível.');
      if(new Date(payload.expires).getTime()<Date.now())throw new Error('Passe vencido.');
      return {ok:true,payload};
    }catch(e){return {ok:false,error:e.message||'Código inválido.'}}
  }
  function savePass(payload,code){localStorage.setItem(PASS_KEY,JSON.stringify({ok:true,code,child:payload.child||'Família',responsible:payload.responsible||'',issued:payload.issued,expires:payload.expires,scope:payload.scope,ts:Date.now()}))}
  function currentPass(){try{const v=JSON.parse(localStorage.getItem(PASS_KEY)||'{}');if(!v.ok||!v.expires)return null;if(new Date(v.expires).getTime()<Date.now())return null;return v}catch(e){return null}}
  function clearPass(){localStorage.removeItem(PASS_KEY)}
  function renderBadge(){
    const pass=currentPass();
    document.querySelectorAll('[data-family-pass-badge]').forEach(function(el){
      if(pass){el.textContent='Passe familiar ativo até '+fmtDate(pass.expires);el.classList.add('family-pass-active')}
      else{el.textContent='Passe familiar não ativado';el.classList.remove('family-pass-active')}
    });
  }
  window.NeuroPedFamilyPass={make:makePass,validate:validatePass,save:savePass,current:currentPass,clear:clearPass,renderBadge:renderBadge,fmtDate:fmtDate,days:DAYS};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderBadge);else renderBadge();
})();