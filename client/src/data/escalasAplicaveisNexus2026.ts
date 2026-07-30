// ============================================================
// Instrumentos AUTORAIS aplicáveis (NEXUS-NP, 2026-07-12).
// Origem: regra de ouro TOTAL retirou do banco os padrões-ouro
// COMERCIAIS (Vineland, Bayley, PSI, Sensory Profile 2, SIPS,
// TSCYC…) — a pedido do Dr. Jadson, estes instrumentos autorais
// cobrem os MESMOS CONSTRUTOS com aplicação completa no app.
//
// Política: redação 100% própria; nenhum item, estrutura ou norma
// de instrumento licenciado é reproduzido. Cada ficha declara que o
// instrumento NÃO substitui a avaliação padronizada correspondente.
// Todos pendentes de validação clínica formal (triagem descritiva).
// ============================================================
import { type ScaleEntry } from "./scaleFilter";
import { escalasIpnTea200 } from "./escalasIpnTea200";

const PENDENCIA_VALIDACAO_AUTORAL =
  "Instrumento autoral em desenvolvimento; conteúdo, propriedades psicométricas e uso clínico aguardam validação formal.";

export const escalasAplicaveisNexus2026: ScaleEntry[] = [
  {
    id: "ead-np",
    name: "EAD-NP",
    fullName: "Escala de Comportamento Adaptativo NeuroPed (autoral)",
    ageMin: 12,
    ageMax: 216,
    queixas: ["funcionalidade", "autonomia", "atraso"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "8–12 min",
    description:
      "Triagem autoral do comportamento adaptativo no dia a dia — comunicação funcional, autocuidado, socialização e autonomia prática — respondida pelos pais/cuidadores e comparada ao esperado para a idade. Cobre o construto avaliado por escalas adaptativas padronizadas (ex.: Vineland-3, ABAS-3), sem substituí-las quando a avaliação normatizada for necessária.",
    fonte: "Instrumento autoral NeuroPed — Dr. Jadson Fraga, 2026. Construto: comportamento adaptativo.",
    scoringCutoff: "16 itens (0–3, quanto MAIOR mais dificuldade adaptativa); interpretação por percentual do máximo e por domínio.",
    validacaoBrasil: "Autoral — pendente de validação formal.",
    licencaUso: "autoral",
    pendente_validacao_clinica: true,
    pendencia: PENDENCIA_VALIDACAO_AUTORAL,
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    signalTags: ["autonomia", "autocuidado", "comunicação funcional", "socialização", "atividades de vida diária", "independência", "prejuízo funcional"],
  },
  {
    id: "tdn-bebe",
    name: "TDN-Bebê",
    fullName: "Triagem do Desenvolvimento NeuroPed — Lactentes 1–42 meses (autoral)",
    ageMin: 1,
    ageMax: 42,
    queixas: ["neonatal", "atraso", "motor", "linguagem"],
    respondente: ["pais", "clinico"],
    prioridade: "triagem",
    tempo: "5–10 min",
    description:
      "Triagem autoral de marcos do desenvolvimento do lactente (motor, comunicação e interação/cognição) para 1 a 42 meses, respondida pelos pais com apoio do clínico. Cobre o construto de avaliação do desenvolvimento infantil precoce (ex.: Bayley-III) em formato de triagem — não substitui avaliação padronizada quando indicada.",
    fonte: "Instrumento autoral NeuroPed — Dr. Jadson Fraga, 2026. Construto: desenvolvimento do lactente.",
    scoringCutoff: "12 marcos (0–2, quanto MAIOR melhor); interpretação por percentual de marcos alcançados e por domínio.",
    validacaoBrasil: "Autoral — pendente de validação formal.",
    licencaUso: "autoral",
    pendente_validacao_clinica: true,
    pendencia: PENDENCIA_VALIDACAO_AUTORAL,
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    signalTags: ["marcos motores", "sustento de cabeça", "sentar", "andar", "balbucio", "primeiras palavras", "atenção compartilhada", "interação"],
  },
  {
    id: "qec-np",
    name: "QEC-NP",
    fullName: "Questionário de Estresse do Cuidador NeuroPed (autoral)",
    ageMin: 0,
    ageMax: 216,
    queixas: ["comportamento", "funcionalidade", "evolucao"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "5 min",
    description:
      "Triagem autoral da sobrecarga e do estresse do cuidador no cuidado da criança/adolescente — exaustão, rede de apoio, impacto na rotina e na relação. Cobre o construto de estresse parental (ex.: PSI) em formato breve; resultado orienta suporte à família, não é diagnóstico.",
    fonte: "Instrumento autoral NeuroPed — Dr. Jadson Fraga, 2026. Construto: estresse do cuidador.",
    scoringCutoff: "12 itens (0–3, quanto MAIOR mais sobrecarga); interpretação por percentual do máximo.",
    validacaoBrasil: "Autoral — pendente de validação formal.",
    licencaUso: "autoral",
    pendente_validacao_clinica: true,
    pendencia: PENDENCIA_VALIDACAO_AUTORAL,
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    signalTags: ["sobrecarga do cuidador", "exaustão", "rede de apoio", "impacto familiar", "rotina da casa"],
  },
  {
    id: "psn-np",
    name: "PSN-NP",
    fullName: "Perfil Sensorial NeuroPed (autoral)",
    ageMin: 6,
    ageMax: 216,
    queixas: ["sensorial", "tea", "alimentacao"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "8–12 min",
    description:
      "Triagem autoral do processamento sensorial no dia a dia em 4 padrões — busca sensorial, evitação/defensividade, hipersensibilidade e baixo registro — respondida pelos pais. Cobre o construto de perfil sensorial (ex.: Sensory Profile 2) em formato de triagem; não substitui avaliação padronizada de integração sensorial.",
    fonte: "Instrumento autoral NeuroPed — Dr. Jadson Fraga, 2026. Construto: processamento sensorial.",
    scoringCutoff: "16 itens (0–3, quanto MAIOR mais sinais sensoriais atípicos); interpretação por percentual e por padrão sensorial.",
    validacaoBrasil: "Autoral — pendente de validação formal.",
    licencaUso: "autoral",
    pendente_validacao_clinica: true,
    pendencia: PENDENCIA_VALIDACAO_AUTORAL,
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    signalTags: ["sensorialidade", "hipersensibilidade", "busca sensorial", "seletividade alimentar", "texturas", "sons", "defensividade tátil"],
  },
  {
    id: "erp-np",
    name: "ERP-NP",
    fullName: "Entrevista de Risco de Psicose NeuroPed — roteiro clínico (autoral)",
    ageMin: 144,
    ageMax: 216,
    queixas: ["psicose"],
    respondente: ["clinico"],
    prioridade: "triagem",
    tempo: "15–25 min",
    description:
      "Roteiro autoral de entrevista clínica estruturada para explorar experiências do espectro psicótico em adolescentes (≥12 anos): percepções incomuns, desconfiança, ideias de referência, desorganização e impacto funcional. Cobre o construto de entrevista de estados mentais de risco (ex.: SIPS/SOPS) em formato de triagem clínica — não estabelece diagnóstico nem substitui avaliação psiquiátrica formal.",
    fonte: "Instrumento autoral NeuroPed — Dr. Jadson Fraga, 2026. Construto: estados mentais de risco.",
    scoringCutoff: "10 dimensões (0–3, quanto MAIOR mais sinais); qualquer dimensão intensa + sofrimento/queda funcional → avaliação especializada.",
    validacaoBrasil: "Autoral — pendente de validação formal.",
    licencaUso: "autoral",
    pendente_validacao_clinica: true,
    pendencia: PENDENCIA_VALIDACAO_AUTORAL,
    suicideRiskInstrument: false,
    psychosisRiskInstrument: true,
    assessmentUse: "triagem",
    applicationMode: "entrevista_clinica",
    signalTags: ["percepções incomuns", "desconfiança", "ideias de referência", "desorganização do pensamento", "isolamento", "queda funcional"],
  },
  {
    id: "tpp-np",
    name: "TPP-NP",
    fullName: "Triagem de Estresse Pós-Traumático Pré-Escolar NeuroPed — heterorrelato (autoral)",
    ageMin: 24,
    ageMax: 84,
    queixas: ["trauma"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "8–10 min",
    description:
      "Triagem autoral de sintomas de estresse pós-traumático em pré-escolares (2–7 anos) relatados pelo cuidador, após evento potencialmente traumático: revivescência no brincar, pesadelos, evitação, mudanças de humor e hiperativação. Cobre o construto de TEPT pré-escolar heterorrelatado (ex.: TSCYC) em formato de triagem — não substitui avaliação especializada.",
    fonte: "Instrumento autoral NeuroPed — Dr. Jadson Fraga, 2026. Construto: TEPT pré-escolar (heterorrelato).",
    scoringCutoff: "12 itens (0–3, quanto MAIOR mais sinais); sinais frequentes após evento identificável → avaliação especializada em trauma.",
    validacaoBrasil: "Autoral — pendente de validação formal.",
    licencaUso: "autoral",
    pendente_validacao_clinica: true,
    pendencia: PENDENCIA_VALIDACAO_AUTORAL,
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    signalTags: ["revivescência", "pesadelos", "evitação", "sobressalto", "regressão", "irritabilidade", "brincar repetitivo do evento"],
  },
  ...escalasIpnTea200,
];
