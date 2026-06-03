/**
 * NeuroPed Router v1.0
 * --------------------
 * Roteia um instrumento ao engine correto com base na ontologia.
 * Nunca chame um engine diretamente — sempre passe pelo router.
 *
 * Uso:
 *   const decision = NEUROPED_ROUTER.routeById('jf-epil-ne');
 *   decision.engine.open(decision.instrument, decision.context);
 */
(function (global) {
  'use strict';

  const O = global.NEUROPED_ONTOLOGY;
  const Overlay = global.NEUROPED_OVERLAY;
  if (!O || !Overlay) {
    console.error('[NEUROPED ROUTER] ontology.js ou overlay.js não carregados.');
    return;
  }

  /**
   * @typedef {Object} RoutingDecision
   * @property {Object|null}     engine       Referência ao engine selecionado, ou null
   * @property {string}          engineName   'direct_test' | 'scale' | 'diary' | 'blocked'
   * @property {Object}          instrument
   * @property {Object}          context      { reason, message_to_family?, allow_clinician_override }
   */

  /**
   * Decide qual engine deve abrir o instrumento.
   * Aplica gate clínico ANTES de rotear — instrumentos com gate só abrem se
   * o contexto for clínico (role do usuário === 'clinico' ou bypass autorizado).
   *
   * @param {Object} instrument  Instrumento já tagueado (com .typing)
   * @param {Object} [opts]
   * @param {string} [opts.userRole='familia']
   * @returns {RoutingDecision}
   */
  function route(instrument, opts) {
    opts = opts || {};
    const userRole = opts.userRole || 'familia';

    if (!instrument || !instrument.id) {
      return {
        engine: null,
        engineName: 'blocked',
        instrument,
        context: { reason: 'Instrumento sem ID válido' }
      };
    }

    // Garante typing
    if (!instrument.typing) instrument.typing = Overlay.getTyping(instrument);
    const t = instrument.typing;

    // Gate clínico — bloqueia se usuário não tem bypass autorizado
    if (O.hasClinicalGate(t)) {
      const bypass = (t.clinical_gate.bypass_roles || []);
      const isClinician = bypass.includes(userRole) || userRole === 'clinico' || userRole === 'medico';
      if (!isClinician) {
        return {
          engine: null,
          engineName: 'blocked',
          instrument,
          context: {
            reason: t.clinical_gate.reason || 'Acesso restrito',
            message_to_family: t.clinical_gate.message_to_family
              || 'Este instrumento exige aplicação ou interpretação clínica.',
            allow_clinician_override: true
          }
        };
      }
    }

    // Roteamento por engine
    if (O.belongsToDiaryEngine(t)) {
      return {
        engine: global.NEUROPED_DIARY_ENGINE,
        engineName: 'diary',
        instrument,
        context: { reason: 'diary' }
      };
    }
    if (O.belongsToDirectTestEngine(t)) {
      return {
        engine: global.NEUROPED_DIRECT_TEST_ENGINE,
        engineName: 'direct_test',
        instrument,
        context: { reason: 'direct_test' }
      };
    }
    if (O.belongsToScaleEngine(t)) {
      return {
        engine: global.NEUROPED_SCALE_ENGINE,
        engineName: 'scale',
        instrument,
        context: { reason: 'scale' }
      };
    }

    // Sem engine compatível
    return {
      engine: null,
      engineName: 'blocked',
      instrument,
      context: { reason: 'Nenhum engine compatível com este typing' }
    };
  }

  /** Conveniência: busca pelo id e roteia. */
  function routeById(id, opts) {
    const all = []
      .concat(Array.isArray(global.NEUROPED_EDITORIAL_SCALES) ? global.NEUROPED_EDITORIAL_SCALES : [])
      .concat(Array.isArray(global.NEUROPED_CATALOG) ? global.NEUROPED_CATALOG : [])
      .concat(Array.isArray(global.NEUROPED_SCALES) ? global.NEUROPED_SCALES : []);
    const inst = all.find(s => s && s.id === id);
    if (!inst) {
      return {
        engine: null,
        engineName: 'blocked',
        instrument: null,
        context: { reason: `Instrumento não encontrado: ${id}` }
      };
    }
    return route(inst, opts);
  }

  const NEUROPED_ROUTER = Object.freeze({ route, routeById });
  global.NEUROPED_ROUTER = NEUROPED_ROUTER;

  if (typeof module !== 'undefined' && module.exports) module.exports = NEUROPED_ROUTER;
})(typeof window !== 'undefined' ? window : globalThis);
