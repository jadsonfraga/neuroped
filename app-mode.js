/* NeuroPed EDJ — App Mode Indicator v42 */
(function(){
  'use strict';
  const MODES={
    DEMO:{label:'Demo',message:'Modo demonstração. Usar somente dados fictícios.'},
    HOMOLOGACAO:{label:'Homologação',message:'Modo homologação. Testes sem dados reais. Produção exige backend seguro, autenticação, logs e criptografia.'},
    PRODUCAO:{label:'Produção',message:'Produção somente com backend seguro, política LGPD, controle de acesso, logs e criptografia.'}
  };
  const modeKey=(localStorage.getItem('np_app_mode')||'HOMOLOGACAO').toUpperCase();
  const current=MODES[modeKey]||MODES.HOMOLOGACAO;
  window.NEUROPED_APP_MODE={mode:modeKey,label:current.label,message:current.message,allowedModes:Object.keys(MODES),versionHint:'v42-foundation-99',productionReady:modeKey==='PRODUCAO'};
  function boot(){
    if(document.getElementById('npModeBadge'))return;
    var badge=document.createElement('button');
    badge.id='npModeBadge';badge.type='button';badge.textContent=current.label.toUpperCase();badge.title=current.message;
    badge.style.cssText='position:fixed;left:12px;bottom:12px;z-index:999997;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:999px;padding:9px 11px;font:900 11px system-ui;box-shadow:0 10px 24px rgba(45,41,38,.14)';
    badge.onclick=function(){alert(current.message)};document.body.appendChild(badge);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
