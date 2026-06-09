// Sistema de Recomendação Inteligente de Testes Diretos
// Baseado em queixa clínica + faixa etária

export interface DirectTestRecommendation {
  id: string;
  name: string;
  route: string;
  queixas: string[]; // queixas clínicas que indicam este teste
  ageMin: number; // meses
  ageMax: number; // meses
  tempo: string;
  prioridade: "primaria" | "secundaria" | "complementar";
  razao: string;
  icon: string;
}

// Testes diretos com a criança — recomendações clínicas
export const testesDiretosRecommendations: DirectTestRecommendation[] = [
  // ===== TDAH: Atenção e Funções Executivas =====
  {
    id: "atencao-concentracao",
    name: "Atenção e Concentração",
    route: "/atencao-concentracao",
    queixas: ["tdah", "aprendizagem", "comportamento"],
    ageMin: 48,
    ageMax: 144,
    tempo: "15–25 min",
    prioridade: "primaria",
    razao: "TDAH: avalia atenção sustentada, seletiva e dividida através de tarefas interativas. Essencial para diferenciar desatenção de impulsividade.",
    icon: "Eye",
  },
  {
    id: "funcoes-executivas",
    name: "Funções Executivas",
    route: "/funcoes-executivas",
    queixas: ["tdah", "cognicao", "comportamento"],
    ageMin: 48,
    ageMax: 144,
    tempo: "20–30 min",
    prioridade: "primaria",
    razao: "TDAH + cognição: avalia planejamento, inibição de impulso, memória de trabalho e flexibilidade. Diferencia funções executivas de atenção pura.",
    icon: "Brain",
  },

  // ===== LINGUAGEM: Consciência Fonológica e Linguagem =====
  {
    id: "linguagem-fonologia",
    name: "Linguagem e Fonologia",
    route: "/linguagem-fonologia",
    queixas: ["linguagem", "aprendizagem", "atraso"],
    ageMin: 36,
    ageMax: 120,
    tempo: "15–20 min",
    prioridade: "primaria",
    razao: "Atraso de linguagem / dificuldades de leitura: avalia consciência fonológica, vocabulário, compreensão narrativa e expressão. Preditor precoce de dislexia.",
    icon: "MessageCircle",
  },

  // ===== APRENDIZAGEM: Habilidades Acadêmicas =====
  {
    id: "academico-interativo",
    name: "Acadêmico Interativo",
    route: "/academico-interativo",
    queixas: ["aprendizagem", "tdah", "cognicao"],
    ageMin: 72,
    ageMax: 168,
    tempo: "15–20 min",
    prioridade: "primaria",
    razao: "Dificuldades de aprendizagem: avalia cálculo matemático, resolução de problemas e sequências lógicas. Diferencia discalculia de dislexia.",
    icon: "Calculator",
  },

  // ===== MOTOR: Coordenação e Desenvolvimento Motor =====
  {
    id: "motricidade-teste",
    name: "Motricidade",
    route: "/motricidade-teste",
    queixas: ["motor", "atraso", "cognicao"],
    ageMin: 24,
    ageMax: 108,
    tempo: "15–20 min",
    prioridade: "primaria",
    razao: "Atraso motor / paralisia cerebral: avalia motricidade grossa (equilíbrio, locomoção) e fina (destreza, preensão). Essencial para PC e transtornos do movimento.",
    icon: "Move",
  },

  // ===== PERCEPÇÃO VISUAL: Discriminação Visual =====
  {
    id: "conhecimento-visual",
    name: "Conhecimento Visual",
    route: "/conhecimento-visual",
    queixas: ["cognicao", "atraso", "aprendizagem"],
    ageMin: 48,
    ageMax: 132,
    tempo: "10–15 min",
    prioridade: "secundaria",
    razao: "Atraso cognitivo / problemas perceptuais: avalia discriminação visual, figura-fundo, simetria e sequências. Útil em suspeita de TEA ou atraso cognitivo.",
    icon: "Eye",
  },

  // ===== ESCRITA E DESENHO: Coordenação Motora Fina =====
  {
    id: "escrita-desenho",
    name: "Escrita e Desenho",
    route: "/escrita-desenho",
    queixas: ["aprendizagem", "motor", "atraso"],
    ageMin: 36,
    ageMax: 132,
    tempo: "15–25 min",
    prioridade: "secundaria",
    razao: "Dificuldades de escrita / atraso motor fino: avalia coordenação motora fina através de desenho interativo, cópia e escrita. Detecta disgrafia.",
    icon: "PenTool",
  },

  // ===== CONHECIMENTOS GERAIS: Cognição Global =====
  {
    id: "conhecimentos-gerais",
    name: "Conhecimentos Gerais",
    route: "/conhecimentos-gerais",
    queixas: ["cognicao", "atraso", "aprendizagem"],
    ageMin: 60,
    ageMax: 144,
    tempo: "10–15 min",
    prioridade: "complementar",
    razao: "Avaliação geral de cognição: avalia conhecimento factual, raciocínio lógico e consciência cultural. Útil como triagem rápida de função cognitiva.",
    icon: "Lightbulb",
  },
<<<<<<< HEAD
=======

  // ===== MEMÓRIA: Processos de Memória =====
  {
    id: "memoria-teste",
    name: "Memória",
    route: "/memoria-teste",
    queixas: ["aprendizagem", "atraso", "cognicao", "tdah"],
    ageMin: 36,
    ageMax: 144,
    tempo: "20–30 min",
    prioridade: "primaria",
    razao: "Dificuldades de aprendizagem / atraso: avalia memória de curto prazo, memória de trabalho, memória episódica e curva de aprendizagem. Essencial para diferenciar TDAH (memória normal com atenção prejudicada) de déficit cognitivo (memória prejudicada).",
    icon: "Brain",
  },

  // ===== PROCESSAMENTO AUDIOVISUAL: Integração Multissensorial =====
  {
    id: "processamento-visuoauditivo",
    name: "Processamento Visual-Auditivo",
    route: "/processamento-visuoauditivo",
    queixas: ["linguagem", "aprendizagem", "cognicao"],
    ageMin: 48,
    ageMax: 144,
    tempo: "20–30 min",
    prioridade: "secundaria",
    razao: "Atraso de linguagem / dificuldades sensoriais: avalia processamento auditivo puro, discriminação visual e integração audiovisual multissensorial. Importante para identificar déficit de processamento auditivo central (APD) e problemas de integração sensorial.",
    icon: "Eye",
  },
>>>>>>> claude/audite-bd8dye
];

// Algoritmo de recomendação inteligente por queixa + idade
export function recommendDirectTests(
  selectedQueixas: string[],
  ageMonths: number | null
): DirectTestRecommendation[] {
  if (!selectedQueixas.length || ageMonths === null) return [];

  const candidates = testesDiretosRecommendations.filter((test) => {
    // Queixa deve corresponder
    const matchesQueixa = test.queixas.some((q) => selectedQueixas.includes(q));
    // Idade deve estar no range
    const matchesAge = ageMonths >= test.ageMin && ageMonths <= test.ageMax;
    return matchesQueixa && matchesAge;
  });

  // Ordena por prioridade (primaria > secundaria > complementar)
  const priorityOrder = { primaria: 0, secundaria: 1, complementar: 2 };
  return candidates.sort((a, b) => {
    const priorityDiff = priorityOrder[a.prioridade] - priorityOrder[b.prioridade];
    if (priorityDiff !== 0) return priorityDiff;
    // Dentro da mesma prioridade, primeira correspondência de queixa
    const aQueixaMatch = a.queixas.filter((q) => selectedQueixas.includes(q)).length;
    const bQueixaMatch = b.queixas.filter((q) => selectedQueixas.includes(q)).length;
    return bQueixaMatch - aQueixaMatch;
  });
}

// Detecta o "caminho clínico" mais apropriado por queixa
export interface ClinicalPath {
  queixa: string;
  label: string;
  primaryTests: string[]; // IDs dos testes que devem ser feitos primeiro
  duration: string;
  description: string;
}

export const clinicalPaths: ClinicalPath[] = [
  {
    queixa: "tdah",
    label: "Investigação de TDAH",
    primaryTests: ["atencao-concentracao", "funcoes-executivas"],
    duration: "35–55 min",
    description:
      "Protocolo: Atenção (sustentada/seletiva/dividida) + Funções Executivas (planejamento/inibição/flexibilidade). Complementado com SNAP/Conners para pais/escola.",
  },
  {
    queixa: "linguagem",
    label: "Investigação de Linguagem",
<<<<<<< HEAD
    primaryTests: ["linguagem-fonologia"],
    duration: "15–20 min",
    description:
      "Protocolo: Fonologia + Vocabulário + Compreensão. Se atraso confirmado, complementar com CELF-5 ou avaliação fonoaudiológica formal.",
=======
    primaryTests: ["linguagem-fonologia", "processamento-visuoauditivo"],
    duration: "35–50 min",
    description:
      "Protocolo: Fonologia + Vocabulário + Compreensão + Processamento Audiovisual. Se atraso confirmado, complementar com CELF-5 ou avaliação fonoaudiológica formal.",
>>>>>>> claude/audite-bd8dye
  },
  {
    queixa: "aprendizagem",
    label: "Investigação de Aprendizagem",
<<<<<<< HEAD
    primaryTests: ["academico-interativo", "linguagem-fonologia", "escrita-desenho"],
    duration: "40–60 min",
    description:
      "Protocolo: Habilidades acadêmicas (cálculo/problema/sequência) + Linguagem + Escrita/Desenho. Diferencia dislexia, disgrafia e discalculia.",
=======
    primaryTests: ["academico-interativo", "linguagem-fonologia", "memoria-teste", "escrita-desenho"],
    duration: "55–85 min",
    description:
      "Protocolo: Habilidades acadêmicas (cálculo/problema/sequência) + Linguagem + Memória + Escrita/Desenho. Diferencia dislexia, disgrafia, discalculia e déficit de memória.",
>>>>>>> claude/audite-bd8dye
  },
  {
    queixa: "motor",
    label: "Investigação de Motricidade",
    primaryTests: ["motricidade-teste"],
    duration: "15–20 min",
    description:
      "Protocolo: Motricidade grossa (equilíbrio/locomoção) + Motricidade fina (destreza/preensão). Complementado com Ashworth (espasticidade) se PC suspeita.",
  },
  {
    queixa: "atraso",
    label: "Investigação de Atraso do Desenvolvimento",
<<<<<<< HEAD
    primaryTests: ["motricidade-teste", "linguagem-fonologia", "conhecimento-visual"],
    duration: "50–75 min",
    description:
      "Protocolo: Motor (marco esperado) + Linguagem (marcos comunicativos) + Cognição (discriminação/sequência). Triagem abrangente para atraso global.",
=======
    primaryTests: ["motricidade-teste", "linguagem-fonologia", "memoria-teste", "conhecimento-visual"],
    duration: "65–105 min",
    description:
      "Protocolo: Motor (marco esperado) + Linguagem (marcos comunicativos) + Memória + Cognição (discriminação/sequência). Triagem abrangente para atraso global.",
>>>>>>> claude/audite-bd8dye
  },
  {
    queixa: "cognicao",
    label: "Investigação de Cognição",
<<<<<<< HEAD
    primaryTests: ["funcoes-executivas", "conhecimento-visual", "academico-interativo"],
    duration: "45–60 min",
    description:
      "Protocolo: Funções executivas + Percepção visual + Acadêmico. Complementado com WISC-V ou Bayley se deficiência intelectual suspeita.",
=======
    primaryTests: ["funcoes-executivas", "memoria-teste", "conhecimento-visual", "academico-interativo"],
    duration: "60–90 min",
    description:
      "Protocolo: Funções executivas + Memória + Percepção visual + Acadêmico. Complementado com WISC-V ou Bayley se deficiência intelectual suspeita.",
>>>>>>> claude/audite-bd8dye
  },
];

export function getClinicPath(queixa: string): ClinicalPath | undefined {
  return clinicalPaths.find((p) => p.queixa === queixa);
}
