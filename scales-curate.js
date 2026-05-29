/* NeuroPed EDJ — Curadoria do catálogo (roda por ÚLTIMO).
   1) Enxuga as variações geradas: por núcleo (domínio) mantém só 3 faixas
      etárias × 3 respondentes (família/escola/clínico) — corta o excesso
      idade×respondente que inflava a contagem.
   2) Etiqueta TODOS com tipo (kind) e natureza (validado | triagem autoral).
   3) Publica estatística honesta em window.NEUROPED_CATALOG_STATS. */
(function () {
  'use strict';
  if (window.NEUROPED_CURATED) return; window.NEUROPED_CURATED = true;
  var all = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];

  function isGen(s){ var a = (s.anchor || '') + ' ' + (s.id || ''); return /aut453-|gmax|global/.test(a); }
  function band(m){ m = m || 0; return m < 72 ? 'p' : (m < 144 ? 's' : 't'); } // pequena / escolar / transição
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
    if (s.official_catalog) {                               // catálogo oficial: mantém todos, não aplicável
      s.nature = 'oficial'; s.kind = 'fonte oficial'; s.applicable = false; keep.push(s); return;
    }
    if (!s.nature) s.nature = 'triagem autoral';
    if (!s.kind) s.kind = kindOf(s);
    if (!isGen(s)) { keep.push(s); return; }               // curados e novos: mantém todos
    if (!KEEP_AUD[s.audience]) return;                      // remove respondentes excedentes
    var k = s.domain + '|' + band(s.age_min_months) + '|' + s.audience;
    if (seen[k]) return; seen[k] = 1;                       // 1 por (domínio × faixa × respondente)
    keep.push(s);
  });

  window.NEUROPED_EDITORIAL_SCALES = keep;

  var doms = {}, oficiais = 0, curados = 0, variacoes = 0, byKind = {};
  keep.forEach(function (s) {
    byKind[s.kind] = (byKind[s.kind] || 0) + 1;
    if (s.official_catalog) { oficiais++; return; }         // não conta no total aplicável
    doms[s.domain] = 1;
    if (isGen(s)) variacoes++; else curados++;
  });
  window.NEUROPED_CATALOG_STATS = {
    total: curados + variacoes,   // instrumentos AUTORAIS aplicáveis (sem o catálogo oficial)
    aplicaveis: curados + variacoes,
    curados: curados,             // individualmente redigidos (distintos)
    variacoes: variacoes,         // coberturas por faixa/respondente
    oficiais: oficiais,           // fontes oficiais catalogadas (não aplicáveis no app público)
    dominios: Object.keys(doms).length,
    distintos: curados,
    porTipo: byKind
  };
})();
