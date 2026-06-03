/* NeuroPed — clinical-config.example.js  (RASCUNHO — VALIDAR COM Dr. JADSON)
 * Configuração clínica que alimenta a Clinical Intelligence Layer (V4).
 * TODOS os números/regras abaixo são PLACEHOLDERS conservadores e DEVEM ser
 * revisados clinicamente antes de qualquer uso assistencial. Sem validação,
 * use apenas em telas de DEMONSTRAÇÃO.
 *
 * Expõe window.NeuroPedClinicalConfig.
 */
(function (g) {
  'use strict';
  // Polaridade por instrumento: 'higher_is_worse' (sintomas) | 'higher_is_better' (adaptativo).
  // As escalas autorais NPE medem SINTOMAS → maior = pior.  ⚠️ VALIDAR.
  var instruments = {};
  for (var i = 1; i <= 12; i++) {
    var id = 'npe-br-' + ('00' + i).slice(-3);
    instruments[id] = { polarity: 'higher_is_worse', confidence: 0.6 /* VALIDAR */ };
  }
  // Exemplos de instrumentos de terceiros (catalogados) — VALIDAR caso a caso.
  instruments['snap-iv']  = { polarity: 'higher_is_worse', confidence: 0.7 };
  instruments['mchat']    = { polarity: 'higher_is_worse', confidence: 0.7 };
  instruments['vineland'] = { polarity: 'higher_is_better' }; // adaptativo: maior = melhor

  g.NeuroPedClinicalConfig = {
    _status: 'RASCUNHO_NAO_VALIDADO',
    _aviso: 'Números provisórios. Revisar com o responsável clínico antes de uso assistencial.',
    instruments: instruments,
    // domínio canônico extra (se o mapeamento léxico não bastar). VALIDAR.
    domainMap: {},
    // Timeline: variação mínima relevante e limiar de instabilidade (frações 0..1). VALIDAR.
    thresholds: { change_min: 0.10, unstable_sd: 0.18 },
    // Resposta (RTI): MCID provisório. VALIDAR por instrumento idealmente.
    rti: { mcid: 0.15, window: 2, unstable_sd: 0.18 },
    // Fenótipos: pesos por domínio (0..1). EXEMPLOS — VALIDAR pesos e limiares.
    phenotypes: [
      { id: 'tdah-desatento', label: 'Perfil TDAH — predomínio desatento',
        weights: { atencao: 1.0, executivo: 0.6, hiperatividade: 0.3 }, min_confidence: 0.5 },
      { id: 'tea-social-comunicacional', label: 'Perfil TEA — social-comunicacional',
        weights: { socializacao: 1.0, linguagem: 0.7, rigidez: 0.7, sensorial: 0.4 }, min_confidence: 0.5 },
      { id: 'disfuncao-executiva', label: 'Disfunção executiva',
        weights: { executivo: 1.0, atencao: 0.6 }, min_confidence: 0.5 }
    ],
    // Carga terapêutica: limiares h/semana e diversidade. VALIDAR.
    burden: { hours_warn: 8, hours_high: 15, diversity_high: 4 },
    // Contradições: gap mínimo entre fontes no mesmo domínio (0..1). VALIDAR.
    contradiction: { gap: 0.4, rules: [] },
    // Decisão: intervalo de reavaliação (dias). VALIDAR.
    cds: { reassess_days: 90 }
  };
})(typeof self !== 'undefined' ? self : this);
