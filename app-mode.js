/* NeuroPed EDJ — App Mode Indicator */
(function(){
  'use strict';
  window.NEUROPED_APP_MODE = {
    mode: 'HOMOLOGAÇÃO',
    label: 'Homologação estática',
    message: 'Ferramenta em evolução. Não usar com dados clínicos reais sem backend seguro, autenticação, logs e criptografia.',
    versionHint: 'v41-app-shell-consulta-livre'
  };
  function boot(){
    if(document.getElementById('npModeBadge')) return;
    var badge=document.createElement('button');
    badge.id='npModeBadge';
    badge.type='button';
    badge.textContent='HOMOLOGAÇÃO';
    badge.title=window.NEUROPED_APP_MODE.message;
    badge.style.cssText='position:fixed;left:12px;bottom:12px;z-index:999997;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:999px;padding:9px 11px;font:900 11px system-ui;box-shadow:0 10px 24px rgba(45,41,38,.14)';
    badge.onclick=function(){alert(window.NEUROPED_APP_MODE.message)};
    document.body.appendChild(badge);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
