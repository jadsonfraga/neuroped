import type { ScaleEntry } from "./scaleFilter";
import { ipnEpiSegModules, ipnEpiSegItems, IPN_EPI_SEG_PROVENANCE } from "./ipnEpiSeg200Contract";

const PENDENCIA = "Instrumento clínico autoral; propriedades psicométricas, normas, confiabilidade, validade, sensibilidade, especificidade e pontos de corte ainda não foram estabelecidos.";
const DESCRIPTION = "Módulo autoral multiperspectivo para organizar eventos paroxísticos, epilepsia, impacto funcional, diferenciais e segurança. Não fecha diagnóstico nem estima probabilidade diagnóstica.";
const BASE_TAGS = ["epilepsia", "crise epiléptica", "evento paroxístico", "convulsão", "ausência", "focal", "generalizada", "consciência", "responsividade", "semiologia", "duração", "cronômetro", "frequência", "estereotipia", "lateralidade", "desvio ocular", "automatismo", "mioclonia", "rigidez", "atonia", "sinais autonômicos", "cianose", "respiração", "pós-ictal", "confusão", "sonolência", "déficit focal", "regressão", "febre", "sono", "privação de sono", "adesão", "medicação antiepiléptica", "efeito adverso", "resgate", "status epilepticus", "crises em salvas", "EEG", "vídeo-EEG", "neuroimagem", "genética", "síncope", "arritmia", "parassonia", "tique", "distonia", "refluxo", "enxaqueca", "crise funcional", "pânico", "hipoglicemia", "segurança", "afogamento", "trauma", "SAMU", "plano de ação", "escola", "transporte", "impacto funcional", "estigma", "privacidade", "devolutiva", "seguimento"];

function moduleSignals(key: string): string[] {
  const module = ipnEpiSegModules.find((value) => value.key === key);
  const items = ipnEpiSegItems.filter((item) => item.module === key);
  return [...new Set([...BASE_TAGS, ...(module?.contextTags ?? []), ...items.flatMap((item) => [...item.signalTags, ...item.contextTags])])];
}

const common = {
  licencaUso: "autoral" as const,
  validacaoBrasil: "Autoral — uso clínico institucional; validação psicométrica própria ainda não realizada.",
  pendente_validacao_clinica: true,
  pendencia: PENDENCIA,
  suicideRiskInstrument: false,
  psychosisRiskInstrument: false,
  implementationStatus: "complete" as const,
  fonte: `${IPN_EPI_SEG_PROVENANCE.title}, v${IPN_EPI_SEG_PROVENANCE.version}, ${IPN_EPI_SEG_PROVENANCE.generatedAt}. Dr. Jadson Fraga / NeuroPed SDG.`,
};

function entry(value: ScaleEntry, moduleKey: string): ScaleEntry {
  return { ...common, ...value, signalTags: moduleSignals(moduleKey) };
}

export const escalasIpnEpiSeg200: ScaleEntry[] = [
  entry({
    id: "ipn-epi-seg-familia-50", name: "IPN-EPI/SEG · Família 50", fullName: "IPN-EPI/SEG 200 — Família e Cuidadores (50 itens)",
    ageMin: 0, ageMax: 215, queixas: ["epilepsia", "sono", "funcionalidade"], respondente: ["pais"] as ScaleEntry["respondente"],
    prioridade: "triagem", tempo: "12–20 min", appRoute: "/generic-scale/ipn-epi-seg-familia-50",
    description: DESCRIPTION, scoringCutoff: "Pontuação autoral de necessidade clínica 0–3/N-O; sem ponto de corte diagnóstico; interpretar por item, domínio e contexto.",
    assessmentUse: "triagem", applicationMode: "questionario_pais",
    verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  }, "familia"),
  entry({
    id: "ipn-epi-seg-escola-30", name: "IPN-EPI/SEG · Escola 30", fullName: "IPN-EPI/SEG 200 — Escola e Equipe Terapêutica (30 itens)",
    ageMin: 24, ageMax: 215, queixas: ["epilepsia", "aprendizagem", "funcionalidade"], respondente: ["professor"] as ScaleEntry["respondente"],
    prioridade: "triagem", tempo: "10–15 min", appRoute: "/generic-scale/ipn-epi-seg-escola-30",
    description: DESCRIPTION, scoringCutoff: "Pontuação autoral de necessidade clínica 0–3/N-O; sem ponto de corte diagnóstico; interpretar por item, domínio e contexto.",
    assessmentUse: "triagem", applicationMode: "questionario_professor",
    verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  }, "escola"),
  entry({
    id: "ipn-epi-seg-autopercepcao-20", name: "IPN-EPI/SEG · Autopercepção 20", fullName: "IPN-EPI/SEG 200 — Autopercepção Apoiada (20 itens)",
    ageMin: 96, ageMax: 215, queixas: ["epilepsia", "ansiedade", "funcionalidade"], respondente: ["autoaplicavel"] as ScaleEntry["respondente"],
    prioridade: "triagem", tempo: "8–15 min", appRoute: "/generic-scale/ipn-epi-seg-autopercepcao-20",
    description: DESCRIPTION, scoringCutoff: "Pontuação autoral de necessidade clínica 0–3/N-O; sem ponto de corte diagnóstico; interpretar por item, domínio e contexto.",
    assessmentUse: "triagem", applicationMode: "autoquestionario_crianca_adolescente",
    verbalRequirement: "nao_verbal_compativel", literacyRequirement: "indiferente",
  }, "autopercepcao"),
  entry({
    id: "ipn-epi-seg-observacao-20", name: "IPN-EPI/SEG · Observação 20", fullName: "IPN-EPI/SEG 200 — Observação Clínica (20 itens)",
    ageMin: 0, ageMax: 215, queixas: ["epilepsia", "atraso", "funcionalidade"], respondente: ["clinico"] as ScaleEntry["respondente"],
    prioridade: "triagem", tempo: "12–20 min", appRoute: "/generic-scale/ipn-epi-seg-observacao-20",
    description: DESCRIPTION, scoringCutoff: "Pontuação autoral de necessidade clínica 0–3/N-O; sem ponto de corte diagnóstico; interpretar por item, domínio e contexto.",
    assessmentUse: "triagem", applicationMode: "observacional_clinico",
    verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  }, "observacao"),
  entry({
    id: "ipn-epi-seg-anamnese-20", name: "IPN-EPI/SEG · Anamnese 20", fullName: "IPN-EPI/SEG 200 — Anamnese Profissional (20 campos)",
    ageMin: 0, ageMax: 215, queixas: ["epilepsia", "atraso", "sono", "funcionalidade"], respondente: ["clinico"] as ScaleEntry["respondente"],
    prioridade: "diagnostica", tempo: "15–30 min", appRoute: "/generic-scale/ipn-epi-seg-anamnese-20",
    description: DESCRIPTION, scoringCutoff: "Sem escore; roteiro qualitativo.",
    assessmentUse: "diagnostico", applicationMode: "entrevista_clinica",
    verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  }, "anamnese"),
  entry({
    id: "ipn-epi-seg-diferenciais-20", name: "IPN-EPI/SEG · Diferenciais 20", fullName: "IPN-EPI/SEG 200 — Diferenciais e Condições Associadas (20 campos)",
    ageMin: 0, ageMax: 215, queixas: ["epilepsia", "sono", "ansiedade", "funcionalidade"], respondente: ["clinico"] as ScaleEntry["respondente"],
    prioridade: "diagnostica", tempo: "15–30 min", appRoute: "/generic-scale/ipn-epi-seg-diferenciais-20",
    description: DESCRIPTION, scoringCutoff: "Sem escore; roteiro qualitativo.",
    assessmentUse: "diagnostico", applicationMode: "registro_clinico",
    verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  }, "diferenciais"),
  entry({
    id: "ipn-epi-seg-seguranca-20", name: "IPN-EPI/SEG · Segurança 20", fullName: "IPN-EPI/SEG 200 — Segurança e Red Flags (20 itens fora do escore)",
    ageMin: 0, ageMax: 215, queixas: ["epilepsia", "funcionalidade"], respondente: ["pais", "professor", "autoaplicavel", "clinico"] as ScaleEntry["respondente"],
    prioridade: "triagem", tempo: "8–15 min", appRoute: "/generic-scale/ipn-epi-seg-seguranca-20",
    description: DESCRIPTION, scoringCutoff: "Sem escore; red flags independentes e decisão clínica própria.",
    assessmentUse: "triagem", applicationMode: "registro_clinico",
    verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  }, "seguranca"),
  entry({
    id: "ipn-epi-seg-sintese-20", name: "IPN-EPI/SEG · Síntese 20", fullName: "IPN-EPI/SEG 200 — Síntese, Plano e Devolutiva (20 campos)",
    ageMin: 0, ageMax: 215, queixas: ["epilepsia", "funcionalidade", "evolucao"], respondente: ["clinico"] as ScaleEntry["respondente"],
    prioridade: "monitorizacao", tempo: "12–25 min", appRoute: "/generic-scale/ipn-epi-seg-sintese-20",
    description: DESCRIPTION, scoringCutoff: "Sem escore; roteiro qualitativo.",
    assessmentUse: "monitorizacao", applicationMode: "registro_clinico",
    verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  }, "sintese"),
];
