/* ============================================================
   NeuroPed SDG — scales-sensitivity.js
   Sensibilidade CITADA por instrumento (não fabrica nada).
   ------------------------------------------------------------
   Lê a curadoria viva (NeuroPedMeta.evidence → evidence-registry.json) e
   extrai a sensibilidade NUMÉRICA quando, e SOMENTE quando, ela vem com uma
   fonte rastreável (PMID). É a mesma regra de ouro do app: sem citação, não
   existe número — devolve null e o motor cai no heurístico (fit).
   Hoje só ~3 instrumentos têm sensibilidade numérica curada (ASQ, PHQ-9,
   GAD-7); a cobertura cresce conforme a curadoria, sem mudar este código.
   Browser (window.NeuroPedSensitivity) + Node (module.exports) p/ teste.
   ============================================================ */
(function (root) {
  'use strict';
  var PMID = /^\d{6,9}$/;

  // extrai "sensibilidade NN%" (aceita 96,9 / 96.9) de um texto curado.
  function parse(statement) {
    var m = String(statement || '').match(/sensibilidade\s+(\d{1,3}(?:[.,]\d+)?)\s*%/i);
    if (!m) return null;
    var v = parseFloat(m[1].replace(',', '.'));
    return (isFinite(v) && v > 0 && v <= 100) ? v : null;
  }

  // get(id) → { pct, citation, pmid, verification } se houver sensibilidade
  // numérica COM PMID na curadoria; senão null. Nunca inventa.
  function get(id) {
    try {
      var meta = root && root.NeuroPedMeta;
      var e = (meta && typeof meta.evidence === 'function') ? meta.evidence(id) : null;
      if (!e || !Array.isArray(e.validation_sources)) return null;
      for (var i = 0; i < e.validation_sources.length; i++) {
        var s = e.validation_sources[i];
        if (!s || !PMID.test(String(s.pmid || ''))) continue;
        var pct = parse(s.statement);
        if (pct == null) continue;
        return { pct: pct, citation: s.citation || '', pmid: String(s.pmid), verification: s.verification || '' };
      }
    } catch (err) {}
    return null;
  }

  var api = { version: '1.0.0', get: get, parse: parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedSensitivity = api;
})(typeof window !== 'undefined' ? window : null);
