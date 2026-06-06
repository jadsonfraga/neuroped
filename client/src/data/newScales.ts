// ============================================================
// SDQ — Strengths and Difficulties Questionnaire (4-17 anos)
// ============================================================
export const sdqQuestions = [
  "Tem consideração pelos sentimentos de outras pessoas",
  "É irrequieto(a), hiperativo(a), não consegue ficar parado(a) por muito tempo",
  "Queixa-se frequentemente de dores de cabeça, dores de barriga ou enjoos",
  "Tem tendência a partilhar com outras crianças (doces, brinquedos, lápis, etc.)",
  "Faz birras ou tem mau gênio com frequência",
  "É solitário(a), tende a brincar sozinho(a)",
  "Normalmente faz o que lhe mandam",
  "Tem muitas preocupações, parece frequentemente preocupado(a)",
  "Ajuda quando alguém se magoa, fica chateado ou se sente doente",
  "Não sossega, está sempre a mexer as pernas ou as mãos",
  "Tem pelo menos um bom amigo/uma boa amiga",
  "Luta frequentemente com as outras crianças ou provoca-as",
  "Anda frequentemente triste, desanimado(a) ou com vontade de chorar",
  "Em geral, os outros colegas/crianças gostam dele(a)",
  "Distrai-se com facilidade, tem dificuldades em se concentrar",
  "É nervoso(a) ou se apega quando vai para novos lugares ou com estranhos",
  "É simpático(a) com crianças mais novas",
  "Mente ou engana frequentemente",
  "As outras crianças metem-se com ele(a), ameaçam-no(a) ou intimidam-no(a)",
  "Oferece-se frequentemente para ajudar os outros (pais, professores, outras crianças)",
  "Pensa nas coisas antes de as fazer",
  "Rouba coisas em casa, na escola ou em outros sítios",
  "Dá-se melhor com adultos do que com outras crianças",
  "Tem muitos medos, assusta-se com facilidade",
  "Geralmente acaba o que começa. Tem uma boa atenção"
];

export const sdqLabels = ["Não é verdade", "É mais ou menos verdade", "É certamente verdade"];

// Subescalas do SDQ (índices 0-based)
export const sdqSubscales = {
  prosocial: { name: "Comportamento Pró-social", items: [0, 3, 8, 16, 19], color: "text-emerald-600 dark:text-emerald-400" },
  hyperactivity: { name: "Hiperatividade", items: [1, 9, 14, 20, 24], color: "text-orange-600 dark:text-orange-400" },
  emotional: { name: "Sintomas Emocionais", items: [2, 7, 12, 15, 23], color: "text-blue-600 dark:text-blue-400" },
  conduct: { name: "Problemas de Conduta", items: [4, 6, 11, 17, 21], color: "text-red-600 dark:text-red-400" },
  peer: { name: "Problemas com Colegas", items: [5, 10, 13, 18, 22], color: "text-purple-600 dark:text-purple-400" },
};

// Itens invertidos (onde "Não é verdade" = 2 pontos)
export const sdqReversedItems = [6, 10, 13, 20, 24]; // 0-based

export function scoreSdqItem(itemIndex: number, value: number): number {
  // value: 0 = "Não é verdade", 1 = "Mais ou menos", 2 = "Certamente verdade"
  if (sdqReversedItems.includes(itemIndex)) {
    return value === 0 ? 2 : value === 1 ? 1 : 0;
  }
  // Para itens pró-sociais e itens diretos, pontuar normalmente
  return value;
}

export function classifySdq(scores: Record<string, number>): {
  total: number;
  classification: string;
  description: string;
  color: string;
  subscaleClassifications: Record<string, { classification: string; color: string }>;
} {
  const total = scores.emotional + scores.conduct + scores.hyperactivity + scores.peer;

  let classification: string;
  let description: string;
  let color: string;

  if (total <= 13) {
    classification = "Normal";
    description = "A pontuação total de dificuldades está dentro da faixa normal. Continuar acompanhamento de rotina.";
    color = "text-emerald-600 dark:text-emerald-400";
  } else if (total <= 16) {
    classification = "Limítrofe";
    description = "Pontuação limítrofe. Recomenda-se reavaliar e considerar acompanhamento mais próximo ou avaliação adicional.";
    color = "text-amber-600 dark:text-amber-400";
  } else {
    classification = "Anormal";
    description = "Pontuação na faixa anormal. Encaminhamento para avaliação especializada em saúde mental recomendado.";
    color = "text-red-600 dark:text-red-400";
  }

  const subscaleClassifications: Record<string, { classification: string; color: string }> = {};

  // Pontos de corte por subescala (borderline, abnormal)
  const cutoffs: Record<string, [number, number]> = {
    emotional: [4, 5],
    conduct: [3, 4],
    hyperactivity: [6, 7],
    peer: [3, 4],
  };

  // Prosocial: escala invertida — maior score = melhor
  const prosocialScore = scores["prosocial"];
  if (prosocialScore >= 6) subscaleClassifications["prosocial"] = { classification: "Normal", color: "text-emerald-600 dark:text-emerald-400" };
  else if (prosocialScore >= 5) subscaleClassifications["prosocial"] = { classification: "Limítrofe", color: "text-amber-600 dark:text-amber-400" };
  else subscaleClassifications["prosocial"] = { classification: "Anormal", color: "text-red-600 dark:text-red-400" };

  for (const [key, [borderline, abnormal]] of Object.entries(cutoffs)) {
    const score = scores[key];
    if (score < borderline) subscaleClassifications[key] = { classification: "Normal", color: "text-emerald-600 dark:text-emerald-400" };
    else if (score <= abnormal) subscaleClassifications[key] = { classification: "Limítrofe", color: "text-amber-600 dark:text-amber-400" };
    else subscaleClassifications[key] = { classification: "Anormal", color: "text-red-600 dark:text-red-400" };
  }

  return { total, classification, description, color, subscaleClassifications };
}

// ============================================================
// SCARED — Screen for Child Anxiety Related Disorders (8-18 anos)
// ============================================================
export const scaredQuestions = [
  "Quando estou com medo é difícil respirar",
  "Tenho dor de cabeça quando estou na escola",
  "Eu não gosto de estar com pessoas que não conheço direito",
  "Fico com medo se durmo fora de casa",
  "Preocupo-me em relação aos outros gostarem de mim",
  "Quando estou assustado(a) parece que vou desmaiar",
  "Eu sou nervoso(a)",
  "Sigo meu pai ou minha mãe aonde quer que eles vão",
  "As pessoas me dizem que eu pareço nervoso(a)",
  "Sinto-me nervoso(a) com pessoas que não conheço direito",
  "Tenho dor de estômago na escola",
  "Quando me assusto, parece que vou enlouquecer",
  "Preocupo-me em ter que dormir sozinho(a)",
  "Preocupo-me em ser tão bom(a) quanto as outras crianças",
  "Quando me assusto, parece que as coisas não são reais",
  "Tenho pesadelos de que algo ruim aconteça com meus pais",
  "Preocupo-me sobre ir à escola",
  "Quando me assusto, meu coração bate rápido",
  "Fico trêmulo(a)",
  "Tenho pesadelos de que algo ruim possa me acontecer",
  "Eu me preocupo sobre as coisas darem certo para mim",
  "Quando me assusto, suo bastante",
  "Eu vivo preocupado(a)",
  "Eu fico muito assustado(a) sem motivo algum",
  "Fico com medo de ficar em casa sozinho(a)",
  "Tenho dificuldade para falar com pessoas que não conheço",
  "Quando me assusto, parece que vou sufocar",
  "As pessoas me dizem que eu me preocupo demais",
  "Não gosto de estar longe da família",
  "Tenho medo de ter crises de ansiedade (ou de pânico)",
  "Preocupo-me que algo ruim possa acontecer com meus pais",
  "Sinto-me tímido(a) com pessoas que não conheço direito",
  "Preocupo-me com o que vai acontecer no futuro",
  "Quando fico assustado(a), parece que vou vomitar",
  "Preocupo-me com quão bem faço as coisas",
  "Tenho medo de ir a escola",
  "Preocupo-me com coisas que já aconteceram",
  "Quando me assusto, fico tonto",
  "Fico nervoso(a) quando estou com outras crianças ou adultos e tenho que fazer alguma coisa com eles me olhando",
  "Fico nervoso(a) quando vou a festas, bailes ou qualquer lugar onde vai haver pessoas que não conheço",
  "Sou tímido(a)"
];

export const scaredLabels = ["Não verdadeiro", "Às vezes verdadeiro", "Verdadeiro"];

export const scaredSubscales = {
  panic: { name: "Pânico / Sintomas Somáticos", items: [0, 5, 8, 11, 14, 17, 18, 21, 23, 26, 29, 33, 37], cutoff: 7, color: "text-red-600 dark:text-red-400" },
  gad: { name: "Ansiedade Generalizada", items: [4, 6, 13, 20, 22, 27, 32, 34, 36], cutoff: 9, color: "text-amber-600 dark:text-amber-400" },
  separation: { name: "Ansiedade de Separação", items: [3, 7, 12, 15, 19, 24, 28, 30], cutoff: 5, color: "text-purple-600 dark:text-purple-400" },
  social: { name: "Fobia Social", items: [2, 9, 25, 31, 38, 39, 40], cutoff: 8, color: "text-blue-600 dark:text-blue-400" },
  school: { name: "Evitação Escolar", items: [1, 10, 16, 35], cutoff: 3, color: "text-teal-600 dark:text-teal-400" },
};

export function classifyScared(total: number, subscaleScores: Record<string, number>): {
  classification: string;
  description: string;
  color: string;
  subscaleResults: { name: string; score: number; cutoff: number; positive: boolean; color: string }[];
} {
  let classification: string;
  let description: string;
  let color: string;

  if (total < 25) {
    classification = "Sem indicativo de Transtorno de Ansiedade";
    description = "A pontuação total não sugere presença de transtorno de ansiedade clinicamente significativo. Continuar acompanhamento de rotina.";
    color = "text-emerald-600 dark:text-emerald-400";
  } else if (total < 30) {
    classification = "Possível Transtorno de Ansiedade";
    description = "A pontuação sugere possível presença de transtorno de ansiedade. Recomenda-se avaliação clínica mais detalhada.";
    color = "text-amber-600 dark:text-amber-400";
  } else {
    classification = "Provável Transtorno de Ansiedade";
    description = "Pontuação altamente sugestiva de transtorno de ansiedade. Encaminhamento para avaliação especializada fortemente recomendado.";
    color = "text-red-600 dark:text-red-400";
  }

  const subscaleResults = Object.entries(scaredSubscales).map(([key, sub]) => ({
    name: sub.name,
    score: subscaleScores[key] ?? 0,
    cutoff: sub.cutoff,
    positive: (subscaleScores[key] ?? 0) >= sub.cutoff,
    color: sub.color,
  }));

  return { classification, description, color, subscaleResults };
}

// ============================================================
// Conners Abreviada — Versão para Pais (6-18 anos)
// ============================================================
export const connersQuestions = [
  // Problemas de Conduta (I)
  "Mexe com coisas e objetos que não deve",
  "É desafiador(a), mal-criado(a), respondão(a)",
  "É destrutivo(a) com os próprios brinquedos e/ou dos outros",
  "Briga frequentemente",
  "Não é uma criança/adolescente muito querido(a) pelos colegas",
  // Problemas de Aprendizagem (II)
  "Apresenta dificuldade de aprendizagem",
  "Parece distraído(a), desligado(a), como se sonhasse acordado(a)",
  "Irritadiço(a), facilmente frustrado(a)",
  "Humor muda drástica e rapidamente",
  "Tem dificuldade para terminar tarefas que começa",
  // Problemas Psicossomáticos (III)
  "Queixa-se de dores de cabeça",
  "Queixa-se de dores de barriga/estômago",
  "Queixa-se de dores diversas (pernas, braços, etc.)",
  "Tem vômitos ou náuseas frequentes",
  "É triste ou chorão(a) sem motivo aparente",
  // Impulsividade-Hiperatividade (IV)
  "Fica inquieto(a) e se contorcendo na cadeira",
  "É excessivamente ativo(a), incapaz de ficar parado(a)",
  "Tem dificuldade de permanecer sentado(a)",
  "Necessita de supervisão constante",
  // Ansiedade (V)
  "É medroso(a), apreensivo(a), com muitas preocupações",
  "É tímido(a) demais",
  "É sensível demais às críticas",
  "Apresenta dificuldade para adormecer",
  "Tem pesadelos frequentes",
  // Hiperatividade (complementar)
  "Agita-se, não para quieto(a) um minuto",
  "Age sem pensar nas consequências",
  "Não consegue esperar sua vez",
  "Fala excessivamente",
];

export const connersLabels = ["Nunca", "Às vezes", "Frequentemente", "Sempre"];

export const connersSubscales = {
  conduct: { name: "Problemas de Conduta", items: [0, 1, 2, 3, 4], color: "text-red-600 dark:text-red-400" },
  learning: { name: "Problemas de Aprendizagem", items: [5, 6, 7, 8, 9], color: "text-orange-600 dark:text-orange-400" },
  psychosomatic: { name: "Queixas Psicossomáticas", items: [10, 11, 12, 13, 14], color: "text-blue-600 dark:text-blue-400" },
  impulsivity: { name: "Impulsividade-Hiperatividade", items: [15, 16, 17, 18], color: "text-purple-600 dark:text-purple-400" },
  anxiety: { name: "Ansiedade", items: [19, 20, 21, 22, 23], color: "text-teal-600 dark:text-teal-400" },
  hyperactivity: { name: "Índice de Hiperatividade", items: [24, 25, 26, 27], color: "text-pink-600 dark:text-pink-400" },
};

export function classifyConners(total: number, subscaleScores: Record<string, number>): {
  classification: string;
  description: string;
  color: string;
} {
  // Ponto de corte geral: T-score ≥ 62 (equivalente a ~70% do total máximo)
  const maxTotal = 28 * 3; // 84
  const percentage = (total / maxTotal) * 100;

  if (percentage < 50) {
    return {
      classification: "Dentro da Normalidade",
      description: "Os comportamentos relatados estão dentro da faixa esperada. Não há indicação de problemas significativos de comportamento, atenção ou hiperatividade.",
      color: "text-emerald-600 dark:text-emerald-400"
    };
  } else if (percentage < 70) {
    return {
      classification: "Faixa de Atenção",
      description: "Alguns comportamentos merecem atenção e acompanhamento mais próximo. Considerar avaliação complementar se os sintomas persistirem.",
      color: "text-amber-600 dark:text-amber-400"
    };
  } else {
    return {
      classification: "Clinicamente Significativo",
      description: "Pontuação elevada sugerindo necessidade de avaliação especializada. Encaminhamento para neuropsicologia ou psiquiatria infantil recomendado.",
      color: "text-red-600 dark:text-red-400"
    };
  }
}

// ============================================================
// Vineland-3 — Escala de Comportamento Adaptativo (Triagem)
// ============================================================
export const vinelandDomains = [
  {
    name: "Comunicação",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    subdomains: [
      {
        name: "Receptiva",
        items: [
          "Vira a cabeça em direção a um som ou voz",
          "Olha para quem está falando",
          "Segue instruções simples (Ex: 'Dá pra mamãe')",
          "Aponta para objeto quando nomeado",
          "Compreende frases com 2-3 palavras",
          "Segue instruções de duas etapas",
          "Compreende conceitos de tempo (antes/depois)",
        ]
      },
      {
        name: "Expressiva",
        items: [
          "Balbucia (ba-ba, da-da)",
          "Diz pelo menos 2 palavras reconhecíveis",
          "Nomeia pelo menos 10 objetos",
          "Usa frases de 2-3 palavras",
          "Conta experiências simples",
          "Usa pronomes adequadamente (eu/tu/ele)",
          "Mantém uma conversa de 2-3 turnos",
        ]
      },
      {
        name: "Escrita",
        items: [
          "Reconhece o próprio nome escrito",
          "Identifica pelo menos 10 letras",
          "Escreve o próprio nome",
          "Lê palavras simples",
          "Escreve frases curtas",
        ]
      }
    ]
  },
  {
    name: "Vida Diária",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    subdomains: [
      {
        name: "Pessoal",
        items: [
          "Alimenta-se com colher derramando pouco",
          "Bebe de copo sem ajuda",
          "Indica necessidades de ir ao banheiro",
          "Lava e seca as mãos sozinho(a)",
          "Escova os dentes com supervisão",
          "Veste-se sozinho(a) (roupas simples)",
          "Toma banho com supervisão mínima",
        ]
      },
      {
        name: "Doméstica",
        items: [
          "Ajuda a guardar brinquedos quando solicitado",
          "Limpa sujeiras simples (líquido derramado)",
          "Ajuda a preparar alimentos simples",
          "Arruma a própria cama com ajuda",
          "Guarda roupas nos locais corretos",
        ]
      },
      {
        name: "Comunidade",
        items: [
          "Reconhece sinais de trânsito básicos",
          "Olha para os dois lados antes de atravessar",
          "Sabe o próprio endereço ou telefone",
          "Reconhece valor das moedas/notas",
          "Usa telefone para ligar para pessoas conhecidas",
        ]
      }
    ]
  },
  {
    name: "Socialização",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    subdomains: [
      {
        name: "Relações Interpessoais",
        items: [
          "Sorri em resposta a outra pessoa",
          "Demonstra preferência por pessoas conhecidas",
          "Imita ações simples de adultos/crianças",
          "Compartilha brinquedos com outra criança",
          "Demonstra empatia quando alguém está triste",
          "Faz amizade com crianças da mesma idade",
          "Brinca cooperativamente em grupo",
        ]
      },
      {
        name: "Brincar e Lazer",
        items: [
          "Brinca com brinquedos de forma funcional",
          "Participa de jogos de faz de conta",
          "Segue regras de jogos simples",
          "Espera sua vez em atividades",
          "Escolhe atividades de lazer preferidas",
        ]
      },
      {
        name: "Habilidades de Enfrentamento",
        items: [
          "Expressa sentimentos com palavras",
          "Pede desculpas quando erra",
          "Controla birras sem ajuda do adulto",
          "Aceita mudanças na rotina sem grande estresse",
          "Resolve conflitos com colegas conversando",
        ]
      }
    ]
  },
  {
    name: "Motricidade",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    subdomains: [
      {
        name: "Motricidade Grossa",
        items: [
          "Senta-se sem apoio",
          "Anda sozinho(a)",
          "Sobe escadas alternando os pés",
          "Corre com boa coordenação",
          "Pula com os dois pés",
          "Pedala triciclo/bicicleta com rodinhas",
          "Pega bola arremessada",
        ]
      },
      {
        name: "Motricidade Fina",
        items: [
          "Pega objetos pequenos com pinça (polegar + indicador)",
          "Empilha 4+ blocos",
          "Usa tesoura para cortar papel",
          "Copia formas simples (círculo, quadrado)",
          "Escreve letras legíveis",
          "Abotoa botões grandes",
        ]
      }
    ]
  }
];

export const vinelandScoreLabels = [
  "Nunca realiza",
  "Às vezes realiza (parcial)",
  "Geralmente realiza (frequente)",
  "Sempre realiza (habitual)"
];

export function classifyVineland(domainScores: Record<string, { score: number; maxScore: number }>): {
  overallClassification: string;
  description: string;
  color: string;
  domainResults: { name: string; percentage: number; classification: string; color: string }[];
} {
  const domainResults = Object.entries(domainScores).map(([name, { score, maxScore }]) => {
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    let classification: string;
    let color: string;

    if (percentage >= 75) {
      classification = "Adequado";
      color = "text-emerald-600 dark:text-emerald-400";
    } else if (percentage >= 50) {
      classification = "Moderadamente Baixo";
      color = "text-amber-600 dark:text-amber-400";
    } else if (percentage >= 25) {
      classification = "Baixo";
      color = "text-orange-600 dark:text-orange-400";
    } else {
      classification = "Significativamente Baixo";
      color = "text-red-600 dark:text-red-400";
    }

    return { name, percentage, classification, color };
  });

  const avgPercentage = domainResults.reduce((sum, d) => sum + d.percentage, 0) / domainResults.length;

  let overallClassification: string;
  let description: string;
  let color: string;

  if (avgPercentage >= 75) {
    overallClassification = "Comportamento Adaptativo Adequado";
    description = "O desempenho adaptativo geral está dentro da faixa esperada para a idade. Continuar estimulação e acompanhamento habitual.";
    color = "text-emerald-600 dark:text-emerald-400";
  } else if (avgPercentage >= 50) {
    overallClassification = "Comportamento Adaptativo Moderadamente Baixo";
    description = "Algumas áreas do comportamento adaptativo merecem atenção. Considerar estimulação dirigida e reavaliação em 6 meses.";
    color = "text-amber-600 dark:text-amber-400";
  } else if (avgPercentage >= 25) {
    overallClassification = "Comportamento Adaptativo Baixo";
    description = "Déficit significativo em comportamento adaptativo. Encaminhamento para avaliação multidisciplinar e intervenção recomendados.";
    color = "text-orange-600 dark:text-orange-400";
  } else {
    overallClassification = "Comportamento Adaptativo Significativamente Baixo";
    description = "Comprometimento grave do comportamento adaptativo. Necessita intervenção especializada urgente e suporte multidisciplinar intensivo.";
    color = "text-red-600 dark:text-red-400";
  }

  return { overallClassification, description, color, domainResults };
}
