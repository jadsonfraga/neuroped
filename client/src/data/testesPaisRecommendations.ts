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
    id: "conners",
    name: "Conners",
    route: "/conners",
    queixas: ["tdah", "comportamento", "aprendizagem"],
    ageMin: 36,
    ageMax: 168,
    tempo: "10–15 min",
    seal: "prata",
    razao: "TDAH/Comportamento: Avalia atenção, hiperatividade, agressividade. Complementa Funções Executivas em contexto de vida real (casa).",
    icon: "BarChart3",
    complementa: "Funções Executivas",
  },

  // ===== LINGUAGEM: Desenvolvimento e Preocupações =====
  {
    id: "asq3",
    name: "ASQ-3",
    route: "/asq3",
    queixas: ["linguagem", "atraso", "cognicao"],
    ageMin: 36,
    ageMax: 72,
    tempo: "10–15 min",
    seal: "ouro",
    razao: "Atraso de linguagem/desenvolvim: Rastreio de marco de desenvolvimento global. Essencial em < 6 anos para diferenciar atraso específico de linguagem vs. atraso global. Complementa Linguagem e Fonologia.",
    icon: "Baby",
    complementa: "Linguagem e Fonologia",
  },
  {
    id: "cars2",
    name: "CARS-2",
    route: "/cars",
    queixas: ["linguagem", "atraso", "comportamento"],
    ageMin: 24,
    ageMax: 96,
    tempo: "15–20 min",
    seal: "prata",
    razao: "Suspeita de autismo: Complementa avaliação de linguagem com atenção para padrões comunicativos autísticos (pragmática, ecolalia, atrasos). Validado para suspeita de TEA.",
    icon: "Puzzle",
    complementa: "Linguagem e Fonologia",
  },

  // ===== APRENDIZAGEM: Dificuldades Acadêmicas =====
  {
    id: "cbcl",
    name: "CBCL",
    route: "/cbcl",
    queixas: ["aprendizagem", "comportamento", "emocional"],
    ageMin: 36,
    ageMax: 180,
    tempo: "10–15 min",
    seal: "ouro",
    razao: "Dificuldades de aprendizagem/comportamento: Rastreio abrangente de problemas de internalização/externalização que afetam aprendizagem. Complementa Acadêmico Interativo com contexto familiar.",
    icon: "ListChecks",
    complementa: "Acadêmico Interativo",
  },
  {
    id: "brief2",
    name: "BRIEF-2",
    route: "/brief2",
    queixas: ["aprendizagem", "tdah", "cognicao"],
    ageMin: 36,
    ageMax: 168,
    tempo: "10–15 min",
    seal: "prata",
    razao: "Funções executivas em casa: Avalia planejamento, organização, inibição no contexto de vida real. Complementa Funções Executivas diretas com informações de desempenho prático.",
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
    id: "vineland",
    name: "Vineland-3",
    route: "/vineland",
    queixas: ["motor", "atraso", "cognicao"],
    ageMin: 24,
    ageMax: 168,
    tempo: "20–30 min",
    seal: "prata",
    razao: "Atraso global/deficiência intelectual: Avalia comportamento adaptativo (comunicação, vida diária, socialização). Complementa bateria motora com avaliação de autonomia funcional.",
    icon: "Users",
    complementa: "Motricidade + Conhecimentos Gerais",
  },

  // ===== ATRASO: Marcos de Desenvolvimento Global =====
  {
    id: "denver2",
    name: "Denver II",
    route: "/denver",
    queixas: ["atraso", "motor", "linguagem"],
    ageMin: 24,
    ageMax: 120,
    tempo: "15–20 min",
    seal: "ouro",
    razao: "Atraso do desenvolvimento: Rastreio de marcos em 4 domínios (motor grosso, motor fino, linguagem, socioemocional). Imprescindível em < 5 anos com suspeita de atraso global.",
    icon: "BookOpen",
    complementa: "Motricidade + Linguagem",
  },
  {
    id: "cshq",
    name: "CSHQ",
    route: "/cshq",
    queixas: ["atraso", "comportamento", "cognicao"],
    ageMin: 48,
    ageMax: 144,
    tempo: "10–15 min",
    seal: "prata",
    razao: "Qualidade do sono: Problemas de sono frequentemente causam atraso comportamental e cognitivo. Complementa avaliação de atraso global investigando causa ambiental.",
    icon: "Moon",
    complementa: "Conhecimentos Gerais",
  },

  // ===== COGNIÇÃO: Funcionamento Intelectual =====
  {
    id: "mchat",
    name: "M-CHAT-R/F",
    route: "/mchat",
    queixas: ["cognicao", "atraso", "linguagem"],
    ageMin: 18,
    ageMax: 48,
    tempo: "5–8 min",
    seal: "ouro",
    razao: "Suspeita de autismo < 3 anos: Rastreio de TEA em primeira infância. Se positivo, diferencia autismo de atraso cognitivo puro. Complementa Conhecimento Visual.",
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
    id: "scared",
    name: "SCARED",
    route: "/scared",
    queixas: ["emocional", "comportamento", "aprendizagem"],
    ageMin: 48,
    ageMax: 180,
    tempo: "5–8 min",
    seal: "ouro",
    razao: "Ansiedade: Rastreio de transtornos de ansiedade em crianças. Frequentemente mascarado como desatenção ou hiperatividade. Essencial se irritabilidade ou evitação presentes.",
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
    id: "sdq",
    name: "SDQ",
    route: "/sdq",
    queixas: ["comportamento", "emocional", "aprendizagem"],
    ageMin: 36,
    ageMax: 180,
    tempo: "5–8 min",
    seal: "prata",
    razao: "Bem-estar geral: Rastreio de problemas emocionais, comportamentais, de hiperatividade, relacionais e prosociais. Útil como triagem ampla antes de especificar diagnóstico.",
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
    primaryTests: ["snap-iv", "conners"],
    duration: "15–25 min",
    description:
      "Protocolo parental: SNAP-IV (sintomas essenciais) + Conners (comportamento em contexto). Essencial para confirmação de TDAH antes de medicação.",
  },
  {
    queixa: "linguagem",
    label: "Investigação de Linguagem (Pais)",
    primaryTests: ["asq3", "cars2"],
    duration: "20–30 min",
    description:
      "Protocolo parental: ASQ-3 (marco geral) + CARS-2 (padrões autísticos). Se < 6 anos, imprescindível para diferenciar atraso específico vs. global.",
  },
  {
    queixa: "aprendizagem",
    label: "Investigação de Aprendizagem (Pais)",
    primaryTests: ["cbcl", "brief2"],
    duration: "20–30 min",
    description:
      "Protocolo parental: CBCL (problemas comportamentais/emocionais) + BRIEF-2 (funções executivas em casa). Complementa testes académicos diretos.",
  },
  {
    queixa: "motor",
    label: "Investigação de Motricidade (Pais)",
    primaryTests: ["gmfcs", "vineland"],
    duration: "25–40 min",
    description:
      "Protocolo parental: GMFCS (classificação motora) + Vineland-3 (autonomia). Se PC suspeita, essencial para caracterizar impacto funcional.",
  },
  {
    queixa: "atraso",
    label: "Investigação de Atraso (Pais)",
    primaryTests: ["denver2", "cshq"],
    duration: "25–35 min",
    description:
      "Protocolo parental: Denver II (marcos dos 4 domínios) + CSHQ (sono como fator). Triagem abrangente para atraso global em < 5 anos.",
  },
  {
    queixa: "cognicao",
    label: "Investigação de Cognição (Pais)",
    primaryTests: ["mchat", "aq10"],
    duration: "10–15 min",
    description:
      "Protocolo parental: M-CHAT (< 3 anos) ou AQ-10 (> 6 anos) para rastreio de TEA. Complementa avaliação cognitiva com investigação de fenótipo autístico.",
  },
  {
    queixa: "emocional",
    label: "Investigação Emocional (Pais)",
    primaryTests: ["scared", "phqa"],
    duration: "10–15 min",
    description:
      "Protocolo parental: SCARED (ansiedade) + PHQ-A (depressão). Diferencia transtornos emocionais que mascaramse como TDAH.",
  },
  {
    queixa: "comportamento",
    label: "Investigação de Comportamento (Pais)",
    primaryTests: ["sdq", "conners"],
    duration: "15–25 min",
    description:
      "Protocolo parental: SDQ (rastreio amplo) + Conners (detalhamento de problemas). Complementa avaliação de funções executivas com contexto de vida real.",
  },
];

export function getParentAssessmentPath(queixa: string): ParentAssessmentPath | undefined {
  return parentAssessmentPaths.find((p) => p.queixa === queixa);
}
