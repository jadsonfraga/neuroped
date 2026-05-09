/* NeuroPed EDJ — Master Access Policy
   Objetivo: PIN master abre áreas restritas; portal da família fica livre para conteúdo educativo.
   Nota: em app estático, isto é controle de acesso de interface, não segurança criptográfica de servidor. */
(function(){
  'use strict';
  var MASTER_HASH='6f0960c4849c531799b84b6755bf2211ec6c9b0f14c9a992a346ac04407c7579';
  var KEY='neuroped_master_access_v1';
  var TTL=12*60*60*1000;
  var PUBLIC_FAMILY_LINKS=[
    ['Novidades em Saúde Infantil','#/portal-novidades'],
    ['Biblioteca Educativa','#/portal-biblioteca'],
    ['Psicoeducação','#/portal-psicoeducacao'],
    ['Guia de Terapias','#/guia-terapias'],
    ['Orientação Parental','#/orientacao-parental'],
    ['Marcos do Desenvolvimento','#/marcos-desenvolvimento'],
    ['Gerador de Rotinas','#/gerador-rotinas'],
    ['Testes Cognitivos','#/testes-cognitivos'],
    ['Conhecimentos Gerais','#/testes-conhecimentos-gerais'],
    ['FAQ da Família','#/portal-faq'],
    ['Recursos úteis','#/portal-recursos']
  ];
  var PRIVATE_LINKS=[
    ['Documentos pessoais','#/portal-documentos'],
    ['Chat / mensagens','#/portal-chat'],
    ['Acompanhamento armazenado','#/portal-acompanhamento'],
    ['Diário de conquistas','#/diario-conquistas'],
    ['Linha do tempo','#/linha-do-tempo'],
    ['Relatório da família','#/relatorio-familia'],
    ['Prontuário','#/prontuario'],
    ['Pacientes','#/pacientes'],
    ['Secretaria','#/secretaria']
  ];
  function clean(v){return String(v||'').replace(/\D/g,'');}
  async function sha256(str){
    var data=new TextEncoder().encode(str);
    var hash=await crypto.subtle.digest('SHA-256',data);
    return Array.from(new Uint8Array(hash)).map(function(b){return b.toString(16).padStart(2,'0')}).join('');
  }
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
  function write(){try{localStorage.setItem(KEY,JSON.stringify({ok:true,ts:Date.now()}))}catch(e){}}
  function clear(){try{localStorage.removeItem(KEY)}catch(e){}}
  function isUnlocked(){var v=read();return !!(v&&v.ok&&Date.now()-Number(v.ts||0)<TTL)}
  async function unlockIfPin(value){
    if(isUnlocked())return false;
    var c=clean(value);
    if(c.length<4 || c.length>16 || !crypto.subtle)return false;
    var h=await sha256(c);
    if(h===MASTER_HASH){write();announce('PIN master ativo. Acesso médico liberado neste navegador.');decorate();return true}
    return false;
  }
  function announce(msg){
    var id='np-master-toast',el=document.getElementById(id);
    if(!el){el=document.createElement('div');el.id=id;el.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:999999;background:#1a6b65;color:#fff;padding:12px 16px;border-radius:999px;font:700 13px system-ui;box-shadow:0 12px 30px rgba(0,0,0,.25)';document.body.appendChild(el)}
    el.textContent=msg;el.style.display='block';setTimeout(function(){el.style.display='none'},2600);
  }
  function path(){var h=location.hash||'';return h.charAt(0)==='#'?h.slice(1):h||'/'}
  function decorate(){
    document.documentElement.classList.toggle('np-master-unlocked',isUnlocked());
    var old=document.getElementById('np-master-badge');
    if(isUnlocked()){
      if(!old){var b=document.createElement('button');b.id='np-master-badge';b.type='button';b.textContent='🔓 Master ativo';b.title='Clique para encerrar o acesso master';b.style.cssText='position:fixed;right:12px;bottom:12px;z-index:999998;background:#1a6b65;color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:10px 12px;font:800 12px system-ui;box-shadow:0 10px 24px rgba(0,0,0,.24)';b.onclick=function(){clear();b.remove();decorate();announce('Acesso master encerrado.')};document.body.appendChild(b)}
    }else if(old){old.remove()}
    injectFamilyPanel();
  }
  function injectFamilyPanel(){
    var p=path();
    if(!/portal-familia|portal-familias/i.test(p))return;
    if(document.getElementById('np-family-free-panel'))return;
    var root=document.getElementById('root')||document.body;
    var panel=document.createElement('section');panel.id='np-family-free-panel';panel.style.cssText='max-width:760px;margin:16px auto;padding:18px;border-radius:24px;border:1px solid rgba(184,150,62,.45);background:linear-gradient(135deg,rgba(250,248,244,.96),rgba(255,253,249,.96));color:#2d2926;font-family:system-ui;box-shadow:0 12px 32px rgba(45,41,38,.18)';
    panel.innerHTML='<h2 style="margin:0 0 6px;color:#1a6b65;font-family:Georgia,serif">Portal da família — navegação livre</h2><p style="margin:0 0 12px;color:#6f6963">Conteúdos educativos e ferramentas gerais ficam livres. Dados pessoais armazenados, documentos, chat e prontuário exigem credencial familiar válida ou PIN master do médico.</p><div id="np-public-links" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-bottom:12px"></div><details style="background:#fff;border:1px solid #eadcc7;border-radius:16px;padding:10px"><summary style="font-weight:900;color:#8b2e3b;cursor:pointer">Áreas protegidas</summary><div id="np-private-links" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-top:10px"></div></details>';
    var target=root.firstElementChild||root;root.insertBefore(panel,target);
    function link(txt,href,priv){var a=document.createElement('a');a.textContent=(priv?'🔒 ':'✨ ')+txt;a.href=href;a.style.cssText='display:block;text-decoration:none;background:#fff;border:1px solid #eadcc7;border-radius:14px;padding:10px 12px;color:'+(priv?'#8b2e3b':'#1a6b65')+';font-weight:800';if(priv)a.onclick=function(ev){if(!isUnlocked()){ev.preventDefault();announce('Área protegida. Use o PIN master ou credencial familiar.')}};return a}
    var pub=panel.querySelector('#np-public-links'),pri=panel.querySelector('#np-private-links');PUBLIC_FAMILY_LINKS.forEach(function(x){pub.appendChild(link(x[0],x[1],false))});PRIVATE_LINKS.forEach(function(x){pri.appendChild(link(x[0],x[1],true))});
  }
  function eligible(el){return el&&el.tagName==='INPUT'&&el.type!=='checkbox'&&el.type!=='radio'&&el.type!=='file'&&el.type!=='button'&&el.type!=='submit'&&el.type!=='hidden'}
  function watchInputs(){
    document.addEventListener('input',function(ev){if(isUnlocked())return;var el=ev.target;if(!eligible(el))return;unlockIfPin(el.value)},true);
    document.addEventListener('submit',function(){if(isUnlocked())return;document.querySelectorAll('input').forEach(function(i){if(eligible(i))unlockIfPin(i.value)})},true);
  }
  window.NeuroPedMasterAccess={isUnlocked:isUnlocked,unlockIfPin:unlockIfPin,clear:clear,decorate:decorate};
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){watchInputs();decorate()})}else{watchInputs();decorate()}
  window.addEventListener('hashchange',function(){setTimeout(decorate,120)});
  setInterval(decorate,15000);
})();