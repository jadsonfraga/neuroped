/* NeuroPed CIL — clinical-config-adapter.js
 * Aceita o schema "clínico-amigável" do responsável E o schema interno das
 * engines, normalizando para o formato que NeuroPedCIL consome. Assim a config
 * pode ser escrita do jeito mais natural sem quebrar as engines.
 *
 * Entrada (qualquer um dos dois, ou misto):
 *   instruments[id].higher_is_worse: bool   →  polarity: 'higher_is_worse'|'higher_is_better'
 *   instruments[id].polarity: 'higher_is_worse'|'higher_is_better' (já interno)
 *   trajectory.worsening_threshold_percent / improvement_threshold_percent / minimum_points_for_trend
 *                                            →  thresholds.change_min / rti.mcid / thresholds.min_points
 *   phenotypes: [...] (interno)  OU  phenotype_rules (best-effort; regras if-based ficam à parte)
 * Preserva _status, domainMap, contradiction, cds, burden.
 * Expõe window.NeuroPedCIL.adaptConfig(raw).
 */
(function (global) {
  'use strict';
  function clamp01(n){ n=Number(n); return isNaN(n)?undefined:Math.max(0,Math.min(1,n)); }

  function adaptConfig(raw) {
    raw = raw || {};
    var out = { _status: raw._status, interpretation: raw.interpretation, _adapted: true };

    // ---- instrumentos: higher_is_worse(bool) → polarity(string) ----
    var inst = {};
    Object.keys(raw.instruments || {}).forEach(function (id) {
      var s = raw.instruments[id] || {};
      var polarity = s.polarity;
      if (!polarity && typeof s.higher_is_worse === 'boolean') polarity = s.higher_is_worse ? 'higher_is_worse' : 'higher_is_better';
      var o = { polarity: polarity, confidence: (s.confidence == null ? 0.7 : s.confidence) };
      if (s.domain) o.domain = s.domain;        // domínio canônico opcional por instrumento
      inst[id] = o;
    });
    out.instruments = inst;

    // ---- thresholds: percent → fração; min_points ----
    var thr = Object.assign({}, raw.thresholds || {});
    var tj = raw.trajectory || {};
    var w = tj.worsening_threshold_percent, im = tj.improvement_threshold_percent;
    if (w != null || im != null) {
      var pcts = [w, im].filter(function (x) { return x != null; }).map(Number);
      var pctMin = pcts.length ? Math.min.apply(null, pcts) : null;
      if (pctMin != null) thr.change_min = pctMin / 100;
    }
    if (thr.change_min == null) thr.change_min = 0.10;
    if (thr.unstable_sd == null) thr.unstable_sd = 0.18;
    if (tj.minimum_points_for_trend != null) thr.min_points = Number(tj.minimum_points_for_trend);
    out.thresholds = thr;

    // ---- RTI / MCID ----
    out.rti = raw.rti || (im != null ? { mcid: Number(im) / 100 } : undefined);

    // ---- fenótipo: array interno OU regras if-based (estas não viram peso; passam à parte) ----
    if (Array.isArray(raw.phenotypes)) out.phenotypes = raw.phenotypes;
    if (raw.phenotype_rules) out.phenotype_rules = raw.phenotype_rules; // engine de regras separado, se houver

    out.domainMap = raw.domainMap;
    out.contradiction = raw.contradiction;
    out.cds = raw.cds;
    out.burden = raw.burden;
    return out;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { adaptConfig: adaptConfig };
  global.NeuroPedCIL = global.NeuroPedCIL || {};
  global.NeuroPedCIL.adaptConfig = adaptConfig;
})(typeof self !== 'undefined' ? self : this);
