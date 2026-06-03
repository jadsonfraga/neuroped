/* NeuroPed Clinical Intelligence Layer (V4) — phenotype-engine.js
 * FASE 3 — Fenotipagem computacional (apoio, NÃO diagnóstico).
 *
 * Identifica clusters clínicos predominantes a partir de sinais normalizados,
 * usando definições de cluster fornecidas por CONFIG do responsável clínico
 * (pesos por domínio). Sem config → não infere (insufficient_clinical_configuration).
 * Detecta também convergência, divergência entre respondentes e overlap.
 *
 * config.phenotypes = [{ id, label, weights:{domain:peso}, min_confidence? }]
 * Biblioteca inerte. Determinística.
 */
(function (global) {
  'use strict';
  var Explain = dep('Explain', './clinical-explainability.js');

  function aggregateByDomain(signals) {
    var by = {};
    (signals || []).forEach(function (s) {
      if (!s || s.domain == null || s.severity == null) return;
      (by[s.domain] = by[s.domain] || []).push(s);
    });
    var out = {};
    Object.keys(by).forEach(function (d) {
      var arr = by[d];
      var sevs = arr.map(function (x) { return Number(x.severity); });
      out[d] = { domain: d, severity: round(mean(sevs), 3), n: arr.length, sources: uniq(arr.map(function (x) { return x.source; })), spread: round(range(sevs), 3) };
    });
    return out;
  }

  function detectPhenotypes(signals, config) {
    config = config || {};
    if (!Array.isArray(config.phenotypes) || !config.phenotypes.length) {
      return { phenotypes: [], meta: Explain.insufficientConfig('PhenotypeEngine', 'definições de cluster (config.phenotypes com pesos por domínio)') };
    }
    var agg = aggregateByDomain(signals);
    var domains = Object.keys(agg);
    if (!domains.length) return { phenotypes: [], meta: { status: 'no_normalized_signals', explanation: 'Sem sinais normalizados suficientes (faltam mapeamentos de instrumento).' } };

    var scored = config.phenotypes.map(function (p) {
      var weights = p.weights || {}; var num = 0, den = 0, ev = [];
      Object.keys(weights).forEach(function (dom) {
        var w = Number(weights[dom]) || 0; den += Math.abs(w);
        var a = agg[dom];
        if (a) { num += w * a.severity; ev.push({ source: a.sources.join('+'), domain: dom, signal: a.severity, weight: w }); }
      });
      var score = den ? clamp01(num / den) : 0;
      var coverage = den ? round(ev.length / Object.keys(weights).length, 2) : 0;
      return { id: p.id, label: p.label, score: round(score, 3), coverage: coverage, evidence: ev, min_confidence: p.min_confidence == null ? 0.5 : p.min_confidence };
    }).filter(function (x) { return x.evidence.length; })
      .sort(function (a, b) { return b.score - a.score; });

    var insights = scored.filter(function (x) { return x.score >= x.min_confidence; }).map(function (x) {
      return Explain.makeInsight({
        engine: 'PhenotypeEngine', insight: 'Perfil predominante: ' + x.label,
        confidence: x.score * x.coverage, domain: null, evidence: x.evidence,
        explanation: 'Cluster "' + x.label + '" com convergência ponderada=' + x.score + ' e cobertura de domínios=' + x.coverage +
          '. Apoio à leitura fenotípica; NÃO é diagnóstico.'
      });
    });

    // overlap: ≥2 fenótipos fortes simultâneos (ex.: TEA/TDAH)
    var strong = scored.filter(function (x) { return x.score >= x.min_confidence; });
    var overlap = strong.length >= 2 ? strong.slice(0, 3).map(function (x) { return x.label; }) : [];

    return { phenotypes: scored, insights: insights, overlap: overlap, domain_profile: agg };
  }

  /* Divergência entre respondentes no MESMO domínio (ex.: escola × família). */
  function respondentDivergence(signals, gap) {
    gap = gap == null ? 0.35 : gap;
    var by = {};
    (signals || []).forEach(function (s) { if (s && s.domain != null && s.severity != null && s.respondent) (by[s.domain] = by[s.domain] || {}), (by[s.domain][s.respondent] = by[s.domain][s.respondent] || []).push(Number(s.severity)); });
    var out = [];
    Object.keys(by).forEach(function (d) {
      var resps = Object.keys(by[d]); if (resps.length < 2) return;
      var avgs = resps.map(function (r) { return { respondent: r, severity: round(mean(by[d][r]), 3) }; });
      var hi = Math.max.apply(null, avgs.map(function (a) { return a.severity; }));
      var lo = Math.min.apply(null, avgs.map(function (a) { return a.severity; }));
      if (hi - lo >= gap) out.push({ domain: d, gap: round(hi - lo, 3), by_respondent: avgs });
    });
    return out;
  }

  function dep(name, path) { return (global.NeuroPedClinical && global.NeuroPedClinical[name]) || (typeof require !== 'undefined' ? require(path) : null); }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function range(a) { return a.length ? Math.max.apply(null, a) - Math.min.apply(null, a) : 0; }
  function clamp01(n) { n = Number(n); if (isNaN(n)) return 0; return Math.max(0, Math.min(1, n)); }
  function round(n, d) { var f = Math.pow(10, d || 2); return Math.round(Number(n) * f) / f; }
  function uniq(a) { var s = {}, o = []; (a || []).forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o; }

  var api = { detectPhenotypes: detectPhenotypes, aggregateByDomain: aggregateByDomain, respondentDivergence: respondentDivergence };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.Phenotype = api;
})(typeof self !== 'undefined' ? self : this);
