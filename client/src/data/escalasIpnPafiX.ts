import type { ApplicationMode, ScaleEntry } from "./scaleFilter";

const SOURCE =
  "PAFI-X — Protocolo de Investigação Fonoaudiológica da Apraxia de Fala na Infância. Instrumento autoral NeuroPed SDG / Dr. Jadson Fraga, versão 1.0, 31/07/2026.";

const COMMON_TAGS = [
  "apraxia de fala na infância",
  "AFI",
  "transtorno motor da fala",
  "fala pouco inteligível",
  "planejamento motor da fala",
  "programação motora da fala",
  "inconsistência de fala",
  "transições coarticulatórias",
  "prosódia",
  "acentuação lexical",
  "distorção vocálica",
  "busca articulatória",
  "piora com complexidade",
  "avaliação dinâmica",
  "diagnóstico diferencial da fala",
];

interface PafiModuleInput {
  id: string;
  name: string;
  fullName: string;
  ageMin: number;
  ageMax?: number;
  tempo: string;
  description: string;
  applicationMode: ApplicationMode;
  verbalRequirement: NonNullable<ScaleEntry["verbalRequirement"]>;
  signalTags: string[];
  queixas?: string[];
}

function pafiModule(input: PafiModuleInput): ScaleEntry {
  return {
    id: input.id,
    name: input.name,
    fullName: input.fullName,
    ageMin: input.ageMin,
    ageMax: input.ageMax ?? 215,
    queixas: input.queixas ?? ["linguagem", "motor", "atraso"],
    respondente: ["clinico"],
    prioridade: "diagnostica",
    tempo: input.tempo,
    appRoute: `/generic-scale/${input.id}`,
    description: input.description,
    fonte: SOURCE,
    scoringCutoff:
      "Registro clínico qualitativo, sem escore e sem ponto de corte diagnóstico. A classificação final depende de convergência clínica, amostra suficiente e diagnóstico diferencial.",
    validacaoBrasil:
      "Instrumento autoral em português, não validado psicometricamente; uso descritivo sob julgamento profissional.",
    licencaUso: "autoral",
    pendente_validacao_clinica: true,
    pendencia:
      "Propriedades psicométricas, normas e acurácia diagnóstica aguardam validação formal. Não usar como teste isolado.",
    verbalRequirement: input.verbalRequirement,
    literacyRequirement: "indiferente",
    suicideRiskInstrument: false,
    psychosisRiskInstrument: false,
    assessmentUse: "diagnostico",
    applicationMode: input.applicationMode,
    implementationStatus: "complete",
    signalTags: [...new Set([...COMMON_TAGS, ...input.signalTags])],
  };
}

export const escalasIpnPafiX: ScaleEntry[] = [
  pafiModule({
    id: "pafi-x-condicoes-amostras-51",
    name: "PAFI-X · Condições e amostras",
    fullName: "PAFI-X — Identificação, condições prévias e amostras obrigatórias (51 campos)",
    ageMin: 24,
    tempo: "12–20 min",
    applicationMode: "registro_clinico",
    verbalRequirement: "nao_verbal_compativel",
    description:
      "Organiza identificação, audição, estruturas orofaciais, função neuromuscular, compreensão, participação e suficiência das amostras antes de interpretar sinais de AFI.",
    signalTags: [
      "audição",
      "estruturas orofaciais",
      "função neuromuscular",
      "compreensão de linguagem",
      "amostra espontânea",
      "nomeação",
      "repetição de palavras",
      "pseudopalavras",
      "sequências silábicas",
      "frases",
      "amostra insuficiente",
    ],
  }),
  pafiModule({
    id: "pafi-x-nucleo-motor-57",
    name: "PAFI-X · Núcleo motor",
    fullName: "PAFI-X — Características centrais e sinais motores associados (57 itens)",
    ageMin: 30,
    tempo: "18–30 min",
    applicationMode: "observacional_clinico",
    verbalRequirement: "verbal",
    description:
      "Registra inconsistência, transições coarticulatórias, prosódia, planejamento/programação, vogais e estrutura silábica em tarefas variadas.",
    signalTags: [
      "erros inconsistentes",
      "consoantes",
      "vogais",
      "segmentação silábica",
      "pausas intrapalavra",
      "ritmo silabado",
      "acentuação igual",
      "tentativas sucessivas",
      "movimentos de busca",
      "produção automática melhor",
      "perda de precisão sem pistas",
    ],
  }),
  pafiModule({
    id: "pafi-x-complexidade-repeticao-70",
    name: "PAFI-X · Complexidade e repetição",
    fullName: "PAFI-X — Efeito da complexidade e repetição sucessiva (70 campos)",
    ageMin: 30,
    tempo: "15–25 min",
    applicationMode: "observacional_clinico",
    verbalRequirement: "verbal",
    description:
      "Compara níveis crescentes de demanda e documenta três produções da mesma palavra, evitando inferência baseada em exemplo isolado.",
    signalTags: [
      "palavras polissilábicas",
      "frases longas",
      "novidade articulatória",
      "queda de inteligibilidade",
      "repetições sucessivas",
      "variabilidade intrapalavra",
      "ordem de segmentos",
      "comprimento do enunciado",
      "complexidade fonotática",
      "amostra replicada",
    ],
  }),
  pafiModule({
    id: "pafi-x-sequencias-dinamica-45",
    name: "PAFI-X · Sequências e avaliação dinâmica",
    fullName: "PAFI-X — Sequências silábicas, hierarquia de pistas e aprendizagem breve (45 itens)",
    ageMin: 30,
    tempo: "15–25 min",
    applicationMode: "observacional_clinico",
    verbalRequirement: "verbal",
    description:
      "Examina sequências repetidas e alternadas, resposta a pistas verbais, visuais, rítmicas e táteis e manutenção após retirada do suporte.",
    signalTags: [
      "diadococinesia",
      "pa-ta-ka",
      "ritmo irregular",
      "alteração da ordem",
      "modelo simultâneo",
      "redução da velocidade",
      "pista visual",
      "pista tátil-cinestésica",
      "retirada gradual",
      "generalização",
      "aprendizagem motora",
    ],
  }),
  pafiModule({
    id: "pafi-x-diferenciais-desenvolvimento-56",
    name: "PAFI-X · Diferenciais e desenvolvimento",
    fullName: "PAFI-X — Diagnóstico diferencial, funções não verbais e história do desenvolvimento (56 campos)",
    ageMin: 24,
    tempo: "20–35 min",
    applicationMode: "entrevista_clinica",
    verbalRequirement: "nao_verbal_compativel",
    description:
      "Estrutura achados a favor e contra transtorno fonológico, inconsistência fonológica, atraso motor da fala e disartria, além da história do desenvolvimento.",
    signalTags: [
      "transtorno fonológico",
      "inconsistência fonológica",
      "atraso motor da fala",
      "disartria",
      "fraqueza orofacial",
      "alteração de tônus",
      "voz",
      "ressonância",
      "controle respiratório",
      "praxia oral não verbal",
      "balbucio reduzido",
      "primeiras palavras tardias",
      "história familiar",
    ],
  }),
  pafiModule({
    id: "pafi-x-triade-3",
    name: "PAFI-X · Tríade clínica",
    fullName: "PAFI-X — Tríade clínica de maior consenso (3 características)",
    ageMin: 30,
    tempo: "3–5 min",
    applicationMode: "observacional_clinico",
    verbalRequirement: "verbal",
    description:
      "Classifica separadamente inconsistência, transições coarticulatórias e prosódia como ausentes, duvidosas, presentes ou marcantes.",
    signalTags: [
      "tríade clínica",
      "características centrais",
      "consenso",
      "inconsistência consonantal",
      "inconsistência vocálica",
      "transições prolongadas",
      "transições interrompidas",
      "prosódia inadequada",
      "acentuação alterada",
      "reprodutibilidade",
    ],
  }),
  pafiModule({
    id: "pafi-x-matriz-confianca-20",
    name: "PAFI-X · Matriz de confiança",
    fullName: "PAFI-X — Matriz de convergência clínica (20 campos)",
    ageMin: 30,
    tempo: "6–10 min",
    applicationMode: "registro_clinico",
    verbalRequirement: "verbal",
    description:
      "Organiza características centrais, evidências motoras complementares e exclusões necessárias sem converter subtotal em diagnóstico automático.",
    signalTags: [
      "convergência clínica",
      "evidências motoras",
      "exclusões necessárias",
      "audição avaliada",
      "neuromuscular",
      "amostra suficiente",
      "pistas motoras",
      "sequências novas",
      "instabilidade",
      "grau de confiança",
    ],
  }),
  pafiModule({
    id: "pafi-x-classificacao-final-1",
    name: "PAFI-X · Classificação final",
    fullName: "PAFI-X — Classificação clínica final documentada (1 campo)",
    ageMin: 30,
    tempo: "2–4 min",
    applicationMode: "registro_clinico",
    verbalRequirement: "verbal",
    description:
      "Registra a conclusão profissional entre AFI improvável, possível, provável, perfil fortemente compatível ou avaliação inconclusiva.",
    signalTags: [
      "AFI improvável",
      "AFI possível",
      "AFI provável",
      "fortemente compatível",
      "avaliação inconclusiva",
      "amostra limitada",
      "hipótese clínica",
      "conclusão fonoaudiológica",
      "confiança diagnóstica",
      "reavaliação longitudinal",
    ],
  }),
  pafiModule({
    id: "pafi-x-conclusao-recomendacoes-54",
    name: "PAFI-X · Conclusão e recomendações",
    fullName: "PAFI-X — Síntese, achados a favor/contra e plano de seguimento (54 campos)",
    ageMin: 24,
    tempo: "12–20 min",
    applicationMode: "registro_clinico",
    verbalRequirement: "nao_verbal_compativel",
    description:
      "Produz síntese clínica estruturada, explicita achados a favor e contra e organiza recomendações, reavaliação e pistas de melhor resposta.",
    signalTags: [
      "achados a favor",
      "achados contra",
      "formulação clínica",
      "fonoterapia motora",
      "avaliação audiológica",
      "avaliação neuropediátrica",
      "avaliação genética",
      "comunicação aumentativa",
      "orientação familiar",
      "registro longitudinal",
      "reavaliação",
    ],
  }),
  pafiModule({
    id: "pafi-x-red-flags-14",
    name: "PAFI-X · Red flags",
    fullName: "PAFI-X — Alertas para encaminhamento médico (14 itens)",
    ageMin: 24,
    tempo: "4–7 min",
    applicationMode: "registro_clinico",
    verbalRequirement: "nao_verbal_compativel",
    queixas: ["linguagem", "motor", "atraso", "epilepsia"],
    description:
      "Checklist independente de regressão, crises, assimetria, fraqueza, deglutição, fadiga, início súbito e sinais sindrômicos; não integra soma diagnóstica de AFI.",
    signalTags: [
      "regressão de linguagem",
      "perda de habilidades",
      "crises epilépticas",
      "assimetria facial",
      "fraqueza muscular",
      "disfagia",
      "engasgos",
      "fadiga progressiva",
      "alteração de marcha",
      "início súbito",
      "dismorfismos",
      "perímetro cefálico",
      "doença neuromuscular",
      "síndrome genética",
    ],
  }),
];
