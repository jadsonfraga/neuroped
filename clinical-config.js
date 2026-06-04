/* NeuroPed — clinical-config.js  · VALIDADO pelo Dr. Jadson Fraga
 * Configuração clínica que ATIVA a interpretação da Trajetória V4 (FASE 1:
 * interpretação segura — polaridade + thresholds de tendência).
 *
 * Princípio: as escalas autorais NPE medem SINTOMAS → escore maior = pior
 * (higher_is_worse). Instrumentos adaptativos (ex.: Vineland) = maior melhor.
 * Schema clínico-amigável; o clinical-config-adapter.js normaliza para a engine.
 * Ajuste/expanda instrumento a instrumento conforme sua prática (merge incremental).
 */
window.CLINICAL_CONFIG = {
  _status: 'VALIDADO',
  interpretation: { enabled: true },

  instruments: {
    // Autorais NPE (sintomas → higher_is_worse)
    'npe-br-001': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-002': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-003': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-004': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-006': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-007': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-008': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-009': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-010': { higher_is_worse: true, confidence: 0.8 },
    'npe-br-012': { higher_is_worse: true, confidence: 0.8 },
    // Terceiros de uso comum (sintomas → higher_is_worse)
    'snap-iv': { higher_is_worse: true, confidence: 0.85 },
    'mchat':   { higher_is_worse: true, confidence: 0.8 },
    'cars':    { higher_is_worse: true, confidence: 0.8 },
    'scared':  { higher_is_worse: true, confidence: 0.8 },
    // Adaptativo (maior = melhor)
    'vineland': { higher_is_worse: false, confidence: 0.8 }
  },

  // Tendência longitudinal: variação ≥15% conta; exige ≥3 pontos p/ rotular trajetória.
  trajectory: {
    worsening_threshold_percent: 15,
    improvement_threshold_percent: 15,
    minimum_points_for_trend: 3
  }

  // Fenótipo/cutoffs/sentinel: pendentes de validação — adicionar quando definidos.
};
