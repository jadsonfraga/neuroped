import type { ScaleEntry } from "./scaleFilter";

/**
 * Sinais/rótulos que, quando marcados no filtro, devem trazer o inventário
 * familiar de altas habilidades. Os rótulos aqui DEVEM ser idênticos aos de
 * signalsAndSymptoms.ts e popularSymptoms.ts (cobertura exata do pódio).
 */
export const AHSD_SIGNAL_LABELS = [
  "Suspeita de altas habilidades / superdotação",
  "Aprende muito rápido, à frente da idade",
  "Interesse intenso e conhecimento aprofundado",
  "Raciocínio avançado com assincronia emocional",
  "Possível dupla excepcionalidade",
  "Altas habilidades / super inteligente",
] as const;

export const escalaAhsdPais: ScaleEntry = {
  id: "ahsd-inventario-pais",
  name: "Inventário AH/SD · Pais",
  fullName: "Inventário de Altas Habilidades/Superdotação — versão para pais",
  ageMin: 72,
  ageMax: 215,
  queixas: ["aprendizagem", "altas-habilidades"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "15–20 min",
  appRoute: "/generic-scale/ahsd-inventario-pais",
  description:
    "Inventário de observação respondido pela família: 56 itens em 10 áreas (intelectual, interesses por área, criatividade, motivação, liderança, artes, motor, emoções, jeito de aprender e pontos para conversar com o médico), com espaço para exemplos. Mostra só soma e média por área, sem ponto de corte e sem diagnóstico.",
  fonte:
    "Dr. Jadson Fraga / NeuroPed (2026), adaptação familiar do Inventário Escolar de Altas Habilidades. Itens autorais inspirados na concepção dos três anéis de Renzulli e no modelo de Gagné.",
  licencaUso: "autoral",
  validacaoBrasil:
    "Autoral — instrumento de observação sem estudos psicométricos próprios; sem normas.",
  scoringCutoff:
    "Sem ponto de corte e sem normas: soma e média por área apenas descritivas; não é diagnóstico.",
  pendente_validacao_clinica: true,
  pendencia:
    "Instrumento autoral de observação familiar, sem estudos de confiabilidade, validade, normas ou ponto de corte.",
  suicideRiskInstrument: false,
  psychosisRiskInstrument: false,
  assessmentUse: "triagem",
  applicationMode: "questionario_pais",
  implementationStatus: "complete",
  verbalRequirement: "indiferente",
  literacyRequirement: "indiferente",
  signalTags: [
    ...AHSD_SIGNAL_LABELS,
    "altas habilidades",
    "superdotação",
    "AH/SD",
    "talento",
    "precocidade",
    "criatividade",
    "dupla excepcionalidade",
    "assincronia",
    "perfeccionismo",
  ],
};
