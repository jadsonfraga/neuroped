/**
 * canFamilyAdminister.js v1.0
 * ---------------------------
 * Gate canônico que substitui o isDiaryPre() de filtro-escalas.html:257
 * e o kindOf() de scales-curate.js:13.
 *
 * Único ponto de decisão "isto pode ser respondido pela família em pré-consulta?".
 *
 * Implementa também:
 *  - Blocklist explícito por ID (Vineland, CARS, Conners-3, GMFCS, C-SSRS,
 *    ASQ Suicide, CBCL, SRS-2): NUNCA aparecem para a família.
 *  - Allowlist explícito (M-CHAT, SNAP-IV, Vanderbilt, SDQ, PHQ-A, GAD-7,
 *    BISQ, SRS-2, ABC): sempre considerados, sujeitos a gate.
 *  - Razão estruturada de rejeição (para debug/auditoria).
 */
(function (global) {
  'use strict';

  const O = global.NEUROPED_ONTOLOGY;
  const Overlay = global.NEUROPED_OVERLAY;
  if (!O || !Overlay) {
    console.error('[canFamilyAdminister] ontology.js ou overlay.js não carregados.');
    return;
  }

  // ──────────────────────────────────────────────────────────
  // Listas explícitas (sobrepõem decisões heurísticas)
  // ──────────────────────────────────────────────────────────

  const BLOCKLIST = Object.freeze(new Set([
    'vineland-3',
    'cars-2',
    'conners-3',
    'gmfcs',
    'c-ssrs',
    'asq-suicide',
    'cbcl',
    'srs-2'
    // Adicionar aqui qualquer instrumento que jamais deve aparecer na pré-consulta
  ]));

  const ALLOWLIST_HINTS = Object.freeze(new Set([
    'mchat-r-f',
    'snap-iv',
    'vanderbilt-pais',
    'vanderbilt-professor',
    'sdq-pt',
    'phq-a',
    'gad-7',
    'bisq-pt',
    'abc-comportamento-triagem'
    // Estes têm precedência sobre heurística — sempre passam pela ontologia,
    // mas não sofrem rejeição extra além do gate definido em seu próprio typing.
  ]));

  /**
   * @typedef {Object} GateResult
   * @property {boolean} allowed
   * @property {string|null} reason  Por que foi bloqueado, se foi.
   * @property {string} code         'ok' | 'blocklist' | 'no_typing' | 'wrong_type'
   *                                | 'wrong_respondent' | 'training_required'
   *                                | 'too_long' | 'clinical_gate'
   */

  /**
   * Avalia se um instrumento pode ser respondido pela família em pré-consulta.
   *
   * @param {Object} instrument  Objeto bruto (com ou sem .typing aplicado)
   * @returns {GateResult}
   */
  function evaluate(instrument) {
    if (!instrument || !instrument.id) {
      return { allowed: false, reason: 'instrumento inválido', code: 'no_typing' };
    }

    // 1) Blocklist explícito tem precedência absoluta
    if (BLOCKLIST.has(instrument.id)) {
      return {
        allowed: false,
        reason: 'Instrumento bloqueado por política clínica (exige profissional certificado, licença ou avaliação direta).',
        code: 'blocklist'
      };
    }

    // 2) Garante typing (aplica overlay se necessário)
    if (!instrument.typing) instrument.typing = Overlay.getTyping(instrument);
    const t = instrument.typing;
    if (!t) {
      return { allowed: false, reason: 'sem typing após overlay', code: 'no_typing' };
    }

    // 3) Tipo aceito? (escala, inventário ou diário)
    const okType = [
      O.INSTRUMENT_TYPE.SCALE_QUESTIONNAIRE,
      O.INSTRUMENT_TYPE.INVENTORY,
      O.INSTRUMENT_TYPE.DIARY
    ].includes(t.instrument_type);
    if (!okType) {
      return {
        allowed: false,
        reason: `Instrumento do tipo ${t.instrument_type} — pertence ao engine de testes diretos ou ferramentas clínicas.`,
        code: 'wrong_type'
      };
    }

    // 4) Respondente compatível?
    const okResp = [
      O.RESPONDENT.FAMILY,
      O.RESPONDENT.TEACHER,
      O.RESPONDENT.SELF_REPORT,
      O.RESPONDENT.MULTI_INFORMANT
    ].includes(t.respondent_required);
    if (!okResp) {
      return {
        allowed: false,
        reason: `Respondente requerido (${t.respondent_required}) não é família/escola/autoteste.`,
        code: 'wrong_respondent'
      };
    }

    // 5) Treinamento aceitável (none ou brief)
    if (t.training_required && t.training_level === O.TRAINING_LEVEL.CERTIFICATION) {
      return {
        allowed: false,
        reason: 'Exige certificação formal — não é apropriado para pré-consulta familiar.',
        code: 'training_required'
      };
    }

    // 6) Duração aceitável (diários são exceção: tempo contínuo)
    const isDiary = t.instrument_type === O.INSTRUMENT_TYPE.DIARY;
    if (!isDiary && typeof t.time_to_apply_minutes === 'number' && t.time_to_apply_minutes > 20) {
      return {
        allowed: false,
        reason: `Aplicação estimada em ${t.time_to_apply_minutes} min — acima do limite de 20 min para pré-consulta.`,
        code: 'too_long'
      };
    }

    // 7) Gate clínico ativo
    if (O.hasClinicalGate(t)) {
      return {
        allowed: false,
        reason: t.clinical_gate.reason || 'Possui gate clínico ativo.',
        code: 'clinical_gate'
      };
    }

    // Aprovado
    return { allowed: true, reason: null, code: 'ok' };
  }

  /** Filtra uma lista, retornando só os aprovados para pré-consulta. */
  function filterList(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(s => evaluate(s).allowed);
  }

  /**
   * Diagnóstico: retorna lista anotada com motivo de cada decisão.
   * Útil para auditoria — substituir gradualmente regex pelos motivos formais.
   */
  function audit(list) {
    if (!Array.isArray(list)) return [];
    return list.map(s => {
      const r = evaluate(s);
      return {
        id: s && s.id,
        title: s && s.title,
        allowed: r.allowed,
        code: r.code,
        reason: r.reason
      };
    });
  }

  const NEUROPED_PRE_CONSULT_GATE = Object.freeze({
    BLOCKLIST: [...BLOCKLIST],
    ALLOWLIST_HINTS: [...ALLOWLIST_HINTS],
    evaluate,
    filterList,
    audit
  });
  global.NEUROPED_PRE_CONSULT_GATE = NEUROPED_PRE_CONSULT_GATE;

  if (typeof module !== 'undefined' && module.exports) module.exports = NEUROPED_PRE_CONSULT_GATE;
})(typeof window !== 'undefined' ? window : globalThis);
