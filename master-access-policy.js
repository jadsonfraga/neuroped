/* NeuroPed EDJ — Master Access Policy
   Objetivo: PIN master abre áreas restritas; portal da família fica livre para conteúdo educativo.
   Nota: em app estático, isto é controle de acesso de interface, não segurança criptográfica de servidor. */
(function(){
  'use strict';
  // Hash SHA-256 do PIN master (nunca o PIN em texto claro). ROTACIONÁVEL sem
  // editar este arquivo, definindo window.NEUROPED_MASTER_PIN_HASH antes dele.
  // PIN antigo (que constava no histórico do git) foi ROTACIONADO. Para trocar
  // por um de sua preferência:  printf "%s" "SEU_NOVO_PIN" | shasum -a 256
  // e cole o hash resultante abaixo (ou em window.NEUROPED_MASTER_PIN_HASH).
  var MASTER_HASH=(window.NEUROPED_MASTER_PIN_HASH||'REMOVIDO');
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
  function clean(v){return String(v||'').trim().toLowerCase();}
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
    // MODO PÚBLICO: PIN master DESATIVADO. O app é educacional e sem senhas;
    // áreas sensíveis ficam OCULTAS (public-mode.js), não protegidas por PIN.
    // Mantido como no-op para não quebrar chamadas legadas.
    return false;
    /* eslint-disable no-unreachable */
    if(isUnlocked())return false;
    var c=clean(value);
    if(c.length<4 || c.length>32 || !crypto.subtle)return false;
    var h=await sha256(c);
    if(h===MASTER_HASH){write();announce('PIN master ativo. Acesso médico liberado neste navegador.');decorate();return true}
    return false;
  }
  function announce(msg){
    var id='np-master-toast',el=document.getElementById(id);
    if(!el){el=document.createElement('div');el.id=id;el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:999999;background:linear-gradient(180deg,#6d6af5,#4f46e5);color:#fff;padding:12px 16px;border-radius:999px;font:700 13px system-ui;box-shadow:0 12px 30px rgba(4,3,18,.5)';document.body.appendChild(el)}
    el.textContent=msg;el.style.display='block';setTimeout(function(){el.style.display='none'},2600);
  }
  function path(){var h=location.hash||'';return h.charAt(0)==='#'?h.slice(1):h||'/'}
  function decorate(){
    document.documentElement.classList.toggle('np-master-unlocked',isUnlocked());
    // PIN master removido do app: sem badge flutuante e sem painel da família.
    var old=document.getElementById('np-master-badge'); if(old) old.remove();
    var fp=document.getElementById('np-family-free-panel'); if(fp) fp.remove();
  }
  function injectFamilyPanel(){
    var p=path();
    if(!/portal-familia|portal-familias/i.test(p))return;
    if(document.getElementById('np-family-free-panel'))return;
    var root=document.getElementById('root')||document.body;
    var panel=document.createElement('section');panel.id='np-family-free-panel';panel.style.cssText='max-width:760px;margin:16px auto;padding:18px;border-radius:24px;border:1px solid rgba(231,201,139,.35);background:linear-gradient(135deg,rgba(21,20,58,.96),rgba(20,19,42,.96));color:#ECEAFF;font-family:system-ui;box-shadow:0 12px 32px rgba(4,3,18,.5)';
    panel.innerHTML='<h2 style="margin:0 0 6px;color:#a9a4ff;font-family:Georgia,serif">Portal da família — navegação livre</h2><p style="margin:0 0 12px;color:#b6b2e6">Conteúdos educativos e ferramentas gerais ficam livres. Dados pessoais armazenados, documentos, chat e prontuário exigem credencial familiar válida ou PIN master do médico.</p><div id="np-public-links" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-bottom:12px"></div><details style="background:rgba(124,118,210,.10);border:1px solid rgba(169,164,255,.16);border-radius:16px;padding:10px"><summary style="font-weight:900;color:#f2dca6;cursor:pointer">Áreas protegidas</summary><div id="np-private-links" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-top:10px"></div></details>';
    var target=root.firstElementChild||root;root.insertBefore(panel,target);
    function link(txt,href,priv){var a=document.createElement('a');a.textContent=(priv?'🔒 ':'✨ ')+txt;a.href=href;a.style.cssText='display:block;text-decoration:none;background:rgba(124,118,210,.10);border:1px solid rgba(169,164,255,.16);border-radius:14px;padding:10px 12px;color:'+(priv?'#f2dca6':'#a9a4ff')+';font-weight:800';if(priv)a.onclick=function(ev){if(!isUnlocked()){ev.preventDefault();announce('Área protegida. Use o PIN master ou credencial familiar.')}};return a}
    var pub=panel.querySelector('#np-public-links'),pri=panel.querySelector('#np-private-links');PUBLIC_FAMILY_LINKS.forEach(function(x){pub.appendChild(link(x[0],x[1],false))});PRIVATE_LINKS.forEach(function(x){pri.appendChild(link(x[0],x[1],true))});
  }
  function eligible(el){return el&&el.tagName==='INPUT'&&el.type!=='checkbox'&&el.type!=='radio'&&el.type!=='file'&&el.type!=='button'&&el.type!=='submit'&&el.type!=='hidden'}
  function watchInputs(){
    document.addEventListener('input',function(ev){if(isUnlocked())return;var el=ev.target;if(!eligible(el))return;unlockIfPin(el.value)},true);
    document.addEventListener('submit',function(){if(isUnlocked())return;document.querySelectorAll('input').forEach(function(i){if(eligible(i))unlockIfPin(i.value)})},true);
  }
  window.NeuroPedMasterAccess={isUnlocked:isUnlocked,unlockIfPin:unlockIfPin,clear:clear,decorate:decorate};
  /* A tela de aplicação já existente passa a reconhecer o lote autoral 2 antes de selecionar o instrumento. */
  if (/instrumento-autoral\.html$/i.test(location.pathname) && !window.NEUROPED_NPE_LOTE2_LOADED && document.readyState==='loading') {
    document.write('<script src="./scales-autorais-npe-lote2.js"><\/script>');
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',decorate)}else{decorate()}
  window.addEventListener('hashchange',function(){setTimeout(decorate,120)});
  window.addEventListener('storage',function(ev){if(ev.key===KEY)decorate()});
  /* Polling de decoração: handle exposto para cleanup. Em SPA com churn
     longo (sessão >>1h), o interval ficava ativo perpetuamente sem clear. */
  var decorateInterval=setInterval(decorate,15000);
  window.addEventListener('pagehide',function(){try{clearInterval(decorateInterval)}catch(e){}},{once:true});
})();