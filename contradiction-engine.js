/* NeuroPed Clinical Intelligence Layer (V4) — contradiction-engine.js
 * FASE 6 — Clinical Contradiction Engine.
 *
 * Sinaliza INCONSISTÊNCIAS (não decide diagnóstico). Detecção determinística de
 * variância entre fontes/instrumentos no mesmo domínio/janela. Regras nomeadas
 * (ex.: "escola normal × diário gravíssimo") vêm de config; a detecção de gap
 * é data-driven. Produz alertas + rebaixamento de confiança + sugestão de
 * reavaliação. NUNCA decisão automática.
 *
 * config.contradiction = { gap?:0..1, rules?:[{id,label,a:{source|domain},b:{...},min_gap}] }
 * Biblioteca inerte.
 */
(function (global) {
  'use strict';
  var Explain = dep('Explain', './clinical-explainability.js');

  function detect(signals, config) {
    config = config || {}; var cfg = config.contradiction || {};
    var gap = cfg.gap == null ? 0.4 : cfg.gap;
    var alerts = [];

    // 1) Gap data-driven: mesmo domínio, fontes/respondentes divergentes além do gap.
    var byDom = {};
    (signals || []).forEach(function (s) { if (s && s.domain != null && s.severity != null) (byDom[s.domain] = byDom[s.domain] || []).push(s); });
    Object.keys(byDom).forEach(function (d) {
      var arr = byDom[d]; if (arr.length < 2) return;
      var sevs = arr.map(function (x) { return Number(x.severity); });
      var hi = Math.max.apply(null, sevs), lo = Math.min.apply(null, sevs);
      if (hi - lo >= gap) {
        var hiS = arr[sevs.indexOf(hi)], loS = arr[sevs.indexOf(lo)];
        alerts.push(Explain.makeInsight({
          engine: 'ContradictionEngine', insight: 'Inconsistência no domínio "' + d + '": sinais divergentes entre fontes',
          confidence: clamp01((hi - lo)), domain: d,
          evidence: [{ source: hiS.source, domain: d, signal: round(hi, 3), note: hiS.respondent || '' }, { source: loS.source, domain: d, signal: round(lo, 3), note: loS.respondent || '' }],
          conflicting_signals: [{ high: hiS.source, low: loS.source, gap: round(hi - lo, 3) }],
          explanation: 'Diferença de ' + round(hi - lo, 3) + ' entre fontes no mesmo domínio. Sugere reavaliação/triangulação. NÃO conclui qual fonte está correta.'
        }));
      }
    });

    // 2) Regras nomeadas (config) — ex.: escola × diário, escala × observação.
    (cfg.rules || []).forEach(function (rule) {
      var a = pick(signals, rule.a), b = pick(signals, rule.b);
      if (a == null || b == null) return;
      var g = Math.abs(a - b);
      if (g >= (rule.min_gap == null ? gap : rule.min_gap)) {
        alerts.push(Explain.makeInsight({
          engine: 'ContradictionEngine', insight: 'Contradição clínica: ' + (rule.label || rule.id),
          confidence: clamp01(g), domain: rule.domain || null,
          evidence: [{ source: keyOf(rule.a), signal: round(a, 3), weight: 1 }, { source: keyOf(rule.b), signal: round(b, 3), weight: 1 }],
          conflicting_signals: [{ rule: rule.id, gap: round(g, 3) }],
          explanation: 'Regra "' + (rule.label || rule.id) + '" disparou (gap=' + round(g, 3) + '). Rebaixar confiança e recomendar reavaliação.'
        }));
      }
    });

    return {
      contradictions: alerts,
      confidence_downgrade: alerts.length ? Math.min(0.5, 0.15 * alerts.length) : 0,
      reassessment_recommended: alerts.length > 0
    };
  }

  function pick(signals, sel) {
    if (!sel) return null;
    var matched = (signals || []).filter(function (s) {
      return (!sel.source || s.source === sel.source) && (!sel.domain || s.domain === sel.domain) && (!sel.respondent || s.respondent === sel.respondent) && s.severity != null;
    }).map(function (s) { return Number(s.severity); });
    return matched.length ? matched.reduce(function (a, b) { return a + b; }, 0) / matched.length : null;
  }
  function keyOf(sel) { return sel ? [sel.source, sel.domain, sel.respondent].filter(Boolean).join('/') : '?'; }
  function dep(name, path) { return (global.NeuroPedClinical && global.NeuroPedClinical[name]) || (typeof require !== 'undefined' ? require(path) : null); }
  function clamp01(n) { n = Number(n); if (isNaN(n)) return 0; return Math.max(0, Math.min(1, n)); }
  function round(n, d) { var f = Math.pow(10, d || 2); return Math.round(Number(n) * f) / f; }

  var api = { detect: detect };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.Contradiction = api;
})(typeof self !== 'undefined' ? self : this);
