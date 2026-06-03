/* NeuroPed Clinical Intelligence Layer (V4) — clinical-normalization.js
 * FASE 2 — Normalização universal.
 *
 * Converte resultados heterogêneos em "normalized_clinical_signal" comparável,
 * MAS só quando há mapeamento clínico registrado para o instrumento. Comparação
 * bruta entre instrumentos incompatíveis é PROIBIDA por princípio (devolve
 * needs_mapping). Severidade/polaridade/percentis vêm de config do responsável.
 *
 * Biblioteca inerte (não carregada por páginas). Determinística.
 */
(function (global) {
  'use strict';

  // 12 domínios funcionais canônicos (FASE 1).
  var DOMAINS = ['linguagem', 'atencao', 'hiperatividade', 'socializacao', 'rigidez',
    'sensorial', 'aprendizagem', 'emocional', 'comportamento_adaptativo', 'executivo', 'sono', 'autonomia'];

  // Mapa lexical (rótulo de domínio do instrumento → domínio canônico). É
  // sobreponível por config; aqui é apenas roteamento textual, não juízo clínico.
  var DEFAULT_DOMAIN_MAP = [
    [/lingua|fala|comunica|verbal|fono/i, 'linguagem'],
    [/aten[cç]|desaten|concentra/i, 'atencao'],
    [/hiperativ|impulsiv|agita/i, 'hiperatividade'],
    [/social|recipro|intera|v[ií]nculo|amig/i, 'socializacao'],
    [/rigid|repetitiv|interesse restrito|rotina|estereotip/i, 'rigidez'],
    [/sensor|t[áa]til|auditiv|sensa|processamento sensorial/i, 'sensorial'],
    [/aprendiz|leitura|escrita|matem|escolar|acad[êe]m|dislex|discalc/i, 'aprendizagem'],
    [/humor|ansiedad|emocion|depress|irritab|afet/i, 'emocional'],
    [/comportament|adaptativ|condut|opositor|agress/i, 'comportamento_adaptativo'],
    [/executiv|planejamento|organiza|mem[óo]ria de trabalho|inibi/i, 'executivo'],
    [/sono|dorm|ins[ôo]nia|vig[íi]lia/i, 'sono'],
    [/autonomi|independ|vida di[áa]ria|autocuidado|avd/i, 'autonomia']
  ];

  function canonicalDomain(label, config) {
    var override = config && config.domainMap && config.domainMap[label];
    if (override && DOMAINS.indexOf(override) >= 0) return override;
    var s = String(label || '');
    for (var i = 0; i < DEFAULT_DOMAIN_MAP.length; i++) if (DEFAULT_DOMAIN_MAP[i][0].test(s)) return DEFAULT_DOMAIN_MAP[i][1];
    return null; // domínio não-reconhecido: honesto, não força
  }

  /* Normaliza UMA leitura (resultado de instrumento, um domínio).
     - raw_pct: razão score/max (métrica transparente que o app já usa).
     - severity/polarity: SÓ se houver mapeamento clínico registrado para o
       instrumento. Sem isso, devolve needs_mapping:true (sem adivinhar).
     config.instruments[instrumentId] = {
        polarity: 'higher_is_worse' | 'higher_is_better',
        severityFn?: function(raw_pct, ageMonths) -> 0..1,
        percentileFn?, zscoreFn?, confidence?: 0..1
     }
  */
  function normalizeReading(reading, config) {
    reading = reading || {};
    config = config || {};
    var instId = reading.instrument_id || reading.source;
    var raw = (reading.max ? Number(reading.score) / Number(reading.max) : (reading.pct != null ? Number(reading.pct) : null));
    var domain = reading.canonical_domain || canonicalDomain(reading.domain, config);
    var imap = (config.instruments || {})[instId] || null;

    var base = {
      source: instId || null,
      domain: domain,
      raw_domain_label: reading.domain || null,
      raw_pct: raw == null ? null : round(raw, 4),
      timestamp: reading.timestamp || reading.created_at || null,
      respondent: reading.respondent || reading.audience || null
    };

    if (!imap || !imap.polarity) {
      // PROIBIDO comparar severidade sem mapeamento clínico do instrumento.
      base.severity = null;
      base.confidence = 0;
      base.needs_mapping = true;
      base.reason = 'Sem mapeamento clínico (polaridade/severidade) registrado para "' + (instId || '?') +
        '". raw_pct é exposto apenas como referência do próprio instrumento; comparação entre instrumentos NÃO autorizada.';
      return base;
    }

    var sev;
    if (typeof imap.severityFn === 'function') {
      sev = clamp01(imap.severityFn(raw, reading.age_months));
    } else {
      // sem função de severidade explícita: deriva do raw respeitando a polaridade
      sev = (imap.polarity === 'higher_is_better') ? clamp01(1 - raw) : clamp01(raw);
    }
    base.severity = sev == null ? null : round(sev, 4);
    base.polarity = imap.polarity;
    base.confidence = clamp01(imap.confidence == null ? 0.6 : imap.confidence);
    base.normalized = true;
    if (typeof imap.percentileFn === 'function') base.percentile = imap.percentileFn(raw, reading.age_months);
    if (typeof imap.zscoreFn === 'function') base.zscore = imap.zscoreFn(raw, reading.age_months);
    return base;
  }

  /* Dois sinais só são comparáveis se ambos normalizados e do mesmo domínio. */
  function comparable(a, b) {
    return !!(a && b && a.normalized && b.normalized && a.domain && a.domain === b.domain);
  }

  function clamp01(n) { n = Number(n); if (isNaN(n)) return 0; return Math.max(0, Math.min(1, n)); }
  function round(n, d) { var f = Math.pow(10, d || 2); return Math.round(Number(n) * f) / f; }

  var api = {
    DOMAINS: DOMAINS.slice(),
    canonicalDomain: canonicalDomain,
    normalizeReading: normalizeReading,
    comparable: comparable
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NeuroPedClinical = global.NeuroPedClinical || {};
  global.NeuroPedClinical.Normalize = api;
})(typeof self !== 'undefined' ? self : this);
