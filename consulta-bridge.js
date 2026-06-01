(function(){
  'use strict';
  function path(){var h=location.hash||'';return h.charAt(0)==='#'?h.slice(1):h||'/'}
  var TARGETS=[
    {re:/^\/(consulta|consultas|pre-consulta)(\/|$|\?)/i, page:'consulta.html'},
    {re:/^\/filtro(-escalas)?(\/|$|\?)/i,                  page:'filtro-escalas.html'},
    {re:/^\/escalas(\/|$|\?)/i,                            page:'escalas.html'},
    {re:/^\/mapa-escalas(\/|$|\?)/i,                       page:'mapa-escalas.html'},
    {re:/^\/banco-escalas(\/|$|\?)/i,                      page:'banco-escalas.html'},
    // HOTFIX SPA: rotas quebradas (#/undefined, #/escala/undefined) que mostravam
    // "Did you forget to add the page" → manda para o filtro estático que funciona.
    {re:/^\/undefined(\/|$|\?)?$/i,                        page:'filtro-escalas.html'},
    {re:/^\/escala\/(undefined|null|)\s*$/i,              page:'filtro-escalas.html'}
  ];
  function go(){
    var p=path();
    var hit=TARGETS.find(function(t){return t.re.test(p)});
    if(!hit)return;
    if(location.pathname.endsWith('/'+hit.page))return;
    var base=location.pathname.replace(/[^/]*$/,'');
    location.replace(base+hit.page);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
  window.addEventListener('hashchange',go);
})();
