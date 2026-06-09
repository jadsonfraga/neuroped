/**
 * ESCALAS COM METADATA CLÍNICA COMPLETA
 *
 * Exemplos de reclassificação cirúrgica de escalas principais.
 * Estes servem como template para reclassificar as 414+ escalas restantes.
 */

import type { ScaleEntryWithClinicalMetadata } from "@/types/ClinicalScaleMetadata";

/**
 * EXEMPLO 1: M-CHAT-R/F — QUESTIONÁRIO PARENTAL PURO
 * Erro atual: Confundido com "teste direto"
 * Correção: Classifica como "questionário_parental"
 */
export const mChatReclassified: ScaleEntryWithClinicalMetadata = {
  // Campos originais
  id: "mchat",
  name: "M-CHAT-R/F",
  fullName: "Modified Checklist for Autism in Toddlers - Revised with Follow-Up",
  ageMin: 16,
  ageMax: 30,
  queixas: ["tea"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "5–10 min",
  appRoute: "/mchat",
  description: "Rastreio de risco para TEA entre 16 e 30 meses respondido por pais.",
  fonte: "Robins DL et al., 2014 - Pediatrics",
  pubmedId: "PMID 24422648",
  validacaoBrasil: "Sim - Losapio MF et al., 2011",
  scoringCutoff: ">=3 risco inicial; >=8 alto risco",
  licencaUso: "livre",

  // NOVO: Metadata clínica
  clinicalMetadata: {
    // ===== CLASSIFICAÇÃO =====
    instrumentType: "questionario_parental",
    administrationMode: "questionario",
    clinicalDescription:
      "Checklist de 20 itens sobre sinais comportamentais de TEA respondido por pais. NÃO é teste direto com criança.",

    // ===== RESPONDENTES =====
    requiresParent: true,
    requiresSchool: false,
    requiresProfessional: false,
    requiresChildPresence: false,
    requiresMinimumCollaboration: false,

    // ===== HABILIDADES DA CRIANÇA =====
    requiresVerbalLanguage: false,
    requiresLanguageComprehension: false,
    requiresReading: false,
    requiresWriting: false,
    motorRequirement: "nenhum",
    requiresSustainedAttention: false,
    requiresAbstractThinking: false,

    // ===== TESTES DIRETOS =====
    directTestComponents: undefined,

    // ===== MÚLTIPLAS FORMAS =====
    hasFormVariants: false,

    // ===== CONTEXTOS =====
    isScreeningTool: true,
    isMonitoringTool: false,
    isDiagnosticSupport: true,
    isFunctionalAssessment: false,

    // ===== CONTRAINDICAÇÕES =====
    contraindications: [
      "Criança ainda não tem 16 meses",
      "Pais indisponíveis ou não confiáveis",
    ],
    restrictions: ["Usar antes de 16m pode gerar falsos-positivos"],
    misuseRisk: "baixo",
    misuseRiskExplanation: "Questionnaire simples, difícil aplicar errado",

    // ===== BLOQUEIOS =====
    blockingRules: [
      {
        id: "requires_parent",
        condition: "parent_not_available",
        userExplanation: "Exige resposta de pais, mas não foram marcados como disponíveis",
        blockType: "soft",
        severity: "soft",
      },
      {
        id: "age_too_young",
        condition: "age < 16",
        userExplanation: "M-CHAT não é validado antes de 16 meses",
        blockType: "hard",
        severity: "hard",
      },
    ],

    // ===== RECOMENDAÇÕES =====
    recommendedWhen: [
      "Suspeita de TEA entre 16-30 meses",
      "Pai relata atraso linguístico ou falta de resposta social",
      "Primeira avaliação em crianças pequenas com sinais de TEA",
    ],
    avoidWhen: [
      "Criança < 16m",
      "Pais não conseguem descrever comportamento (ex: psicose parental)",
      "Apenas para confirmar TEA isoladamente (usar ADOS-2 + ADI-R para diagnóstico)",
    ],
    clinicalNotes:
      "M-CHAT é TRIAGEM, não diagnóstico. Follow-Up reduz falsos-positivos. Positivo em M-CHAT exige ADOS-2.",
  },
};

/**
 * EXEMPLO 2: PPVT-4 — TESTE DIRETO DE DESEMPENHO REAL
 * Erro atual: Listado genericamente como "clinico"
 * Correção: Classifica como "teste_direto_desempenho" com tarefas claras
 */
export const ppvt4Reclassified: ScaleEntryWithClinicalMetadata = {
  // Campos originais
  id: "ppvt4",
  name: "PPVT-4",
  fullName: "Peabody Picture Vocabulary Test 4",
  ageMin: 30,
  ageMax: 216,
  queixas: ["linguagem"],
  respondente: ["clinico"],
  prioridade: "diagnostica",
  tempo: "15 min",
  description: "Avalia vocabulário receptivo por identificação de figuras.",
  fonte: "Dunn LM & Dunn DM, 2007 - Pearson",
  validacaoBrasil: "Parcial",
  licencaUso: "comercial",

  // NOVO: Metadata clínica
  clinicalMetadata: {
    // ===== CLASSIFICAÇÃO =====
    instrumentType: "teste_direto_desempenho",
    administrationMode: "teste_direto_tarefa",
    clinicalDescription:
      "VERDADEIRO TESTE DIRETO: Apresenta 4 figuras, criança aponta a que corresponde à palavra falada. Tarefa objetiva de desempenho.",

    // ===== RESPONDENTES =====
    requiresParent: false,
    requiresSchool: false,
    requiresProfessional: true,
    professionalType: "fonoaudiólogo",
    requiresChildPresence: true,
    requiresMinimumCollaboration: true,

    // ===== HABILIDADES DA CRIANÇA =====
    requiresVerbalLanguage: false, // Criança não precisa falar
    requiresLanguageComprehension: true, // Precisa entender palavra
    requiresReading: false,
    requiresWriting: false,
    motorRequirement: "motor_fino", // Apontar
    requiresSustainedAttention: true,
    requiresAbstractThinking: false,

    // ===== TESTES DIRETOS =====
    directTestComponents: [
      {
        id: "ppvt-basico",
        name: "Identificação de Figura por Palavra Falada",
        domain: "linguagem_receptiva",
        description: "Clínico fala palavra, criança aponta entre 4 figuras",
        passCriterion: "Apontar figura correta em <3 segundos",
        ageMinMonths: 30,
        ageMaxMonths: 216,
      },
    ],

    // ===== MÚLTIPLAS FORMAS =====
    hasFormVariants: false,

    // ===== CONTEXTOS =====
    isScreeningTool: false,
    isMonitoringTool: false,
    isDiagnosticSupport: true,
    isFunctionalAssessment: false,

    // ===== CONTRAINDICAÇÕES =====
    contraindications: [
      "Criança não consegue apontar (paralisia, ausência de braços)",
      "Deficiência auditiva sem acessibilidades",
      "Criança não consegue sentar colaborativamente",
    ],
    restrictions: [
      "Requer profissional treinado (fonoaudiólogo de preferência)",
      "Material propriedade do editor (não fotocopiar)",
    ],
    misuseRisk: "moderado",
    misuseRiskExplanation:
      "Pode ser mal administrado (criança não entende comando, figuras mostradas errado)",

    // ===== BLOQUEIOS =====
    blockingRules: [
      {
        id: "requires_professional",
        condition: "no_professional_available",
        userExplanation: "Exige aplicação por fonoaudiólogo ou profissional treinado",
        blockType: "soft",
        severity: "soft",
      },
      {
        id: "requires_motor",
        condition: "cannot_point_or_select",
        userExplanation: "Criança deve conseguir apontar (motor fino)",
        blockType: "hard",
        severity: "hard",
      },
      {
        id: "requires_collaboration",
        condition: "minimal_collaboration_not_possible",
        userExplanation: "Requer colaboração: criança deve sentar e prestar atenção",
        blockType: "hard",
        severity: "hard",
      },
    ],

    // ===== RECOMENDAÇÕES =====
    recommendedWhen: [
      "Avaliação de vocabulário receptivo em suspeita de atraso linguístico",
      "Diagnóstico diferencial: deficiência auditiva vs atraso linguístico",
      "Medida de desempenho linguístico antes/depois de terapia",
    ],
    avoidWhen: [
      "Criança não consegue apontar",
      "Criança com deficiência auditiva (sem equipamento amplificador)",
      "Ambiente muito ruidoso",
      "Criança demanda muito altos (pode ser interpretado como não entender)",
    ],
    clinicalNotes:
      "PPVT é teste de COMPREENSÃO receptiva. Não avalia expressão. Criança não fala na tarefa. Deve ser aplicado por profissional.",
  },
};

/**
 * EXEMPLO 3: SCARED — MÚLTIPLAS VERSÕES (DEVE SER SEPARADA)
 * Erro atual: Uma entrada com "respondente: [pais, autoaplicavel]"
 * Correção: Separar em 2 escalas distintas
 */

// 3A: SCARED Versão Pais
export const scaredParentalReclassified: ScaleEntryWithClinicalMetadata = {
  id: "scared-pais",
  name: "SCARED (Versão Pais)",
  fullName: "Screen for Child Anxiety Related Disorders - Parent Version",
  ageMin: 96,
  ageMax: 216,
  queixas: ["ansiedade"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "10 min",
  appRoute: "/scared-pais",
  description: "41 itens respondidos por pais sobre sintomas de ansiedade da criança.",
  fonte: "Birmaher B et al., 1997",
  validacaoBrasil: "Sim",
  licencaUso: "livre",

  clinicalMetadata: {
    instrumentType: "questionario_parental",
    administrationMode: "questionario",
    clinicalDescription:
      "Questionário parental de 41 itens sobre 5 subescalas de ansiedade (pânico, generalizada, separação, fobia social, evitação escolar)",

    requiresParent: true,
    requiresSchool: false,
    requiresProfessional: false,
    requiresChildPresence: false,
    requiresMinimumCollaboration: false,

    requiresVerbalLanguage: false,
    requiresLanguageComprehension: false,
    requiresReading: false,
    requiresWriting: false,
    motorRequirement: "nenhum",
    requiresSustainedAttention: false,
    requiresAbstractThinking: false,

    directTestComponents: undefined,
    hasFormVariants: true,
    formVariants: [
      {
        variantId: "scared-pais",
        name: "Parent Version",
        respondent: "pais",
        ageMinMonths: 96,
        ageMaxMonths: 216,
        tempo: "10 min",
        language: "pt-BR",
        appRoute: "/scared-pais",
      },
      {
        variantId: "scared-crianca",
        name: "Child/Adolescent Version",
        respondent: "crianca",
        ageMinMonths: 120,
        ageMaxMonths: 216,
        tempo: "10 min",
        language: "pt-BR",
        appRoute: "/scared-crianca",
      },
    ],

    isScreeningTool: true,
    isMonitoringTool: true,
    isDiagnosticSupport: true,
    isFunctionalAssessment: false,

    contraindications: [
      "Pais com psicopatologia severa (respostas não confiáveis)",
    ],
    restrictions: [],
    misuseRisk: "baixo",

    blockingRules: [
      {
        id: "requires_parent",
        condition: "parent_not_available",
        userExplanation: "Versão parental exige resposta de pais",
        blockType: "soft",
        severity: "soft",
      },
    ],

    recommendedWhen: [
      "Triagem de ansiedade em crianças 8+",
      "Perspectiva parental sobre sintomas de ansiedade",
    ],
    avoidWhen: [
      "Pais não conseguem descrever comportamento da criança",
      "Sem perspectiva parental (usar versão criança)",
    ],
  },
};

// 3B: SCARED Versão Criança
export const scaredChildReclassified: ScaleEntryWithClinicalMetadata = {
  id: "scared-crianca",
  name: "SCARED (Versão Criança/Adolescente)",
  fullName: "Screen for Child Anxiety Related Disorders - Child Version",
  ageMin: 120, // Elevar a 10 anos (era 96 = 8 anos, inadequado)
  ageMax: 216,
  queixas: ["ansiedade"],
  respondente: ["autoaplicavel"],
  prioridade: "triagem",
  tempo: "10 min",
  appRoute: "/scared-crianca",
  description:
    "41 itens respondidos pela própria criança/adolescente sobre sintomas de ansiedade pessoal.",
  fonte: "Birmaher B et al., 1997",
  validacaoBrasil: "Sim",
  licencaUso: "livre",

  clinicalMetadata: {
    instrumentType: "autorrelato_crianca",
    administrationMode: "questionario",
    clinicalDescription:
      "Autorrelato de 41 itens: criança relata seus próprios sintomas ansiosos. Exige leitura fluida e compreensão abstrata.",

    requiresParent: false,
    requiresSchool: false,
    requiresProfessional: false,
    requiresChildPresence: true,
    requiresMinimumCollaboration: true,

    requiresVerbalLanguage: false,
    requiresLanguageComprehension: true,
    requiresReading: true,
    minReadingLevel: "nivel3", // Leitura de textos
    requiresWriting: false,
    motorRequirement: "motor_fino", // Marcar respostas
    requiresSustainedAttention: true,
    requiresAbstractThinking: true, // Deve refletir sobre emoções

    directTestComponents: undefined,
    hasFormVariants: true,
    formVariants: [
      {
        variantId: "scared-pais",
        name: "Parent Version",
        respondent: "pais",
        ageMinMonths: 96,
        ageMaxMonths: 216,
        tempo: "10 min",
        language: "pt-BR",
        appRoute: "/scared-pais",
      },
      {
        variantId: "scared-crianca",
        name: "Child/Adolescent Version",
        respondent: "crianca",
        ageMinMonths: 120,
        ageMaxMonths: 216,
        tempo: "10 min",
        language: "pt-BR",
        appRoute: "/scared-crianca",
      },
    ],

    isScreeningTool: true,
    isMonitoringTool: true,
    isDiagnosticSupport: true,
    isFunctionalAssessment: false,

    contraindications: [
      "Criança com compreensão linguística inadequada",
      "Criança que não consegue ler fluentemente",
      "Criança com capacidade muito limitada de introspeccão",
    ],
    restrictions: [],
    misuseRisk: "baixo",

    blockingRules: [
      {
        id: "requires_reading",
        condition: "cannot_read_fluently",
        userExplanation:
          "Exige leitura fluida (nível 3). Criança precisa ler e entender textos sobre emoções.",
        blockType: "hard",
        severity: "hard",
      },
      {
        id: "age_too_young",
        condition: "age < 10",
        userExplanation:
          "Recomendado a partir de 10 anos. Crianças mais jovens não têm maturidade para autorrelato de ansiedade.",
        blockType: "soft",
        severity: "soft",
      },
      {
        id: "requires_abstract_thinking",
        condition: "limited_abstract_thought",
        userExplanation:
          "Exige que criança consiga refletir sobre emoções abstratas (medo, preocupação).",
        blockType: "hard",
        severity: "hard",
      },
    ],

    recommendedWhen: [
      "Autorrelato de ansiedade em adolescentes",
      "Complemento à versão parental para visão mais completa",
      "Avaliação da perspectiva interna da criança sobre seus sintomas",
    ],
    avoidWhen: [
      "Criança < 10 anos (usar versão parental)",
      "Criança não lê fluentemente",
      "Criança com déficit cognitivo significativo",
    ],
    clinicalNotes:
      "SCARED criança fornece perspectiva diferente da versão parental. Discordâncias podem ser clinicamente significativas.",
  },
};
