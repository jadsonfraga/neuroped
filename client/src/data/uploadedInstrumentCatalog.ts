import type { ScaleEntry } from "@/data/scaleFilter";

export type UploadedInstrumentKind = "instrumento" | "questionario_auxiliar" | "referencia_clinica";

export interface UploadedInstrumentDetail {
  id: string;
  kind: UploadedInstrumentKind;
  title: string;
  subtitle: string;
  summary: string;
  intendedUse: string;
  limitations: string[];
  filterRules: string[];
  provenance: string;
  aliases?: string[];
}

/**
 * Instrumentos/documentos recebidos em julho de 2026.
 *
 * Segurança editorial:
 * - não reproduz itens, âncoras, crivos ou algoritmos proprietários;
 * - instrumentos licenciados entram apenas como referência externa;
 * - material adaptado sem manual/correção confirmados fica como metadata_only;
 * - o capítulo sobre apraxia é referência clínica, não escala.
 */
export const uploadedFilterInstruments: ScaleEntry[] = [
  {
    id: "cars2-st",
    name: "CARS2-ST",
    fullName: "Childhood Autism Rating Scale, Second Edition — Standard Version",
    ageMin: 24,
    ageMax: 216,
    queixas: ["tea", "social", "linguagem", "sensorial", "funcionalidade"],
    respondente: ["clinico"],
    prioridade: "diagnostica",
    tempo: "5–10 min após coleta multimodal",
    appRoute: "/instrumentos-importados/cars2-st",
    description:
      "Versão padrão da CARS-2, preenchida pelo examinador a partir de observação direta, história do desenvolvimento e informações de múltiplas fontes. Não é instrumento de rastreio populacional.",
    fonte: "Schopler, Van Bourgondien, Wellman & Love — CARS-2 (WPS); material clínico enviado em 2026-07",
    validacaoBrasil: "Uso clínico no Brasil; conferir edição/adaptação e manual licenciados",
    scoringCutoff: "Pontuação e interpretação exclusivamente conforme manual oficial da CARS-2 e versão etária utilizada",
    licencaUso: "comercial",
    applicationMode: "observacional_clinico",
    assessmentUse: "diagnostico",
    implementationStatus: "external_only",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "tea",
      "comunicação social",
      "imitação",
      "resposta emocional",
      "rigidez",
      "sensorial",
      "comunicação verbal",
      "comunicação não verbal",
      "observação clínica",
    ],
  },
  {
    id: "cars2-hf",
    name: "CARS2-HF",
    fullName: "Childhood Autism Rating Scale, Second Edition — High-Functioning Version",
    ageMin: 72,
    ageMax: 216,
    queixas: ["tea", "social", "linguagem", "sensorial", "funcionalidade"],
    respondente: ["clinico"],
    prioridade: "diagnostica",
    tempo: "5–10 min após coleta multimodal",
    appRoute: "/instrumentos-importados/cars2-hf",
    description:
      "Versão da CARS-2 destinada a crianças e adolescentes verbalmente fluentes, em geral a partir de 6 anos, com capacidade intelectual média ou superior e sinais sociais/comportamentais mais sutis.",
    fonte: "Schopler, Van Bourgondien, Wellman & Love — CARS-2 (WPS); material clínico enviado em 2026-07",
    validacaoBrasil: "Uso clínico no Brasil; conferir edição/adaptação e manual licenciados",
    scoringCutoff: "Pontuação e interpretação exclusivamente conforme manual oficial da CARS2-HF",
    licencaUso: "comercial",
    applicationMode: "observacional_clinico",
    assessmentUse: "diagnostico",
    implementationStatus: "external_only",
    verbalRequirement: "verbal",
    literacyRequirement: "indiferente",
    signalTags: [
      "tea nível 1",
      "linguagem fluente",
      "reciprocidade social",
      "pragmática",
      "interesses restritos",
      "flexibilidade",
      "ansiedade social",
      "observação clínica",
    ],
  },
  {
    id: "cars2-qpc",
    name: "CARS2-QPC",
    fullName: "CARS-2 Questionnaire for Parents or Caregivers",
    ageMin: 24,
    ageMax: 216,
    queixas: ["tea", "social", "linguagem", "sensorial", "funcionalidade"],
    respondente: ["pais"],
    prioridade: "diagnostica",
    tempo: "10–15 min",
    appRoute: "/instrumentos-importados/cars2-qpc",
    description:
      "Questionário não pontuado para pais/cuidadores que organiza história inicial, comunicação, interação social, comportamentos repetitivos, brincadeira, rotinas e aspectos sensoriais, subsidiando a classificação profissional ST/HF.",
    fonte: "CARS-2 Questionnaire for Parents or Caregivers (WPS); material clínico enviado em 2026-07",
    validacaoBrasil: "Conferir versão oficial autorizada em português",
    scoringCutoff: "Sem escore próprio; informação auxiliar para o examinador",
    licencaUso: "comercial",
    applicationMode: "questionario_pais",
    assessmentUse: "diagnostico",
    implementationStatus: "external_only",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "história do desenvolvimento",
      "comunicação social",
      "brincadeira",
      "rotinas",
      "interesses restritos",
      "sensorial",
      "pais",
    ],
  },
  {
    id: "ica-abc-autismo",
    name: "ICA / ABC-Autismo",
    fullName: "Inventário de Comportamentos Autísticos — Autism Behavior Checklist",
    ageMin: 18,
    ageMax: 216,
    queixas: ["tea", "social", "linguagem", "sensorial", "comportamento"],
    respondente: ["pais", "clinico"],
    prioridade: "triagem",
    tempo: "10–20 min",
    appRoute: "/instrumentos-importados/ica-abc-autismo",
    description:
      "Inventário ponderado de 57 comportamentos distribuídos em áreas sensorial, relacionamento, uso do corpo/objetos, linguagem e pessoal-social. Diferenciado do ABC de Comportamento Aberrante já existente no app.",
    fonte: "Krug et al.; adaptação brasileira de Marteleto & Pedromônico; formulário enviado em 2026-07",
    pubmedId: "PMID 16389789",
    validacaoBrasil: "Sim — estudo brasileiro publicado; confirmar a versão e a folha de correção utilizadas",
    scoringCutoff:
      "Estudo brasileiro identificou ponto de corte 49; o arquivo enviado apresenta faixas diferentes. Conferir versão/protocolo antes de interpretar.",
    licencaUso: "restrita",
    applicationMode: "questionario_pais",
    assessmentUse: "triagem",
    implementationStatus: "external_only",
    pendente_validacao_clinica: true,
    pendencia:
      "Reconciliar os pontos de corte do formulário enviado com a publicação brasileira e confirmar autorização de reprodução antes de embutir itens.",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "autismo",
      "sensorial",
      "relacionamento",
      "corpo e objetos",
      "linguagem",
      "pessoal-social",
      "comportamentos autísticos",
    ],
  },
  {
    id: "qiiahsd-r-ei",
    name: "QIIAHSD-R-EI",
    fullName:
      "Questionário para Identificação de Indicadores de Altas Habilidades/Superdotação — Responsáveis — Educação Infantil (adaptado)",
    ageMin: 48,
    ageMax: 71,
    queixas: ["cognicao", "aprendizagem", "social"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "10–15 min",
    appRoute: "/instrumentos-importados/qiiahsd-r-ei",
    description:
      "Questionário parental adaptado para indicadores de habilidade acima da média, criatividade, comprometimento com a tarefa, liderança e características gerais na educação infantil.",
    fonte: "QIIAHSD-R-EI adaptado — formulário enviado em 2026-07",
    validacaoBrasil: "Material adaptado; propriedades psicométricas e manual da versão recebida não documentados",
    scoringCutoff: "Sem ponto de corte validado documentado no arquivo recebido; interpretar qualitativamente e cruzar com escola/observação",
    licencaUso: "contato_autor",
    applicationMode: "questionario_pais",
    assessmentUse: "triagem",
    implementationStatus: "metadata_only",
    pendente_validacao_clinica: true,
    pendencia:
      "Confirmar autoria, faixa etária oficial, instruções de correção, propriedades psicométricas e permissão de incorporação.",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "altas habilidades",
      "superdotação",
      "criatividade",
      "memória",
      "curiosidade",
      "comprometimento com tarefa",
      "liderança",
      "educação infantil",
    ],
  },
  {
    id: "apraxia-tea-referencia",
    name: "Apraxia da fala × TEA",
    fullName: "Referência clínica para relações e distinções entre apraxia da fala na infância e autismo",
    ageMin: 18,
    ageMax: 216,
    queixas: ["linguagem", "tea"],
    respondente: ["clinico"],
    prioridade: "monitorizacao",
    tempo: "Leitura clínica",
    appRoute: "/instrumentos-importados/apraxia-tea-referencia",
    description:
      "Capítulo de revisão para apoiar o diagnóstico diferencial entre alterações de planejamento/programação motora da fala e alterações de comunicação social associadas ao TEA. Não é escala.",
    fonte: "Wanderley & Montenegro. Apraxia da fala na infância e autismo: relações e distinções. Capítulo enviado em 2026-07",
    validacaoBrasil: "Referência narrativa; não se aplica validação como instrumento",
    scoringCutoff: "Não se aplica — material de referência clínica",
    licencaUso: "restrita",
    applicationMode: "psicoeducacao",
    assessmentUse: "psicoeducacao",
    implementationStatus: "metadata_only",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "apraxia da fala",
      "planejamento motor da fala",
      "erros inconsistentes",
      "prosódia",
      "coarticulação",
      "intenção comunicativa",
      "diagnóstico diferencial",
    ],
  },
];

/**
 * Corrige colisões/ambiguidades já existentes no catálogo sem apagar páginas:
 * - `cars` é um registro interno dos 15 domínios, não a aplicação oficial CARS-2;
 * - o ASQ de autismo enviado corresponde à família SCQ e não deve ser duplicado;
 * - `abc` existente permanece Aberrant Behavior Checklist; o inventário de autismo
 *   usa o id inequívoco `ica-abc-autismo`.
 */
const uploadedInstrumentOverrides: Record<string, Partial<ScaleEntry>> = {
  cars: {
    name: "CARS — registro clínico",
    fullName: "Registro descritivo dos 15 domínios da Childhood Autism Rating Scale",
    description:
      "Registro interno dos 15 domínios clínicos da CARS, sem reproduzir o protocolo oficial da CARS-2 e sem cálculo automático de classificação.",
    fonte: "CARS original — material clínico enviado em 2026-07; CARS-2 oficial catalogada separadamente",
    scoringCutoff:
      "O app registra respostas por domínio, mas não soma nem classifica a CARS-2. Para uso oficial, aplicar CARS2-ST ou CARS2-HF com manual licenciado.",
    licencaUso: "restrita",
    implementationStatus: "complete",
    pendente_validacao_clinica: false,
  },
  scq: {
    name: "SCQ / ASQ-Autismo",
    fullName: "Social Communication Questionnaire — Autism Screening Questionnaire",
    description:
      "Questionário de 40 itens para pais/cuidadores sobre comunicação social e comportamentos relacionados ao TEA. O formulário enviado declara uso restrito em pesquisa; itens oficiais não são incorporados.",
    fonte: "Rutter, Bailey & Lord — SCQ; formulário ASQ em português enviado em 2026-07",
    validacaoBrasil:
      "A versão recebida está identificada como instrumento em fase de validação e uso restrito em pesquisa; confirmar versão autorizada",
    scoringCutoff: "Interpretar apenas com manual/versão autorizados; não usar isoladamente para diagnóstico",
    licencaUso: "comercial",
    implementationStatus: "external_only",
    appRoute: "/instrumentos-importados/scq-asq",
    pendente_validacao_clinica: true,
    pendencia: "Confirmar versão brasileira autorizada e condições de uso clínico.",
    signalTags: [
      "tea",
      "comunicação social",
      "reciprocidade",
      "gestos",
      "brincadeira simbólica",
      "interesses restritos",
      "pais",
    ],
  },
};

export function applyUploadedInstrumentOverrides(scale: ScaleEntry): ScaleEntry {
  const patch = uploadedInstrumentOverrides[scale.id];
  return patch ? { ...scale, ...patch } : scale;
}

export const uploadedInstrumentDetails: UploadedInstrumentDetail[] = [
  {
    id: "cars2-st",
    kind: "instrumento",
    title: "CARS2-ST",
    subtitle: "Versão padrão da CARS-2",
    summary:
      "Classificação profissional de 15 áreas relacionadas ao TEA, construída a partir de observação direta, história do desenvolvimento, entrevistas e dados prévios.",
    intendedUse:
      "Apoio ao processo diagnóstico e à descrição da intensidade dos comportamentos associados ao TEA em perfis compatíveis com a versão padrão.",
    limitations: [
      "Não deve ser preenchida diretamente por pais ou professores.",
      "Não é instrumento de rastreio populacional.",
      "Não deve ser usada como única base para diagnóstico ou nível de suporte.",
      "Itens, âncoras e algoritmo oficial exigem material licenciado.",
    ],
    filterRules: ["Idade: 2–18 anos", "Respondente: clínico", "Finalidade: apoio diagnóstico", "Status: aplicação externa/licenciada"],
    provenance: "CARS-2/WPS e material clínico enviado em julho de 2026.",
  },
  {
    id: "cars2-hf",
    kind: "instrumento",
    title: "CARS2-HF",
    subtitle: "Versão para perfis verbalmente fluentes",
    summary:
      "Versão da CARS-2 direcionada a sinais sociais e comportamentais mais sutis em crianças e adolescentes verbalmente fluentes, geralmente com capacidade intelectual média ou superior.",
    intendedUse:
      "Apoio diagnóstico em escolares/adolescentes cujo perfil torna a versão padrão menos sensível às manifestações sutis.",
    limitations: [
      "Requer seleção correta da versão com base no perfil clínico, linguagem e funcionamento intelectual.",
      "Não substitui avaliação cognitiva, adaptativa e comunicação social multimodal.",
      "Aplicação e interpretação dependem do manual licenciado.",
    ],
    filterRules: ["Idade: 6–18 anos", "Comunicação: verbal", "Respondente: clínico", "Finalidade: apoio diagnóstico"],
    provenance: "CARS-2/WPS e material clínico enviado em julho de 2026.",
  },
  {
    id: "cars2-qpc",
    kind: "questionario_auxiliar",
    title: "CARS2-QPC",
    subtitle: "Questionário para pais ou cuidadores",
    summary:
      "Coleta estruturada, não pontuada, sobre desenvolvimento inicial, comunicação, interação social, brincadeira, rotinas, comportamentos repetitivos e interesses sensoriais.",
    intendedUse: "Subsidiar o examinador responsável pela CARS2-ST ou CARS2-HF e orientar perguntas de esclarecimento.",
    limitations: [
      "Não gera classificação diagnóstica isolada.",
      "Não substitui a observação direta.",
      "Reprodução e uso devem respeitar a licença oficial.",
    ],
    filterRules: ["Idade: 2–18 anos", "Respondente: pais/cuidadores", "Finalidade: informação auxiliar", "Sem escore próprio"],
    provenance: "CARS-2/WPS e material clínico enviado em julho de 2026.",
  },
  {
    id: "scq-asq",
    kind: "instrumento",
    title: "SCQ / ASQ-Autismo",
    subtitle: "Social Communication Questionnaire / Autism Screening Questionnaire",
    summary:
      "Questionário parental de 40 respostas sim/não sobre comunicação social, reciprocidade, gestos, brincadeira, interesses e comportamentos repetitivos, com vários itens retrospectivos de 4–5 anos.",
    intendedUse: "Triagem de risco para TEA em crianças com idade e desenvolvimento compatíveis com a versão utilizada.",
    limitations: [
      "O arquivo recebido declara uso restrito em pesquisa.",
      "Não foram incorporados itens nem algoritmo ao app.",
      "Resultado positivo exige avaliação diagnóstica clínica multimodal.",
    ],
    filterRules: ["Idade: a partir de 4 anos", "Respondente: pais/cuidadores", "Finalidade: triagem", "Status: externo/licenciado"],
    provenance: "Formulário ASQ em português enviado em julho de 2026; família instrumental SCQ.",
    aliases: ["ASQ autismo", "SCQ", "Questionário de Comunicação Social"],
  },
  {
    id: "ica-abc-autismo",
    kind: "instrumento",
    title: "ICA / ABC-Autismo",
    subtitle: "Inventário de Comportamentos Autísticos",
    summary:
      "Inventário de 57 comportamentos ponderados em áreas sensorial, relacionamento, corpo/objetos, linguagem e pessoal-social.",
    intendedUse: "Triagem e organização de sinais comportamentais relacionados ao TEA; não substitui entrevista e observação diagnósticas.",
    limitations: [
      "Não confundir com o ABC de Comportamento Aberrante já existente no NeuroPed.",
      "O formulário recebido e a publicação brasileira apresentam referências de corte que precisam ser reconciliadas.",
      "Itens oficiais não foram incorporados até confirmação de licença e versão.",
    ],
    filterRules: ["Idade: 18 meses–18 anos", "Respondente: pais/clínico", "Finalidade: triagem", "Status: referência externa"],
    provenance: "Krug et al.; adaptação brasileira; formulário ASQ+ABC enviado em julho de 2026.",
    aliases: ["Autism Behavior Checklist", "Inventário de Comportamento da Criança Autista", "ICA"],
  },
  {
    id: "qiiahsd-r-ei",
    kind: "instrumento",
    title: "QIIAHSD-R-EI",
    subtitle: "Indicadores de altas habilidades/superdotação — responsáveis — educação infantil",
    summary:
      "Questionário adaptado de frequência (0–4) para características gerais, habilidade acima da média, criatividade, comprometimento com a tarefa e liderança.",
    intendedUse: "Levantamento qualitativo de indicadores que devem ser cruzados com escola, observação, produções e avaliação cognitiva quando indicada.",
    limitations: [
      "A versão recebida está identificada como adaptada.",
      "O arquivo não documenta ponto de corte, manual de correção ou propriedades psicométricas completas.",
      "Não confirma superdotação isoladamente.",
    ],
    filterRules: ["Faixa conservadora no filtro: 4–5 anos e 11 meses", "Respondente: responsáveis", "Finalidade: triagem qualitativa", "Status: ficha técnica"],
    provenance: "Formulário QIIAHSD-R-EI adaptado enviado em julho de 2026.",
  },
  {
    id: "apraxia-tea-referencia",
    kind: "referencia_clinica",
    title: "Apraxia da fala na infância × TEA",
    subtitle: "Referência para diagnóstico diferencial",
    summary:
      "Revisão narrativa das semelhanças e diferenças entre alterações motoras de planejamento/programação da fala e alterações de comunicação social associadas ao TEA.",
    intendedUse:
      "Apoiar anamnese e encaminhamento fonoaudiológico, observando inconsistência dos erros, transições entre sons/sílabas, prosódia, intenção comunicativa, gestos e pragmática.",
    limitations: [
      "Não é escala nem protocolo diagnóstico.",
      "Não substitui avaliação fonoaudiológica motora da fala.",
      "TEA e apraxia podem ocorrer separadamente ou em associação.",
    ],
    filterRules: ["Queixas: linguagem e TEA", "Respondente: clínico", "Finalidade: referência clínica", "Sem escore"],
    provenance: "Capítulo de Wanderley & Montenegro enviado em julho de 2026.",
  },
];

export function getUploadedInstrumentDetail(id?: string | null): UploadedInstrumentDetail | undefined {
  return uploadedInstrumentDetails.find((item) => item.id === id);
}
