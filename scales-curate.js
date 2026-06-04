/* NeuroPed SDG — Curadoria do catálogo (roda por último).
   Carrega o lote NPE-BR-013 a NPE-BR-024 antes da curadoria para que
   os novos testes sejam contados como aplicáveis e ranqueados no filtro.
   Publica NEUROPED_CATALOG_STATS, incluindo fontes oficiais separadas. */
(function () {
  'use strict';
  function curate(){
    if (window.NEUROPED_CURATED) return; window.NEUROPED_CURATED = true;
    var all = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
    function isGen(s){ var a = (s.anchor || '') + ' ' + (s.id || ''); return /aut453-|gmax|global/.test(a); }
    function band(m){ m = m || 0; return m < 72 ? 'p' : (m < 144 ? 's' : 't'); }
    var KEEP_AUD = { familia:1, escola:1, clinico:1 };
    function kindOf(s){
      if (s.validated) return 'validado';
      var t = (s.title || '').toLowerCase();
      if (/diári|diario|controle diário|registro de|monitor/.test(t)) return 'diário';
      if (/teste direto/.test(t)) return 'teste direto';
      if (/invent[áa]rio/.test(t)) return 'inventário';
      if (/checklist|plano|guia:|carta|gatilhos|agenda visual|metas/.test(t)) return 'ferramenta';
      return 'rastreio';
    }
    var seen = {}, keep = [];
    all.forEach(function (s) {
      if (s.official_catalog) { s.nature = 'oficial'; s.kind = 'fonte oficial'; s.applicable = false; keep.push(s); return; }
      if (!s.nature) s.nature = 'triagem autoral';
      if (!s.kind) s.kind = kindOf(s);
      if (!isGen(s)) { keep.push(s); return; }
      if (!KEEP_AUD[s.audience]) return;
      var k = s.domain + '|' + band(s.age_min_months) + '|' + s.audience;
      if (seen[k]) return; seen[k] = 1; keep.push(s);
    });
    window.NEUROPED_EDITORIAL_SCALES = keep;
    var doms = {}, oficiais = 0, curados = 0, variacoes = 0, byKind = {};
    keep.forEach(function (s) {
      byKind[s.kind] = (byKind[s.kind] || 0) + 1;
      if (s.official_catalog) { oficiais++; return; }
      doms[s.domain] = 1;
      if (isGen(s)) variacoes++; else curados++;
    });
    window.NEUROPED_CATALOG_STATS = { total:curados+variacoes, aplicaveis:curados+variacoes, curados:curados, variacoes:variacoes, oficiais:oficiais, dominios:Object.keys(doms).length, distintos:curados, porTipo:byKind };
  }
  window.NeuroPedCurate = curate;
  if (!window.NEUROPED_NPE_LOTE2_LOADED && document.readyState === 'loading') {
    document.write('<script src="./scales-autorais-npe-lote2.js"><\/script><script>window.NeuroPedCurate();<\/script>');
  } else { curate(); }
})();