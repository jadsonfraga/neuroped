export const CLINICAL_SOURCE_TYPES = [
  "parent_report",
  "school_report",
  "therapist_report",
  "physician_observation",
  "exam_result",
  "scale_result",
  "ai_inference",
] as const;

export type ClinicalSourceType = (typeof CLINICAL_SOURCE_TYPES)[number];

export const SPEAKER_ROLES = [
  "physician",
  "patient",
  "mother",
  "father",
  "teacher",
  "therapist",
  "companion",
  "unknown",
] as const;

export type SpeakerRole = (typeof SPEAKER_ROLES)[number];

export const REVIEW_STATUSES = [
  "pending",
  "confirmed",
  "corrected",
  "rejected",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CLINICAL_SECTIONS = [
  "chief_complaint",
  "history_present_illness",
  "pregnancy",
  "delivery",
  "neonatal_period",
  "motor_development",
  "language_development",
  "social_interaction",
  "repetitive_behaviors",
  "sensory_profile",
  "sleep",
  "feeding",
  "autonomy",
  "school",
  "learning",
  "behavior",
  "mood",
  "anxiety",
  "seizures",
  "epilepsy",
  "medications",
  "allergies",
  "medical_history",
  "family_history",
  "physician_notes",
  "hypotheses",
  "plan",
  "guidance",
] as const;

export type ClinicalSection = (typeof CLINICAL_SECTIONS)[number];

export interface TranscriptSpan {
  startMs: number;
  endMs: number;
  segmentId: string;
}

export interface ClinicalProvenance {
  sourceType: ClinicalSourceType;
  speakerRole: SpeakerRole;
  observedAt?: string;
  recordedAt: string;
  transcriptSpan?: TranscriptSpan;
  confidence?: number;
  reviewStatus: ReviewStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
}

export interface ClinicalFact {
  id: string;
  consultationId: string;
  section: ClinicalSection;
  text: string;
  provenance: ClinicalProvenance;
  createdAt: string;
  updatedAt: string;
}

export interface AiSuggestion {
  id: string;
  consultationId: string;
  kind:
    | "missing_question"
    | "clinical_summary"
    | "timeline_event"
    | "inconsistency"
    | "cognitive_bias"
    | "differential_diagnosis"
    | "safety_check";
  text: string;
  evidenceFactIds: string[];
  confidence?: number;
  reviewStatus: ReviewStatus;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  consultationId: string;
  occurredAt?: string;
  ageInMonths?: number;
  category:
    | "pregnancy"
    | "delivery"
    | "development"
    | "first_words"
    | "first_steps"
    | "school"
    | "diagnosis"
    | "medication"
    | "seizure"
    | "hospitalization"
    | "surgery"
    | "therapy"
    | "consultation";
  text: string;
  evidenceFactIds: string[];
  reviewStatus: ReviewStatus;
}

export interface TranscriptionInput {
  consultationId: string;
  audioObjectKey: string;
  language: "pt-BR" | string;
  expectedSpeakerCount?: number;
  vocabularyHints?: string[];
}

export interface TranscriptSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speakerLabel?: string;
  speakerRole: SpeakerRole;
  confidence?: number;
}

export interface TranscriptionResult {
  providerId: string;
  providerJobId?: string;
  language: string;
  durationMs: number;
  segments: TranscriptSegment[];
  rawText: string;
}

export interface ProviderHealth {
  available: boolean;
  latencyMs?: number;
  checkedAt: string;
  detail?: string;
}

export interface TranscriptionProvider {
  readonly id: string;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
  healthCheck(): Promise<ProviderHealth>;
}

export function isAiGeneratedSource(sourceType: ClinicalSourceType): boolean {
  return sourceType === "ai_inference";
}

export function canBeTreatedAsConfirmedFact(fact: ClinicalFact): boolean {
  return (
    fact.provenance.sourceType !== "ai_inference" &&
    fact.provenance.reviewStatus === "confirmed"
  );
}

export function assertValidConfidence(confidence?: number): void {
  if (confidence === undefined) return;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new RangeError("Confidence must be a finite number between 0 and 1.");
  }
}
