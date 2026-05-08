(function(){
  'use strict';
  const KEY='np_family_voucher_session_v1';
  const LIST_KEY='np_family_vouchers_issued_v1';
  const TTL_DAYS=120;
  const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
  function randomPart(n){const a=new Uint32Array(n);crypto.getRandomValues(a);let s='';for(let i=0;i<n;i++)s+=ALPHABET[a[i]%ALPHABET.length];return s}
  function format(code){code=norm(code);return code.replace(/(.{4})/g,'$1-').replace(/-$/,'')}
  async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
  function now(){return Date.now()}
  function addDays(ts,d){return ts+d*24*60*60*1000}
  function dateBR(ts){return new Date(ts).toLocaleDateString('pt-BR')}
  function loadList(){try{return JSON.parse(localStorage.getItem(LIST_KEY)||'[]')}catch(e){return[]}}
  function saveList(x){localStorage.setItem(LIST_KEY,JSON.stringify(x))}
  function session(){try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s.ok&&s.expiresAt&&now()<s.expiresAt)return s}catch(e){}return null}
  function clearSession(){localStorage.removeItem(KEY)}
  async function issueVoucher(meta){const raw='NF-'+randomPart(12);const code=format(raw);const issuedAt=now();const expiresAt=addDays(issuedAt,TTL_DAYS);const hash=await sha(norm(code));const item={hash,codePreview:code.slice(0,4)+'-••••-••••',issuedAt,expiresAt,child:meta&&meta.child?String(meta.child).slice(0,80):'',family:meta&&meta.family?String(meta.family).slice(0,80):'',notes:meta&&meta.notes?String(meta.notes).slice(0,160):''};const list=loadList();list.unshift(item);saveList(list.slice(0,80));return {code,issuedAt,expiresAt,expiresText:dateBR(expiresAt),days:TTL_DAYS}}
  async function validateVoucher(code){const hash=await sha(norm(code));const list=loadList();const found=list.find(x=>x.hash===hash);if(!found)return {ok:false,reason:'Voucher não encontrado neste aparelho.'};if(now()>found.expiresAt)return {ok:false,reason:'Voucher expirado em '+dateBR(found.expiresAt)+'.'};const s={ok:true,type:'family-voucher',hash,startedAt:now(),expiresAt:found.expiresAt,child:found.child||'',family:found.family||''};localStorage.setItem(KEY,JSON.stringify(s));return {ok:true,session:s,expiresText:dateBR(found.expiresAt)}}
  function remainingText(){const s=session();if(!s)return 'Sem acesso familiar ativo.';const d=Math.ceil((s.expiresAt-now())/(24*60*60*1000));return 'Acesso familiar ativo por mais '+d+' dia'+(d===1?'':'s')+' · até '+dateBR(s.expiresAt)}
  function canFamilyNavigate(){return !!session()}
  window.NPFamilyVoucher={issueVoucher,validateVoucher,session,clearSession,remainingText,canFamilyNavigate,loadList,format,dateBR,TTL_DAYS};
})();