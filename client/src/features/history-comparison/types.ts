// Types for Historical Comparison and Trend Analysis

export interface AssessmentHistory {
  id: string;
  patientId: string;
  scaleId: string;
  scaleName: string;
  score: number;
  maxScore: number;
  timestamp: Date;
  assessor: string;
  assessmentPhase: "screening" | "diagnostic" | "monitoring";
}

export interface TrendAnalysis {
  scaleId: string;
  scaleName: string;
  totalAssessments: number;
  firstScore: number;
  lastScore: number;
  firstDate: Date;
  lastDate: Date;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  percentageChange: number; // (last - first) / first * 100
  averageScore: number;
  standardDeviation: number;
  daysSinceLastAssessment: number;
  recommendedRetestTiming?: {
    earlyOK: boolean;
    optimalDaysFromNow: number;
    reasoning: string;
  };
}

export interface RetestRecommendation {
  scaleId: string;
  scaleName: string;
  lastAssessmentDate: Date;
  daysSinceLast: number;
  recommendation: "retest_now" | "retest_soon" | "wait" | "no_history";
  reasoning: string;
  estimatedNextDate: Date;
  priority: "high" | "medium" | "low";
}

export interface ComparisonMetrics {
  totalScales: number;
  scalesImproving: number;
  scalesStable: number;
  decliningScales: number;
  averageTrend: number; // -1 to 1
  lastAssessmentDate: Date;
  mostRecentScale: string;
}
