/**
 * NeuroPed Ontology Overlay v1.0
 * ------------------------------
 * Aplica a ontologia v1.0 sobre o catálogo existente em runtime, sem rebuildar
 * o scales-bundle.js. Cada instrumento conhecido é tagueado por ID; instrumentos
 * fora do catálogo recebem classificação heurística marcada como fallback para
 * auditoria.
 *
 * Carregar APÓS scales-bundle.js e APÓS ontology.js:
 *   <script src="scales-bundle.js"></script>
 *   <script src="engines/ontology.js"></script>
 *   <script src="engines/overlay.js"></script>
 *
 * Depois disso, todo objeto em window.NEUROPED_EDITORIAL_SCALES (e outros
 * registros conhecidos) possui o sub-objeto .typing com os cinco eixos.
 */
(function (global) {
  'use strict';

  const O = global.NEUROPED_ONTOLOGY;
  if (!O) {
    console.error('[NEUROPED OVERLAY] ontology.js não carregado. Abortando overlay.');
    return;
  }

  const { RESPONDENT, INSTRUMENT_TYPE, APPLICATION_MODE, TRAINING_LEVEL } = O;

  // ──────────────────────────────────────────────────────────
  // Catálogo mestre: ID → typing canônico
  // Mantenha em ordem de domínio para facilitar revisão clínica.
  // ──────────────────────────────────────────────────────────
  const CATALOG = {

    // ── NPE Família 12–36 meses ──
    'fam-12-36-tea-primeiros-sinais':     O.asFamilyScale(3),
    'fam-12-36-fala-inicial':             O.asFamilyScale(3),
    'fam-12-36-alimentacao-sensorial':    O.asFamilyScale(3),
    'fam-12-36-sono-pequeno':             O.asFamilyScale(3),
    'fam-12-36-brincar-social':           O.asFamilyScale(3),

    // ── NPE Família 3–5 anos ──
    'fam-3-5-comunicacao-funcional':      O.asFamilyScale(3),
    'fam-3-5-crises-transicoes':          O.asFamilyScale(3),
    'fam-3-5-sensorial-diario':           O.asFamilyScale(3),  // nome enganoso; é escala
    'fam-3-5-autonomia-inicial':          O.asFamilyScale(3),
    'fam-3-5-flexibilidade-rotina':       O.asFamilyScale(3),

    // ── NPE Família 6–11 anos ──
    'fam-6-11-atencao-casa':              O.asFamilyScale(3),
    'fam-6-11-organizacao-memoria':       O.asFamilyScale(3),
    'fam-6-11-ansiedade-infantil':        O.asFamilyScale(3),
    'fam-6-11-oposicao-irritabilidade':   O.asFamilyScale(3),
    'fam-6-11-sono-escolar':              O.asFamilyScale(3),

    // ── Autorais Dr. Jadson Fraga ──
    'jf-einp-tdah-tod-12mais':            O.asMultiInformantScale(15),

    'jf-enf-tea-drj':                     O.asDirectTest(20, {
      clinical_gate: {
        enabled: true,
        reason: 'Avaliação estruturada de TEA exige observação clínica direta',
        message_to_family: 'Esta avaliação é aplicada presencialmente pelo neuropediatra.',
        bypass_roles: ['neuropediatra']
      }
    }),

    'jf-enso-ped-sono':                   O.asFamilyScale(5),

    'jf-epil-ne':                         O.asDirectTest(25, {
      training_level: TRAINING_LEVEL.CERTIFICATION,
      clinical_gate: {
        enabled: true,
        reason: 'Escala epileptológica exige interpretação por neuropediatra',
        message_to_family: 'Avaliação aplicada exclusivamente pelo neuropediatra em consulta.',
        bypass_roles: ['neuropediatra']
      }
    }),

    'jf-ecnfaj-cefaleia':                 O.asFamilyScale(10, { training_level: TRAINING_LEVEL.BRIEF, training_required: true }),
    'jf-ecnfaj-cefaleia-diario':          O.asDiary(RESPONDENT.FAMILY),

    'jf-eani-ansiedade':                  O.withSuicideRiskGate(O.asSelfReport(5, { training_level: TRAINING_LEVEL.BRIEF, training_required: true })),

    // ── Internacionais / catalogados ──
    'mchat-r-f':                          O.asFamilyScale(5, { training_required: true, training_level: TRAINING_LEVEL.BRIEF }),
    'snap-iv':                            O.asMultiInformantScale(10),
    'sdq-pt':                             O.asMultiInformantScale(10),
    'phq-a':                              O.withSuicideRiskGate(O.asSelfReport(5, { training_required: true, training_level: TRAINING_LEVEL.BRIEF })),
    'gad-7':                              O.asSelfReport(5, { training_required: true, training_level: TRAINING_LEVEL.BRIEF }),
    'bisq-pt':                            O.asFamilyScale(5),
    'vanderbilt-pais':                    O.asFamilyScale(10, { training_required: true, training_level: TRAINING_LEVEL.BRIEF }),
    'vanderbilt-professor': Object.assign(O.asFamilyScale(10, { training_required: true, training_level: TRAINING_LEVEL.BRIEF }), {
      respondent_required: RESPONDENT.TEACHER,
      application_mode: APPLICATION_MODE.REMOTO_ESCOLA
    }),

    // ── ABC Comportamento (PAR canônico: triagem + diário) ──
    'abc-comportamento-triagem':          O.asFamilyScale(7),
    'abc-comportamento-diario':           O.asDiary(RESPONDENT.FAMILY),

    // ── BLOQUEADOS do filtro pré-consulta (com gate clínico ou licença) ──
    'vineland-3':                         O.withLicenseGate(O.asCertifiedDirectTest(60), 'Pearson'),
    'cars-2':                             O.asCertifiedDirectTest(30),
    'conners-3':                          O.withLicenseGate(O.asMultiInformantScale(20, { training_required: true, training_level: TRAINING_LEVEL.CERTIFICATION }), 'MHS'),
    'gmfcs':                              Object.assign(O.asClinicalTool(10), {
      clinical_gate: {
        enabled: true,
        reason: 'Sistema de classificação motora grossa exige observação clínica',
        message_to_family: 'Classificação aplicada pelo médico ou fisioterapeuta em consulta.',
        bypass_roles: ['fisioterapeuta', 'neuropediatra']
      }
    }),
    'c-ssrs':                             O.withSuicideRiskGate(Object.assign(O.asClinicalTool(10), {
      application_mode: APPLICATION_MODE.ENTREVISTA_ESTRUTURADA
    })),
    'asq-suicide':                        O.withSuicideRiskGate(Object.assign(O.asClinicalTool(5), {
      instrument_type: INSTRUMENT_TYPE.SCALE_QUESTIONNAIRE,
      application_mode: APPLICATION_MODE.ENTREVISTA_ESTRUTURADA
    })),
    'cbcl':                               O.withLicenseGate(O.asInventory(RESPONDENT.FAMILY, 25, { training_level: TRAINING_LEVEL.CERTIFICATION, training_required: true }), 'ASEBA'),
    'srs-2':                              O.withLicenseGate(O.asMultiInformantScale(15, { training_required: true, training_level: TRAINING_LEVEL.CERTIFICATION }), 'WPS'),

    // ── DIÁRIOS CLÍNICOS canônicos ──
    'diario-sono-7d':                     O.asDiary(RESPONDENT.FAMILY),
    'diario-cefaleia-30d':                O.asDiary(RESPONDENT.FAMILY),
    'diario-crises-epilepticas': Object.assign(O.asDiary(RESPONDENT.FAMILY, { training_required: true, training_level: TRAINING_LEVEL.BRIEF }), {
      sentinel: { enabled: true, action: 'alert_clinician', reason: 'Cluster de crises ≥3 em 24h' }
    }),
    'diario-alimentar-7d':                O.asDiary(RESPONDENT.FAMILY),
    'diario-evacuatorio':                 O.asDiary(RESPONDENT.FAMILY),
    'diario-sensorial':                   O.asDiary(RESPONDENT.FAMILY),
    'diario-medicacao':                   O.asDiary(RESPONDENT.FAMILY, { training_required: true, training_level: TRAINING_LEVEL.BRIEF }),
    'diario-escola-comportamento':        O.asDiary(RESPONDENT.TEACHER)
  };

  // ──────────────────────────────────────────────────────────
  // Heurística de fallback (último recurso, marcada como tal)
  // ──────────────────────────────────────────────────────────

  /**
   * Classifica um instrumento legado quando não está no CATALOG.
   * É uma heurística — sempre marca classification_source='heuristic_fallback'
   * para que a auditoria possa promovê-lo ao CATALOG depois.
   *
   * @param {Object} scale  Objeto bruto do scales-bundle.js
   * @returns {InstrumentTyping}
   */
  function heuristicTyping(scale) {
    const id    = String(scale && scale.id || '').toLowerCase();
    const title = String(scale && scale.title || '').toLowerCase();
    const audience = String(scale && scale.audience || '').toLowerCase();
    const audLabel = String(scale && scale.audience_label || '').toLowerCase();
    const isDirect = Array.isArray(scale && scale.direct_tasks) && scale.direct_tasks.length > 0;
    const isDaily  = scale && (scale.daily === true || scale.kind === 'diário');

    // 1) Diário (id, daily flag, ou palavras-chave no título)
    if (isDaily
        || id.startsWith('diario-') || id.startsWith('diary-')
        || /\bdi[áa]rio\b|\bregistro\b|\bmonitor\b/i.test(title)) {
      const respondent = (audience === 'escola' || audience === 'professor')
        ? RESPONDENT.TEACHER : RESPONDENT.FAMILY;
      const typing = O.asDiary(respondent);
      typing.classification_source = 'heuristic_fallback';
      return typing;
    }

    // 2) Inventário (palavra no título)
    if (/invent[áa]rio|inventory|cbcl|basc/i.test(title)) {
      const typing = O.asInventory(RESPONDENT.FAMILY, 20);
      typing.classification_source = 'heuristic_fallback';
      return typing;
    }

    // 3) Ferramenta clínica (checklist, carta, agenda)
    if (/checklist|carta|plano|agenda visual|gatilhos|metas|protocolo/i.test(title)) {
      const typing = O.asClinicalTool(10);
      typing.classification_source = 'heuristic_fallback';
      return typing;
    }

    // 4) Teste direto (audience=clinico OU direct_tasks presentes)
    if (isDirect || audience === 'clinico') {
      const typing = O.asDirectTest(15);
      typing.classification_source = 'heuristic_fallback';
      return typing;
    }

    // 5) Autoteste (audience=autoteste)
    if (audience === 'autoteste' || /\bautoteste\b/i.test(audLabel)) {
      const typing = O.asSelfReport(5, { training_required: true, training_level: TRAINING_LEVEL.BRIEF });
      typing.classification_source = 'heuristic_fallback';
      return typing;
    }

    // 6) Escala escolar
    if (audience === 'escola' || audience === 'professor') {
      const typing = O.asFamilyScale(10);
      typing.respondent_required = RESPONDENT.TEACHER;
      typing.application_mode = APPLICATION_MODE.REMOTO_ESCOLA;
      typing.classification_source = 'heuristic_fallback';
      return typing;
    }

    // 7) Default: escala familiar curta
    const typing = O.asFamilyScale(5);
    typing.classification_source = 'heuristic_fallback';
    return typing;
  }

  // ──────────────────────────────────────────────────────────
  // Aplicação do overlay
  // ──────────────────────────────────────────────────────────

  function getTyping(scale) {
    if (!scale || !scale.id) return null;
    if (scale.typing && scale.typing.ontology_version) return scale.typing; // já tagueado
    const fromCatalog = CATALOG[scale.id];
    return fromCatalog || heuristicTyping(scale);
  }

  /**
   * Aplica o typing em-place a uma lista de instrumentos.
   * Retorna estatísticas para diagnóstico.
   */
  function applyToList(list, listName) {
    if (!Array.isArray(list)) return null;
    let manual = 0, fallback = 0, invalid = 0;
    for (const s of list) {
      if (!s || !s.id) continue;
      const typing = getTyping(s);
      const check = O.validateTyping(typing);
      if (!check.ok) {
        invalid++;
        console.warn(`[NEUROPED OVERLAY] typing inválido em ${s.id}:`, check.errors);
        continue;
      }
      s.typing = typing;
      if (typing.classification_source === 'heuristic_fallback') fallback++;
      else manual++;
    }
    const stats = { listName, total: list.length, manual, fallback, invalid };
    console.info('[NEUROPED OVERLAY]', stats);
    return stats;
  }

  /** Tagueia todos os registros globais conhecidos. */
  function applyToAll() {
    const stats = [];
    if (Array.isArray(global.NEUROPED_EDITORIAL_SCALES))
      stats.push(applyToList(global.NEUROPED_EDITORIAL_SCALES, 'NEUROPED_EDITORIAL_SCALES'));
    if (Array.isArray(global.NEUROPED_CATALOG))
      stats.push(applyToList(global.NEUROPED_CATALOG, 'NEUROPED_CATALOG'));
    if (Array.isArray(global.NEUROPED_SCALES))
      stats.push(applyToList(global.NEUROPED_SCALES, 'NEUROPED_SCALES'));
    return stats;
  }

  // ──────────────────────────────────────────────────────────
  // Particionamento por engine (para o novo menu)
  // ──────────────────────────────────────────────────────────

  function _allTaggedInstruments() {
    const seen = new Map();
    const sources = [
      global.NEUROPED_EDITORIAL_SCALES,
      global.NEUROPED_CATALOG,
      global.NEUROPED_SCALES
    ];
    for (const src of sources) {
      if (!Array.isArray(src)) continue;
      for (const s of src) {
        if (!s || !s.id || seen.has(s.id)) continue;
        if (!s.typing) s.typing = getTyping(s);
        seen.set(s.id, s);
      }
    }
    return Array.from(seen.values());
  }

  function listDirectTests()  { return _allTaggedInstruments().filter(s => O.belongsToDirectTestEngine(s.typing)); }
  function listScales()       { return _allTaggedInstruments().filter(s => O.belongsToScaleEngine(s.typing)); }
  function listDiaries()      { return _allTaggedInstruments().filter(s => O.belongsToDiaryEngine(s.typing)); }
  function listPreConsult()   { return _allTaggedInstruments().filter(s => O.appearsInPreConsultFilter(s.typing)); }

  // ──────────────────────────────────────────────────────────
  // API pública
  // ──────────────────────────────────────────────────────────

  const NEUROPED_OVERLAY = Object.freeze({
    CATALOG,
    getTyping,
    heuristicTyping,
    applyToList,
    applyToAll,
    listDirectTests,
    listScales,
    listDiaries,
    listPreConsult,

    // Re-export conveniente da ontology
    ontology: O
  });

  global.NEUROPED_OVERLAY = NEUROPED_OVERLAY;

  // Auto-aplicação ao carregar (idempotente)
  if (typeof global.document !== 'undefined') {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', applyToAll, { once: true });
    } else {
      // bundle já carregado? aplica imediatamente
      try { applyToAll(); } catch (e) { console.error('[NEUROPED OVERLAY] applyToAll falhou:', e); }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NEUROPED_OVERLAY;
  }
})(typeof window !== 'undefined' ? window : globalThis);
