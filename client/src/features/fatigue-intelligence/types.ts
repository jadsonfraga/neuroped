// Clinical Fatigue Intelligence — Optimal test battery length

export interface BatteryFatigueAnalysis {
  totalDuration: number;
  scaleCount: number;
  estimatedCognitiveLoad: "light" | "moderate" | "heavy" | "excessive";
  fatigueRisk: number; // 0-100
  recommendedMaxDuration: number;
  isTooLong: boolean;
  childAge: number;
  childDevelopmentalLevel: "infant" | "toddler" | "preschool" | "school" | "adolescent";
}

export interface FatigueAlternative {
  id: string;
  scaleIds: string[];
  totalDuration: number;
  removedScaleId: string;
  removedScaleName: string;
  reasoning: string;
  fatigueReduction: number; // percentage
  clinicalImpact: "minimal" | "low" | "moderate" | "significant";
}

export interface FatigueGuidelines {
  ageGroup: string;
  recommendedMaxMinutes: number;
  breakRecommendation: string;
  signs: string[]; // Signs of fatigue to watch for
}
