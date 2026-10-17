// ============================================================
// Dados expandidos de Neuropediatria: C-SSRS, PHQ-A, YGTSS e GMFCS.
// CRAFFT, Vanderbilt, ASQ-3, CSHQ, ABC e PedsQL saíram em 17/10/2026 (licenciados):
// ficha de referência + alternativa no app (ver authorialScalesSubstitutos.ts).
// ============================================================

// --- PHQ-A (Patient Health Questionnaire for Adolescents) ---
export const phqaQuestions = [
  "Pouco interesse ou prazer em fazer as coisas",
  "Sentir-se para baixo, deprimido(a) ou sem esperança",
  "Dificuldade para adormecer, permanecer dormindo ou dormir demais",
  "Sentir-se cansado(a) ou com pouca energia",
  "Falta de apetite ou comendo demais",
  "Sentir-se mal consigo mesmo(a), achar que é um fracasso ou que decepcionou sua família",
  "Dificuldade para se concentrar nas coisas (como lição de casa ou assistir TV)",
  "Movimentar-se ou falar tão devagar que as outras pessoas notaram, ou o contrário — tão agitado(a) que fica andando de um lado para o outro",
  "Pensamentos de que seria melhor estar morto(a) ou de se machucar de alguma forma",
];
export const phqaLabels = [
  "Nenhuma vez",
  "Vários dias",
  "Mais da metade dos dias",
  "Quase todos os dias",
];
export function hasPositivePhqaSelfHarm(
  answers: Record<number, number>,
): boolean {
  return Number.isInteger(answers[8]) && answers[8] > 0;
}

export function requiresPhqaSafetyConfirmation(
  answers: Record<number, number>,
  safetyProtocolConfirmed: boolean,
): boolean {
  return hasPositivePhqaSelfHarm(answers) && !safetyProtocolConfirmed;
}

export function updatePhqaSafetyConfirmation(
  currentConfirmed: boolean,
  questionIndex: number,
  previousValue: number | undefined,
  nextValue: number,
): boolean {
  if (questionIndex !== 8) return currentConfirmed;
  if (previousValue !== nextValue) return false;
  return nextValue > 0 ? currentConfirmed : false;
}

export function buildPhqaReportItems(
  answers: Record<number, number>,
  safetyProtocolConfirmed: boolean,
): Array<{
  question: string;
  answer: string;
}> {
  const items = phqaQuestions.map((question, index) => ({
    question,
    answer:
      answers[index] !== undefined
        ? phqaLabels[answers[index]]
        : "Não respondida",
  }));

  if (hasPositivePhqaSelfHarm(answers)) {
    items.push({
      question: "Nota de segurança — item 9 positivo",
      answer: safetyProtocolConfirmed
        ? "Protocolo de segurança iniciado antes da conclusão. Respostas registradas sem cálculo ou interpretação de escore."
        : "Confirmação do protocolo de segurança pendente. Resultado não deve ser concluído. Respostas sem cálculo ou interpretação de escore.",
    });
  }

  return items;
}
export function classifyPhqa(total: number) {
  if (total <= 4)
    return {
      classification: "Mínima",
      color: "emerald",
      description: "Depressão mínima (0-4). Monitoramento.",
    };
  if (total <= 9)
    return {
      classification: "Leve",
      color: "amber",
      description:
        "Depressão leve (5-9). Observação ativa, considerar reavaliação em 2 semanas.",
    };
  if (total <= 14)
    return {
      classification: "Moderada",
      color: "orange",
      description:
        "Depressão moderada (10-14). Considerar tratamento psicoterápico e/ou farmacológico.",
    };
  if (total <= 19)
    return {
      classification: "Moderada-Grave",
      color: "red",
      description:
        "Depressão moderadamente grave (15-19). Tratamento ativo indicado.",
    };
  return {
    classification: "Grave",
    color: "red",
    description:
      "Depressão grave (20-27). Encaminhamento urgente para psiquiatria, avaliar risco.",
  };
}

// --- C-SSRS (Columbia Suicide Severity Rating Scale) ---
export const cssrsQuestions = [
  {
    id: 1,
    text: "Desejou estar morto(a) ou desejou poder adormecer e não acordar?",
    level: "Ideação passiva",
  },
  { id: 2, text: "Teve pensamentos de se matar?", level: "Ideação ativa" },
  {
    id: 3,
    text: "Pensou em como faria isso (método)?",
    level: "Ideação com método",
  },
  {
    id: 4,
    text: "Teve intenção de agir com base nesses pensamentos?",
    level: "Ideação com intenção",
  },
  {
    id: 5,
    text: "Começou a elaborar os detalhes de como se matar ou fez preparativos?",
    level: "Ideação com plano",
  },
  {
    id: 6,
    text: "Já fez algo, começou a fazer algo ou se preparou para fazer algo para acabar com sua vida?",
    level: "Comportamento suicida",
  },
];

export function getVisibleCssrsQuestionIds(
  answers: Record<number, boolean>,
): number[] {
  const visible = [1, 2];

  if (answers[2] === true) {
    visible.push(3, 4, 5);
  }

  if (answers[2] !== undefined) {
    visible.push(6);
  }

  return visible;
}

export function pruneCssrsAnswers(
  answers: Record<number, boolean>,
): Record<number, boolean> {
  const visible = new Set(getVisibleCssrsQuestionIds(answers));
  return Object.fromEntries(
    Object.entries(answers)
      .map(([key, value]) => [Number(key), value] as const)
      .filter(([key]) => visible.has(key)),
  );
}

export function getCssrsSkipLogicSummary(
  answers: Record<number, boolean>,
): string {
  if (answers[2] === false) {
    return "Lógica de interrupção aplicada: Q2 = Não; Q3-Q5 foram omitidas.";
  }
  if (answers[2] === true) {
    return "Lógica de seguimento aplicada: Q2 = Sim; Q3-Q5 e Q6 foram apresentadas.";
  }
  return "Q1 e Q2 devem ser respondidas antes da pergunta sobre comportamento suicida.";
}
export function classifyCssrs(answers: Record<number, boolean>) {
  if (answers[6])
    return {
      level: 6,
      classification: "Comportamento Suicida",
      color: "red",
      description:
        "Presença de comportamento suicida. Encaminhamento IMEDIATO para emergência psiquiátrica.",
    };
  if (answers[5])
    return {
      level: 5,
      classification: "Ideação com Plano",
      color: "red",
      description:
        "Ideação suicida ativa com plano específico. Alto risco — encaminhamento urgente.",
    };
  if (answers[4])
    return {
      level: 4,
      classification: "Ideação com Intenção",
      color: "red",
      description:
        "Ideação suicida ativa com intenção de agir. Encaminhamento psiquiátrico urgente.",
    };
  if (answers[3])
    return {
      level: 3,
      classification: "Ideação com Método",
      color: "orange",
      description:
        "Ideação suicida ativa com método, sem intenção. Avaliação de segurança necessária.",
    };
  if (answers[2])
    return {
      level: 2,
      classification: "Ideação Ativa",
      color: "orange",
      description:
        "Ideação suicida ativa sem método específico. Avaliação especializada indicada.",
    };
  if (answers[1])
    return {
      level: 1,
      classification: "Ideação Passiva",
      color: "amber",
      description:
        "Desejo de morte sem ideação ativa. Acompanhamento recomendado.",
    };
  return {
    level: 0,
    classification: "Sem Risco Identificado",
    color: "emerald",
    description: "Sem ideação suicida identificada nesta avaliação.",
  };
}

// --- YGTSS (Yale Global Tic Severity Scale — triagem) ---
export const ygtssMotorTics = [
  "Piscar os olhos de forma excessiva",
  "Movimentos da boca, lábios ou língua",
  "Movimentos da cabeça (sacudir, girar)",
  "Encolher os ombros",
  "Movimentos dos braços ou mãos",
  "Movimentos das pernas ou pés",
  "Movimentos abdominais (contrações)",
  "Movimentos faciais complexos (caretas)",
  "Gestos ou posturas complexas",
  "Tocar em si mesmo ou nos outros repetidamente",
];
export const ygtssVocalTics = [
  "Fungadas/limpar a garganta",
  "Grunhidos ou sons guturais",
  "Gritos ou berros",
  "Repetição de sons ou sílabas",
  "Repetição de palavras próprias (palilalia)",
  "Repetição de palavras dos outros (ecolalia)",
  "Palavras ou frases inapropriadas (coprolalia)",
  "Assobios, sopros ou outros sons",
];
export const ygtssFrequencyLabels = [
  "Ausente",
  "Raramente",
  "Frequentemente",
  "Quase sempre",
  "Constante",
];
export const ygtssIntensityLabels = [
  "Nenhuma",
  "Mínima",
  "Leve",
  "Moderada",
  "Grave",
  "Muito grave",
];
export function classifyYgtss(
  motorScore: number,
  vocalScore: number,
  impairment: number,
) {
  const totalTic = motorScore + vocalScore;
  const globalScore = totalTic + impairment;
  let severity = "Ausente";
  let color = "emerald";
  if (globalScore >= 50) {
    severity = "Grave";
    color = "red";
  } else if (globalScore >= 30) {
    severity = "Moderado";
    color = "orange";
  } else if (globalScore >= 10) {
    severity = "Leve";
    color = "amber";
  } else if (globalScore > 0) {
    severity = "Mínimo";
    color = "emerald";
  }
  return {
    motorScore,
    vocalScore,
    totalTic,
    impairment,
    globalScore,
    severity,
    color,
  };
}

// --- GMFCS (Gross Motor Function Classification System) ---
export const gmfcsLevels = [
  {
    level: "I",
    title: "Nível I — Anda sem Limitações",
    color: "emerald",
    description:
      "Anda em casa, na escola, ao ar livre e na comunidade. Consegue subir escadas sem apoio no corrimão. Realiza habilidades motoras grossas como correr e pular, mas a velocidade, equilíbrio e coordenação podem ser reduzidos.",
    characteristics: [
      "Anda sem limitações dentro e fora de casa",
      "Sobe e desce escadas sem apoio",
      "Corre e pula mas com limitações de velocidade e coordenação",
      "Participa de atividades físicas e esportivas",
    ],
  },
  {
    level: "II",
    title: "Nível II — Anda com Limitações",
    color: "amber",
    description:
      "Anda na maioria dos ambientes. Pode ter dificuldade em superfícies irregulares, inclinadas, em áreas lotadas ou espaços apertados. Pode usar dispositivos auxiliares para longas distâncias. Sobe escadas com apoio.",
    characteristics: [
      "Anda na maioria dos ambientes com limitações",
      "Dificuldade em terrenos irregulares e inclinações",
      "Sobe escadas com apoio no corrimão",
      "Pode precisar de cadeira de rodas para longas distâncias",
    ],
  },
  {
    level: "III",
    title: "Nível III — Anda com Dispositivo Auxiliar",
    color: "orange",
    description:
      "Anda usando dispositivo auxiliar de mobilidade manual (andador, muletas) em ambientes internos. Senta-se com apoio ou pode necessitar de cinto pélvico. Usa cadeira de rodas para distâncias maiores.",
    characteristics: [
      "Anda com andador ou muletas em ambientes internos",
      "Senta-se com apoio — pode precisar de cinto",
      "Usa cadeira de rodas manual para longas distâncias",
      "Pode conseguir subir escadas com apoio e supervisão",
    ],
  },
  {
    level: "IV",
    title: "Nível IV — Mobilidade Limitada (Cadeira de Rodas)",
    color: "red",
    description:
      "A auto-mobilidade é limitada. É transportado ou usa cadeira de rodas motorizada. Necessita de adaptações para sentar-se. Pode conseguir andar curtas distâncias com dispositivo e supervisão intensa.",
    characteristics: [
      "Usa cadeira de rodas na maioria dos ambientes",
      "Pode andar curtas distâncias com muito apoio",
      "Necessita de assento adaptado com suporte de tronco",
      "Pode operar cadeira de rodas motorizada",
    ],
  },
  {
    level: "V",
    title: "Nível V — Transportado em Cadeira de Rodas",
    color: "red",
    description:
      "Deficiências físicas graves limitam o controle voluntário do movimento. Não consegue manter posturas contra gravidade de cabeça e tronco. Requer tecnologia assistiva e assistência física total.",
    characteristics: [
      "Transportado em cadeira de rodas em todos os ambientes",
      "Limitações graves no controle de cabeça e tronco",
      "Necessita de equipamento adaptado extensivo",
      "Requer assistência física total para mobilidade",
    ],
  },
];

// --- Tipos para Diário de Crises Epilépticas ---
export interface EpilepsyEntry {
  date: string;
  time: string;
  type: string;
  duration: string;
  consciousness: string;
  triggers: string[];
  description: string;
  postIctal: string[];
  medication: string;
  notes: string;
}
export const epilepsyTypes = [
  "Tônico-clônica generalizada",
  "Ausência típica",
  "Ausência atípica",
  "Mioclônica",
  "Tônica",
  "Clônica",
  "Atônica",
  "Focal com consciência preservada",
  "Focal com consciência alterada",
  "Focal evoluindo para bilateral",
  "Espasmos epilépticos",
  "Outro / Não classificada",
];
export const epilepsyTriggers = [
  "Privação de sono",
  "Febre / Infecção",
  "Estresse emocional",
  "Exercício intenso",
  "Estímulo luminoso (fotossensibilidade)",
  "Menstruação",
  "Esquecimento de medicação",
  "Álcool",
  "Alimentação irregular",
  "Outro",
];
export const postIctalSymptoms = [
  "Sonolência",
  "Confusão mental",
  "Cefaleia",
  "Dor muscular",
  "Náusea/vômito",
  "Amnésia do evento",
  "Afasia transitória",
  "Fraqueza de membro (Todd)",
  "Nenhum",
];

// --- Tipos para Calendário de Cefaleia ---
export interface HeadacheEntry {
  date: string;
  intensity: number; // 0-10 VAS
  type: string;
  location: string;
  duration: string;
  aura: boolean;
  auraType: string;
  triggers: string[];
  symptoms: string[];
  medication: string;
  relief: string;
  notes: string;
}
export const headacheTypes = [
  "Migranosa (pulsátil, unilateral)",
  "Tensional (pressão, bilateral)",
  "Em salvas (cluster)",
  "Cervicogênica",
  "Secundária a sinusite",
  "Pós-traumática",
  "Outro / Não definida",
];
export const headacheLocations = [
  "Frontal bilateral",
  "Frontal unilateral",
  "Temporal bilateral",
  "Temporal unilateral",
  "Occipital",
  "Parietal",
  "Hemicraniana direita",
  "Hemicraniana esquerda",
  "Holocraniana (cabeça toda)",
  "Retro-orbitária",
];
export const headacheTriggers = [
  "Estresse/Ansiedade",
  "Privação de sono",
  "Excesso de sono",
  "Jejum prolongado",
  "Alimentos (chocolate, queijo, etc.)",
  "Mudança climática",
  "Exercício físico",
  "Telas (computador/celular)",
  "Menstruação",
  "Desidratação",
  "Outro",
];
export const headacheSymptoms = [
  "Náusea",
  "Vômito",
  "Fotofobia (sensibilidade à luz)",
  "Fonofobia (sensibilidade ao som)",
  "Osmofobia (sensibilidade a cheiros)",
  "Tontura",
  "Lacrimejamento",
  "Congestão nasal",
  "Piora com atividade física",
];
export const headacheAuraTypes = [
  "Visual (escotomas, linhas em zigue-zague)",
  "Sensitiva (formigamento, dormência)",
  "Motora (fraqueza)",
  "Linguagem (dificuldade para falar)",
  "Vestibular (vertigem)",
];
