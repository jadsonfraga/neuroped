// ============================================================
// DADOS ESTRUTURADOS DE ESCALAS — Perguntas, Respostas e Gabarito
// Sistema para renderizar escalas dinamicamente no app
// ============================================================

export type AnswerType = "yes_no" | "likert_5" | "likert_4" | "likert_3" | "multiple_choice" | "numeric" | "open_text";

export interface AnswerOption {
  id: string;
  label: string;
  value: number;
  description?: string;
}

export interface ScaleQuestion {
  id: string;
  itemNumber: number;
  text: string;
  answerType: AnswerType;
  options?: AnswerOption[];
  reversed?: boolean; // true se resposta deve ser invertida no scoring
  minScore?: number;
  maxScore?: number;
  help?: string; // tooltip com instruções
  dependsOn?: string; // ID da questão da qual esta depende (skip logic)
}

export interface ScaleDomain {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
  scoringFormula?: string; // ex: "sum" | "average" | "custom:function"
}

export interface ScaleScoringCutoff {
  minScore: number;
  maxScore: number;
  classification: string;
  description: string;
  color: "text-emerald-600" | "text-amber-600" | "text-red-600" | "text-gray-600";
  action?: string; // recomendação clínica
}

export interface ScaleMetadata {
  scaleId: string;
  name: string;
  fullName: string;
  ageMin: number; // months
  ageMax: number; // months
  estimatedTime: string; // ex: "10 min"
  questions: ScaleQuestion[];
  domains?: ScaleDomain[];
  scoringCutoffs?: ScaleScoringCutoff[];
  totalItems: number;
  minScore: number;
  maxScore: number;
  scoringMethod?: string; // "sum" | "average" | "custom"
  validationCountries?: string[]; // ["BR", "US", "EU"]
  clinicalNotes?: string;
  references?: string[];
}

// =====================================================================
// EXEMPLO 1: PROMIS Pediatric Anger (Raiva) — 5 itens simplificado
// =====================================================================

export const promisPediatricAngerQuestions: ScaleQuestion[] = [
  {
    id: "anger_1",
    itemNumber: 1,
    text: "Nos últimos 7 dias, quantas vezes você se sentiu irritado/a?",
    answerType: "likert_5",
    options: [
      { id: "never", label: "Nunca", value: 1 },
      { id: "almost_never", label: "Quase nunca", value: 2 },
      { id: "sometimes", label: "Às vezes", value: 3 },
      { id: "often", label: "Frequentemente", value: 4 },
      { id: "very_often", label: "Muito frequentemente", value: 5 },
    ],
    help: "Considere qualquer momento em que você se sentiu chato ou irritado.",
  },
  {
    id: "anger_2",
    itemNumber: 2,
    text: "Nos últimos 7 dias, com que frequência você perdeu a paciência?",
    answerType: "likert_5",
    options: [
      { id: "never", label: "Nunca", value: 1 },
      { id: "almost_never", label: "Quase nunca", value: 2 },
      { id: "sometimes", label: "Às vezes", value: 3 },
      { id: "often", label: "Frequentemente", value: 4 },
      { id: "very_often", label: "Muito frequentemente", value: 5 },
    ],
  },
  {
    id: "anger_3",
    itemNumber: 3,
    text: "Nos últimos 7 dias, com que frequência você sentiu raiva?",
    answerType: "likert_5",
    options: [
      { id: "never", label: "Nunca", value: 1 },
      { id: "almost_never", label: "Quase nunca", value: 2 },
      { id: "sometimes", label: "Às vezes", value: 3 },
      { id: "often", label: "Frequentemente", value: 4 },
      { id: "very_often", label: "Muito frequentemente", value: 5 },
    ],
  },
  {
    id: "anger_4",
    itemNumber: 4,
    text: "Nos últimos 7 dias, quantas vezes você gritou com alguém?",
    answerType: "likert_5",
    options: [
      { id: "never", label: "Nunca", value: 1 },
      { id: "almost_never", label: "Quase nunca", value: 2 },
      { id: "sometimes", label: "Às vezes", value: 3 },
      { id: "often", label: "Frequentemente", value: 4 },
      { id: "very_often", label: "Muito frequentemente", value: 5 },
    ],
  },
  {
    id: "anger_5",
    itemNumber: 5,
    text: "Nos últimos 7 dias, com que frequência você sentiu que queria bater em algo ou alguém?",
    answerType: "likert_5",
    options: [
      { id: "never", label: "Nunca", value: 1 },
      { id: "almost_never", label: "Quase nunca", value: 2 },
      { id: "sometimes", label: "Às vezes", value: 3 },
      { id: "often", label: "Frequentemente", value: 4 },
      { id: "very_often", label: "Muito frequentemente", value: 5 },
    ],
  },
];

export const promisPediatricAngerMetadata: ScaleMetadata = {
  scaleId: "scale_008",
  name: "PROMIS Pediatric Anger",
  fullName: "Sistema de Informação de Medidas de Resultados Relatados pelo Paciente — Raiva Pediátrica",
  ageMin: 96, // 8 anos
  ageMax: 204, // 17 anos
  estimatedTime: "5 min",
  questions: promisPediatricAngerQuestions,
  totalItems: 5,
  minScore: 5,
  maxScore: 25,
  scoringMethod: "sum",
  scoringCutoffs: [
    {
      minScore: 5,
      maxScore: 10,
      classification: "Raiva muito baixa",
      description: "Níveis muito baixos de raiva e irritabilidade.",
      color: "text-emerald-600",
      action: "Acompanhamento de rotina.",
    },
    {
      minScore: 11,
      maxScore: 15,
      classification: "Raiva baixa",
      description: "Níveis baixos de raiva comparado com pares.",
      color: "text-emerald-600",
      action: "Acompanhamento de rotina.",
    },
    {
      minScore: 16,
      maxScore: 18,
      classification: "Raiva média",
      description: "Níveis moderados de raiva, dentro dos esperado para idade.",
      color: "text-amber-600",
      action: "Considerar estratégias de regulação emocional.",
    },
    {
      minScore: 19,
      maxScore: 22,
      classification: "Raiva elevada",
      description: "Níveis elevados de raiva comparado com pares.",
      color: "text-red-600",
      action: "Encaminhar para avaliação psicossocial e terapia emocional.",
    },
    {
      minScore: 23,
      maxScore: 25,
      classification: "Raiva muito elevada",
      description: "Níveis muito elevados de raiva com possível risco de comportamento agressivo.",
      color: "text-red-600",
      action: "Avaliação urgente, considerar manejo comportamental intensivo.",
    },
  ],
  validationCountries: ["US", "BR", "EU"],
  clinicalNotes: "Instrumento de monitorização. Não substitui avaliação clínica abrangente de transtornos comportamentais ou emocionais.",
  references: [
    "National Institutes of Health (NIH) - Patient-Reported Outcomes Measurement Information System (PROMIS®)",
  ],
};

// =====================================================================
// EXEMPLO 2: M-CHAT-R/F (Modified Checklist for Autism in Toddlers)
// =====================================================================

export const mchatRFQuestions: ScaleQuestion[] = [
  {
    id: "mchat_1",
    itemNumber: 1,
    text: "Se você aponta para algo do outro lado do quarto, seu filho olha para esse objeto?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true, // resposta "Não" é risco
  },
  {
    id: "mchat_2",
    itemNumber: 2,
    text: "Você já se perguntou se seu filho poderia ser surdo?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 1 },
      { id: "no", label: "Não", value: 0 },
    ],
  },
  {
    id: "mchat_3",
    itemNumber: 3,
    text: "Seu filho brinca de faz de conta? (Ex: finge beber de um copo vazio, finge falar ao telefone)",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_4",
    itemNumber: 4,
    text: "Seu filho gosta de subir em coisas? (Ex: móveis, brinquedos, escadas)",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_5",
    itemNumber: 5,
    text: "Seu filho faz movimentos incomuns com os dedos perto dos olhos?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 1 },
      { id: "no", label: "Não", value: 0 },
    ],
  },
  {
    id: "mchat_6",
    itemNumber: 6,
    text: "Seu filho aponta com o dedo indicador para pedir algo ou para pedir ajuda?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_7",
    itemNumber: 7,
    text: "Seu filho aponta com o dedo indicador para mostrar algo interessante?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_8",
    itemNumber: 8,
    text: "Seu filho se interessa por outras crianças?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_9",
    itemNumber: 9,
    text: "Seu filho traz objetos para mostrar a você?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_10",
    itemNumber: 10,
    text: "Seu filho responde quando você o chama pelo nome?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_11",
    itemNumber: 11,
    text: "Quando você sorri para seu filho, ele sorri de volta?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_12",
    itemNumber: 12,
    text: "Seu filho fica incomodado com barulhos do cotidiano? (Ex: aspirador, música alta)",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 1 },
      { id: "no", label: "Não", value: 0 },
    ],
  },
  {
    id: "mchat_13",
    itemNumber: 13,
    text: "Seu filho anda?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_14",
    itemNumber: 14,
    text: "Seu filho olha nos seus olhos quando você fala, brinca ou veste?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_15",
    itemNumber: 15,
    text: "Seu filho tenta copiar o que você faz? (Ex: acenar tchau, bater palmas)",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_16",
    itemNumber: 16,
    text: "Se você virar a cabeça para olhar algo, seu filho olha ao redor para ver o que está observando?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_17",
    itemNumber: 17,
    text: "Seu filho tenta fazer você olhar para ele?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_18",
    itemNumber: 18,
    text: "Seu filho compreende quando você diz algo? (Ex: sem gestos: coloca na mesa, me dá o cobertor)",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_19",
    itemNumber: 19,
    text: "Quando acontece algo novo, seu filho olha para seu rosto para ver como você se sente?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
  {
    id: "mchat_20",
    itemNumber: 20,
    text: "Seu filho gosta de atividades de movimento? (Ex: ser balançado, ser erguido no joelho)",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },
      { id: "no", label: "Não", value: 1 },
    ],
    reversed: true,
  },
];

export const mchatRFMetadata: ScaleMetadata = {
  scaleId: "mchat",
  name: "M-CHAT-R/F",
  fullName: "Modified Checklist for Autism in Toddlers - Revised with Follow-Up",
  ageMin: 16, // 16 meses
  ageMax: 30, // 30 meses
  estimatedTime: "5-10 min",
  questions: mchatRFQuestions,
  totalItems: 20,
  minScore: 0,
  maxScore: 20,
  scoringMethod: "sum",
  scoringCutoffs: [
    {
      minScore: 0,
      maxScore: 2,
      classification: "Baixo Risco",
      description: "Resultado dentro da normalidade. O acompanhamento pediátrico de rotina é suficiente.",
      color: "text-emerald-600",
      action: "Se <24 meses, reavaliar aos 24 meses. Acompanhamento pediátrico de rotina.",
    },
    {
      minScore: 3,
      maxScore: 7,
      classification: "Risco Moderado",
      description: "Recomenda-se a aplicação da Entrevista de Seguimento (Follow-up).",
      color: "text-amber-600",
      action: "Aplicar M-CHAT-R/F Follow-up. Se persistir ≥2 sintomas, encaminhar para avaliação especializada.",
    },
    {
      minScore: 8,
      maxScore: 20,
      classification: "Alto Risco",
      description: "Encaminhamento imediato para avaliação diagnóstica e intervenção precoce.",
      color: "text-red-600",
      action: "Encaminhamento urgente para avaliação diagnóstica (ADOS-2, ADI-R) e início de intervenção precoce.",
    },
  ],
  validationCountries: ["US", "BR"],
  clinicalNotes: "Instrumento de triagem. Não estabelece diagnóstico isolado. Interpretar com história clínica, exame e contexto escolar/familiar.",
  references: [
    "Robins DL, Fein D, Barton M. The Modified Checklist for Autism in Toddlers (M-CHAT). 2009.",
  ],
};

// =====================================================================
// Registro global de escalas estruturadas
// =====================================================================

export const allScaleMetadata: Record<string, ScaleMetadata> = {
  scale_008: promisPediatricAngerMetadata,
  mchat: mchatRFMetadata,
  // Outras escalas serão adicionadas aqui conforme implementadas
};

export function getScaleMetadata(scaleId: string): ScaleMetadata | undefined {
  return allScaleMetadata[scaleId];
}

export function getScaleQuestions(scaleId: string): ScaleQuestion[] | undefined {
  const metadata = getScaleMetadata(scaleId);
  return metadata?.questions;
}
