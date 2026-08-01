// Recomendações auxiliares respondidas por pais ou cuidadores.
//
// Regra de integridade: nome, rota, idade e tempo vêm SEMPRE de allScales, o
// catálogo de aplicações realmente disponíveis. A curadoria abaixo só define
// por que o instrumento entra, para qual queixa e em qual prioridade.
import { allScales, type ScaleEntry } from "./scaleFilter";

export interface ParentTestRecommendation {
  id: string;
  scaleId: string;
  name: string;
  route: string;
  queixas: string[];
  ageMin: number;
  ageMax: number;
  tempo: string;
  seal: "ouro" | "prata" | "bronze";
  razao: string;
  icon: string;
  complementa: string;
  canonicalScale: ScaleEntry;
}

interface ParentRecommendationSpec {
  id: string;
  scaleId: string;
  queixas: string[];
  seal: ParentTestRecommendation["seal"];
  razao: string;
  icon: string;
  complementa: string;
}

const recommendationSpecs: ParentRecommendationSpec[] = [
  {
    id: "snap-iv",
    scaleId: "snap",
    queixas: ["tdah", "comportamento", "aprendizagem"],
    seal: "ouro",
    razao:
      "Organiza sintomas de desatenção e hiperatividade/impulsividade observados em casa e pode ser cruzado com a versão escolar; é rastreio dimensional, não confirmação diagnóstica isolada.",
    icon: "Activity",
    complementa: "Atenção e funções executivas",
  },
  {
    id: "vanderbilt-pais",
    scaleId: "vanderbilt",
    queixas: ["tdah", "comportamento", "aprendizagem"],
    seal: "prata",
    razao:
      "Acrescenta sintomas de desatenção, hiperatividade, oposição, conduta e desempenho, permitindo integrar o relato familiar à informação escolar.",
    icon: "ListChecks",
    complementa: "Sintomas e prejuízo em contexto",
  },
  {
    id: "conners-pais",
    scaleId: "conners",
    queixas: ["tdah", "comportamento", "aprendizagem"],
    seal: "bronze",
    razao:
      "Aprofunda funcionamento cotidiano, oposição, aprendizagem e autorregulação; interpretar conforme a versão licenciada aplicada e nunca como diagnóstico isolado.",
    icon: "BarChart3",
    complementa: "Atenção e funções executivas",
  },
  {
    id: "asq3-pais",
    scaleId: "asq3",
    queixas: ["atraso", "linguagem", "motor"],
    seal: "ouro",
    razao:
      "Questionário de desenvolvimento por cuidadores que cobre comunicação, motor, resolução de problemas e pessoal-social em crianças pequenas.",
    icon: "Baby",
    complementa: "Desenvolvimento global",
  },
  {
    id: "cbcl-pais",
    scaleId: "cbcl",
    queixas: ["comportamento", "ansiedade", "depressao", "aprendizagem"],
    seal: "ouro",
    razao:
      "Oferece visão ampla de sintomas internalizantes, externalizantes, atenção e funcionamento social relatados pelos cuidadores.",
    icon: "ListChecks",
    complementa: "Comportamento e impacto funcional",
  },
  {
    id: "brief2-pais",
    scaleId: "brief2",
    queixas: ["tdah", "cognicao", "aprendizagem"],
    seal: "prata",
    razao:
      "Descreve funções executivas no cotidiano — inibição, flexibilidade, memória de trabalho e organização — a partir do contexto familiar.",
    icon: "BrainCog",
    complementa: "Funções executivas",
  },
  {
    id: "mchat-pais",
    scaleId: "mchat",
    queixas: ["tea", "atraso", "linguagem"],
    seal: "ouro",
    razao:
      "Rastreio parental específico para risco de TEA na janela etária documentada; resultado positivo orienta seguimento estruturado, não fecha diagnóstico.",
    icon: "Puzzle",
    complementa: "Comunicação social precoce",
  },
  {
    id: "abc-pais",
    scaleId: "abc",
    queixas: ["tea", "comportamento", "evolucao", "social"],
    seal: "prata",
    razao:
      "Ajuda a acompanhar irritabilidade, hiperatividade, estereotipias, retraimento e comunicação em contexto real, especialmente quando o objetivo é monitorar mudança.",
    icon: "Puzzle",
    complementa: "Evolução comportamental no TEA",
  },
  {
    id: "scared-pais",
    scaleId: "scared",
    queixas: ["ansiedade", "comportamento"],
    seal: "ouro",
    razao:
      "Organiza sinais de ansiedade, evitação, separação, pânico e queixas somáticas na faixa etária validada, com versão apropriada ao informante.",
    icon: "ShieldAlert",
    complementa: "Entrevista de ansiedade",
  },
  {
    id: "sdq-pais",
    scaleId: "sdq",
    queixas: ["comportamento", "ansiedade", "depressao", "tdah", "social", "aprendizagem"],
    seal: "prata",
    razao:
      "Acrescenta uma leitura breve de emoções, hiperatividade, conduta, pares e comportamento pró-social a partir do cotidiano.",
    icon: "BarChart3",
    complementa: "Comportamento e relações",
  },
  {
    id: "cshq-pais",
    scaleId: "cshq",
    queixas: ["sono", "comportamento", "tdah"],
    seal: "ouro",
    razao:
      "Questionário parental de hábitos e dificuldades do sono, importante quando sono insuficiente ou fragmentado pode amplificar sintomas diurnos.",
    icon: "Moon",
    complementa: "Rotina, sono e funcionamento diurno",
  },
];

const scaleById = new Map(allScales.map((scale) => [scale.id, scale]));

function hydrateRecommendation(
  spec: ParentRecommendationSpec,
): ParentTestRecommendation | null {
  const canonicalScale = scaleById.get(spec.scaleId);
  if (!canonicalScale) return null;
  return {
    ...spec,
    name: canonicalScale.name,
    route: canonicalScale.appRoute || `/generic-scale/${canonicalScale.id}`,
    ageMin: canonicalScale.ageMin,
    ageMax: canonicalScale.ageMax,
    tempo: canonicalScale.tempo,
    canonicalScale,
  };
}

export const testesPaisRecommendations: ParentTestRecommendation[] =
  recommendationSpecs
    .map(hydrateRecommendation)
    .filter(
      (recommendation): recommendation is ParentTestRecommendation =>
        Boolean(recommendation),
    );

export function recommendParentTests(
  selectedQueixas: string[],
  ageMonths: number | null,
): ParentTestRecommendation[] {
  if (!selectedQueixas.length || ageMonths === null) return [];

  const selected = new Set(selectedQueixas);
  const sealOrder = { ouro: 0, prata: 1, bronze: 2 };
  return testesPaisRecommendations
    .filter(
      (recommendation) =>
        recommendation.queixas.some((queixa) => selected.has(queixa)) &&
        ageMonths >= recommendation.ageMin &&
        ageMonths <= recommendation.ageMax,
    )
    .sort((a, b) => {
      const sealDifference = sealOrder[a.seal] - sealOrder[b.seal];
      if (sealDifference !== 0) return sealDifference;
      const complaintDifference =
        b.queixas.filter((queixa) => selected.has(queixa)).length -
        a.queixas.filter((queixa) => selected.has(queixa)).length;
      return complaintDifference || a.name.localeCompare(b.name, "pt-BR");
    });
}

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
    label: "Contexto familiar para atenção e autorregulação",
    primaryTests: ["snap-iv", "vanderbilt-pais"],
    duration: "20–30 min",
    description:
      "Combine rastreio de sintomas com prejuízo cotidiano e, quando possível, confronte casa e escola.",
  },
  {
    queixa: "linguagem",
    label: "Desenvolvimento segundo os cuidadores",
    primaryTests: ["asq3-pais"],
    duration: "10–15 min",
    description:
      "Organize comunicação e demais marcos antes de integrar observação clínica e avaliação fonoaudiológica.",
  },
  {
    queixa: "aprendizagem",
    label: "Contexto familiar da dificuldade escolar",
    primaryTests: ["cbcl-pais", "brief2-pais"],
    duration: "25–35 min",
    description:
      "Cruze comportamento, emoções e funções executivas em casa com desempenho acadêmico e informação escolar.",
  },
  {
    queixa: "motor",
    label: "Marcos motores segundo os cuidadores",
    primaryTests: ["asq3-pais"],
    duration: "10–15 min",
    description:
      "Relacione marcos motores e participação ao exame neurológico e à avaliação funcional direta.",
  },
  {
    queixa: "atraso",
    label: "Triagem parental do desenvolvimento",
    primaryTests: ["asq3-pais"],
    duration: "10–15 min",
    description:
      "Comece pelos cinco domínios do desenvolvimento e amplie conforme idade, domínio afetado e impacto funcional.",
  },
  {
    queixa: "tea",
    label: "Comunicação social segundo os cuidadores",
    primaryTests: ["mchat-pais", "abc-pais"],
    duration: "10–25 min",
    description:
      "A idade e a finalidade definem a escolha: rastreio precoce na janela do M-CHAT ou monitoramento comportamental em faixas posteriores.",
  },
  {
    queixa: "social",
    label: "Participação social e comportamento",
    primaryTests: ["sdq-pais", "abc-pais"],
    duration: "15–25 min",
    description:
      "Documente pares, comportamento pró-social, retraimento e impacto em situações reais, cruzando outros ambientes.",
  },
  {
    queixa: "ansiedade",
    label: "Ansiedade no cotidiano familiar",
    primaryTests: ["scared-pais", "sdq-pais"],
    duration: "15–20 min",
    description:
      "Combine rastreio específico de ansiedade com uma leitura ampla de emoções e funcionamento quando a apresentação for mista.",
  },
  {
    queixa: "depressao",
    label: "Humor segundo os cuidadores",
    primaryTests: ["cbcl-pais", "sdq-pais"],
    duration: "20–30 min",
    description:
      "Use o relato parental como uma perspectiva e preserve avaliação direta do adolescente e rastreio imediato de segurança quando indicado.",
  },
  {
    queixa: "comportamento",
    label: "Comportamento em contexto familiar",
    primaryTests: ["sdq-pais", "vanderbilt-pais"],
    duration: "15–25 min",
    description:
      "Diferencie sintomas amplos, oposição, autorregulação e prejuízo no cotidiano, cruzando outros ambientes.",
  },
  {
    queixa: "sono",
    label: "Hábitos de sono e repercussão diurna",
    primaryTests: ["cshq-pais", "sdq-pais"],
    duration: "15–25 min",
    description:
      "Registre rotina, despertares e repercussão comportamental antes de atribuir sintomas diurnos apenas ao neurodesenvolvimento.",
  },
  {
    queixa: "evolucao",
    label: "Acompanhamento percebido pelos cuidadores",
    primaryTests: ["abc-pais", "sdq-pais"],
    duration: "15–25 min",
    description:
      "Use medidas repetíveis para acompanhar mudança funcional, registrando versão, intervalo e contexto.",
  },
];

export function getParentAssessmentPath(
  queixa: string,
): ParentAssessmentPath | undefined {
  return parentAssessmentPaths.find((path) => path.queixa === queixa);
}
