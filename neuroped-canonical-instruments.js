/**
 * NeuroPed Canonical Instruments v1.0
 * -----------------------------------
 * Registra em runtime os instrumentos canônicos declarados na ontologia
 * mas ainda ausentes do scales-bundle.js. Carregue APÓS:
 *   - scales-bundle.js
 *   - neuroped-ontology.js
 *   - neuroped-overlay.js
 *
 * Cada instrumento aqui possui um campo .typing já populado (com
 * classification_source='catalog'), de forma que o overlay não precisa
 * heurística para eles. O diário e a escala ABC ficam canonizados aqui
 * até que o scripts/build-scales-bundle.mjs seja recuperado e o JSON-fonte
 * possa absorvê-los.
 */
(function (global) {
  'use strict';

  const O = global.NEUROPED_ONTOLOGY;
  if (!O) {
    console.error('[CANONICAL] ontology.js não carregado. Abortando registro.');
    return;
  }

  const { RESPONDENT } = O;

  // ──────────────────────────────────────────────────────────
  // Fábrica: cria objeto compatível com schema do bundle (it() em scales-editorial.js)
  // ──────────────────────────────────────────────────────────
  function makeInstrument(spec) {
    const base = {
      id: spec.id,
      title: spec.emoji ? `${spec.emoji} ${spec.title}` : spec.title,
      short_title: spec.short_title || spec.title,
      original_title: spec.title,
      emoji: spec.emoji || '📋',
      audience: spec.audience || 'familia',
      audience_label: spec.audience_label || 'Família',
      age_band: spec.age_band || 'todas as idades',
      age_min_months: spec.age_min_months ?? 12,
      age_max_months: spec.age_max_months ?? 216,
      symptoms: spec.symptoms || [],
      complaints: spec.complaints || [],
      keywords: spec.keywords || [],
      domain: spec.domain || 'Comportamento',
      page: spec.page || 'menu-instrumentos.html',
      anchor: spec.anchor || spec.id,
      priority: spec.priority ?? 80,
      plain_questions: spec.plain_questions || [],
      clinical_use: spec.clinical_use || '',
      differentiator: spec.differentiator || '',
      not_normative_disclaimer: 'Instrumento de triagem/acompanhamento. Não substitui avaliação clínica.',
      typing: spec.typing  // já vem da ontologia
    };
    return base;
  }

  // ──────────────────────────────────────────────────────────
  // Catálogo canônico
  // ──────────────────────────────────────────────────────────
  const CANONICAL = [

    // ────────── ABC Comportamento ──────────
    makeInstrument({
      id: 'abc-comportamento-triagem',
      emoji: '🧩',
      title: 'Triagem Comportamental A-B-C (Likert)',
      short_title: 'Triagem A-B-C',
      audience: 'familia',
      audience_label: 'Teste familiar',
      age_band: '2–17 anos',
      age_min_months: 24, age_max_months: 216,
      symptoms: ['birra','agressividade','autoagressão','oposição'],
      complaints: ['comportamento','crises','irritabilidade'],
      keywords: ['abc','antecedente','consequência','funcional','birra','agressividade'],
      domain: 'Comportamento',
      priority: 92,
      plain_questions: [
        'Em que situações o comportamento costuma aparecer (transições, recusa, fome, sono)?',
        'O que a criança faz de forma observável (gritar, bater, autoagredir, fugir)?',
        'O que os adultos costumam fazer logo depois (ceder, isolar, conversar, retirar exigência)?',
        'Onde e com quem o comportamento acontece mais (casa, escola, transporte)?',
        'Quanto tempo dura e qual a intensidade média do episódio?',
        'O que a criança parece obter ou evitar (atenção, fuga de tarefa, item, alívio sensorial)?'
      ],
      clinical_use: 'Mapeia gatilhos, topografia, consequências e função aparente do comportamento-alvo para orientar plano comportamental individualizado.',
      differentiator: 'Likert curta com perfil funcional (fuga/atenção/tangível/sensorial), substituindo o "diário" mal-formado anterior.',
      typing: O.asFamilyScale(7)
    }),

    makeInstrument({
      id: 'abc-comportamento-diario',
      emoji: '📝',
      title: 'Diário A-B-C de Episódios',
      short_title: 'Diário A-B-C',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: '2–17 anos',
      age_min_months: 24, age_max_months: 216,
      symptoms: ['birra','agressividade','autoagressão','oposição'],
      complaints: ['comportamento','crises'],
      keywords: ['abc','diario','episodios','funcional'],
      domain: 'Comportamento',
      priority: 90,
      clinical_use: 'Registro longitudinal de episódios com antecedente, comportamento e consequência. Gera padrão funcional.',
      differentiator: 'Complementa a Triagem A-B-C: enquanto a triagem é snapshot, o diário registra episódios reais entre consultas.',
      typing: O.asDiary(RESPONDENT.FAMILY)
    }),

    // ────────── Diários clínicos longitudinais ──────────
    makeInstrument({
      id: 'diario-sono-7d',
      emoji: '😴',
      title: 'Diário de Sono — 7 dias',
      short_title: 'Diário Sono 7d',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: 'todas as idades',
      age_min_months: 6, age_max_months: 216,
      symptoms: ['insônia','despertares','sono ruim','sonolência'],
      complaints: ['sono'],
      keywords: ['sono','insonia','despertares','rotina sono','bedtime'],
      domain: 'Sono',
      priority: 88,
      clinical_use: 'Registro de 7 dias consecutivos de horário de deitar, latência, despertares, hora de acordar e qualidade subjetiva. Padrão para consulta de sono.',
      typing: O.asDiary(RESPONDENT.FAMILY)
    }),

    makeInstrument({
      id: 'diario-cefaleia-30d',
      emoji: '🤕',
      title: 'Diário de Cefaleia — 30 dias',
      short_title: 'Diário Cefaleia 30d',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: '4–17 anos',
      age_min_months: 48, age_max_months: 216,
      symptoms: ['dor de cabeça','cefaleia','enxaqueca'],
      complaints: ['cefaleia','dor'],
      keywords: ['cefaleia','enxaqueca','dor de cabeca','diario'],
      domain: 'Cefaleia',
      priority: 86,
      clinical_use: 'Registro diário de presença, intensidade, duração, localização, gatilhos e medicação. Insumo para classificação ICHD-3 e ajuste terapêutico.',
      typing: O.asDiary(RESPONDENT.FAMILY)
    }),

    makeInstrument({
      id: 'diario-crises-epilepticas',
      emoji: '⚡',
      title: 'Diário de Crises Epilépticas',
      short_title: 'Diário Crises',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: 'todas as idades',
      age_min_months: 1, age_max_months: 216,
      symptoms: ['crise','convulsão','ausência','epilepsia'],
      complaints: ['epilepsia','crises'],
      keywords: ['crise','convulsao','ausencia','tonico-clonica','epilepsia','focal','mioclonica'],
      domain: 'Epilepsia',
      priority: 95,
      clinical_use: 'Registro por episódio: tipo, duração, gatilho suspeito, pós-ictal, medicação. Sentinela ativa para cluster de crises (>3 em 24h).',
      typing: Object.assign(O.asDiary(RESPONDENT.FAMILY, { training_required: true, training_level: O.TRAINING_LEVEL.BRIEF }), {
        sentinel: { enabled: true, action: 'alert_clinician', reason: 'Cluster de crises ≥3 em 24h ou crise >5 min' }
      })
    }),

    makeInstrument({
      id: 'diario-alimentar-7d',
      emoji: '🍽️',
      title: 'Diário Alimentar — 7 dias',
      short_title: 'Diário Alimentar 7d',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: 'todas as idades',
      age_min_months: 12, age_max_months: 216,
      symptoms: ['seletividade alimentar','recusa alimentar','baixo apetite'],
      complaints: ['alimentação','sensorial'],
      keywords: ['alimentacao','seletividade','recusa','dieta','sensorial alimentar'],
      domain: 'Alimentação',
      priority: 80,
      clinical_use: 'Registro de refeições, aceitação, texturas, contexto. Insumo para avaliação fonoaudiológica e nutricional.',
      typing: O.asDiary(RESPONDENT.FAMILY)
    }),

    makeInstrument({
      id: 'diario-evacuatorio',
      emoji: '🚽',
      title: 'Diário Evacuatório',
      short_title: 'Diário Evacuatório',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: '2–11 anos',
      age_min_months: 24, age_max_months: 143,
      symptoms: ['constipação','retenção','encoprese'],
      complaints: ['intestino','constipação'],
      keywords: ['evacuacao','constipacao','encoprese','intestino','fezes'],
      domain: 'Intestino',
      priority: 75,
      clinical_use: 'Registro de frequência, consistência (Bristol), dor e retenção. Insumo para conduta em constipação funcional pediátrica.',
      typing: O.asDiary(RESPONDENT.FAMILY)
    }),

    makeInstrument({
      id: 'diario-sensorial',
      emoji: '🌈',
      title: 'Diário Sensorial',
      short_title: 'Diário Sensorial',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: '2–17 anos',
      age_min_months: 24, age_max_months: 216,
      symptoms: ['sobrecarga sensorial','meltdown','seletividade sensorial'],
      complaints: ['sensorial','tea'],
      keywords: ['sensorial','sobrecarga','meltdown','overload','autorregulacao'],
      domain: 'Sensorial',
      priority: 78,
      clinical_use: 'Registro de eventos sensoriais (visual/auditivo/tátil/proprioceptivo) e estratégias usadas. Insumo para Terapia Ocupacional.',
      typing: O.asDiary(RESPONDENT.FAMILY)
    }),

    makeInstrument({
      id: 'diario-medicacao',
      emoji: '💊',
      title: 'Diário de Medicação',
      short_title: 'Diário Medicação',
      audience: 'familia',
      audience_label: 'Diário familiar',
      age_band: 'todas as idades',
      age_min_months: 1, age_max_months: 216,
      symptoms: ['esquecimento','reação adversa','adesão'],
      complaints: ['medicacao'],
      keywords: ['medicacao','remedio','adesao','efeito colateral','horario'],
      domain: 'Farmacoterapia',
      priority: 82,
      clinical_use: 'Registro de horários, doses, esquecimentos, efeitos adversos suspeitos. Insumo para ajuste de prescrição.',
      typing: O.asDiary(RESPONDENT.FAMILY, { training_required: true, training_level: O.TRAINING_LEVEL.BRIEF })
    }),

    makeInstrument({
      id: 'diario-escola-comportamento',
      emoji: '🏫',
      title: 'Diário Escolar de Comportamento',
      short_title: 'Diário Escolar',
      audience: 'escola',
      audience_label: 'Diário escolar',
      age_band: '3–17 anos',
      age_min_months: 36, age_max_months: 216,
      symptoms: ['agressividade escolar','recusa escolar','crises escola'],
      complaints: ['comportamento','escola'],
      keywords: ['escola','professor','comportamento sala'],
      domain: 'Comportamento',
      priority: 77,
      clinical_use: 'Registro feito pela escola: episódios, contexto pedagógico, manejo aplicado, resposta. Triangula com diário familiar.',
      typing: Object.assign(O.asDiary(RESPONDENT.TEACHER), {
        application_mode: O.APPLICATION_MODE.LONGITUDINAL_CONTINUO
      })
    })
  ];

  // ──────────────────────────────────────────────────────────
  // Registro: anexa ao window.NEUROPED_EDITORIAL_SCALES
  // (idempotente — não duplica se ID já existe)
  // ──────────────────────────────────────────────────────────
  function register() {
    if (!Array.isArray(global.NEUROPED_EDITORIAL_SCALES)) {
      global.NEUROPED_EDITORIAL_SCALES = [];
    }
    const existing = new Set(global.NEUROPED_EDITORIAL_SCALES.map(s => s && s.id).filter(Boolean));
    let added = 0;
    for (const inst of CANONICAL) {
      if (existing.has(inst.id)) continue;
      global.NEUROPED_EDITORIAL_SCALES.push(inst);
      existing.add(inst.id);
      added++;
    }
    console.info(`[CANONICAL] registrados ${added}/${CANONICAL.length} instrumentos canônicos.`);

    // Reaplica overlay se disponível para garantir typing consistente
    if (global.NEUROPED_OVERLAY && typeof global.NEUROPED_OVERLAY.applyToAll === 'function') {
      try { global.NEUROPED_OVERLAY.applyToAll(); } catch (e) {}
    }
    return added;
  }

  // Auto-registro (idempotente)
  if (typeof global.document !== 'undefined') {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', register, { once: true });
    } else {
      try { register(); } catch (e) { console.error('[CANONICAL] register falhou:', e); }
    }
  }

  global.NEUROPED_CANONICAL_INSTRUMENTS = Object.freeze({ CANONICAL, register });
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.NEUROPED_CANONICAL_INSTRUMENTS;
  }
})(typeof window !== 'undefined' ? window : globalThis);
