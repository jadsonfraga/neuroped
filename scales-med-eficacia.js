/* NeuroPed SDG — Eficácia da medicação (relato pré-consulta)
 * ----------------------------------------------------------
 * Instrumento AUTORAL para pacientes/famílias que usam medicação responderem
 * ANTES da consulta: a medicação está sendo eficaz? Há efeitos? Adesão? O médico
 * recebe um resumo estruturado para decidir manter, ajustar ou trocar.
 * Apoio ao acompanhamento; NÃO substitui avaliação médica nem orienta mudar dose
 * por conta própria.
 */
(function () {
  'use strict';
  if (window.NEUROPED_MED_EFICACIA_LOADED) return;
  window.NEUROPED_MED_EFICACIA_LOADED = true;

  var inst = {
    id: 'jf-med-eficacia-preconsulta',
    title: '💊 Eficácia da medicação — relato pré-consulta',
    short_title: 'Eficácia da medicação (pré-consulta)',
    emoji: '💊',
    audience: 'familia',
    audience_label: 'Família/Paciente',
    age_band: '0–18+ anos',
    age_min_months: 0,
    age_max_months: 960,
    domain: 'Resposta à medicação',
    complaints: ['medicacao', 'medicação', 'remédio', 'remedio', 'eficácia', 'eficacia', 'resposta', 'efeito colateral', 'dose', 'tratamento', 'metilfenidato', 'ritalina', 'risperidona', 'melhora', 'piora', 'ajuste'],
    symptoms: ['medicação em uso', 'dúvida sobre eficácia', 'efeito colateral', 'adesão'],
    keywords: ['medicacao', 'eficacia', 'resposta a medicacao', 'efeito colateral', 'adesao', 'pre-consulta', 'farmacoterapia', 'dose'],
    plain_questions: [
      'Qual(is) medicação(ões) a criança usa hoje, com dose e horário?',
      'Há quanto tempo está usando nesta dose?',
      'Desde que começou, houve melhora no problema-alvo (atenção, comportamento, humor, sono, crises…)?',
      'A melhora aparece o dia todo ou só em parte do dia (ex.: só de manhã, "efeito acaba à tarde")?',
      'A medicação está sendo tomada todos os dias, no horário combinado?',
      'Surgiu algum efeito indesejado (apetite, sono, humor, dor de cabeça, tiques, irritabilidade…)?',
      'A escola percebeu alguma mudança, para melhor ou pior?',
      'No geral, de 0 a 10, quanto você está satisfeito(a) com o resultado da medicação?',
      'Na sua percepção, a medicação está sendo eficaz, mais ou menos, ou não está ajudando?',
      'Há alguma dúvida, dificuldade ou preocupação com a medicação que você quer falar na consulta?'
    ],
    clinical_use: 'Relato estruturado, respondido ANTES da consulta, sobre eficácia, adesão e efeitos da medicação — qualifica a decisão de manter, ajustar ou trocar.',
    differentiator: 'Foco em EFICÁCIA + adesão + efeitos colaterais + impacto funcional (casa/escola), no formato pré-consulta — economiza tempo e dá ao médico um panorama objetivo.',
    not_normative_disclaimer: 'Instrumento autoral de acompanhamento; não substitui avaliação médica e NÃO orienta iniciar, mudar ou suspender dose por conta própria.',
    page: 'instrumento.html',
    priority: 210
  };

  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  if (!base.some(function (x) { return x && x.id === inst.id; })) {
    window.NEUROPED_EDITORIAL_SCALES = [inst].concat(base);
  }
  window.NEUROPED_MED_EFICACIA = inst;
})();
