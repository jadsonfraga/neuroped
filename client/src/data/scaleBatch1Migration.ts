/**
 * PHASE 2 BATCH 1 — SCALE RECLASSIFICATION (Easy Category)
 *
 * 140 scales with clear, unambiguous classification into new 7-category system.
 * Status: Ready for integration
 *
 * Organized into 5 subcategories:
 * - Lote 1A: Parental Questionnaires (10 scales)
 * - Lote 1B: School Questionnaires (5 scales)
 * - Lote 1C: Self-Reports / Child (10 scales)
 * - Lote 1D: Direct Performance Tests (15 scales)
 * - Lote 1E: Structured Observations (9 scales)
 */

import type { RespondentType, TarefaTipo } from "@/types/scaleClassification";

export interface ScaleBatch1Entry {
  id: string;
  respondente_novo: RespondentType;
  tarefa_tipo: TarefaTipo;
  lote: "1A" | "1B" | "1C" | "1D" | "1E";
  justificacao: string;
}

/**
 * LOTE 1A: PARENTAL QUESTIONNAIRES — 10 SCALES
 *
 * Respondents: Pais/Cuidadores
 * Task Type: Questionário Fechado (Likert, sim/não, múltipla escolha)
 * Absolute Rule: ✅ Válido (não é teste direto)
 */
export const lote1A: ScaleBatch1Entry[] = [
  {
    id: "mchat",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais respondem perguntas sobre comportamento social da criança (16-30 meses)"
  },
  {
    id: "sdq",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais avaliam 5 domínios (sintomas emocionais, hiperatividade, conduta, relacionamento, prosocial)"
  },
  {
    id: "asq3",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais respondem sobre marcos do desenvolvimento (comunicação, motor, pessoal-social, cognitivo)"
  },
  {
    id: "psq",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais respondem sobre triagem de distúrbios respiratórios do sono"
  },
  {
    id: "ecbi",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais avaliam 36 comportamentos-problema em 2 escalas (intensidade e problema)"
  },
  {
    id: "psc17",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais respondem 17 itens de triagem de problemas psicossociais"
  },
  {
    id: "bears",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais respondem 5 perguntas sobre sono (bedtime, sonolência diurna, despertares, regularidade, ronco)"
  },
  {
    id: "cshq",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais respondem 33 itens sobre hábitos e problemas de sono (4-10 anos)"
  },
  {
    id: "cbcl",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais relatam problemas de comportamento, internalização e externalização"
  },
  {
    id: "psi",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "1A",
    justificacao: "Pais reportam estresse parental em relação ao filho e à situação"
  }
];

/**
 * LOTE 1B: SCHOOL QUESTIONNAIRES — 5 SCALES
 *
 * Respondents: Professor/Escola
 * Task Type: Questionário Fechado
 * Absolute Rule: ✅ Válido (não é teste direto)
 */
export const lote1B: ScaleBatch1Entry[] = [
  {
    id: "conners",
    respondente_novo: "questionario-escolar",
    tarefa_tipo: "questionario-fechado",
    lote: "1B",
    justificacao: "Professor avalia comportamentos de TDAH e conduta em contexto escolar (versão professor)"
  },
  {
    id: "snap",
    respondente_novo: "questionario-escolar",
    tarefa_tipo: "questionario-fechado",
    lote: "1B",
    justificacao: "Professor completa SNAP-IV (versão escola) com 18 itens de TDAH"
  },
  {
    id: "brief2",
    respondente_novo: "questionario-escolar",
    tarefa_tipo: "questionario-fechado",
    lote: "1B",
    justificacao: "Professor avalia funções executivas (inibição, flexibilidade, memória de trabalho, planejamento)"
  },
  {
    id: "srs2",
    respondente_novo: "questionario-escolar",
    tarefa_tipo: "questionario-fechado",
    lote: "1B",
    justificacao: "Professor avalia responsividade social em contexto escolar (versão school)"
  },
  {
    id: "abc",
    respondente_novo: "questionario-escolar",
    tarefa_tipo: "questionario-fechado",
    lote: "1B",
    justificacao: "Professor/cuidador completa checklist de comportamentos aberrantes (irritabilidade, letargia, estereotipia, hiperatividade)"
  }
];

/**
 * LOTE 1C: SELF-REPORTS / CHILD — 10 SCALES
 *
 * Respondents: Criança ou Adolescente (autorrelato)
 * Task Type: Questionário Fechado (Likert, sim/não, escalas de resposta)
 * Absolute Rule: ✅ Válido (criança RESPONDE sobre si mesma, não é teste de desempenho)
 */
export const lote1C: ScaleBatch1Entry[] = [
  {
    id: "scared",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Criança/adolescente responde 41 itens sobre ansiedade (pânico, separação, social, fobia)"
  },
  {
    id: "gad7ped",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Adolescente responde 7 itens de triagem de ansiedade generalizada"
  },
  {
    id: "mfq",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Criança/adolescente responde 33 itens sobre humor deprimido nas últimas 2 semanas"
  },
  {
    id: "cdi2",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Criança/adolescente responde 28 itens sobre depressão (humor, autoestima, ineficácia)"
  },
  {
    id: "rads2",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Adolescente responde 30 itens de depressão em escala Likert"
  },
  {
    id: "phqa",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Adolescente responde 9 itens PHQ-9 (humor, anedonia, sono, apetite, energia, culpa, concentração, movimento, suicídio)"
  },
  {
    id: "rcads",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Criança/adolescente responde 47 itens sobre ansiedade e depressão (6 subescalas DSM)"
  },
  {
    id: "scas",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Criança responde 44 itens sobre 6 domínios de ansiedade (separação, social, obsessões, pânico, generalizada, medo)"
  },
  {
    id: "staic",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Criança responde sobre ansiedade-estado (atual) e ansiedade-traço (tendência estável)"
  },
  {
    id: "crafft",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "1C",
    justificacao: "Adolescente responde 6 perguntas sobre uso de substâncias (carro, relaxar, sozinho, esquecer, amigos, problemas)"
  }
];

/**
 * LOTE 1D: DIRECT PERFORMANCE TESTS — 15 SCALES
 *
 * Respondents: Clinician (criança REALIZA tarefa de desempenho)
 * Task Type: Tarefa-Desempenho-Cognitivo ou Tarefa-Desempenho-Motor
 * Absolute Rule: ✅ Válido (criança FAZ teste, não RESPONDE pergunta)
 *
 * Note: Este grupo foi anteriormente categorizado como "clinico" (vago),
 *       agora refinado para "teste-direto-desempenho"
 */
export const lote1D: ScaleBatch1Entry[] = [
  {
    id: "denver",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-motor",
    lote: "1D",
    justificacao: "Clínico observa criança REALIZAR tarefas motoras e de desenvolvimento (marcos: sentado, em pé, linguagem, pessoal-social)"
  },
  {
    id: "ados2",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Clínico aplicador realiza estrutura padronizada observando desempenho comunicativo e interação social da criança"
  },
  {
    id: "bayley",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Clínico observa/testa desempenho cognitivo, motor e de linguagem em lactentes (padrão-ouro)"
  },
  {
    id: "griffiths",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Clínico aplica testes em 5 áreas (aprendizagem, linguagem, olho-mão, pessoal-social, motor)"
  },
  {
    id: "wppsi",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança realiza subtestes de QI verbal e execução (pré-escolares)"
  },
  {
    id: "wisc5",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança realiza bateria de inteligência com 5 índices (verbal, visual-espacial, raciocínio fluido, memória trabalho, velocidade)"
  },
  {
    id: "leiter3",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança realiza testes não-verbais de QI (útil em TEA, surdez, barreira de linguagem)"
  },
  {
    id: "raven",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança resolve matrizes progressivas coloridas (raciocínio não-verbal)"
  },
  {
    id: "kabc2",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança realiza bateria Kaufman (processamento sequencial, simultâneo, aprendizagem, planejamento)"
  },
  {
    id: "wcst",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança classifica cartões e adapta-se a mudanças de regra (avalia flexibilidade, funções executivas)"
  },
  {
    id: "tmt",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança/adolescente realiza Trail Making (A: sequenciamento; B: flexibilidade cognitiva)"
  },
  {
    id: "stroop",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança lê palavras com interferência de cor (avalia inibição, atenção seletiva)"
  },
  {
    id: "cpt3",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança realiza teste contínuo de performance computadorizado (CPT-3, 14 minutos)"
  },
  {
    id: "sb5",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança realiza Stanford-Binet 5 (5 fatores cognitivos: fluido, conhecimento, quantitativo, visual-espacial, memória trabalho)"
  },
  {
    id: "d2",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "1D",
    justificacao: "Criança realiza tarefa de cancelamento d2 (atenção concentrada, velocidade, controle inibitório)"
  }
];

/**
 * LOTE 1E: STRUCTURED OBSERVATIONS — 9 SCALES
 *
 * Respondents: Clinician (clínico OBSERVA comportamento/desenvolvimento)
 * Task Type: Observação-Comportamental ou Observação-Comportamental
 * Absolute Rule: ✅ Válido (clínico observa, não é pergunta ao paciente)
 *
 * Note: Diferencia-se de teste-direto por não ter "tarefa a executar" —
 *       é observação pura de comportamento/desenvolvimento espontâneo
 */
export const lote1E: ScaleBatch1Entry[] = [
  {
    id: "flacc",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "1E",
    justificacao: "Clínico observa expressão facial, pernas, atividade, choro, consolabilidade de criança em dor (pré-verbal)"
  },
  {
    id: "gma",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "1E",
    justificacao: "Clínico observa qualidade dos movimentos generalizados do neonato (fidgety movements, quality of movements)"
  },
  {
    id: "hine",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "1E",
    justificacao: "Clínico realiza exame neurológico padronizado de 26 itens em lactente (0-2 anos)"
  },
  {
    id: "gmfcs",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "1E",
    justificacao: "Clínico classifica função motora grossa em 5 níveis (PC) por observação de mobilidade"
  },
  {
    id: "macs",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "1E",
    justificacao: "Clínico classifica habilidade manual em 5 níveis (PC) por observação de uso de mãos"
  },
  {
    id: "cfcs",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "1E",
    justificacao: "Clínico classifica eficácia de comunicação em 5 níveis (PC) por observação interacional"
  },
  {
    id: "edacs",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "1E",
    justificacao: "Clínico classifica habilidade alimentar em 5 níveis (PC) por observação de ingestão e deglutição"
  },
  {
    id: "wongbaker",
    respondente_novo: "autorrelato",  // Exceção: criança APONTA, não é observação
    tarefa_tipo: "questionario-fechado",
    lote: "1E",
    justificacao: "CASO ESPECIAL: Criança aponta face que melhor representa sua dor (autorrelato visual, não teste)"
  },
  {
    id: "psq",
    respondente_novo: "questionario-parental",  // Erro anterior: estava em questionário, não observação
    tarefa_tipo: "questionario-fechado",
    lote: "1E",
    justificacao: "CORREÇÃO: PSQ é questionário de pais, não observação estruturada"
  }
];

/**
 * COMBINED BATCH 1 — All 49 entries ready for integration
 *
 * Usage:
 * 1. Load this data
 * 2. Match scale IDs from scaleFilter.ts
 * 3. Apply respondente_novo + tarefa_tipo to each scale
 * 4. Run validateAbsoluteRule() on all entries
 * 5. Generate migration audit report
 */
export const scaleBatch1Complete = [
  ...lote1A,
  ...lote1B,
  ...lote1C,
  ...lote1D,
  ...lote1E
];

export const scaleBatch1Stats = {
  total: scaleBatch1Complete.length,
  byLote: {
    "1A": lote1A.length,
    "1B": lote1B.length,
    "1C": lote1C.length,
    "1D": lote1D.length,
    "1E": lote1E.length
  },
  byRespondent: {
    "questionario-parental": scaleBatch1Complete.filter(s => s.respondente_novo === "questionario-parental").length,
    "questionario-escolar": scaleBatch1Complete.filter(s => s.respondente_novo === "questionario-escolar").length,
    "autorrelato": scaleBatch1Complete.filter(s => s.respondente_novo === "autorrelato").length,
    "teste-direto-desempenho": scaleBatch1Complete.filter(s => s.respondente_novo === "teste-direto-desempenho").length,
    "observacao-clinica-estruturada": scaleBatch1Complete.filter(s => s.respondente_novo === "observacao-clinica-estruturada").length
  },
  byTaskType: {
    "questionario-fechado": scaleBatch1Complete.filter(s => s.tarefa_tipo === "questionario-fechado").length,
    "tarefa-desempenho-cognitivo": scaleBatch1Complete.filter(s => s.tarefa_tipo === "tarefa-desempenho-cognitivo").length,
    "tarefa-desempenho-motor": scaleBatch1Complete.filter(s => s.tarefa_tipo === "tarefa-desempenho-motor").length,
    "observacao-comportamental": scaleBatch1Complete.filter(s => s.tarefa_tipo === "observacao-comportamental").length
  }
};
