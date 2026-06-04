/* NeuroPed SDG — scales-clinical-signals.js
 * Camada ADITIVA e à prova de falhas sobre o motor de laudo.
 *
 * Motivo (auditoria 2026-06): o motor genérico interpreta o resultado apenas
 * por % do escore máximo e NÃO consome os campos autorais já definidos nas
 * escalas: `cutoffs` (faixas calibradas), `traps` (sinais de atenção) e
 * `gate_message` (porta de investigação). Este módulo lê esses campos do
 * catálogo (window.NEUROPED_EDITORIAL_SCALES) + as respostas (window.answers)
 * e injeta um painel claramente rotulado no resultado, SEM remover nada e SEM
 * fechar diagnóstico. Falha em silêncio se algo não existir.
 *
 * Expõe window.NeuroPedClinicalSignals.evaluate(scale, answers) (função pura,
 * testável). Semântica das travas: "qualquer item do idx >= min" (a confirmar
 * com o autor clínico). Carregar APÓS scales-bundle.js.
 */
(function () {
  'use strict';
  if (window.__npClinicalSignals) return; window.__npClinicalSignals = true;

  function num(v) { v = (v == null ? null : Number(v)); return (v == null || isNaN(v)) ? null : v; }
  function maxPerItem(scale) {
    var opt = scale.options || scale.labels;
    return (Array.isArray(opt) && opt.length) ? (opt.length - 1) : 3;
  }
  // valor do item de índice global k (escalas NPE são domínio único → chave '0-k')
  function itemVals(scale, answers) {
    var n = (scale.items || []).length, out = [];
    for (var i = 0; i < n; i++) out.push(num(answers && answers['0-' + i]));
    return out;
  }
  // total robusto: soma TODOS os valores numéricos respondidos (independe da chave)
  function totalOf(answers) {
    var t = 0; if (!answers) return 0;
    for (var k in answers) if (Object.prototype.hasOwnProperty.call(answers, k)) { var v = num(answers[k]); if (v != null) t += v; }
    return t;
  }
  function cutoffBand(scale, total) {
    var cs = scale.cutoffs; if (!Array.isArray(cs) || !cs.length) return null;
    for (var i = 0; i < cs.length; i++) if (total <= cs[i].max) return cs[i];
    return cs[cs.length - 1];
  }
  function firedTraps(scale, vals) {
    var out = [];
    (scale.traps || []).forEach(function (tp) {
      var idx = tp.idx || [], min = (tp.min == null ? 3 : tp.min);
      var hit = idx.some(function (i) { var v = vals[i]; return v != null && v >= min; });
      if (hit) out.push({ msg: tp.msg, level: tp.level || 'atencao' });
    });
    return out;
  }
  function firedGate(scale, vals, total) {
    var g = scale.gate_message; if (!g) return null;
    var need = (g.requireTotal == null ? 0 : g.requireTotal);
    var any = (g.anyItem || []).some(function (i) { var v = vals[i]; return v != null && v >= (g.min == null ? 1 : g.min); });
    return (total >= need && any) ? { msg: g.msg } : null;
  }

  window.NeuroPedClinicalSignals = {
    evaluate: function (scale, answers) {
      if (!scale) return null;
      var vals = itemVals(scale, answers);
      var answered = vals.filter(function (v) { return v != null; }).length;
      var total = totalOf(answers);
      return {
        total: total,
        maxTotal: (scale.items || []).length * maxPerItem(scale),
        answered: answered,
        totalItems: (scale.items || []).length,
        band: cutoffBand(scale, total),
        traps: firedTraps(scale, vals),
        gate: firedGate(scale, vals, total)
      };
    }
  };

  /* ---------- integração visual (à prova de falhas) ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  var CLS_COLOR = { ok: '#0f766e', warn: '#b45309', risk: '#b91c1c' };

  function activeScale() {
    try {
      var id = window.activeId || ((window.scales || [])[0] || {}).id;
      var cat = window.NEUROPED_EDITORIAL_SCALES || [];
      for (var i = 0; i < cat.length; i++) if (cat[i] && cat[i].id === id) return cat[i];
    } catch (e) {}
    return null;
  }
  function activeAnswers(scale) {
    try { var a = window.answers || {}; return (scale && a[scale.id]) || a || {}; } catch (e) { return {}; }
  }
  function hasSignals(s) {
    return (Array.isArray(s.cutoffs) && s.cutoffs.length) || (s.traps && s.traps.length) || s.gate_message;
  }

  function panelHTML(ev) {
    if (!ev || (!ev.band && !ev.traps.length && !ev.gate)) return '';
    var p = [];
    p.push('<div id="npClinicalSignals" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin:2px 0 14px;background:#fbfaf7">');
    p.push('<div style="font:800 13px system-ui;color:#0f172a;margin-bottom:6px">Interpretação calibrada <span style="font-weight:600;color:#64748b">(faixas autorais do instrumento)</span></div>');
    if (ev.band) {
      var col = CLS_COLOR[ev.band.cls] || '#334155';
      p.push('<div style="display:flex;align-items:center;gap:8px;font:700 13px system-ui;color:' + col + '"><span style="width:10px;height:10px;border-radius:50%;background:' + col + ';display:inline-block"></span>' + esc(ev.band.label) + '</div>');
      p.push('<div style="font:600 11px system-ui;color:#64748b;margin-top:2px">Pontuação ' + ev.total + ' / ' + ev.maxTotal + (ev.answered < ev.totalItems ? (' · ' + (ev.totalItems - ev.answered) + ' item(ns) sem resposta') : '') + '</div>');
    }
    var alerts = (ev.traps || []).slice();
    if (ev.gate) alerts.push({ msg: ev.gate.msg, level: 'gate' });
    if (alerts.length) {
      p.push('<div style="margin-top:10px;font:800 12px system-ui;color:#b91c1c">⚠ Sinais de atenção</div><ul style="margin:4px 0 0;padding-left:18px">');
      alerts.forEach(function (a) {
        var pr = (a.level === 'prioritario' || a.level === 'gate');
        p.push('<li style="font:' + (pr ? '700' : '600') + ' 12px system-ui;color:' + (pr ? '#b91c1c' : '#7c2d12') + ';margin-bottom:3px">' + esc(a.msg) + '</li>');
      });
      p.push('</ul>');
    }
    p.push('<div style="font:600 10px system-ui;color:#94a3b8;margin-top:8px">Faixas e sinais conforme definição autoral do instrumento. Apoio à leitura — não substitui validação clínica nem fecha diagnóstico; a decisão é do médico responsável.</div>');
    p.push('</div>');
    return p.join('');
  }

  function inject(container) {
    try {
      if (!container || document.getElementById('npClinicalSignals')) return;
      var scale = activeScale(); if (!scale || !hasSignals(scale)) return;
      var ev = window.NeuroPedClinicalSignals.evaluate(scale, activeAnswers(scale));
      var html = panelHTML(ev); if (!html) return;
      container.insertAdjacentHTML('afterbegin', html);
    } catch (e) {}
  }

  function watch() {
    try {
      var obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes || [];
          for (var j = 0; j < added.length; j++) {
            var n = added[j]; if (!n || n.nodeType !== 1) continue;
            var c = (n.id === 'npResultContent') ? n : (n.querySelector && n.querySelector('#npResultContent'));
            if (c) inject(c);
          }
        }
      });
      obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
