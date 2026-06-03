/* NeuroPed Clinical Intelligence Layer (V4) — clinical-decision-support.js
 * FASE 9 — Clinical Decision Support (assistência, NUNCA diagnóstico).
 *
 * Sugere, de forma determinística e explicável:
 *  - domínios subexplorados (sem instrumento recente);
 *  - necessidade de reavaliação (última aplicação além do intervalo);
 *  - possível excesso terapêutico (via burden);
 *  - lacunas de investigação (domínios canônicos nunca medidos).
 *
 * config.cds = { reassess_days?:int, expected_domains?:[...], burden_high_flag?:bool }
 * Objetivo: assistência clínica. Nunca substituição médica.
 * Biblioteca inerte.
 */
(function (global) {
  'use strict';
  var Explain = dep('Explain', './clinical-explainability.js');
  var Norm = dep('Normalize', './clinical-normalization.js');

  function suggest(ctx, config) {
    ctx = ctx || {}; config = config || {}; var cfg = config.cds || {};
    var timeline = ctx.timeline || {};          // saída de Timeline.build
    var burden = ctx.burden || null;            // saída de Burden.compute
    var now = ctx.now ? new Date(ctx.now).getTime() : Date.now();
    var suggestions = [];

    var covered = timeline.domains_covered || [];
    var allDomains = (Norm && Norm.DOMAINS) || [];
    var expected = cfg.expected_domains && cfg.expected_domains.length ? cfg.expected_domains : allDomains;

    // 1) lacunas: domínios esperados nunca medidos
    var gaps = expected.filter(function (d) { return covered.indexOf(d) < 0; });
    if (gaps.length) suggestions.push(Explain.makeInsight({
      engine: 'ClinicalDecisionSupport', insight: 'Domínios sem qualquer medição: ' + gaps.join(', '),
      confidence: 0.6, evidence: gaps.map(function (d) { return { source: 'cobertura', domain: d, signal: 0, weight: 1, note: 'nunca avaliado' }; }),
      explanation: 'Investigação possivelmente incompleta. Considere instrumento para os domínios não cobertos. Apoio — não obriga conduta.'
    }));

    // 2) reavaliação: por domínio, última aplicação além do intervalo
    if (cfg.reassess_days != null && timeline.domains) {
      var due = [];
      Object.keys(timeline.domains).forEach(function (d) {
        var ev = timeline.domains[d].events || []; if (!ev.length) return;
        var last = Math.max.apply(null, ev.map(function (e) { return new Date(e.timestamp).getTime() || 0; }));
        var days = Math.round((now - last) / 86400000);
        if (days >= cfg.reassess_days) due.push({ domain: d, days_since: days });
      });
      if (due.length) suggestions.push(Explain.makeInsight({
        engine: 'ClinicalDecisionSupport', insight: 'Reavaliação sugerida em ' + due.length + ' domínio(s)',
        confidence: 0.65, evidence: due.map(function (x) { return { source: 'recência', domain: x.domain, signal: 1, weight: 1, note: x.days_since + ' dias' }; }),
        explanation: 'Última medição além de ' + cfg.reassess_days + ' dias nesses domínios. Reavaliar para acompanhar trajetória.'
      }));
    }

    // 3) excesso terapêutico (do burden engine)
    if (burden && burden.overload_risk === 'alto') suggestions.push(Explain.makeInsight({
      engine: 'ClinicalDecisionSupport', insight: 'Possível excesso terapêutico (carga alta)',
      confidence: 0.7, evidence: [{ source: 'burden', signal: 1, weight: 1, note: burden.weekly_hours + ' h/sem' }],
      explanation: (burden.recommended_adjustment || 'Revisar sustentabilidade do plano.') + ' Apoio à decisão — não prescreve.'
    }));

    // 4) domínio subexplorado: medido só 1 vez (sem trajetória)
    if (timeline.domains) {
      var thin = Object.keys(timeline.domains).filter(function (d) { return (timeline.domains[d].events || []).length === 1; });
      if (thin.length) suggestions.push(Explain.makeInsight({
        engine: 'ClinicalDecisionSupport', insight: 'Domínios com uma única medição (sem trajetória): ' + thin.join(', '),
        confidence: 0.5, evidence: thin.map(function (d) { return { source: 'cobertura', domain: d, signal: 0.5, weight: 1, note: '1 aplicação' }; }),
        explanation: 'Sem repetição não há leitura de evolução. Uma 2ª aplicação habilita análise de resposta.'
      }));
    }

    return { suggestions: suggestions, count: suggestions.length, disclaimer: 'Assistência clínica explicável. Nunca diagnóstico automático nem substituição médica.' };
  }

  function dep(name, path) { return (global.NeuroPedClinical && global.NeuroPedClinical[name]) || (typeof require !== 'undefined' ? require(path) : null); }

  var api = { suggest: suggest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.DecisionSupport = api;
})(typeof self !== 'undefined' ? self : this);
