// ============================================================
// LOTE 2 — Escalas autorais do Google Drive do Dr. Jadson Fraga
// (varredura completa 2026-07). Conteúdo AUTORAL e EXPERIMENTAL —
// instrumentos de organização clínica, sem validação psicométrica
// publicada. Triagem/monitorização e apoio a laudo, NUNCA diagnóstico
// isolado. Abrem como FICHA TÉCNICA (metadata_only, /generic-scale/:id).
//
// CURADORIA (pedido do autor): a varredura encontrou 16 escalas autorais
// fora do banco. 15 delas eram ITERAÇÕES da mesma família broadband
// multi-domínio, criadas dia a dia (jun–jul/2026) — praticamente o mesmo
// instrumento renomeado e com nº de itens diferente. Para não poluir o
// filtro com ~15 cards quase idênticos (e porque NDI-360 e MATRIX-100 já
// cobrem a família broadband rápida/aprofundada), mantemos aqui apenas as
// DUAS versões broadband mais recentes como representantes da geração atual
// + a Escala Maria Clara (ansiedade), que é um instrumento distinto.
//
// Iterações supersedidas (preservadas no histórico git, fora do app):
//   INTEGRA-KIDS 360, MAPA-360, SINAF-NeuroPed, INTEGRA-NEUROPED 90,
//   EINPI-360, EINPI-DrJ v1, PONTE-PED 72, SINAPSE-FI 60, NEXUS-PED 52,
//   NEFI-PED 96, IDAFENI, EIDAF-Neuroinfantil, NAVI-PED 84.
//
// Nenhuma é rastreador DEDICADO de risco suicida/psicose — são matrizes
// amplas com item(ns) sentinela; classificação de segurança idêntica a
// NDI-360 e MATRIX-100 (não recebem suicideRiskInstrument/psychosisRisk).
// ============================================================
import { type ScaleEntry } from "./scaleFilter";

const DOC = (id: string) => `https://docs.google.com/document/d/${id}/edit`;

export const escalasAutoraisDrive2026Lote2: ScaleEntry[] = [
  {
    id: "nef-360",
    name: "NEF-360 — Neuro-Escola Funcional 360",
    fullName: "NEF-360 — Neuro-Escola Funcional 360 (Escala Integrada de Neuropediatria e Psiquiatria Infantil para Consultório, Família e Escola)",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "15–20 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. Matriz clínica única (60 itens, 0–3) que organiza sinais funcionais de neurodesenvolvimento, comportamento, aprendizagem, epilepsia, sono e sofrimento emocional, integrando dados de pais, escola e consulta e sinalizando prioridades e red flags. Ficha técnica — sem validação psicométrica publicada.",
    fonte: "ESCALA AUTORAL NEF360 V1 (2026-07-06) — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("12_m2Tb8dZWN2pUgKTt5FhU1KBxWyc9TKWTBDUg2rkWA"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "60 itens, cada 0–3 (NA quando não se aplica). Escore por domínio convertido em percentual: 0–20% sem prejuízo relevante; 21–40% leve; 41–60% moderado; 61–80% importante; 81–100% crítico. Índice Global = média percentual dos domínios aplicáveis, sempre lido junto aos domínios críticos.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/nef-360",
  },
  {
    id: "neurofunc-360",
    name: "NEUROFUNC-360",
    fullName: "NEUROFUNC-360 V1 — Escala Integrada de Funcionamento Neuropsiquiátrico, Desenvolvimento e Vida Real da Criança e do Adolescente",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "10–15 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. Versão broadband curta (40 itens, 0–3) que integra desenvolvimento, comportamento, cognição, linguagem, sono, epilepsia, aprendizagem, autorregulação, funções executivas, sofrimento emocional e funcionalidade, identificando as áreas de maior impacto para anamnese, laudo e plano. Ficha técnica — sem validação publicada.",
    fonte: "2026-07-05_ESCALA_AUTORAL_NEUROFUNC-360_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1Ss2fQeYp7LrbAQ63nTdSiCCld_FyTjUrACEMtyBh6yE"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "40 itens (0–3). Escore bruto por domínio: 0–2 sem sinal; 3–5 leve; 6–8 moderado; 9–12 alto. Total: 0–20 baixa carga; 21–40 vulnerabilidade leve/moderada; 41–70 moderado; 71–100 importante; >100 alta complexidade. Índices auxiliares (Escola, Neurodesenvolvimento, Risco Clínico).",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/neurofunc-360",
  },
  {
    id: "escala-maria-clara-ansiedade",
    name: "Escala Maria Clara — Ansiedade",
    fullName: "Escala Autoral Maria Clara — Ansiedade Infantojuvenil (Protocolo Dr. Jadson Fraga)",
    ageMin: 96,
    ageMax: 215,
    queixas: ["ansiedade"],
    respondente: ["autoaplicavel", "clinico"],
    prioridade: "monitorizacao",
    tempo: "10–15 min",
    description:
      "Instrumento autoral do Dr. Jadson Fraga para avaliar a ansiedade infantojuvenil nas últimas 2 semanas em três dimensões — ansiedade global e somática, ansiedade generalizada cognitiva e ansiedade de desempenho/avaliação —, classificando gravidade e impacto funcional. 25 itens (0–3). Ficha técnica — sem validação psicométrica publicada.",
    fonte: "Escala Autoral Maria Clara (PDF) — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: https://drive.google.com/file/d/1i7LPeeg1CsJX7qnmtCxMAHheOrQ1m6sB/view",
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — inspirada em SCARED/GAD-7/RCADS; sem validação psicométrica própria publicada",
    scoringCutoff:
      "25 itens (0 = nunca a 3 = quase sempre). Dimensão A/SCARED (0–40), B/GAD-7 adaptado (0–21), C/RCADS desempenho (0–24). Total máximo 85: 0–24 leve/subclínica; 25–44 leve; 45–64 moderada; ≥65 grave (alto impacto, risco de cronificação). Interpretação qualitativa obrigatória pelo médico.",
    assessmentUse: "monitorizacao",
    applicationMode: "autoquestionario_crianca_adolescente",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/escala-maria-clara-ansiedade",
  },
];
