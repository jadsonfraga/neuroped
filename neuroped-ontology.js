/**
 * NeuroPed Ontology v1.0
 * ----------------------
 * Núcleo de classificação multidimensional dos instrumentos clínicos.
 * Substitui a inferência por regex (kindOf / isDiaryPre) por um schema
 * declarativo e tipado via JSDoc.
 *
 * Spec canônica: ./INSTRUMENT_ONTOLOGY.md
 *
 * Exporta em window.NEUROPED_ONTOLOGY para uso no browser sem build step.
 */
(function (global) {
  'use strict';

  const VERSION = '1.0.0';

  // ──────────────────────────────────────────────────────────
  // Enums canônicos
  // ──────────────────────────────────────────────────────────

  const INSTRUMENT_TYPE = Object.freeze({
    DIRECT_TEST:         'direct_test',
    SCALE_QUESTIONNAIRE: 'scale_questionnaire',
    INVENTORY:           'inventory',
    DIARY:               'diary',
    CLINICAL_TOOL:       'clinical_tool'
  });

  const RESPONDENT = Object.freeze({
    CLINICIAN_TRAINED: 'clinician_trained',
    CLINICIAN_ANY:     'clinician_any',
    FAMILY:            'family',
    TEACHER:           'teacher',
    SELF_REPORT:       'self_report',
    MULTI_INFORMANT:   'multi_informant'
  });

  const TRAINING_LEVEL = Object.freeze({
    NONE:          'none',
    BRIEF:         'brief',
    CERTIFICATION: 'certification'
  });

  const APPLICATION_MODE = Object.freeze({
    PRESENCIAL_CLINICO:     'presencial_clinico',
    REMOTO_FAMILIA:         'remoto_familia',
    REMOTO_ESCOLA:          'remoto_escola',
    AUTOAPLICADO:           'autoaplicado',
    LONGITUDINAL_CONTINUO:  'longitudinal_continuo',
    ENTREVISTA_ESTRUTURADA: 'entrevista_estruturada'
  });

  /**
   * @typedef {Object} ClinicalGate
   * @property {boolean} enabled
   * @property {string}  [reason]
   * @property {string}  [message_to_family]
   * @property {string[]} [bypass_roles]
   */

  /**
   * @typedef {Object} Sentinel
   * @property {boolean}  enabled
   * @property {number[]} [trigger_items]
   * @property {number}   [trigger_threshold]
   * @property {'alert_clinician'|'show_resources'|'block_export'} [action]
   */

  /**
   * @typedef {Object} InstrumentTyping
   * Os cinco eixos canônicos da ontologia.
   * @property {string}  instrument_type
   * @property {string}  respondent_required
   * @property {boolean} training_required
   * @property {string}  training_level
   * @property {number|null} time_to_apply_minutes  Null para instrumentos longitudinais (sem tempo único).
   * @property {string}  application_mode
   * @property {ClinicalGate} [clinical_gate]
   * @property {Sentinel}     [sentinel]
   * @property {'manual'|'catalog'|'heuristic_fallback'} classification_source
   * @property {string} ontology_version
   */

  // ──────────────────────────────────────────────────────────
  // Validadores
  // ──────────────────────────────────────────────────────────

  const _values = (enumObj) => Object.values(enumObj);

  /**
   * Valida que um objeto de tipagem está bem-formado.
   * @param {InstrumentTyping} t
   * @returns {{ok: boolean, errors: string[]}}
   */
  function validateTyping(t) {
    const errors = [];
    if (!t || typeof t !== 'object') return { ok: false, errors: ['typing is null/non-object'] };

    if (!_values(INSTRUMENT_TYPE).includes(t.instrument_type))
      errors.push(`instrument_type inválido: ${t.instrument_type}`);

    if (!_values(RESPONDENT).includes(t.respondent_required))
      errors.push(`respondent_required inválido: ${t.respondent_required}`);

    if (typeof t.training_required !== 'boolean')
      errors.push('training_required deve ser boolean');

    if (!_values(TRAINING_LEVEL).includes(t.training_level))
      errors.push(`training_level inválido: ${t.training_level}`);

    if (t.training_required === false && t.training_level !== TRAINING_LEVEL.NONE)
      errors.push('Inconsistência: training_required=false exige training_level="none"');

    if (t.time_to_apply_minutes !== null &&
        (typeof t.time_to_apply_minutes !== 'number' || t.time_to_apply_minutes < 0))
      errors.push('time_to_apply_minutes deve ser number>=0 ou null (longitudinal)');

    if (!_values(APPLICATION_MODE).includes(t.application_mode))
      errors.push(`application_mode inválido: ${t.application_mode}`);

    if (t.instrument_type === INSTRUMENT_TYPE.DIARY &&
        t.application_mode !== APPLICATION_MODE.LONGITUDINAL_CONTINUO)
      errors.push('Diários exigem application_mode="longitudinal_continuo"');

    return { ok: errors.length === 0, errors };
  }

  // ──────────────────────────────────────────────────────────
  // Atributos derivados (funções puras)
  // ──────────────────────────────────────────────────────────

  /**
   * Pertence ao engine de testes diretos?
   * @param {InstrumentTyping} t
   */
  function belongsToDirectTestEngine(t) {
    if (!t) return false;
    return t.instrument_type === INSTRUMENT_TYPE.DIRECT_TEST
      || t.application_mode === APPLICATION_MODE.PRESENCIAL_CLINICO;
  }

  /**
   * Pertence ao engine de escalas/questionários?
   * @param {InstrumentTyping} t
   */
  function belongsToScaleEngine(t) {
    if (!t) return false;
    const okType = t.instrument_type === INSTRUMENT_TYPE.SCALE_QUESTIONNAIRE
                || t.instrument_type === INSTRUMENT_TYPE.INVENTORY;
    const okMode = [
      APPLICATION_MODE.REMOTO_FAMILIA,
      APPLICATION_MODE.REMOTO_ESCOLA,
      APPLICATION_MODE.AUTOAPLICADO
    ].includes(t.application_mode);
    return okType && okMode;
  }

  /**
   * Pertence ao engine de diários?
   * @param {InstrumentTyping} t
   */
  function belongsToDiaryEngine(t) {
    if (!t) return false;
    return t.instrument_type === INSTRUMENT_TYPE.DIARY
      || t.application_mode === APPLICATION_MODE.LONGITUDINAL_CONTINUO;
  }

  /**
   * Possui gate clínico que bloqueia uso fora do consultório?
   * @param {InstrumentTyping} t
   */
  function hasClinicalGate(t) {
    return Boolean(t && t.clinical_gate && t.clinical_gate.enabled);
  }

  /**
   * Possui item-sentinela (risco autolesivo, cluster epiléptico, etc.)?
   * @param {InstrumentTyping} t
   */
  function hasSentinel(t) {
    return Boolean(t && t.sentinel && t.sentinel.enabled);
  }

  /**
   * Critério canônico do filtro de pré-consulta. Centraliza toda a lógica
   * que antes estava distribuída em isDiaryPre() + kindOf() + regex.
   *
   * Um instrumento aparece no filtro de pré-consulta se, e somente se:
   *   1. É escala, inventário ou diário (não é teste direto nem ferramenta clínica)
   *   2. Respondente é família, escola, autoteste ou multi-informante
   *   3. Não exige treinamento clínico avançado (none ou brief permitidos)
   *   4. Aplicação ≤ 20 minutos (diários são exceção: tempo "continuo")
   *   5. Não possui gate clínico ativo
   *
   * @param {InstrumentTyping} t
   * @returns {boolean}
   */
  function appearsInPreConsultFilter(t) {
    if (!t) return false;

    const typeOk = [
      INSTRUMENT_TYPE.SCALE_QUESTIONNAIRE,
      INSTRUMENT_TYPE.INVENTORY,
      INSTRUMENT_TYPE.DIARY
    ].includes(t.instrument_type);
    if (!typeOk) return false;

    const respondentOk = [
      RESPONDENT.FAMILY,
      RESPONDENT.TEACHER,
      RESPONDENT.SELF_REPORT,
      RESPONDENT.MULTI_INFORMANT
    ].includes(t.respondent_required);
    if (!respondentOk) return false;

    const trainingOk = !t.training_required
      || t.training_level === TRAINING_LEVEL.BRIEF;
    if (!trainingOk) return false;

    const isDiary = t.instrument_type === INSTRUMENT_TYPE.DIARY;
    const timeOk = isDiary || t.time_to_apply_minutes === null
      || t.time_to_apply_minutes <= 20;
    if (!timeOk) return false;

    if (hasClinicalGate(t)) return false;

    return true;
  }

  // ──────────────────────────────────────────────────────────
  // Builders de typing canônicos (helpers para o overlay)
  // ──────────────────────────────────────────────────────────

  function _baseTyping(source) {
    return {
      instrument_type: null,
      respondent_required: null,
      training_required: false,
      training_level: TRAINING_LEVEL.NONE,
      time_to_apply_minutes: null,
      application_mode: null,
      clinical_gate: { enabled: false },
      sentinel: { enabled: false },
      classification_source: source || 'manual',
      ontology_version: VERSION
    };
  }

  /** Builder: escala/questionário familiar curto. */
  function asFamilyScale(minutes, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.SCALE_QUESTIONNAIRE,
      respondent_required: RESPONDENT.FAMILY,
      training_required: false,
      training_level: TRAINING_LEVEL.NONE,
      time_to_apply_minutes: minutes,
      application_mode: APPLICATION_MODE.REMOTO_FAMILIA
    }, opts || {});
  }

  /** Builder: escala multi-informante (pais + escola). */
  function asMultiInformantScale(minutes, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.SCALE_QUESTIONNAIRE,
      respondent_required: RESPONDENT.MULTI_INFORMANT,
      training_required: true,
      training_level: TRAINING_LEVEL.BRIEF,
      time_to_apply_minutes: minutes,
      application_mode: APPLICATION_MODE.REMOTO_FAMILIA
    }, opts || {});
  }

  /** Builder: autoteste (adolescente/criança). */
  function asSelfReport(minutes, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.SCALE_QUESTIONNAIRE,
      respondent_required: RESPONDENT.SELF_REPORT,
      training_required: false,
      training_level: TRAINING_LEVEL.NONE,
      time_to_apply_minutes: minutes,
      application_mode: APPLICATION_MODE.AUTOAPLICADO
    }, opts || {});
  }

  /** Builder: teste direto presencial (clínico aplica). */
  function asDirectTest(minutes, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.DIRECT_TEST,
      respondent_required: RESPONDENT.CLINICIAN_TRAINED,
      training_required: true,
      training_level: TRAINING_LEVEL.BRIEF,
      time_to_apply_minutes: minutes,
      application_mode: APPLICATION_MODE.PRESENCIAL_CLINICO
    }, opts || {});
  }

  /** Builder: teste direto que exige certificação (ADOS-2, Vineland-3, CARS-2). */
  function asCertifiedDirectTest(minutes, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.DIRECT_TEST,
      respondent_required: RESPONDENT.CLINICIAN_TRAINED,
      training_required: true,
      training_level: TRAINING_LEVEL.CERTIFICATION,
      time_to_apply_minutes: minutes,
      application_mode: APPLICATION_MODE.PRESENCIAL_CLINICO,
      clinical_gate: {
        enabled: true,
        reason: 'Instrumento exige certificação formal',
        message_to_family: 'Este instrumento só pode ser aplicado por profissional certificado em consultório.',
        bypass_roles: ['clinico_certificado']
      }
    }, opts || {});
  }

  /** Builder: diário longitudinal. */
  function asDiary(respondent, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.DIARY,
      respondent_required: respondent || RESPONDENT.FAMILY,
      training_required: false,
      training_level: TRAINING_LEVEL.NONE,
      time_to_apply_minutes: null,
      application_mode: APPLICATION_MODE.LONGITUDINAL_CONTINUO
    }, opts || {});
  }

  /** Builder: inventário extenso (CBCL, BASC). */
  function asInventory(respondent, minutes, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.INVENTORY,
      respondent_required: respondent || RESPONDENT.FAMILY,
      training_required: true,
      training_level: TRAINING_LEVEL.BRIEF,
      time_to_apply_minutes: minutes,
      application_mode: APPLICATION_MODE.REMOTO_FAMILIA
    }, opts || {});
  }

  /** Builder: ferramenta clínica não pontuável (checklist, classificação). */
  function asClinicalTool(minutes, opts) {
    return Object.assign(_baseTyping('catalog'), {
      instrument_type: INSTRUMENT_TYPE.CLINICAL_TOOL,
      respondent_required: RESPONDENT.CLINICIAN_ANY,
      training_required: true,
      training_level: TRAINING_LEVEL.BRIEF,
      time_to_apply_minutes: minutes,
      application_mode: APPLICATION_MODE.PRESENCIAL_CLINICO
    }, opts || {});
  }

  /** Anexa gate clínico de risco autolesivo a um typing existente. */
  function withSuicideRiskGate(typing) {
    typing.clinical_gate = {
      enabled: true,
      reason: 'Avaliação de risco autolesivo exige interpretação clínica imediata',
      message_to_family: 'Esta avaliação envolve risco de autolesão e deve ser feita junto a um profissional. Procure o serviço de saúde ou ligue 188 (CVV).',
      bypass_roles: ['clinico']
    };
    typing.sentinel = { enabled: true, action: 'alert_clinician' };
    return typing;
  }

  /** Anexa gate de licença comercial (SRS-2/WPS, CBCL/ASEBA, Conners/MHS). */
  function withLicenseGate(typing, licensor) {
    typing.clinical_gate = {
      enabled: true,
      reason: `Instrumento licenciado por ${licensor || 'editora externa'}`,
      message_to_family: 'Este instrumento exige licença do fabricante e só está disponível para uso profissional certificado.',
      bypass_roles: ['clinico_licenciado']
    };
    return typing;
  }

  // ──────────────────────────────────────────────────────────
  // Export
  // ──────────────────────────────────────────────────────────

  const NEUROPED_ONTOLOGY = Object.freeze({
    VERSION,
    INSTRUMENT_TYPE,
    RESPONDENT,
    TRAINING_LEVEL,
    APPLICATION_MODE,

    // validação
    validateTyping,

    // predicados derivados
    belongsToDirectTestEngine,
    belongsToScaleEngine,
    belongsToDiaryEngine,
    appearsInPreConsultFilter,
    hasClinicalGate,
    hasSentinel,

    // builders
    asFamilyScale,
    asMultiInformantScale,
    asSelfReport,
    asDirectTest,
    asCertifiedDirectTest,
    asDiary,
    asInventory,
    asClinicalTool,
    withSuicideRiskGate,
    withLicenseGate
  });

  global.NEUROPED_ONTOLOGY = NEUROPED_ONTOLOGY;

  // Suporte opcional a CommonJS / ESM (caso o build script futuro queira importar).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NEUROPED_ONTOLOGY;
  }
})(typeof window !== 'undefined' ? window : globalThis);
