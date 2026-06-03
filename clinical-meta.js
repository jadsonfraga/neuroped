/* ============================================================
   NeuroPed EDJ — clinical-meta.js
   Trilhos da CURADORIA de evidência/ontologia clínica (não fabrica conteúdo).
   ------------------------------------------------------------
   Lê evidence-registry.json + clinical-ontology.json (curadoria humana) e
   expõe consulta por instrumento. Regra de ouro, garantida pelo validador:
   uma afirmação só "vale" se tiver CITAÇÃO; sem fonte, fica needs_curation e
   o motor NÃO mostra claim. Nunca um palpite apresentado como fato.
   ------------------------------------------------------------
   - validateRegistry(obj): PURO — { ok, errors[] }. Usado no CI e no runtime.
   - evidence(id) / ontology(id): entrada CURADA (ou null) após load().
   - load(): browser (fetch) carrega os JSON uma vez; no-op fora do browser.
   Browser (window.NeuroPedMeta) + Node (module.exports) p/ teste.
   ============================================================ */
(function (root) {
  'use strict';

  var _ev = null, _on = null, _loading = null;

  // Só entradas CURADAS: ignora _templates e qualquer _needs_curation:true.
  function curatedOnly(obj) {
    var out = {}, inst = (obj && obj.instruments) || {};
    Object.keys(inst).forEach(function (k) {
      if (k.charAt(0) === '_') return;
      var e = inst[k];
      if (e && e._needs_curation !== true) out[k] = e;
    });
    return out;
  }

  // Validador PURO: toda entrada curada precisa de citação em cada afirmação.
  // Bloqueia "evidence_level" ou "guideline_support" sem fonte → impede fabricação.
  function validateRegistry(obj) {
    var errors = [], inst = (obj && obj.instruments) || {};
    var PMID = /^\d{6,9}$/;
    Object.keys(inst).forEach(function (k) {
      if (k.charAt(0) === '_') return;          // _example_template etc.
      var e = inst[k] || {};
      if (e._needs_curation === true) return;   // ainda não curado: tudo bem ficar vazio
      var gs = e.guideline_support || [];
      gs.forEach(function (g, i) {
        if (!g || !g.citation || !String(g.citation).trim())
          errors.push(k + ': guideline_support[' + i + '] sem citation (afirmação sem fonte)');
        if (g && g.body && !/^(AAP|NICE|AACAP|DSM-5-TR|ICD-11|Cochrane)$/.test(String(g.body)))
          errors.push(k + ': body "' + g.body + '" fora do vocabulário de diretrizes');
      });
      // FONTE PRIMÁRIA psicométrica: PMID rastreável é OBRIGATÓRIO (anti-fabricação).
      var vs = e.validation_sources || [];
      vs.forEach(function (s, i) {
        if (!s || !s.citation || !String(s.citation).trim())
          errors.push(k + ': validation_sources[' + i + '] sem citation');
        if (!s || !PMID.test(String(s.pmid || '')))
          errors.push(k + ': validation_sources[' + i + '] sem PMID rastreável');
      });
      // Entrada curada precisa de AO MENOS uma fonte (diretriz citada OU fonte com PMID).
      var hasSource = gs.some(function (g) { return g && g.citation; }) ||
        vs.some(function (s) { return s && s.citation && PMID.test(String(s.pmid || '')); });
      if (!hasSource)
        errors.push(k + ': curado (sem _needs_curation) porém SEM nenhuma fonte rastreável');
      if (e.evidence_level && !hasSource)
        errors.push(k + ': evidence_level definido sem nenhuma fonte citável');
    });
    return { ok: errors.length === 0, errors: errors };
  }

  function evidence(id) { return _ev ? (curatedOnly(_ev)[id] || null) : null; }
  function ontology(id) { return _on ? (curatedOnly(_on)[id] || null) : null; }

  // Carrega os JSON no browser (uma vez). Fora do browser, no-op.
  function load() {
    if (_loading) return _loading;
    if (typeof fetch !== 'function') { _loading = Promise.resolve(false); return _loading; }
    _loading = Promise.all([
      fetch('./evidence-registry.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('./clinical-ontology.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (res) {
      _ev = res[0]; _on = res[1];
      // segurança: se a curadoria estiver malformada, NÃO expõe (melhor nada que errado)
      if (_ev && !validateRegistry(_ev).ok) _ev = null;
      return true;
    });
    return _loading;
  }

  var api = { validateRegistry: validateRegistry, curatedOnly: curatedOnly, evidence: evidence, ontology: ontology, load: load };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.NeuroPedMeta = api; }
})(typeof window !== 'undefined' ? window : null);
