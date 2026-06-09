// Types for Multidisciplinary Integration

export type ProfessionalType =
  | "neuro"
  | "psicolog"
  | "fono"
  | "to"
  | "pedagogo"
  | "pediatra"
  | "outro";

export interface Observation {
  id: string;
  patientId: string;
  professionalType: ProfessionalType;
  professionalName: string;
  professionalCRM?: string;
  observationText: string;
  timestamp: Date;
  createdByUserId: string;
  tags?: string[]; // e.g., "screening", "behavioral", "language"
  relatedScales?: string[]; // IDs of scales this observation relates to
  confidenceLevel?: "low" | "medium" | "high"; // clinician's confidence in observation
}

export interface ProfessionalProfile {
  type: ProfessionalType;
  label: string;
  color: string;
  icon: string;
  emoji: string;
}

export interface ObservationPanelProps {
  patientId: string;
  observations: Observation[];
  onAddObservation?: (observation: Omit<Observation, "id" | "timestamp">) => void;
  onDeleteObservation?: (observationId: string) => void;
  onEditObservation?: (observation: Observation) => void;
}

export interface ObservationStats {
  totalCount: number;
  byProfessional: Record<ProfessionalType, number>;
  latestObservation?: Observation;
  timelineRange: { start: Date; end: Date };
}
