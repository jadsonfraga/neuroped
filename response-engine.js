/* NeuroPed Clinical Intelligence Layer (V4) — response-engine.js
 * FASE 5 — Response to Intervention (RTI).
 *
 * A partir de uma série temporal de UM instrumento (like-with-like), detecta:
 * improving | plateau | unstable | regressing | fluctuation, com suavização
 * (média móvel) e MCID (mínima diferença clinicamente importante) vinda de
 * config. Direção clínica só com polaridade configurada (senão, sentido bruto).
 *
 * series[] = [{ t, value(0..1), instrument }]  (value = severity normalizada OU raw_pct)
 * config.rti = { mcid?:0..1, window?:int, unstable_sd?:0..1 }
 * config.instruments[id].polarity para rotular melhora/piora.
 * Biblioteca inerte.
 */
(function (global) {
  'use strict';
  var Explain = dep('Explain', './clinical-explainability.js');

  function smooth(values, window) {
    window = Math.max(1, window || 1); if (window === 1) return values.slice();
    return values.map(function (_, i) { var a = values.slice(Math.max(0, i - window + 1), i + 1); return mean(a); });
  }

  function analyze(series, opts) {
    opts = opts || {};
    var cfg = (opts.config && opts.config.rti) || {};
    var mcid = cfg.mcid == null ? null : Number(cfg.mcid);
    var win = cfg.window == null ? 2 : cfg.window;
    var unstableSd = cfg.unstable_sd == null ? 0.18 : cfg.unstable_sd;
    var polarity = opts.polarity || (opts.config && opts.config.instruments && series.length && opts.config.instruments[series[0].instrument] && opts.config.instruments[series[0].instrument].polarity) || null;
    var severityBased = !!opts.severity_based; // true se value já é severidade normalizada

    var pts = (series || []).slice().filter(function (p) { return p && p.value != null; }).sort(function (a, b) { return ts(a.t) - ts(b.t); });
    if (pts.length < 2) return { trajectory_status: 'single_point', n: pts.length, explanation: 'Série insuficiente (mín. 2 aplicações comparáveis).' };

    var raw = pts.map(function (p) { return Number(p.value); });
    var sm = smooth(raw, win);
    var delta = sm[sm.length - 1] - sm[0];
    var sd = stdev(raw);
    var significant = mcid == null ? (Math.abs(delta) >= 0.10) : (Math.abs(delta) >= mcid);

    var status, direction, confident = false;
    if (sd >= unstableSd && !significant) { status = 'unstable'; direction = 'fluctuating'; }
    else if (!significant) { status = 'plateau'; direction = 'stable'; }
    else if (severityBased || polarity) {
      // severidade OU polaridade conhecida → maior severidade = pior
      var worse = severityBased ? (delta > 0) : (polarity === 'higher_is_worse' ? delta > 0 : delta < 0);
      status = worse ? 'regressing' : 'improving';
      direction = worse ? 'worsening' : 'improving';
      confident = true;
    } else {
      status = 'changed_direction_unconfigured'; direction = delta > 0 ? 'raw_up' : 'raw_down';
    }

    var ci = confInterval(raw);
    var out = {
      trajectory_status: status, direction: direction, direction_confident: confident,
      delta: round(delta, 3), smoothed: sm.map(function (v) { return round(v, 3); }), stdev: round(sd, 3),
      mcid_used: mcid, significant: significant, n: pts.length, ci95: ci, points: pts,
      explanation: (severityBased ? 'Severidade normalizada' : (polarity ? 'Sinal com polaridade configurada' : 'Sinal bruto sem polaridade')) +
        ', média móvel(w=' + win + '), Δ=' + round(delta, 3) + (mcid != null ? (' vs MCID=' + mcid) : ' (MCID não configurado → limiar 0.10 provisório)') + '.'
    };
    if (significant && confident) {
      out.insight = Explain.makeInsight({
        engine: 'ResponseEngine', insight: 'Resposta longitudinal: ' + status,
        confidence: clamp01(0.5 + Math.min(0.4, Math.abs(delta))), domain: opts.domain || null,
        evidence: pts.map(function (p) { return { source: p.instrument, domain: opts.domain || null, signal: round(p.value, 3), weight: 1, timestamp: p.t }; }),
        explanation: out.explanation + ' Apoio à leitura de resposta — não decide conduta.'
      });
    }
    return out;
  }

  function confInterval(a) { if (a.length < 2) return null; var m = mean(a), sd = stdev(a), se = sd / Math.sqrt(a.length); return { mean: round(m, 3), lo: round(m - 1.96 * se, 3), hi: round(m + 1.96 * se, 3) }; }
  function dep(name, path) { return (global.NeuroPedCIL && global.NeuroPedCIL[name]) || (typeof require !== 'undefined' ? require(path) : null); }
  function ts(x) { var t = new Date(x).getTime(); return isNaN(t) ? 0 : t; }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function stdev(a) { if (a.length < 2) return 0; var m = mean(a); return Math.sqrt(mean(a.map(function (x) { return (x - m) * (x - m); }))); }
  function clamp01(n) { n = Number(n); if (isNaN(n)) return 0; return Math.max(0, Math.min(1, n)); }
  function round(n, d) { var f = Math.pow(10, d || 2); return Math.round(Number(n) * f) / f; }

  var api = { analyze: analyze, smooth: smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedCIL = global.NeuroPedCIL || {};
  global.NeuroPedCIL.Response = api;
})(typeof self !== 'undefined' ? self : this);
