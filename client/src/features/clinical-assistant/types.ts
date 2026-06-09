// Types for Clinical Intelligence Assistant

export interface BatteryPhase {
  id: "screening" | "diagnostic" | "optional";
  label: string;
  duration: number; // minutes
  scales: BatteryScale[];
}

export interface BatteryScale {
  id: string;
  name: string;
  respondent: string;
  duration: number;
  priority: "essential" | "complementary" | "optional";
  reasoning: string;
}

export interface SuggestedBattery {
  id: string;
  name: string;
  totalDuration: number;
  phases: BatteryPhase[];
  explanation: string;
  clinicalNotes: string;
  estimatedTimeRange: { min: number; max: number };
}

export interface ClinicalAssistantInput {
  age: number; // months
  complaint: string; // main complaint
  respondentsAvailable: ("pais" | "professor" | "clinico" | "crianca")[];
  timeAvailable: number; // minutes
  previousAssessments?: string[]; // scale IDs of previous assessments
  childCapabilities?: {
    canRead: boolean;
    canWrite: boolean;
    verbal: boolean;
  };
}

export interface AssistantSuggestion {
  battery: SuggestedBattery;
  alternativeOptions: SuggestedBattery[];
  warnings: ClinicianWarning[];
  confidence: number; // 0-100
}

export interface ClinicianWarning {
  id: string;
  severity: "info" | "warning" | "alert";
  message: string;
  actionItems?: string[];
}
