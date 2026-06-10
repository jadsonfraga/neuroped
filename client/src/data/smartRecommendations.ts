/**
 * Sistema Inteligente de Recomendações
 * Mapeia padrões clínicos → escalas recomendadas → bateria completa
 */

export interface ClinicalPattern {
  signature: string[]; // Ex: ["tdah", "executiva"]
  primaryScale: string; // Ex: "snap"
  secondaryScales: string[]; // Ex: ["brief2", "conners"]
  supportingScales: string[]; // Ex: ["cbcl", "sdq"]
  reason: string;
  estimatedTime: string;
  successRate: number; // 0-100
}

export const clinicalPatterns: ClinicalPattern[] = [
  // ===== DESENVOLVIMENTO =====
  {
    signature: ["atraso", "linguagem", "motor"],
    primaryScale: "bayley",
    secondaryScales: ["griffiths", "denver"],
    supportingScales: ["portage", "catclams"],
    reason: "Avaliação abrangente do desenvolvimento global",
    estimatedTime: "2-3 horas",
    successRate: 95
  },
  {
    signature: ["atraso"],
    primaryScale: "denver",
    secondaryScales: ["asq3", "portage"],
    supportingScales: ["peds", "catclams"],
    reason: "Triagem rápida de atraso do desenvolvimento",
    estimatedTime: "30-45 minutos",
    successRate: 88
  },

  // ===== TDAH =====
  {
    signature: ["tdah", "cognicao"],
    primaryScale: "snap",
    secondaryScales: ["brief2", "conners"],
    supportingScales: ["cbcl", "sdq", "vanderbilt"],
    reason: "TDAH com prejuízo executivo - avaliação completa",
    estimatedTime: "1-1.5 horas",
    successRate: 92
  },
  {
    signature: ["tdah"],
    primaryScale: "snap",
    secondaryScales: ["vanderbilt", "conners"],
    supportingScales: ["cbcl"],
    reason: "Triagem e confirmação de TDAH",
    estimatedTime: "45-60 minutos",
    successRate: 90
  },

  // ===== TEA =====
  {
    signature: ["tea", "comportamento", "linguagem"],
    primaryScale: "ados2",
    secondaryScales: ["cars", "adir"],
    supportingScales: ["srs2", "cbcl", "vineland"],
    reason: "Diagnóstico padrão-ouro de TEA",
    estimatedTime: "3-4 horas",
    successRate: 96
  },
  {
    signature: ["tea"],
    primaryScale: "mchat",
    secondaryScales: ["cars", "srs2"],
    supportingScales: ["cbcl", "sdq"],
    reason: "Rastreio e avaliação de TEA",
    estimatedTime: "1-1.5 horas",
    successRate: 88
  },

  // ===== ANSIEDADE + DEPRESSÃO =====
  {
    signature: ["ansiedade", "depressao"],
    primaryScale: "rcads",
    secondaryScales: ["masc2", "cdi2"],
    supportingScales: ["phqa", "scared"],
    reason: "Ansiedade comórbida com depressão",
    estimatedTime: "30-45 minutos",
    successRate: 93
  },
  {
    signature: ["ansiedade"],
    primaryScale: "scared",
    secondaryScales: ["masc2", "rcads"],
    supportingScales: ["gad7"],
    reason: "Transtornos de ansiedade",
    estimatedTime: "20-30 minutos",
    successRate: 91
  },

  // ===== COGNIÇÃO =====
  {
    signature: ["cognicao"],
    primaryScale: "wisc5",
    secondaryScales: ["nepsy2", "leiter3"],
    supportingScales: ["raven", "tde"],
    reason: "Avaliação de inteligência padrão-ouro",
    estimatedTime: "60-90 minutos",
    successRate: 96
  },

  // ===== FUNCIONALIDADE =====
  {
    signature: ["funcionalidade"],
    primaryScale: "pedicat",
    secondaryScales: ["vineland", "pedsql"],
    supportingScales: ["gmfcs"],
    reason: "Habilidades adaptativas",
    estimatedTime: "30-45 minutos",
    successRate: 88
  },

  // ===== APRENDIZAGEM =====
  {
    signature: ["aprendizagem"],
    primaryScale: "tde",
    secondaryScales: ["confias", "prolec"],
    supportingScales: ["wisc5"],
    reason: "Desempenho escolar",
    estimatedTime: "45-60 minutos",
    successRate: 90
  },

  // ===== COMPORTAMENTO =====
  {
    signature: ["comportamento"],
    primaryScale: "cbcl",
    secondaryScales: ["sdq", "abc"],
    supportingScales: ["ecbi"],
    reason: "Problemas comportamentais",
    estimatedTime: "20-30 minutos",
    successRate: 87
  },
];

export function findBestPattern(queixas: string[]): ClinicalPattern | null {
  if (queixas.length === 0) return null;

  let bestMatch: ClinicalPattern | null = null;
  let bestScore = 0;

  for (const pattern of clinicalPatterns) {
    const matches = pattern.signature.filter(sig => queixas.includes(sig)).length;
    const score = matches / pattern.signature.length;

    if (matches > 0 && score > bestScore) {
      bestMatch = pattern;
      bestScore = score;
    }
  }

  return bestMatch;
}

export function getBatteryForPattern(pattern: ClinicalPattern): {
  primary: string;
  secondary: string[];
  supporting: string[];
  total: string[];
} {
  return {
    primary: pattern.primaryScale,
    secondary: pattern.secondaryScales,
    supporting: pattern.supportingScales,
    total: [pattern.primaryScale, ...pattern.secondaryScales, ...pattern.supportingScales]
  };
}

export function getScaleRelevance(scaleId: string, casePattern: ClinicalPattern): number {
  if (scaleId === casePattern.primaryScale) return 100;
  if (casePattern.secondaryScales.includes(scaleId)) return 80;
  if (casePattern.supportingScales.includes(scaleId)) return 60;
  return 0;
}
