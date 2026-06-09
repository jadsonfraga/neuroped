// Types for Expert Override Mode

export interface OverrideReason {
  id: string;
  category:
    | "clinical_exception"
    | "research_context"
    | "developmental_variance"
    | "cultural_adaptation"
    | "professional_judgment"
    | "other";
  description: string;
  evidence?: string; // Supporting evidence/documentation
}

export interface ScaleOverride {
  id: string;
  scaleId: string;
  scaleName: string;
  patientId: string;
  blockedReason: string; // e.g., "Reading required but child cannot read"
  blockingRule: string; // Rule that triggered the block
  overrideAuthorizedBy: string; // User/clinician name
  overrideReason: OverrideReason;
  additionalNotes: string;
  timestamp: Date;
  isApprovedByReviewer?: boolean;
  reviewerName?: string;
  reviewedAt?: Date;
  confidenceLevel: "low" | "medium" | "high";
}

export interface OverrideAuditLog {
  overrideId: string;
  action: "created" | "reviewed" | "approved" | "rejected";
  actor: string; // User who took action
  timestamp: Date;
  notes?: string;
}

export interface OverrideStatistics {
  totalOverrides: number;
  byCategory: Record<string, number>;
  pendingReview: number;
  approved: number;
  rejectedOrClosed: number;
  commonBlockingRules: Array<{ rule: string; count: number }>;
}
