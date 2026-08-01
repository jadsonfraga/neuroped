// Recomendações auxiliares respondidas por pais ou cuidadores.
//
// Regra de integridade: nome, rota, idade e tempo vêm SEMPRE de allScales. A
// curadoria abaixo só define por que o instrumento entra, para qual queixa e em
// qual prioridade. Assim o bloco auxiliar não cria uma segunda verdade clínica.
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
    id: "conners-pais",
    scaleId: "conners",
    queixas: ["tdah", "comportamento", "aprendizagem"],
    seal: "prata",
    razao:
      "Acrescenta funcionamento cotidiano, oposição, aprendizagem e autorregulação ao relato de sintomas; interpretar conforme a versão licenciada aplicada.",
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
    id: "peds-pais",
    scaleId: "peds",
    queixas: ["atraso", "linguagem", "motor"],
    seal: "prata",
    razao:
      "Estrutura as preocupações dos cuidadores sobre desenvolvimento e comportamento, ajudando a decidir quando ampliar a avaliação formal.",
    icon: "BookOpen",
    complementa: "Marcos do desenvolvimento",
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
    id: "vineland-pais",
    scaleId: "vineland",
    queixas: ["funcionalidade", "autonomia", "atraso", "motor", "cognicao"],
    seal: "ouro",
    razao:
      "Caracteriza comunicação, vida diária, socialização e autonomia por entrevista ou relato do cuidador; exige versão e normas licenciadas adequadas.",
    icon: "Users",
    complementa: "Autonomia e comportamento adaptativo",
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
    id: "atec-pais",
    scaleId: "atec",
    queixas: ["tea", "social", "linguagem", "comportamento", "evolucao"],
    seal: "prata",
    razao:
      "Ajuda a acompanhar comunicação, sociabilidade, aspectos sensoriais e saúde/comportamento ao longo do tempo, sem substituir avaliação diagnóstica.",
    icon: "Puzzle",
    complementa: "Evolução funcional no TEA",
  },
  {
    id: "srs2-pais",
    scaleId: "srs2",
    queixas: ["tea", "social", "linguagem"],
    seal: "bronze",
    razao:
      "Quantifica responsividade social em contexto real e pode acrescentar perspectiva familiar ou escolar; uso depende da versão licenciada.",
    icon: "Users",
    complementa: "Reciprocidade e participação social",
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
    id: "psc17-pais",
    scaleId: "psc17",
    queixas: ["comportamento", "ansiedade", "depressao", "tdah"],
    seal: "prata",
    razao:
      "Triagem breve parental de carga psicossocial, sintomas internalizantes, externalizantes e atenção; útil quando a queixa inicial é inespecífica.",
    icon: "HeartPulse",
    complementa: "Triagem psicossocial ampla",
  },
  {
    id: "sdq-pais",
    scaleId: "sdq",
    queixas: ["comportamento", "ansiedade", "tdah", "social", "aprendizagem"],
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
    primaryTests: ["snap-iv", "conners-pais"],
    duration: "20–30 min",
    description:
      "Combine rastreio de sintomas com funcionamento executivo cotidiano e, quando possível, confronte casa e escola.",
  },
  {
    queixa: "linguagem",
    label: "Desenvolvimento segundo os cuidadores",
    primaryTests: ["asq3-pais", "peds-pais"],
    duration: "15–25 min",
    description:
      "Organize marcos e preocupações familiares antes de integrar observação clínica e avaliação fonoaudiológica.",
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
    label: "Impacto funcional segundo os cuidadores",
    primaryTests: ["asq3-pais", "vineland-pais"],
    duration: "20–40 min",
    description:
      "Relacione marcos motores, participação e autonomia ao exame neurológico e à avaliação funcional direta.",
  },
  {
    queixa: "atraso",
    label: "Triagem parental do desenvolvimento",
    primaryTests: ["asq3-pais", "peds-pais"],
    duration: "15–25 min",
    description:
      "Comece por marcos e preocupações dos cuidadores e amplie conforme idade, domínio afetado e impacto funcional.",
  },
  {
    queixa: "funcionalidade",
    label: "Funcionamento adaptativo no cotidiano",
    primaryTests: ["vineland-pais", "asq3-pais"],
    duration: "25–45 min",
    description:
      "Documente comunicação, vida diária, socialização, participação e quantidade de ajuda necessária.",
  },
  {
    queixa: "autonomia",
    label: "Autonomia e atividades de vida diária",
    primaryTests: ["vineland-pais", "peds-pais"],
    duration: "25–40 min",
    description:
      "Caracterize o que a criança faz sozinha, com supervisão ou com assistência direta em contextos reais.",
  },
  {
    queixa: "tea",
    label: "Comunicação social segundo os cuidadores",
    primaryTests: ["mchat-pais", "atec-pais"],
    duration: "10–25 min",
    description:
      "A idade define o instrumento: rastreio precoce na janela do M-CHAT ou acompanhamento funcional por cuidador em faixas posteriores.",
  },
  {
    queixa: "social",
    label: "Reciprocidade e participação social",
    primaryTests: ["srs2-pais", "sdq-pais"],
    duration: "15–30 min",
    description:
      "Documente reciprocidade, pares e impacto social, respeitando licença e versão apropriada do instrumento.",
  },
  {
    queixa: "ansiedade",
    label: "Ansiedade no cotidiano familiar",
    primaryTests: ["scared-pais", "psc17-pais"],
    duration: "15–20 min",
    description:
      "Combine rastreio específico de ansiedade com uma triagem psicossocial ampla quando a apresentação for mista.",
  },
  {
    queixa: "depressao",
    label: "Humor e carga psicossocial segundo os cuidadores",
    primaryTests: ["psc17-pais", "cbcl-pais"],
    duration: "20–30 min",
    description:
      "Use o relato parental como uma das perspectivas e preserve avaliação direta do adolescente e rastreio imediato de segurança quando indicado.",
  },
  {
    queixa: "comportamento",
    label: "Comportamento em contexto familiar",
    primaryTests: ["sdq-pais", "conners-pais"],
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
      "Registre rotina, despertares e repercussão comportamental antes de atribuir sintomas diurnos apenas a transtornos do neurodesenvolvimento.",
  },
  {
    queixa: "evolucao",
    label: "Acompanhamento percebido pelos cuidadores",
    primaryTests: ["atec-pais", "sdq-pais"],
    duration: "15–25 min",
    description:
      "Use medidas repetíveis para acompanhar mudança funcional, sempre registrando versão, intervalo e contexto.",
  },
];

export function getParentAssessmentPath(
  queixa: string,
): ParentAssessmentPath | undefined {
  return parentAssessmentPaths.find((path) => path.queixa === queixa);
}
