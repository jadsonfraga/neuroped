/* NeuroPed Clinical Intelligence Layer (V4) — therapeutic-burden-engine.js
 * FASE 4 — Therapeutic Burden Engine.
 *
 * Calcula carga terapêutica a partir do PLANO informado (sessões: modalidade,
 * frequência, duração, deslocamento, remoto/presencial). A aritmética é
 * determinística; os LIMIARES de risco vêm de config clínica (sem inventar).
 * Prepara gancho para o trigger "VANT" (overload_risk).
 *
 * sessions[] = [{ modality, perWeek, minutes, commute_min?, remote?:bool, fatigue?:0..1 }]
 * config.burden = { hours_warn, hours_high, diversity_high, support_level?:1..3 }
 * Biblioteca inerte.
 */
(function (global) {
  'use strict';
  var Explain = dep('Explain', './clinical-explainability.js');

  function compute(plan, config) {
    plan = plan || {}; config = config || {};
    var sessions = Array.isArray(plan.sessions) ? plan.sessions : [];
    var cfg = config.burden || {};

    var weeklyMin = 0, commuteMin = 0, modalities = {}, remoteMin = 0, presentialMin = 0, fatigue = [];
    sessions.forEach(function (s) {
      var perWeek = num(s.perWeek, 0), minutes = num(s.minutes, 0), commute = num(s.commute_min, 0);
      var sessMin = perWeek * minutes;
      weeklyMin += sessMin;
      commuteMin += perWeek * commute;
      if (s.remote) remoteMin += sessMin; else presentialMin += sessMin;
      if (s.modality) modalities[s.modality] = (modalities[s.modality] || 0) + sessMin;
      if (s.fatigue != null) fatigue.push(clamp01(s.fatigue));
    });

    var weeklyHours = round((weeklyMin + commuteMin) / 60, 2);
    var diversity = Object.keys(modalities).length;
    var monthlyHours = round(weeklyHours * 4.345, 1);
    var familyBurdenIndex = round(clamp01((weeklyHours / 20) * 0.6 + (commuteMin / 600) * 0.25 + (mean(fatigue)) * 0.15), 3); // 0..1 transparente

    var result = {
      weekly_hours: weeklyHours, monthly_hours: monthlyHours, commute_hours_week: round(commuteMin / 60, 2),
      diversity: diversity, modalities: modalities, remote_ratio: weeklyMin ? round(remoteMin / weeklyMin, 2) : 0,
      family_burden_index: familyBurdenIndex
    };

    // Risco e recomendação só com limiares clínicos configurados.
    if (cfg.hours_warn == null || cfg.hours_high == null) {
      result.overload_risk = null;
      result.meta = Explain.insufficientConfig('TherapeuticBurdenEngine', 'limiares de carga (config.burden.hours_warn / hours_high / diversity_high)');
      return result;
    }
    var risk = weeklyHours >= cfg.hours_high ? 'alto' : weeklyHours >= cfg.hours_warn ? 'moderado' : 'baixo';
    if (cfg.diversity_high != null && diversity >= cfg.diversity_high && risk === 'baixo') risk = 'moderado';
    result.overload_risk = risk;
    result.sustainability_score = round(clamp01(1 - (weeklyHours / (cfg.hours_high * 1.5)) - familyBurdenIndex * 0.2), 3);
    result.recommended_adjustment = risk === 'alto'
      ? 'Revisar prioridades terapêuticas: concentrar metas, considerar teleatendimento p/ reduzir deslocamento, espaçar modalidades de menor prioridade.'
      : (risk === 'moderado' ? 'Monitorar fadiga/adesão; reavaliar em 4–6 semanas.' : 'Carga sustentável no momento.');
    result.vant_trigger = (risk === 'alto'); // gancho futuro p/ trigger "VANT"
    result.insight = Explain.makeInsight({
      engine: 'TherapeuticBurdenEngine', insight: 'Carga terapêutica: ' + risk + ' (' + weeklyHours + ' h/sem, ' + diversity + ' modalidades)',
      confidence: 0.7, evidence: Object.keys(modalities).map(function (m) { return { source: m, signal: round(modalities[m] / Math.max(1, weeklyMin), 2), weight: 1, note: 'min/sem=' + modalities[m] }; }),
      explanation: 'Soma determinística do plano informado vs. limiares clínicos configurados. Apoio à decisão sobre sustentabilidade — não prescreve.'
    });
    return result;
  }

  function dep(name, path) { return (global.NeuroPedClinical && global.NeuroPedClinical[name]) || (typeof require !== 'undefined' ? require(path) : null); }
  function num(v, d) { v = Number(v); return isNaN(v) ? (d || 0) : v; }
  function mean(a) { return a && a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function clamp01(n) { n = Number(n); if (isNaN(n)) return 0; return Math.max(0, Math.min(1, n)); }
  function round(n, d) { var f = Math.pow(10, d || 2); return Math.round(Number(n) * f) / f; }

  var api = { compute: compute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.Burden = api;
})(typeof self !== 'undefined' ? self : this);
