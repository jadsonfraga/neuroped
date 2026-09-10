import type { ScaleEntry } from "./scaleFilter";

/**
 * Instrumentos autorais concluídos em 10/09/2026 e incorporados ao app.
 * Todos são de monitorização/seguimento e não possuem validação psicométrica
 * publicada nem pontos de corte diagnósticos.
 */
export const escalasAutorais20260910: ScaleEntry[] = [
  {
    id: "adapta-18-sdg",
    name: "ADAPTA-18 SDG",
    fullName: "Registro Autoral de Transições, Flexibilidade e Recuperação — revisão operacional v2.0-app",
    ageMin: 36,
    ageMax: 215,
    queixas: ["comportamento", "funcionalidade", "tea", "tdah", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "monitorizacao",
    tempo: "5–7 min",
    appRoute: "/generic-scale/adapta-18-sdg",
    description:
      "Monitor longitudinal de transições, flexibilidade diante de mudanças/alternativas e recuperação após frustração. Esta é uma revisão operacional autoral para o app, criada a partir do escopo clínico preservado; não se apresenta como reconstrução textual do PDF anterior.",
    fonte:
      "Dr. Jadson Fraga, NeuroPed SDG — ADAPTA-18 SDG, revisão operacional v2.0-app (10/09/2026).",
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — sem validação psicométrica publicada.",
    scoringCutoff:
      "Sem ponto de corte. Médias 0–3 por domínio e global apenas para comparação longitudinal intraindividual.",
    assessmentUse: "monitorizacao",
    implementationStatus: "complete",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "transicoes",
      "mudanca de rotina",
      "flexibilidade",
      "frustracao",
      "recuperacao",
      "autorregulacao",
      "rigidez",
      "participacao",
    ],
    exemploPais:
      "Quando um plano muda, uma atividade termina ou algo não sai como esperado, quanto apoio seu filho precisa para aceitar a mudança e voltar a participar?",
  },
  {
    id: "porta-20-sdg",
    name: "PORTA-20 SDG",
    fullName: "Perfil Observacional de Participação, Organização, Rotina, Transição e Adaptação Escolar — v2.1",
    ageMin: 48,
    ageMax: 120,
    queixas: ["aprendizagem", "funcionalidade", "comportamento", "tdah", "tea", "evolucao"],
    respondente: ["professor", "clinico"],
    prioridade: "monitorizacao",
    tempo: "5–7 min",
    appRoute: "/generic-scale/porta-20-sdg",
    description:
      "Monitor funcional escolar de chegada/transições, início e sustentação de atividades, autonomia/comunicação de necessidades e participação social/autorregulação.",
    fonte:
      "Dr. Jadson Fraga, NeuroPed SDG — PORTA-20 SDG v2.1 (10/09/2026). Fonte canônica: PDF autoral NeuroPed SDG.",
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — sem validação psicométrica publicada.",
    scoringCutoff:
      "Sem ponto de corte. Médias 0–3 por domínio e global apenas para comparação longitudinal.",
    assessmentUse: "monitorizacao",
    applicationMode: "questionario_professor",
    implementationStatus: "complete",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "adaptacao escolar",
      "transicoes",
      "participacao",
      "organizacao",
      "autonomia",
      "comunicacao de necessidades",
      "autorregulacao",
      "apoio escolar",
    ],
  },
  {
    id: "ticar-18-sdg",
    name: "TICAR-18 SDG",
    fullName: "Tiques, Impacto Contextual, Autorregulação e Rotina — v1.1",
    ageMin: 60,
    ageMax: 215,
    queixas: ["tiques", "funcionalidade", "social", "sono", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "monitorizacao",
    tempo: "5–8 min",
    appRoute: "/generic-scale/ticar-18-sdg",
    description:
      "Monitor longitudinal da repercussão funcional de tiques: conforto corporal, esforço de contenção, participação, desempenho, contexto e repercussão social.",
    fonte:
      "Dr. Jadson Fraga, NeuroPed SDG — TICAR-18 SDG v1.1 (10/09/2026).",
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — sem validação psicométrica publicada.",
    scoringCutoff:
      "Sem ponto de corte. Médias 0–3 por domínio e global; N/O excluído do denominador.",
    assessmentUse: "monitorizacao",
    implementationStatus: "complete",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "tiques",
      "dor",
      "fadiga",
      "supressao",
      "escola",
      "participacao",
      "bullying",
      "vergonha",
      "impacto funcional",
    ],
    exemploPais:
      "Além de notar os tiques, observe se eles causam dor, pausa, vergonha, esforço para esconder, dificuldade na escola ou evitamento de atividades.",
  },
  {
    id: "ponte-16-sdg",
    name: "PONTE-16 SDG",
    fullName: "Escala Autoral de Generalização Funcional entre Contextos — v1.0",
    ageMin: 36,
    ageMax: 216,
    queixas: ["funcionalidade", "autonomia", "evolucao", "tea", "tdah", "atraso"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "monitorizacao",
    tempo: "4–6 min",
    appRoute: "/generic-scale/ponte-16-sdg",
    description:
      "Monitoriza se habilidades aprendidas aparecem espontaneamente em casa, escola, terapia e outros contextos, com menor dependência de pistas e utilidade funcional real.",
    fonte:
      "Dr. Jadson Fraga, NeuroPed SDG — PONTE-16 SDG (10/09/2026).",
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — sem validação psicométrica publicada.",
    scoringCutoff:
      "Sem ponto de corte. Média 0–3 para comparação longitudinal intraindividual; maior média = maior generalização observada.",
    assessmentUse: "seguimento",
    implementationStatus: "complete",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    signalTags: [
      "generalizacao",
      "transferencia de habilidades",
      "casa escola terapia",
      "uso espontaneo",
      "dependencia de pistas",
      "manutencao",
      "participacao",
    ],
    exemploPais:
      "O que seu filho aprende na terapia ou na escola aparece também em casa e em situações reais, sem alguém precisar conduzir cada passo?",
  },
];
