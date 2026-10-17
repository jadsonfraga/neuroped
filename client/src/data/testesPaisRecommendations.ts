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
    id: "vineland",
    name: "Vineland-3",
    route: "/generic-scale/vineland",
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
    primaryTests: ["snap-iv", "na-atencao-atividade-pais"],
    duration: "15–25 min",
    description:
      "Protocolo parental: SNAP-IV (sintomas essenciais) + Atenção, atividade e autocontrole (autoral; impacto por contexto, com forma do professor). Essencial antes de decidir medicação.",
  },
  {
    queixa: "linguagem",
    label: "Investigação de Linguagem (Pais)",
    primaryTests: ["asq3", "na-comportamentos-repetitivos-pais"],
    duration: "20–30 min",
    description:
      "Protocolo parental: ASQ-3 (marco geral) + Comportamentos repetitivos (autoral; rigidez e interesses intensos). Se < 6 anos, imprescindível para diferenciar atraso específico vs. global.",
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
    primaryTests: ["sdq", "na-atencao-atividade-pais"],
    duration: "15–25 min",
    description:
      "Protocolo parental: SDQ (rastreio amplo) + Atenção, atividade e autocontrole (autoral; detalha agitação, impulsividade e impacto). Complementa avaliação de funções executivas com contexto de vida real.",
  },
];

export function getParentAssessmentPath(queixa: string): ParentAssessmentPath | undefined {
  return parentAssessmentPaths.find((p) => p.queixa === queixa);
}
