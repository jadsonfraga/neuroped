/* NeuroPed CIL — clinical-trajectory-explain.js
 * EXPLAINABILITY ENGINE — transforma cada trajetória em JUSTIFICATIVA CLÍNICA
 * legível e auditável ("por que o sistema concluiu isso?").
 *
 * Determinístico: deriva tudo dos deltas reais + config. Honesto: só afirma
 * melhora/piora quando a polaridade está configurada (direction_confident);
 * caso contrário descreve variação bruta. Cada justificativa passa pelo
 * envelope makeInsight (evidence[]+confidence+explanation) — sem caixa-preta.
 *
 * Expõe:
 *   NeuroPedCIL.Explainability.trajectory(domain, traj)  -> insight (1 domínio)
 *   NeuroPedCIL.Explainability.timeline(timelineOut)      -> { summary, narratives[], buckets }
 */
(function (global) {
  'use strict';
  var Explain = (global.NeuroPedCIL && global.NeuroPedCIL.Explain) ||
    (typeof require !== 'undefined' ? require('./clinical-explainability.js') : null);

  function round(n, d) { var f = Math.pow(10, d || 2); return Math.round(Number(n) * f) / f; }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function pctChange(first, last) {
    if (first == null || last == null) return null;
    if (Math.abs(first) < 1e-6) return (Math.abs(last) < 1e-6) ? 0 : null; // baseline ~0: % indefinido
    return Math.round((last - first) / Math.abs(first) * 100);
  }

  // Justificativa de UM domínio.
  function trajectory(domain, tr) {
    if (!tr || !Array.isArray(tr.points) || tr.points.length < 2) return null;
    var first = tr.points[0].value, last = tr.points[tr.points.length - 1].value;
    var pc = pctChange(first, last);
    var n = tr.n, days = tr.span_days, conf = !!tr.direction_confident;

    var verb;
    switch (tr.status) {
      case 'regressing': verb = 'piora'; break;
      case 'improving':  verb = 'melhora'; break;
      case 'plateau':    verb = 'estabilidade'; break;
      case 'unstable':   verb = 'instabilidade (flutuação)'; break;
      default:           verb = 'variação sem direção clínica afirmada'; // sem polaridade
    }
    var changeTxt = (pc == null) ? 'variação no escore'
      : (Math.abs(pc) + '% de ' + (last >= first ? 'aumento' : 'redução') + ' no escore');
    var sentence = cap(domain) + ': ' + verb + ' — ' + changeTxt +
      ' em ' + n + ' aplicações' + (days ? (' (' + days + ' dias)') : '') + '.';

    // confiança: cresce com nº de pontos e magnitude; baixa se direção não afirmada
    var confidence = conf ? Math.min(1, 0.5 + (n >= 3 ? 0.2 : 0) + Math.min(0.3, Number(tr.magnitude || 0))) : 0.3;

    return Explain.makeInsight({
      engine: 'TrajectoryExplain',
      insight: sentence,
      confidence: confidence,
      domain: domain,
      evidence: tr.points.map(function (p) { return { source: p.instrument, domain: domain, signal: round(p.value, 3), timestamp: p.t }; }),
      explanation: 'Δ=' + round(tr.magnitude, 3) + ' (métrica 0–1)' +
        (pc != null ? (' · ' + pc + '% vs. linha de base') : '') +
        ' · ' + n + ' pontos · estabilidade=' + tr.stability + '. ' +
        (conf ? 'Direção clínica afirmada (polaridade do instrumento configurada).'
              : 'Direção clínica NÃO afirmada (instrumento sem polaridade validada) — apenas sentido bruto.')
    });
  }

  // Leitura composta da timeline inteira.
  function timeline(tl) {
    var doms = (tl && tl.domains) || {};
    var buckets = { improving: [], regressing: [], plateau: [], other: [] };
    var narratives = [];
    Object.keys(doms).forEach(function (d) {
      var tr = doms[d].trajectory; if (!tr) return;
      var ins = trajectory(d, tr); if (ins) narratives.push(ins);
      if (buckets[tr.status]) buckets[tr.status].push(d); else buckets.other.push(d);
    });
    var parts = [];
    if (buckets.improving.length) parts.push('melhora em ' + buckets.improving.join(', '));
    if (buckets.regressing.length) parts.push('piora em ' + buckets.regressing.join(', '));
    if (buckets.plateau.length) parts.push('estabilidade em ' + buckets.plateau.join(', '));
    var summary = parts.length
      ? ('Leitura longitudinal: ' + parts.join('; ') + '. Apoio explicável — não substitui avaliação médica.')
      : 'Ainda sem tendência clínica afirmável (faltam pontos comparáveis ou polaridade configurada).';
    return { summary: summary, narratives: narratives, buckets: buckets };
  }

  var api = { trajectory: trajectory, timeline: timeline };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedCIL = global.NeuroPedCIL || {};
  global.NeuroPedCIL.Explainability = api;
})(typeof self !== 'undefined' ? self : this);
