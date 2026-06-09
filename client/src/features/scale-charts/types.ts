// Types for Scale Charts and Reports

export interface ScaleResult {
  id: string;
  patientId: string;
  scaleName: string;
  scaleId: string;
  score: number;
  maxScore: number;
  percentageScore: number;
  timestamp: Date;
  assessor: string; // who administered the scale
  respondent: string; // who answered (parent, teacher, clinician)
  notes?: string;
}

export interface LongitudinalChartData {
  date: string;
  score: number;
  timestamp: Date;
  assessor: string;
  notes?: string;
}

export interface ComparisonChartData {
  application: string;
  date: string;
  score: number;
  maxScore: number;
}

export interface DomainBreakdownData {
  domain: string;
  score: number;
  maxScore: number;
  percentage: number;
  color?: string;
}

export interface ChartConfig {
  title: string;
  subtitle?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
  height?: number;
}

export interface ScaleReportSummary {
  scaleId: string;
  scaleName: string;
  totalApplications: number;
  latestScore: number;
  trend: "improving" | "stable" | "declining" | "no-data";
  trendPercentage?: number; // percentage change from first to last
  clinicalInterpretation: string;
  recommendations: string[];
}
