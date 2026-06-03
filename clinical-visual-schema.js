/* NeuroPed Clinical Intelligence Layer (V4) — clinical-visual-schema.js
 * FASE 8 — Visual Analytics (DESACOPLADO da engine).
 *
 * Apenas FÁBRICAS DE VIEW-MODEL: recebem saídas das engines e devolvem
 * estruturas de dados prontas para QUALQUER renderizador (SVG/Canvas/lib).
 * NÃO renderiza, NÃO toca o DOM, NÃO depende de framework. Assim a engine
 * permanece independente da visualização.
 *
 * Widgets: radar funcional, timeline evolutiva, heatmap de sintomas,
 * burden map, trajectory graph, phenotype clusters.
 */
(function (global) {
  'use strict';

  // Radar funcional: severidade média por domínio (0..1).
  function functionalRadar(timeline) {
    var doms = (timeline && timeline.domains) || {};
    return {
      type: 'radar',
      axes: Object.keys(doms).map(function (d) {
        var ev = doms[d].events || [];
        var sev = ev.filter(function (e) { return e.severity != null; }).map(function (e) { return e.severity; });
        var raw = ev.filter(function (e) { return e.raw_pct != null; }).map(function (e) { return e.raw_pct; });
        return { domain: d, value: avg(sev.length ? sev : raw), normalized: sev.length > 0, n: ev.length };
      })
    };
  }

  // Timeline evolutiva: pontos por domínio ao longo do tempo.
  function evolutionTimeline(timeline) {
    var doms = (timeline && timeline.domains) || {};
    return {
      type: 'timeline',
      series: Object.keys(doms).map(function (d) {
        var tr = doms[d].trajectory || {};
        return { domain: d, status: tr.status || null, points: (tr.points || []).map(function (p) { return { t: p.t, value: p.value, instrument: p.instrument }; }) };
      })
    };
  }

  // Heatmap de sintomas: domínio × tempo (bucket) → severidade.
  function symptomHeatmap(timeline, bucket) {
    bucket = bucket || 'month';
    var cells = [];
    ((timeline && timeline.timeline) || []).forEach(function (e) {
      cells.push({ domain: e.domain, period: periodKey(e.timestamp, bucket), value: e.severity != null ? e.severity : e.raw_pct, normalized: !!e.normalized });
    });
    return { type: 'heatmap', bucket: bucket, cells: cells };
  }

  // Burden map: modalidades × minutos/semana + risco.
  function burdenMap(burden) {
    if (!burden) return { type: 'burden', segments: [], risk: null };
    var mods = burden.modalities || {};
    return {
      type: 'burden', risk: burden.overload_risk || null, weekly_hours: burden.weekly_hours,
      family_burden_index: burden.family_burden_index,
      segments: Object.keys(mods).map(function (m) { return { modality: m, minutes_week: mods[m] }; })
    };
  }

  // Trajectory graph de um domínio (linha suavizada + status).
  function trajectoryGraph(trajectory) {
    if (!trajectory) return { type: 'trajectory', points: [], status: null };
    return { type: 'trajectory', domain: trajectory.domain, status: trajectory.status, direction: trajectory.direction, direction_confident: !!trajectory.direction_confident, points: (trajectory.points || []) };
  }

  // Phenotype clusters: barras de convergência por cluster.
  function phenotypeClusters(phenotypeResult) {
    var ph = (phenotypeResult && phenotypeResult.phenotypes) || [];
    return { type: 'clusters', overlap: (phenotypeResult && phenotypeResult.overlap) || [], bars: ph.map(function (p) { return { id: p.id, label: p.label, score: p.score, coverage: p.coverage }; }) };
  }

  function avg(a) { return a && a.length ? Math.round((a.reduce(function (s, x) { return s + Number(x); }, 0) / a.length) * 1000) / 1000 : 0; }
  function periodKey(t, bucket) {
    var d = new Date(t); if (isNaN(d.getTime())) return 'na';
    var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2);
    if (bucket === 'year') return '' + y;
    if (bucket === 'week') { var on = new Date(d); on.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return on.toISOString().slice(0, 10); }
    return y + '-' + m;
  }

  var api = { functionalRadar: functionalRadar, evolutionTimeline: evolutionTimeline, symptomHeatmap: symptomHeatmap, burdenMap: burdenMap, trajectoryGraph: trajectoryGraph, phenotypeClusters: phenotypeClusters };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.VisualSchema = api;
})(typeof self !== 'undefined' ? self : this);
