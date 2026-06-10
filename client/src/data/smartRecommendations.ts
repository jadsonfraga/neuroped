// Smart Recommendations Engine
// Incrementa inteligência na seleção e apresentação de escalas

import { type ScaleEntry } from "./scaleFilter";

export interface SmartRecommendation {
  scales: ScaleEntry[];
  tier: "primary" | "secondary" | "alternative";
  reason: string;
  whenToUse: string;
  limitations: string[];
  suggestedFollowUp?: string;
  estimatedDuration: string;
  clinicalValue: string;
}

// ============ SMART COMBINATION RECOMMENDATIONS ============

export const smartCombinations: Record<string, SmartRecommendation> = {
  // TDAH - Avaliação Completa (2-3 horas)
  "tdah-complete": {
    scales: [], // Will be populated from database
    tier: "primary",
    reason: "Avaliação diagnóstica completa de TDAH",
    whenToUse:
      "Primeira avaliação de suspeita TDAH em criança 6+ anos com queixa clara",
    limitations: [
      "Requer coleta com pais/professores",
      "Tempo total 60-90 minutos",
      "Melhor se criança em ambiente estável",
    ],
    suggestedFollowUp: "CPT/TOVA se diagnóstico em dúvida + Avaliação função executiva",
    estimatedDuration: "60-90 minutos",
    clinicalValue: "Diagnóstico diferencial alto",
  },

  // TEA - Early Detection (16-30 meses)
  "tea-early": {
    scales: [],
    tier: "primary",
    reason: "Rastreio de risco TEA em lactente",
    whenToUse: "Criança 16-30 meses com atraso linguagem ou sinais sociais",
    limitations: [
      "M-CHAT é rastreio, não diagnóstico",
      "Se positivo, encaminhar para ADOS-2",
      "Validação em amostra brasileira ainda em progresso",
    ],
    suggestedFollowUp: "ADOS-2 se M-CHAT positivo",
    estimatedDuration: "5-10 minutos",
    clinicalValue: "Detecção precoce crítica",
  },

  // Atraso Desenvolvimento - Global
  "atraso-global": {
    scales: [],
    tier: "primary",
    reason: "Avaliação abrangente de atraso do desenvolvimento",
    whenToUse: "Qualquer idade com múltiplos atrasos ou idade < 2 anos",
    limitations: ["Tempo longo (60-90m)", "Requer clínico treinado", "Custo elevado"],
    suggestedFollowUp: "Terapia ocupacional/fonoaudiologia conforme achados",
    estimatedDuration: "60-90 minutos",
    clinicalValue: "Padrão-ouro desenvolvimento infantil",
  },

  // Ansiedade - Criança
  "ansiedade-crianca": {
    scales: [],
    tier: "primary",
    reason: "Avaliação de transtorno de ansiedade em criança escolar",
    whenToUse: "Criança 8+ anos com preocupação excessiva ou evitação",
    limitations: ["Requer cooperação criança", "Importante história parental", "Descartar atraso"],
    suggestedFollowUp: "RCADS se SCARED positivo + avaliação funcional",
    estimatedDuration: "10-15 minutos",
    clinicalValue: "Rastreio rápido, diagnóstico preciso",
  },

  // Comportamento - Contexto Casa
  "comportamento-casa": {
    scales: [],
    tier: "primary",
    reason: "Avaliação de problemas comportamentais no contexto doméstico",
    whenToUse: "Criança 2-7 anos com desobediência/agressão em casa",
    limitations: ["Respondente pai/mãe (tendência viés)", "Não cobre contexto escolar"],
    suggestedFollowUp: "SDQ em professor + orientação parental",
    estimatedDuration: "15-20 minutos",
    clinicalValue: "Específico contexto doméstico",
  },

  // Comportamento - Contexto Escola
  "comportamento-escola": {
    scales: [],
    tier: "primary",
    reason: "Avaliação de problemas comportamentais em contexto escolar",
    whenToUse: "Criança 4+ anos com queixa escolar (desatenção/agressão/desafio)",
    limitations: ["Depende qualidade informação professor", "Não cobre contexto casa"],
    suggestedFollowUp: "CBCL aos pais para visão completa",
    estimatedDuration: "5-10 minutos",
    clinicalValue: "Informação escolar crítica para decisão",
  },
};

// ============ CONTEXT-AWARE RECOMMENDATIONS ============

export function getSmartRecommendation(
  queixas: string[],
  ageMonths: number,
  context?: string
): SmartRecommendation | null {
  // TDAH recommendations
  if (queixas.includes("tdah")) {
    if (ageMonths < 72) {
      return {
        scales: [],
        tier: "alternative",
        reason: "TDAH < 6 anos: use escalas comportamento geral",
        whenToUse: "Pré-escolar com suspeita TDAH deve usar CBCL ao invés",
        limitations: [
          "TDAH não é diagnóstico válido < 6 anos",
          "Sintomas normais desenvolvimento pré-escolar",
        ],
        estimatedDuration: "10-15 minutos",
        clinicalValue: "Diferencial vs comportamento típico",
      };
    }
    return smartCombinations["tdah-complete"];
  }

  // TEA recommendations
  if (queixas.includes("tea")) {
    if (ageMonths >= 16 && ageMonths <= 30) {
      return smartCombinations["tea-early"];
    }
  }

  // Behavior recommendations
  if (queixas.includes("comportamento")) {
    if (context === "school") {
      return smartCombinations["comportamento-escola"];
    } else if (context === "home") {
      return smartCombinations["comportamento-casa"];
    }
  }

  return null;
}

// ============ MULTI-SCALE BATTERIES ============

export const clinicalBatteries = [
  {
    name: "Bateria TDAH Completa",
    scales: ["snap", "conners", "brief2", "cpt3"],
    duration: "60-90 min",
    indication: "Diagnóstico TDAH 6+",
    coverage: "Desatenção, hiperatividade, função executiva, CPT",
  },
  {
    name: "Bateria TEA - Lactente",
    scales: ["mchat", "asq3", "mullen"],
    duration: "30-45 min",
    indication: "Rastreio TEA 16-36 meses",
    coverage: "Sinais sociais, comunicação, desenvolvimento",
  },
  {
    name: "Bateria Atraso Desenvolvimento",
    scales: ["bayley", "aims", "celf5"],
    duration: "90-120 min",
    indication: "Atraso múltiplos domínios",
    coverage: "Cognitivo, motor, linguagem",
  },
  {
    name: "Bateria Saúde Mental Infantil",
    scales: ["cbcl", "scared", "rcads", "sdq"],
    duration: "30-40 min",
    indication: "Rastreio abrangente problemas psiquiátricos",
    coverage: "Comportamento, ansiedade, internalização, externalização",
  },
];

// ============ AGE-SPECIFIC RECOMMENDATIONS ============

export function getAgeSpecificScales(ageMonths: number, queixa: string): string[] {
  const ageGroup =
    ageMonths < 6
      ? "0-6m"
      : ageMonths < 12
        ? "6-12m"
        : ageMonths < 24
          ? "1-2a"
          : ageMonths < 48
            ? "2-4a"
            : ageMonths < 72
              ? "4-6a"
              : ageMonths < 144
                ? "6-12a"
                : "12-18a";

  const recommendations: Record<string, Record<string, string[]>> = {
    tdah: {
      "0-6m": [],
      "6-12m": [],
      "1-2a": [],
      "2-4a": ["cbcl"],
      "4-6a": ["cbcl", "sdq"],
      "6-12a": ["snap", "conners", "brief2"],
      "12-18a": ["snap", "conners", "brief2", "asrs"],
    },
    tea: {
      "0-6m": [],
      "6-12m": ["mchat"],
      "1-2a": ["mchat", "asq3"],
      "2-4a": ["cars2", "srs2"],
      "4-6a": ["cars2", "srs2", "scq"],
      "6-12a": ["ados2", "cars2", "srs2"],
      "12-18a": ["ados2", "cars2"],
    },
    atraso: {
      "0-6m": ["bayley", "aims"],
      "6-12m": ["bayley", "aims", "asq3"],
      "1-2a": ["bayley", "denver", "asq3"],
      "2-4a": ["denver", "griffiths"],
      "4-6a": ["wppsi", "griffiths"],
      "6-12a": ["wisc", "wppsi"],
      "12-18a": ["wisc", "wais"],
    },
  };

  return recommendations[queixa]?.[ageGroup] || [];
}

// ============ RISK STRATIFICATION ============

export function stratifyRisk(
  scaleName: string,
  score: number,
  maxScore: number
): "normal" | "at-risk" | "clinical" {
  const percentile = (score / maxScore) * 100;

  if (percentile < 70) return "normal";
  if (percentile < 90) return "at-risk";
  return "clinical";
}

// ============ FOLLOW-UP RECOMMENDATIONS ============

export function getFollowUpRecommendation(
  primaryScale: string,
  result: "normal" | "at-risk" | "clinical"
): string {
  if (result === "normal") {
    return "Sem ação necessária. Reavalie em 6-12 meses se há mudanças.";
  }

  const followUps: Record<string, Record<string, string>> = {
    snap: {
      "at-risk": "Colete BRIEF-2 para avaliar função executiva",
      clinical: "Encaminhe para psiquiatra/psicologo para diagnóstico TDAH",
    },
    mchat: {
      "at-risk": "Repita M-CHAT com profissional treinado",
      clinical: "Encaminhe para diagnóstico ADOS-2",
    },
    scared: {
      "at-risk": "Reavalie em 4 semanas, considere RCADS",
      clinical: "Encaminhe para terapia / psiquiatra",
    },
  };

  return (
    followUps[primaryScale]?.[result] || "Consulte especialista para próximos passos"
  );
}

// ============ DECISION SUPPORT ============

export function shouldUseMultipleScales(
  queixa: string,
  ageMonths: number,
  complexity: "simple" | "moderate" | "complex"
): boolean {
  // Complex cases benefit from multiple scales
  if (complexity === "complex") return true;

  // Diagnostic evaluations often need multiple scales
  if (queixa === "tdah" || queixa === "tea") return true;

  // Age affects decision (younger = more comprehensive)
  if (ageMonths < 24) return true;

  return false;
}

export function estimateEvaluationTime(
  scales: ScaleEntry[],
  respondents: string[]
): { timeMinutes: number; explanation: string } {
  // Estimate based on scale count and respondent types
  let baseTime = 0;

  // Each scale: 5-10 minutes
  baseTime += scales.length * 7;

  // Additional time per respondent type
  if (respondents.includes("pais")) baseTime += 15;
  if (respondents.includes("professor")) baseTime += 10;
  if (respondents.includes("clinico")) baseTime += 20;

  return {
    timeMinutes: baseTime,
    explanation: `${baseTime} minutos (${scales.length} escalas + ${respondents.length} respondente(s))`,
  };
}
