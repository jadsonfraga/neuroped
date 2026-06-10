// Clinical Intelligence Engine
// Regras sofisticadas de seleção de escalas baseadas em contexto clínico

export interface ClinicalRule {
  name: string;
  condition: (context: any) => boolean;
  action: string;
  priority: number; // 1-10, higher = more important
}

export const clinicalRules: ClinicalRule[] = [
  // ============ TDAH RULES ============
  {
    name: "TDAH_AGE_RESTRICTION",
    condition: (ctx) => ctx.queixas?.includes("tdah") && ctx.ageMonths < 72,
    action: "exclude_tdah_scales",
    priority: 10,
  },
  {
    name: "TDAH_REQUIRE_BEHAVIORAL_DATA",
    condition: (ctx) =>
      ctx.queixas?.includes("tdah") &&
      !ctx.respondentes?.includes("pais") &&
      !ctx.respondentes?.includes("professor"),
    action: "warn_insufficient_context",
    priority: 8,
  },
  {
    name: "TDAH_COMORBID_ANXIETY",
    condition: (ctx) => ctx.queixas?.includes("tdah") && ctx.queixas?.includes("ansiedade"),
    action: "prioritize_brief2_rcads",
    priority: 7,
  },
  {
    name: "TDAH_EXCLUDE_PSYCHOSIS_CONTEXT",
    condition: (ctx) => ctx.queixas?.includes("tdah") && ctx.queixas?.includes("psicose"),
    action: "exclude_tdah_prioritize_psychosis",
    priority: 9,
  },

  // ============ TEA RULES ============
  {
    name: "TEA_LANGUAGE_REQUIREMENT",
    condition: (ctx) => ctx.queixas?.includes("tea") && ctx.alphabetic === false,
    action: "use_nonverbal_screening",
    priority: 8,
  },
  {
    name: "TEA_EARLY_DETECTION",
    condition: (ctx) => ctx.queixas?.includes("tea") && ctx.ageMonths >= 16 && ctx.ageMonths <= 30,
    action: "prioritize_mchat",
    priority: 9,
  },
  {
    name: "TEA_SCHOOL_AGE_DIAGNOSTIC",
    condition: (ctx) => ctx.queixas?.includes("tea") && ctx.ageMonths > 30,
    action: "prioritize_ados2_cars2",
    priority: 9,
  },
  {
    name: "TEA_EXCLUDE_GLOBAL_DELAY",
    condition: (ctx) =>
      ctx.queixas?.includes("tea") && ctx.queixas?.includes("atraso") && ctx.ageMonths < 24,
    action: "require_ados_not_just_developmental",
    priority: 8,
  },

  // ============ DEVELOPMENT RULES ============
  {
    name: "ATRASO_MOTOR_EARLY",
    condition: (ctx) =>
      ctx.queixas?.includes("atraso") && ctx.ageMonths < 24 && ctx.signals?.includes("motor"),
    action: "prioritize_bayley_aims",
    priority: 9,
  },
  {
    name: "ATRASO_LANGUAGE_FOCUSED",
    condition: (ctx) =>
      ctx.queixas?.includes("atraso") && ctx.signals?.includes("linguagem") && ctx.ageMonths > 12,
    action: "add_language_specific_scales",
    priority: 7,
  },

  // ============ ANXIETY RULES ============
  {
    name: "ANXIETY_REQUIRE_VERBAL",
    condition: (ctx) => ctx.queixas?.includes("ansiedade") && ctx.verbal === false,
    action: "recommend_observational_scales",
    priority: 8,
  },
  {
    name: "ANXIETY_CHILD_SELF_REPORT",
    condition: (ctx) =>
      ctx.queixas?.includes("ansiedade") && ctx.ageMonths >= 96 && ctx.respondente === "crianca",
    action: "prioritize_rcads_scared",
    priority: 7,
  },

  // ============ BEHAVIOR RULES ============
  {
    name: "BEHAVIOR_CONTEXT_MATTERS",
    condition: (ctx) => ctx.queixas?.includes("comportamento"),
    action: "vary_by_context",
    priority: 8,
  },
  {
    name: "BEHAVIOR_HOME_ECBI",
    condition: (ctx) =>
      ctx.queixas?.includes("comportamento") && ctx.clinicalContext === "home",
    action: "prioritize_ecbi",
    priority: 7,
  },
  {
    name: "BEHAVIOR_SCHOOL_SDQ",
    condition: (ctx) =>
      ctx.queixas?.includes("comportamento") && ctx.clinicalContext === "school",
    action: "prioritize_sdq",
    priority: 7,
  },

  // ============ SAFETY RULES ============
  {
    name: "SUICIDE_AGE_RESTRICTION",
    condition: (ctx) => ctx.queixas?.includes("suicidio") && ctx.ageMonths < 96,
    action: "exclude_suicide_scales",
    priority: 10,
  },
  {
    name: "PSYCHOSIS_ADOLESCENT_ONLY",
    condition: (ctx) => ctx.queixas?.includes("psicose") && ctx.ageMonths < 144,
    action: "exclude_psychosis_scales",
    priority: 10,
  },

  // ============ METADATA RULES ============
  {
    name: "VERBAL_REQUIREMENT",
    condition: (ctx) => ctx.verbal === true && ctx.alphabetic === false,
    action: "exclude_alphabetic_scales",
    priority: 6,
  },
  {
    name: "NONVERBAL_PREFERENCE",
    condition: (ctx) => ctx.verbal === false,
    action: "prioritize_nonverbal_scales",
    priority: 7,
  },
  {
    name: "ASSESSMENT_TYPE_MATCH",
    condition: (ctx) => ctx.assessmentType === "diagnostic",
    action: "prioritize_diagnostic_scales",
    priority: 6,
  },
];

// ============ INTELLIGENT PRIORITIZATION ============

export function applyIntelligentRules(context: any, scales: any[]): any[] {
  let workingSet = [...scales];

  // Apply rules in priority order
  const sortedRules = [...clinicalRules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.condition(context)) {
      workingSet = applyRuleAction(workingSet, rule.action, context);
    }
  }

  return workingSet;
}

function applyRuleAction(scales: any[], action: string, context: any): any[] {
  const scaleId = (id: string) =>
    scales.filter((s) => s.id.toLowerCase().includes(id.toLowerCase()));
  const exclude = (pattern: string) =>
    scales.filter((s) => !s.id.toLowerCase().includes(pattern.toLowerCase()));

  switch (action) {
    case "exclude_tdah_scales":
      return exclude("snap") + exclude("conners") + exclude("brief");

    case "prioritize_mchat":
      return [
        ...scaleId("mchat"),
        ...scales.filter((s) => !s.id.toLowerCase().includes("mchat")),
      ];

    case "prioritize_ados2_cars2":
      const special = [
        ...scaleId("ados"),
        ...scaleId("cars"),
        ...scales.filter((s) => !s.id.includes("ados") && !s.id.includes("cars")),
      ];
      return special;

    case "prioritize_bayley_aims":
      return [
        ...scaleId("bayley"),
        ...scaleId("aims"),
        ...scales.filter((s) => !s.id.includes("bayley") && !s.id.includes("aims")),
      ];

    case "exclude_suicide_scales":
      return exclude("ecar") + exclude("ssrs") + exclude("suicide");

    case "exclude_psychosis_scales":
      return exclude("sips") + exclude("panss") + exclude("ymrs");

    case "prioritize_nonverbal_scales":
      return scales.filter((s) => s.verbal === false || s.verbal === undefined);

    case "exclude_alphabetic_scales":
      return scales.filter((s) => s.alphabetic !== true);

    case "prioritize_diagnostic_scales":
      return [
        ...scales.filter((s) => s.assessment_type === "diagnostic"),
        ...scales.filter((s) => s.assessment_type !== "diagnostic"),
      ];

    default:
      return scales;
  }
}

// ============ SIGNAL-TO-SCALE MAPPING ============

export const signalToScaleMapping: Record<string, string[]> = {
  // TDAH signals
  "hiperatividade": ["snap", "conners", "brief2", "cbcl"],
  "desatenção": ["snap", "brief2", "conners", "tova"],
  "impulsividade": ["snap", "conners", "brief2"],

  // TEA signals
  "contato-olho-ausente": ["ados2", "mchat", "cars2", "srs2"],
  "interesse-restrito": ["ados2", "cars2", "adir"],
  "estereotipias": ["ados2", "cars2"],

  // Development signals
  "motor-delay": ["aims", "bayley", "gmfcs"],
  "linguagem-atrasada": ["bayley", "celf5", "ast"],
  "desenvolvimento-global": ["bayley", "griffiths", "denver"],

  // Anxiety signals
  "preocupacao": ["scared", "rcads", "gad7"],
  "evitacao": ["scared", "rcads"],

  // Behavior signals
  "agressao": ["cbcl", "ecbi", "sdq"],
  "desafio": ["ecbi", "cbcl", "oppd"],
};

export function suggestScalesBySignals(signals: string[]): string[] {
  const suggested = new Set<string>();

  for (const signal of signals) {
    const scales = signalToScaleMapping[signal.toLowerCase()];
    if (scales) {
      scales.forEach((s) => suggested.add(s));
    }
  }

  return Array.from(suggested);
}

// ============ CLINICAL CONFIDENCE ASSESSMENT ============

export function assessClinicalConfidence(
  matchCount: number,
  contextCompleteness: number,
  rulesApplied: number
): number {
  // Confidence based on multiple factors
  let confidence = 50; // Base

  // More matches = higher confidence
  confidence += Math.min(20, matchCount * 2);

  // More context = higher confidence
  confidence += contextCompleteness * 5;

  // More rules applied = higher confidence (more specificity)
  confidence += Math.min(20, rulesApplied * 2);

  return Math.min(100, confidence);
}

// ============ RECOMMENDATION EXPLANATION ============

export function generateExplanation(
  scaleName: string,
  appliedRules: ClinicalRule[],
  score: number
): string {
  const reasons: string[] = [];

  reasons.push(`Score: ${score}/100`);

  for (const rule of appliedRules.slice(0, 2)) {
    reasons.push(`• ${rule.name.replace(/_/g, " ").toLowerCase()}`);
  }

  return `${scaleName}: ${reasons.join(" | ")}`;
}
