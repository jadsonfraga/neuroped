/* NeuroPed Clinical Intelligence Layer (V4) — clinical-explainability.js
 * Envelope de explicabilidade. Regra de ouro: NENHUM insight sem evidência.
 * Proíbe "caixa-preta": todo insight aponta instrumentos, peso, domínio e sinal.
 *
 * Camada de biblioteca — NÃO acoplada a UI, NÃO carregada por nenhuma página
 * ainda. Determinística. Nada de IA generativa.
 */
(function (global) {
  'use strict';

  /* Cria um insight auditável. Lança se faltar evidência (anti-caixa-preta). */
  function makeInsight(o) {
    o = o || {};
    if (!o.insight || typeof o.insight !== 'string') throw new Error('explainability: insight (texto) é obrigatório');
    var evidence = Array.isArray(o.evidence) ? o.evidence : [];
    if (!evidence.length) throw new Error('explainability: insight sem evidence[] é proibido (caixa-preta)');
    var conf = clamp01(o.confidence == null ? 0.5 : Number(o.confidence));
    return {
      insight: o.insight,
      confidence: conf,
      confidence_label: confidenceLabel(conf),
      domain: o.domain || null,
      evidence: evidence.map(normEvidence),
      conflicting_signals: Array.isArray(o.conflicting_signals) ? o.conflicting_signals : [],
      explanation: o.explanation || '',
      // rastro de proveniência: quais instrumentos e pesos sustentam a inferência
      provenance: {
        instruments: uniq(evidence.map(function (e) { return e.source; }).filter(Boolean)),
        generated_at: new Date().toISOString(),
        engine: o.engine || null,
        config_required: !!o.config_required
      },
      // toda inferência clínica é apoio, nunca diagnóstico automático
      disclaimer: 'Apoio à decisão clínica explicável. Não é diagnóstico automático nem substitui avaliação médica.'
    };
  }

  /* Um item de evidência: instrumento + domínio + intensidade + peso aplicado. */
  function normEvidence(e) {
    e = e || {};
    return {
      source: e.source || e.instrument || null,          // instrumento usado
      domain: e.domain || null,                           // domínio afetado
      signal: e.signal == null ? null : Number(e.signal), // intensidade do sinal (0–1)
      weight: e.weight == null ? null : Number(e.weight), // peso aplicado
      timestamp: e.timestamp || null,
      note: e.note || ''
    };
  }

  /* Quando a engine não tem configuração clínica suficiente, devolve um
     "não-insight" honesto em vez de adivinhar. */
  function insufficientConfig(engine, what) {
    return {
      insight: null,
      status: 'insufficient_clinical_configuration',
      confidence: 0,
      missing: what || 'configuração clínica',
      explanation: 'A engine "' + engine + '" exige configuração clínica validada (' + (what || '') +
        ') para inferir com segurança. Sem isso, NÃO infere — por princípio.',
      disclaimer: 'Nenhuma inferência fabricada sem base clínica definida pelo responsável.'
    };
  }

  function clamp01(n) { n = Number(n); if (isNaN(n)) return 0; return Math.max(0, Math.min(1, n)); }
  function confidenceLabel(c) { return c >= 0.8 ? 'alta' : c >= 0.55 ? 'moderada' : c >= 0.3 ? 'baixa' : 'muito baixa'; }
  function uniq(a) { var s = {}, o = []; (a || []).forEach(function (x) { if (!s[x]) { s[x] = 1; o.push(x); } }); return o; }

  var api = { makeInsight: makeInsight, insufficientConfig: insufficientConfig, _normEvidence: normEvidence };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.Explain = api;
})(typeof self !== 'undefined' ? self : this);
