// Sistema de Recomendação Inteligente de Testes para Pais
// Complementar aos testes diretos com a criança
// Baseado em queixa clínica + faixa etária

export interface ParentTestRecommendation {
  id: string;
  name: string;
  route: string;
  queixas: string[];
  ageMin: number; // meses
  ageMax: number; // meses
  tempo: string;
  seal: "ouro" | "prata" | "bronze"; // gold, silver, bronze
  razao: string;
  icon: string;
  complementa: string; // qual teste direto complementa
}

// SWYC Marcos (livre, Tufts): um formulário por janela de idade, aplicado pelos pais.
const SWYC_MARCOS_PAIS: ParentTestRecommendation[] = ([
  ["24m", 23, 28], ["30m", 29, 34], ["36m", 35, 46], ["48m", 47, 58], ["60m", 59, 65],
] as const).map(([form, ageMin, ageMax]): ParentTestRecommendation => ({
  id: `swyc-marcos-${form}`,
  name: `SWYC Marcos ${form}`,
  route: `/generic-scale/swyc-marcos-${form}`,
  queixas: ["atraso", "linguagem", "motor", "cognicao"],
  ageMin,
  ageMax,
  tempo: "3–5 min",
  seal: "ouro",
  razao: "Atraso do desenvolvimento ou da linguagem: marcos de linguagem, cognição e motricidade do formulário da idade, de uso livre (SWYC). Ajuda a separar atraso específico de linguagem de atraso global.",
  icon: "Baby",
  complementa: "Linguagem e Fonologia",
}));

// Testes para pais — recomendações clínicas
// OURO = Escalas essenciais/clássicas bem-validadas
// PRATA = Questionários complementares para aspectos específicos
// BRONZE = Avaliações opcionais para enriquecer diagnóstico
export const testesPaisRecommendations: ParentTestRecommendation[] = [
  // ===== TDAH: Comportamento e Sintomas =====
  {
    id: "snap-iv",
    name: "SNAP-IV",
    route: "/snap",
    queixas: ["tdah", "comportamento", "aprendizagem"],
    ageMin: 36,
    ageMax: 168,
    tempo: "5–8 min",
    seal: "ouro",
    razao: "TDAH: Escala clássica de sintomas (desatenção/impulsividade/hiperatividade). Essencial para confirmação parental de TDAH. Complementa testes diretos de atenção.",
    icon: "Activity",
    complementa: "Atenção e Concentração",
  },
  {
    id: "na-atencao-atividade-pais",
    name: "Atenção, atividade e autocontrole (autoral)",
    route: "/generic-scale/na-atencao-atividade-pais",
    queixas: ["tdah", "comportamento", "aprendizagem"],
    ageMin: 72,
    ageMax: 216,
    tempo: "5–7 min",
    seal: "bronze",
    razao: "TDAH/Comportamento: desatenção, agitação, impulsividade e organização em casa, com o impacto em cada área separado. Forma paralela para o professor. Autoral NeuroPed, sem validação: complementa o SNAP-IV.",
    icon: "BarChart3",
    complementa: "Funções Executivas",
  },

  // ===== LINGUAGEM: Desenvolvimento e Preocupações =====
  // Marcos do desenvolvimento: formulário SWYC da idade (livre, Tufts), que substituiu ASQ-3 e Denver II.
  ...SWYC_MARCOS_PAIS,
  {
    id: "na-comportamentos-repetitivos-pais",
    name: "Comportamentos repetitivos (autoral)",
    route: "/generic-scale/na-comportamentos-repetitivos-pais",
    queixas: ["linguagem", "atraso", "comportamento"],
    ageMin: 24,
    ageMax: 216,
    tempo: "4–6 min",
    seal: "bronze",
    razao: "Suspeita de autismo: a família descreve movimentos repetitivos, rigidez e interesses intensos. Autoral NeuroPed, sem validação; a observação na consulta usa o roteiro clínico próprio.",
    icon: "Puzzle",
    complementa: "Linguagem e Fonologia",
  },

  // ===== APRENDIZAGEM: Dificuldades Acadêmicas =====
  {
    id: "na-perfil-emocional-comportamental-pais",
    name: "Perfil emocional e comportamental (autoral)",
    route: "/generic-scale/na-perfil-emocional-comportamental-pais",
    queixas: ["aprendizagem", "comportamento", "emocional"],
    ageMin: 72,
    ageMax: 216,
    tempo: "6–8 min",
    seal: "bronze",
    razao: "Dificuldades de aprendizagem/comportamento: panorama de emoções, comportamento, atenção e relações em casa, com forma paralela para o professor. Autoral NeuroPed, sem validação.",
    icon: "ListChecks",
    complementa: "Acadêmico Interativo",
  },
  {
    id: "na-funcoes-executivas-ampliado-pais",
    name: "Funções executivas — versão ampliada (autoral)",
    route: "/generic-scale/na-funcoes-executivas-ampliado-pais",
    queixas: ["aprendizagem", "tdah", "cognicao"],
    ageMin: 60,
    ageMax: 216,
    tempo: "6–8 min",
    seal: "bronze",
    razao: "Funções executivas em casa: iniciar, planejar, lembrar, controlar impulsos, flexibilidade, regulação emocional e revisão do próprio trabalho. Forma paralela para o professor. Autoral NeuroPed, sem validação.",
    icon: "BrainCog",
    complementa: "Funções Executivas",
  },

  // ===== MOTOR: Marcos e Preocupações =====
  {
    id: "gmfcs",
    name: "GMFCS",
    route: "/gmfcs",
    queixas: ["motor", "atraso", "cognicao"],
    ageMin: 24,
    ageMax: 180,
    tempo: "5–8 min",
    seal: "ouro",
    razao: "Paralisia cerebral/atraso motor: Classificação de capacidade funcional motora grossa. Essencial se suspeita de PC ou atraso motor global. Complementa teste de Motricidade.",
    icon: "Accessibility",
    complementa: "Motricidade",
  },
  {
    id: "na-comportamento-adaptativo-pais",
    name: "Comportamento adaptativo (autoral)",
    route: "/generic-scale/na-comportamento-adaptativo-pais",
    queixas: ["motor", "atraso", "cognicao"],
    ageMin: 36,
    ageMax: 168,
    tempo: "5–8 min",
    seal: "bronze",
    razao: "Atraso global/deficiência intelectual: habilidades da vida diária, comunicação e socialização no relato dos pais. Autoral NeuroPed, sem validação; complementa a bateria motora com a autonomia funcional.",
    icon: "Users",
    complementa: "Motricidade + Conhecimentos Gerais",
  },

  // ===== ATRASO: sono como fator =====
  {
    id: "na-sono-crianca-pais",
    name: "Sono da criança (autoral)",
    route: "/generic-scale/na-sono-crianca-pais",
    queixas: ["atraso", "comportamento", "cognicao"],
    ageMin: 48,
    ageMax: 144,
    tempo: "4–6 min",
    seal: "bronze",
    razao: "Qualidade do sono: problemas de sono pioram comportamento, atenção e aprendizagem. Descreve início, despertares, respiração e sonolência diurna. Autoral NeuroPed, sem validação.",
    icon: "Moon",
    complementa: "Conhecimentos Gerais",
  },

  // ===== COGNIÇÃO: Funcionamento Intelectual =====
  {
    id: "na-sinais-precoces-tea-pais",
    name: "Sinais precoces do espectro autista (autoral)",
    route: "/generic-scale/na-sinais-precoces-tea-pais",
    queixas: ["cognicao", "atraso", "linguagem"],
    ageMin: 16,
    ageMax: 36,
    tempo: "5–7 min",
    seal: "bronze",
    razao: "Suspeita de autismo antes dos 3 anos: sinais de alerta em seis áreas, incluindo perda de habilidades. Ajuda a diferenciar autismo de atraso cognitivo. Autoral NeuroPed, sem validação.",
    icon: "Baby",
    complementa: "Conhecimento Visual",
  },
  {
    id: "aq10",
    name: "AQ-10",
    route: "/aq10",
    queixas: ["cognicao", "comportamento", "aprendizagem"],
    ageMin: 72,
    ageMax: 180,
    tempo: "5–8 min",
    seal: "prata",
    razao: "TEA em > 6 anos: Rastreio de traços autísticos (padrões restritos, dificuldades sociais). Complementa avaliação cognitiva investigando fenótipo autístico.",
    icon: "Puzzle",
    complementa: "Conhecimento Visual",
  },

  // ===== EMOCIONAL: Ansiedade e Humor =====
  {
    id: "na-ansiedade-seguimento-pais",
    name: "Seguimento de ansiedade (autoral)",
    route: "/generic-scale/na-ansiedade-seguimento-pais",
    queixas: ["emocional", "comportamento", "aprendizagem"],
    ageMin: 48,
    ageMax: 168,
    tempo: "4–6 min",
    seal: "bronze",
    razao: "Ansiedade: muitas vezes se mascara como desatenção ou agitação. Os pais descrevem medos, preocupações e evitação; a partir dos 8 anos a própria criança responde a forma de autorrelato. Autoral NeuroPed, sem validação.",
    icon: "ShieldAlert",
    complementa: "Atenção e Concentração",
  },
  {
    id: "phqa",
    name: "PHQ-A",
    route: "/phqa",
    queixas: ["emocional", "comportamento", "aprendizagem"],
    ageMin: 48,
    ageMax: 180,
    tempo: "5–8 min",
    seal: "prata",
    razao: "Depressão: Rastreio de sintomas depressivos (humor, interesse, energia, culpa). Diferencia depressão de TDAH (ambos causam falta de concentração).",
    icon: "HeartPulse",
    complementa: "Atenção e Concentração",
  },

  // ===== RISCO/PROTEÇÃO: Comportamento e Bem-estar =====
  {
    id: "swyc-ppsc",
    name: "SWYC PPSC (pré-escolar)",
    route: "/generic-scale/swyc-ppsc",
    queixas: ["comportamento", "emocional", "aprendizagem"],
    ageMin: 36,
    ageMax: 65,
    tempo: "3–5 min",
    seal: "prata",
    razao: "Bem-estar no pré-escolar: rastreio breve de problemas emocionais e de comportamento, de uso livre (SWYC). Útil como triagem ampla antes de especificar o diagnóstico; a partir dos 6 anos, use o Perfil emocional e comportamental.",
    icon: "BarChart3",
    complementa: "Funções Executivas",
  },
  {
    id: "cssrs",
    name: "C-SSRS",
    route: "/cssrs",
    queixas: ["emocional", "comportamento"],
    ageMin: 48,
    ageMax: 180,
    tempo: "10–15 min",
    seal: "bronze",
    razao: "Risco de suicídio: Obrigatório se há ideação, agressividade grave ou automutilação. Complementa avaliação emocional com investigação de risco.",
    icon: "ShieldAlert",
    complementa: "Funções Executivas",
  },
];

// Algoritmo de recomendação inteligente por queixa + idade
export function recommendParentTests(
  selectedQueixas: string[],
  ageMonths: number | null
): ParentTestRecommendation[] {
  if (!selectedQueixas.length || ageMonths === null) return [];

  const candidates = testesPaisRecommendations.filter((test) => {
    // Queixa deve corresponder
    const matchesQueixa = test.queixas.some((q) => selectedQueixas.includes(q));
    // Idade deve estar no range
    const matchesAge = ageMonths >= test.ageMin && ageMonths <= test.ageMax;
    return matchesQueixa && matchesAge;
  });

  // Ordena por prioridade (ouro > prata > bronze)
  const sealOrder = { ouro: 0, prata: 1, bronze: 2 };
  return candidates.sort((a, b) => {
    const sealDiff = sealOrder[a.seal] - sealOrder[b.seal];
    if (sealDiff !== 0) return sealDiff;
    // Dentro do mesmo selo, primeira correspondência de queixa
    const aQueixaMatch = a.queixas.filter((q) => selectedQueixas.includes(q)).length;
    const bQueixaMatch = b.queixas.filter((q) => selectedQueixas.includes(q)).length;
    return bQueixaMatch - aQueixaMatch;
  });
}

// Recomendações curatoriais por queixa
export interface ParentAssessmentPath {
  queixa: string;
  label: string;
  primaryTests: string[];
  duration: string;
  description: string;
}

export const parentAssessmentPaths: ParentAssessmentPath[] = [
  {
    queixa: "tdah",
    label: "Investigação de TDAH (Pais)",
    primaryTests: ["snap-iv", "na-atencao-atividade-pais"],
    duration: "15–25 min",
    description:
      "Protocolo parental: SNAP-IV (sintomas essenciais) + Atenção, atividade e autocontrole (autoral; impacto por contexto, com forma do professor). Essencial antes de decidir medicação.",
  },
  {
    queixa: "linguagem",
    label: "Investigação de Linguagem (Pais)",
    primaryTests: ["swyc-marcos-24m", "swyc-marcos-30m", "swyc-marcos-36m", "swyc-marcos-48m", "swyc-marcos-60m", "na-comportamentos-repetitivos-pais"],
    duration: "10–15 min",
    description:
      "Protocolo parental: SWYC Marcos do formulário da idade (livre; marco geral) + Comportamentos repetitivos (autoral; rigidez e interesses intensos). Se < 6 anos, imprescindível para diferenciar atraso específico vs. global.",
  },
  {
    queixa: "aprendizagem",
    label: "Investigação de Aprendizagem (Pais)",
    primaryTests: ["na-perfil-emocional-comportamental-pais", "na-funcoes-executivas-ampliado-pais"],
    duration: "20–30 min",
    description:
      "Protocolo parental: Perfil emocional e comportamental + Funções executivas — versão ampliada (autorais, com formas do professor). Complementa testes acadêmicos diretos.",
  },
  {
    queixa: "motor",
    label: "Investigação de Motricidade (Pais)",
    primaryTests: ["gmfcs", "na-comportamento-adaptativo-pais"],
    duration: "10–20 min",
    description:
      "Protocolo parental: GMFCS (classificação motora) + Comportamento adaptativo (autoral; autonomia no dia a dia). Se PC suspeita, essencial para caracterizar impacto funcional.",
  },
  {
    queixa: "atraso",
    label: "Investigação de Atraso (Pais)",
    primaryTests: ["swyc-marcos-24m", "swyc-marcos-30m", "swyc-marcos-36m", "swyc-marcos-48m", "swyc-marcos-60m", "na-sono-crianca-pais"],
    duration: "10–15 min",
    description:
      "Protocolo parental: SWYC Marcos do formulário da idade (livre; linguagem, cognição e motricidade) + Sono da criança (autoral; sono como fator). Triagem abrangente para atraso global em < 5 anos.",
  },
  {
    queixa: "cognicao",
    label: "Investigação de Cognição (Pais)",
    primaryTests: ["na-sinais-precoces-tea-pais", "aq10"],
    duration: "10–15 min",
    description:
      "Protocolo parental: Sinais precoces do espectro autista (autoral, < 3 anos) ou AQ-10 (> 6 anos) para investigar o fenótipo autístico. Complementa a avaliação cognitiva.",
  },
  {
    queixa: "emocional",
    label: "Investigação Emocional (Pais)",
    primaryTests: ["na-ansiedade-seguimento-pais", "phqa"],
    duration: "10–15 min",
    description:
      "Protocolo parental: Seguimento de ansiedade (autoral) + PHQ-A (depressão). Diferencia transtornos emocionais que se mascaram como TDAH.",
  },
  {
    queixa: "comportamento",
    label: "Investigação de Comportamento (Pais)",
    primaryTests: ["swyc-ppsc", "na-perfil-emocional-comportamental-pais", "na-atencao-atividade-pais"],
    duration: "15–25 min",
    description:
      "Protocolo parental: SWYC PPSC (livre, pré-escolar) ou Perfil emocional e comportamental (autoral, a partir de 6 anos) para o rastreio amplo + Atenção, atividade e autocontrole (autoral; detalha agitação, impulsividade e impacto). Complementa avaliação de funções executivas com contexto de vida real.",
  },
];

export function getParentAssessmentPath(queixa: string): ParentAssessmentPath | undefined {
  return parentAssessmentPaths.find((p) => p.queixa === queixa);
}
