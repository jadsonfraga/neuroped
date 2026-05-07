(function(){
  'use strict';
  function path(){var h=location.hash||'';return h.charAt(0)==='#'?h.slice(1):h||'/'}
  function isConsulta(){return /^\/(consulta|consultas|pre-consulta)(\/|$|\?)/i.test(path())}
  function go(){
    if(!isConsulta())return;
    var base=location.pathname.replace(/[^/]*$/,'');
    var target=base+'consulta.html';
    if(location.pathname.endsWith('/consulta.html'))return;
    location.replace(target);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
  window.addEventListener('hashchange',go);
})();