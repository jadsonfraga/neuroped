import type { ScaleEntry } from "./scaleFilter";

const FONTE =
  "IPN-LFC 200 — Linguagem, Fala, Comunicação e Impacto Funcional, versão 1.0, 02/08/2026. Dr. Jadson Fraga / NeuroPed SDG.";

const PENDENCIA =
  "Instrumento clínico autoral de organização multiperspectiva e planejamento funcional, ainda sem estudos próprios de confiabilidade, validade, normas, sensibilidade, especificidade ou ponto de corte.";

const COMMON: Pick<
  ScaleEntry,
  | "licencaUso"
  | "validacaoBrasil"
  | "pendente_validacao_clinica"
  | "pendencia"
  | "suicideRiskInstrument"
  | "psychosisRiskInstrument"
  | "implementationStatus"
  | "fonte"
> = {
  licencaUso: "autoral",
  validacaoBrasil:
    "Autoral — uso clínico institucional; validação psicométrica própria ainda não realizada.",
  pendente_validacao_clinica: true,
  pendencia: PENDENCIA,
  suicideRiskInstrument: false,
  psychosisRiskInstrument: false,
  implementationStatus: "complete",
  fonte: FONTE,
};

const BASE_SIGNAL_TAGS = [
  "linguagem", "fala", "comunicação", "compreensão", "expressão",
  "vocabulário", "gramática", "narrativa", "pragmática", "inteligibilidade",
  "fonologia", "articulação", "planejamento motor da fala", "apraxia de fala",
  "disartria", "fluência", "gagueira", "voz", "prosódia",
  "comunicação aumentativa e alternativa", "CAA", "leitura", "escrita",
  "alfabetização", "aprendizagem", "participação", "amizades", "escola",
  "impacto funcional", "perda auditiva", "audição", "multilinguismo",
  "dialeto", "regressão", "engasgos", "aspiração", "respiração",
  "fraqueza bulbar", "coordenação orofacial", "metas funcionais",
  "contrarreferência",
];

function entry(
  value: ScaleEntry,
  extraTags: string[],
): ScaleEntry {
  return { ...COMMON, ...value, signalTags: [...BASE_SIGNAL_TAGS, ...extraTags] };
}

const DESCRIPTION =
  "Módulo autoral que organiza linguagem, fala, comunicação, participação e impacto funcional. Não fecha diagnóstico e não substitui avaliação fonoaudiológica, auditiva, neuropsicológica ou médica quando indicada.";

export const escalasIpnLfc200: ScaleEntry[] = [
  entry({
    id: "ipn-lfc-familia-50",
    name: "IPN-LFC · Família 50",
    fullName: "IPN-LFC 200 — Família e Cuidadores (50 itens)",
    ageMin: 6,
    ageMax: 215,
    queixas: ["linguagem", "atraso", "aprendizagem", "funcionalidade"],
    respondente: ["pais"],
    prioridade: "diagnostica",
    tempo: "12–20 min",
    appRoute: "/generic-scale/ipn-lfc-familia-50",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore diagnóstico; perfil descritivo 0–3/N-O por item e domínio, sem ponto de corte validado.",
    assessmentUse: "diagnostico",
    applicationMode: "questionario_pais",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  }, ["comunicação intencional", "linguagem receptiva", "linguagem expressiva", "impacto familiar"]),
  entry({
    id: "ipn-lfc-escola-30",
    name: "IPN-LFC · Escola/Terapia 30",
    fullName: "IPN-LFC 200 — Escola e Equipe Terapêutica (30 itens)",
    ageMin: 24,
    ageMax: 215,
    queixas: ["linguagem", "aprendizagem", "funcionalidade"],
    respondente: ["professor"],
    prioridade: "diagnostica",
    tempo: "10–15 min",
    appRoute: "/generic-scale/ipn-lfc-escola-30",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore diagnóstico; perfil descritivo 0–3/N-O por item e domínio, sem ponto de corte validado.",
    assessmentUse: "diagnostico",
    applicationMode: "questionario_professor",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  }, ["acesso à instrução", "participação escolar", "adaptações", "PEI"]),
  entry({
    id: "ipn-lfc-autopercepcao-20",
    name: "IPN-LFC · Autopercepção Apoiada 20",
    fullName: "IPN-LFC 200 — Autopercepção Apoiada da Criança/Adolescente (20 itens)",
    ageMin: 96,
    ageMax: 215,
    queixas: ["linguagem", "aprendizagem", "funcionalidade"],
    respondente: ["autoaplicavel"],
    prioridade: "diagnostica",
    tempo: "8–15 min",
    appRoute: "/generic-scale/ipn-lfc-autopercepcao-20",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore diagnóstico; perfil descritivo 0–3/N-O por item e domínio, sem ponto de corte validado.",
    assessmentUse: "diagnostico",
    applicationMode: "autoquestionario_crianca_adolescente",
    verbalRequirement: "nao_verbal_compativel",
    literacyRequirement: "indiferente",
  }, ["voz da criança", "consentimento", "ser compreendido", "pertencimento"]),
  entry({
    id: "ipn-lfc-observacao-30",
    name: "IPN-LFC · Observação Clínica 30",
    fullName: "IPN-LFC 200 — Observação Clínica Funcional (30 itens)",
    ageMin: 6,
    ageMax: 215,
    queixas: ["linguagem", "atraso", "aprendizagem", "funcionalidade"],
    respondente: ["clinico"],
    prioridade: "diagnostica",
    tempo: "15–25 min",
    appRoute: "/generic-scale/ipn-lfc-observacao-30",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore diagnóstico; perfil descritivo 0–3/N-O por item e domínio, sem ponto de corte validado.",
    assessmentUse: "diagnostico",
    applicationMode: "observacional_clinico",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  }, ["atenção compartilhada", "intenção comunicativa", "reparo comunicativo", "amostra de linguagem"]),
  entry({
    id: "ipn-lfc-fala-motora-20",
    name: "IPN-LFC · Fala Motora/Fluência/Voz 20",
    fullName: "IPN-LFC 200 — Fala, Planejamento Motor, Fluência e Voz (20 itens)",
    ageMin: 12,
    ageMax: 215,
    queixas: ["linguagem", "motor", "funcionalidade"],
    respondente: ["clinico"],
    prioridade: "diagnostica",
    tempo: "12–20 min",
    appRoute: "/generic-scale/ipn-lfc-fala-motora-20",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore diagnóstico; perfil descritivo 0–3/N-O por item e domínio, sem ponto de corte validado.",
    assessmentUse: "diagnostico",
    applicationMode: "observacional_clinico",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  }, ["inconsistência articulatória", "transições", "diadococinesia", "ressonância"]),
  entry({
    id: "ipn-lfc-anamnese-20",
    name: "IPN-LFC · Anamnese e Red Flags 20",
    fullName: "IPN-LFC 200 — Anamnese, Contexto e Red Flags (20 campos)",
    ageMin: 0,
    ageMax: 215,
    queixas: ["linguagem", "atraso", "aprendizagem", "funcionalidade"],
    respondente: ["clinico"],
    prioridade: "diagnostica",
    tempo: "15–30 min",
    appRoute: "/generic-scale/ipn-lfc-anamnese-20",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore e sem ponto de corte; síntese qualitativa.",
    assessmentUse: "diagnostico",
    applicationMode: "entrevista_clinica",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  }, ["história clínica", "curso temporal", "triagem auditiva", "red flags independentes"]),
  entry({
    id: "ipn-lfc-diferenciais-15",
    name: "IPN-LFC · Diferenciais 15",
    fullName: "IPN-LFC 200 — Hipóteses Diferenciais e Condições Associadas (15 campos)",
    ageMin: 6,
    ageMax: 215,
    queixas: ["linguagem", "atraso", "aprendizagem", "funcionalidade"],
    respondente: ["clinico"],
    prioridade: "diagnostica",
    tempo: "12–25 min",
    appRoute: "/generic-scale/ipn-lfc-diferenciais-15",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore e sem ponto de corte; síntese qualitativa.",
    assessmentUse: "diagnostico",
    applicationMode: "registro_clinico",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  }, ["transtorno do desenvolvimento da linguagem", "diferença linguística", "deficiência auditiva", "TEA", "deficiência intelectual"]),
  entry({
    id: "ipn-lfc-sintese-15",
    name: "IPN-LFC · Síntese e Metas 15",
    fullName: "IPN-LFC 200 — Síntese Funcional, Metas e Plano (15 campos)",
    ageMin: 0,
    ageMax: 215,
    queixas: ["linguagem", "aprendizagem", "funcionalidade"],
    respondente: ["clinico"],
    prioridade: "monitorizacao",
    tempo: "12–25 min",
    appRoute: "/generic-scale/ipn-lfc-sintese-15",
    description: DESCRIPTION,
    scoringCutoff: "Sem escore e sem ponto de corte; síntese qualitativa.",
    assessmentUse: "monitorizacao",
    applicationMode: "registro_clinico",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  }, ["síntese funcional", "metas SMART", "plano terapêutico", "reavaliação"]),
];
