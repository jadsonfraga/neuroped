/* NeuroPed Clinical Intelligence Layer (V4) — clinical-timeline-engine.js
 * FASE 1 — Clinical Timeline Engine.
 *
 * Consolida as APLICAÇÕES já salvas pelo app (neuroped_scales_results_v1 via
 * NPStore.resultsFor), ordena cronologicamente, agrupa por domínio funcional
 * canônico e descreve evolução de forma DETERMINÍSTICA e explicável.
 *
 * Importante (honestidade clínica): a DIREÇÃO clínica (melhora/piora) só é
 * afirmada quando a polaridade do instrumento está configurada (via
 * clinical-normalization). Sem isso, reporta apenas a magnitude/sentido do
 * sinal bruto do próprio instrumento, sem rotular como melhora/regressão.
 *
 * Biblioteca inerte (não carregada por páginas). Sem IA generativa.
 */
(function (global) {
  'use strict';

  var Norm = (global.NeuroPedClinical && global.NeuroPedClinical.Normalize) ||
    (typeof require !== 'undefined' ? require('./clinical-normalization.js') : null);

  // ---- estruturas ----
  function ClinicalEvent(o) {        // uma leitura de um domínio numa aplicação
    this.instrument = o.instrument; this.instrument_title = o.instrument_title || null;
    this.domain = o.domain; this.raw_domain_label = o.raw_domain_label || null;
    this.timestamp = o.timestamp; this.raw_pct = o.raw_pct;
    this.severity = (o.severity == null ? null : o.severity);
    this.normalized = !!o.normalized; this.respondent = o.respondent || null;
  }
  function FunctionalDomain(name) { this.domain = name; this.events = []; this.trajectory = null; }
  function ClinicalEpisode(o) { this.from = o.from; this.to = o.to; this.instrument = o.instrument; this.events = o.events || []; }
  function ClinicalTrajectory(o) {
    this.domain = o.domain; this.points = o.points || []; this.status = o.status; // see TRAJ
    this.direction = o.direction; this.magnitude = o.magnitude; this.stability = o.stability;
    this.span_days = o.span_days; this.n = (o.points || []).length; this.explanation = o.explanation;
    this.direction_confident = !!o.direction_confident;
  }

  var TRAJ = { IMPROVING: 'improving', PLATEAU: 'plateau', UNSTABLE: 'unstable', REGRESSING: 'regressing', SINGLE: 'single_point', UNKNOWN: 'direction_unconfigured' };

  function ts(x) { var t = new Date(x).getTime(); return isNaN(t) ? 0 : t; }
  function round(n, d) { var f = Math.pow(10, d || 2); return Math.round(Number(n) * f) / f; }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function stdev(a) { if (a.length < 2) return 0; var m = mean(a); return Math.sqrt(mean(a.map(function (x) { return (x - m) * (x - m); }))); }

  /* Converte uma aplicação salva (com domains[]) em ClinicalEvent[] por domínio. */
  function toEvents(result, config) {
    var out = [];
    var when = result.created_at || result.timestamp;
    var doms = Array.isArray(result.domains) && result.domains.length
      ? result.domains
      : [{ name: result.instrument_group || result.domain || result.instrument_title || 'geral', score: result.score, max: result.max, pct: (result.max ? result.score / result.max : null) }];
    doms.forEach(function (d) {
      var reading = {
        instrument_id: result.instrument_id, instrument_title: result.instrument_title,
        domain: d.name, score: d.score, max: d.max, pct: d.pct,
        created_at: when, respondent: result.respondent || result.audience
      };
      var n = Norm ? Norm.normalizeReading(reading, config) : { domain: null, raw_pct: reading.pct, severity: null, normalized: false };
      if (!n.domain) return; // domínio não-canônico → não força
      out.push(new ClinicalEvent({
        instrument: result.instrument_id, instrument_title: result.instrument_title,
        domain: n.domain, raw_domain_label: d.name, timestamp: when,
        raw_pct: n.raw_pct, severity: n.severity, normalized: n.normalized, respondent: n.respondent
      }));
    });
    return out;
  }

  /* Trajetória de UM domínio a partir de eventos do MESMO instrumento (séries
     comparáveis). Determinística; rotula direção clínica só com polaridade. */
  function trajectoryFor(domain, events, config) {
    var cfg = config || {};
    var thr = cfg.thresholds || {};
    var dMin = thr.change_min == null ? 0.10 : thr.change_min;      // variação mínima relevante (fração de severity/raw)
    var unstableSd = thr.unstable_sd == null ? 0.18 : thr.unstable_sd;

    // agrupa por instrumento (só compara like-with-like)
    var byInst = {};
    events.forEach(function (e) { (byInst[e.instrument] = byInst[e.instrument] || []).push(e); });
    // escolhe a série mais longa (mais informativa) para a trajetória do domínio
    var best = null;
    Object.keys(byInst).forEach(function (k) { var s = byInst[k].slice().sort(function (a, b) { return ts(a.timestamp) - ts(b.timestamp); }); if (!best || s.length > best.length) best = s; });
    best = best || [];
    if (best.length < 1) return null;

    var useSeverity = best.every(function (e) { return e.severity != null; });
    var vals = best.map(function (e) { return useSeverity ? e.severity : (e.raw_pct == null ? null : e.raw_pct); }).filter(function (v) { return v != null; });
    var points = best.map(function (e) { return { t: e.timestamp, value: useSeverity ? e.severity : e.raw_pct, instrument: e.instrument }; });
    var span = best.length > 1 ? Math.round((ts(best[best.length - 1].timestamp) - ts(best[0].timestamp)) / 86400000) : 0;

    if (vals.length < 2) {
      return new ClinicalTrajectory({ domain: domain, points: points, status: TRAJ.SINGLE, direction: 'na', magnitude: 0, stability: 1, span_days: span, explanation: 'Apenas uma aplicação comparável neste domínio — sem trajetória ainda.' });
    }

    var delta = vals[vals.length - 1] - vals[0];           // no sentido da métrica usada
    var sd = stdev(vals);
    var stability = round(1 - Math.min(1, sd / unstableSd), 3);
    var magnitude = round(Math.abs(delta), 3);

    // polaridade só conhecida se usamos severity normalizada (severity = pior quando maior)
    var status, direction, confident = false, expl;
    if (Math.abs(delta) < dMin && sd < unstableSd) { status = TRAJ.PLATEAU; direction = 'stable'; }
    else if (sd >= unstableSd && Math.abs(delta) < dMin) { status = TRAJ.UNSTABLE; direction = 'fluctuating'; }
    else if (useSeverity) {
      confident = true;
      // severity: maior = pior → delta>0 = regressão; delta<0 = melhora
      status = delta > 0 ? TRAJ.REGRESSING : TRAJ.IMPROVING;
      direction = delta > 0 ? 'worsening' : 'improving';
    } else {
      // sem polaridade configurada: NÃO rotula melhora/piora
      status = TRAJ.UNKNOWN;
      direction = delta > 0 ? 'raw_signal_up' : 'raw_signal_down';
    }
    expl = (useSeverity ? 'Severidade normalizada' : 'Sinal bruto (% do máximo do próprio instrumento — polaridade NÃO configurada)') +
      ' variou ' + round(delta, 3) + ' em ' + best.length + ' aplicações (' + span + ' dias). Estabilidade=' + stability + '.' +
      (useSeverity ? '' : ' Direção clínica (melhora/piora) requer config de polaridade do instrumento.');

    return new ClinicalTrajectory({ domain: domain, points: points, status: status, direction: direction, magnitude: magnitude, stability: stability, span_days: span, explanation: expl, direction_confident: confident });
  }

  function build(results, config) {
    config = config || {};
    var events = [];
    (results || []).forEach(function (r) { events = events.concat(toEvents(r, config)); });
    events.sort(function (a, b) { return ts(a.timestamp) - ts(b.timestamp); });

    var domains = {};
    events.forEach(function (e) { (domains[e.domain] = domains[e.domain] || new FunctionalDomain(e.domain)); domains[e.domain].events.push(e); });
    Object.keys(domains).forEach(function (d) { domains[d].trajectory = trajectoryFor(d, domains[d].events, config); });

    return {
      generated_at: new Date().toISOString(),
      n_applications: (results || []).length,
      n_events: events.length,
      domains_covered: Object.keys(domains),
      timeline: events,
      domains: domains,
      // sinais normalizados prontos para as demais engines (fenótipo, contradição…)
      signals: events.filter(function (e) { return e.normalized; }).map(function (e) {
        return { domain: e.domain, severity: e.severity, confidence: 1, source: e.instrument, timestamp: e.timestamp, respondent: e.respondent };
      })
    };
  }

  /* Conveniência: lê os resultados da criança ativa via NPStore. */
  function buildForActiveChild(config) {
    var S = global.NPStore;
    if (!S || !S.active) return build([], config);
    var c = S.active();
    var results = (c && S.resultsFor) ? S.resultsFor(c) : [];
    return build(results || [], config);
  }

  var api = {
    build: build, buildForActiveChild: buildForActiveChild, toEvents: toEvents, trajectoryFor: trajectoryFor,
    TRAJ: TRAJ, ClinicalEvent: ClinicalEvent, ClinicalEpisode: ClinicalEpisode, ClinicalTrajectory: ClinicalTrajectory, FunctionalDomain: FunctionalDomain
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.Timeline = api;
})(typeof self !== 'undefined' ? self : this);
