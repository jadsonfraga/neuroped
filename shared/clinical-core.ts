import { z } from "zod";

/**
 * NeuroPed Clinical Core
 *
 * Contrato longitudinal canônico do produto. Ele não prescreve, diagnostica
 * nem infere normalidade. Seu papel é registrar eventos clínicos estruturados
 * com proveniência explícita e permitir que diferentes módulos (Conecta,
 * Notes, escalas, documentos e futuras integrações) conversem sobre a mesma
 * jornada do paciente.
 */

export const clinicalEventTypes = [
  "encounter",
  "problem",
  "medication",
  "observation",
  "plan",
  "outcome",
  "safety",
] as const;
export type ClinicalEventType = (typeof clinicalEventTypes)[number];

export const clinicalProvenanceKinds = [
  "reported",
  "observed",
  "measured",
  "documented",
  "inferred",
  "decision",
] as const;
export type ClinicalProvenanceKind = (typeof clinicalProvenanceKinds)[number];

export const clinicalSources = [
  "patient",
  "family",
  "school",
  "therapist",
  "clinician",
  "instrument",
  "laboratory",
  "imaging",
  "eeg",
  "genetics",
  "document",
  "device",
  "system",
  "other",
] as const;
export type ClinicalSource = (typeof clinicalSources)[number];

export const clinicalEventStatuses = ["active", "corrected", "voided"] as const;
export type ClinicalEventStatus = (typeof clinicalEventStatuses)[number];

export const encounterTypes = [
  "initial",
  "followup",
  "telemedicine",
  "eeg_review",
  "report_review",
  "school_meeting",
  "multidisciplinary",
  "other",
] as const;

export const problemCertainties = ["suspected", "working", "confirmed", "ruled_out"] as const;
export const problemStatuses = ["active", "inactive", "resolved"] as const;
export const problemActions = ["add", "update", "resolve", "rule_out"] as const;

export const medicationActions = [
  "reported_use",
  "start",
  "continue",
  "adjust",
  "hold",
  "stop",
] as const;

export const findingStatuses = ["present", "absent", "not_assessed", "unknown"] as const;

export const observationDomains = [
  "development",
  "communication",
  "behavior",
  "attention",
  "sleep",
  "appetite",
  "growth",
  "consciousness_interaction",
  "language_speech",
  "cranial_nerves",
  "strength_tone",
  "coordination",
  "reflexes",
  "gait_balance",
  "involuntary_movements",
  "psychomotor_activity",
  "mood_affect",
  "thought",
  "perception",
  "orientation",
  "insight_judgment",
  "suicidal_ideation",
  "seizure",
  "headache",
  "sensory",
  "autonomy",
  "school_function",
  "other",
] as const;

export const planKinds = [
  "followup",
  "exam",
  "referral",
  "therapy",
  "school",
  "education",
  "monitoring",
  "safety_plan",
  "medication_review",
  "other",
] as const;

export const planStatuses = ["planned", "in_progress", "completed", "cancelled"] as const;
export const planPriorities = ["routine", "priority", "urgent"] as const;

export const safetyDomains = [
  "suicide_self_harm",
  "seizure_emergency",
  "medication_adverse_event",
  "aggression",
  "abuse_neglect",
  "acute_neurologic_change",
  "other",
] as const;
export const safetySeverities = ["low", "moderate", "high", "critical"] as const;

const boundedId = z.string().trim().min(1).max(128);
const isoInstant = z.string().datetime({ offset: true });
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const clinicalProvenanceSchema = z
  .object({
    kind: z.enum(clinicalProvenanceKinds),
    source: z.enum(clinicalSources),
    sourceLabel: optionalText(160),
    capturedAt: isoInstant.optional(),
  })
  .strict();

const eventBase = z.object({
  patientId: boundedId,
  occurredAt: isoInstant,
  encounterId: boundedId.optional(),
  provenance: clinicalProvenanceSchema,
  note: optionalText(5_000),
  supersedesEventId: boundedId.optional(),
});

const encounterDataSchema = z
  .object({
    encounterType: z.enum(encounterTypes),
    reason: optionalText(500),
    setting: z.enum(["clinic", "telemedicine", "hospital", "school", "home", "other"]).optional(),
  })
  .strict();

const problemDataSchema = z
  .object({
    action: z.enum(problemActions),
    label: z.string().trim().min(1).max(240),
    codeSystem: z.enum(["CID10", "CID11", "SNOMED", "internal"]).optional(),
    code: optionalText(40),
    certainty: z.enum(problemCertainties),
    status: z.enum(problemStatuses),
    rationale: optionalText(2_000),
  })
  .strict();

const medicationDataSchema = z
  .object({
    action: z.enum(medicationActions),
    genericName: z.string().trim().min(1).max(160),
    brandName: optionalText(160),
    doseMg: z.number().finite().nonnegative().max(100_000).optional(),
    doseMgKgDay: z.number().finite().nonnegative().max(10_000).optional(),
    doseMgKgDose: z.number().finite().nonnegative().max(10_000).optional(),
    formulation: optionalText(160),
    route: optionalText(80),
    frequency: optionalText(120),
    indication: optionalText(500),
    targetSymptom: optionalText(500),
    effectiveFrom: isoInstant.optional(),
    effectiveTo: isoInstant.optional(),
    reason: optionalText(1_000),
  })
  .strict();

const observationDataSchema = z
  .object({
    domain: z.enum(observationDomains),
    findingStatus: z.enum(findingStatuses),
    valueNumber: z.number().finite().optional(),
    unit: optionalText(40),
    valueText: optionalText(1_000),
    redFlag: z.boolean().optional(),
  })
  .strict();

const planDataSchema = z
  .object({
    kind: z.enum(planKinds),
    target: z.string().trim().min(1).max(1_000),
    status: z.enum(planStatuses).default("planned"),
    priority: z.enum(planPriorities).default("routine"),
    dueAt: isoInstant.optional(),
    responsibleRole: optionalText(160),
    successCriterion: optionalText(1_000),
  })
  .strict();

const outcomeDataSchema = z
  .object({
    domain: z.string().trim().min(1).max(120),
    measure: z.string().trim().min(1).max(240),
    valueNumber: z.number().finite().optional(),
    valueText: optionalText(1_000),
    unit: optionalText(40),
    direction: z.enum(["improved", "stable", "worsened", "mixed", "unknown"]).optional(),
    comparisonWindowDays: z.number().int().min(1).max(3_650).optional(),
  })
  .strict();

const safetyDataSchema = z
  .object({
    domain: z.enum(safetyDomains),
    severity: z.enum(safetySeverities),
    status: z.enum(["identified", "addressed", "escalated", "resolved"]),
    actionTaken: z.string().trim().min(1).max(2_000),
    destination: optionalText(500),
    followupHours: z.number().int().min(1).max(720).optional(),
  })
  .strict();

export const clinicalEventInputSchema = z.discriminatedUnion("eventType", [
  eventBase.extend({ eventType: z.literal("encounter"), data: encounterDataSchema }).strict(),
  eventBase.extend({ eventType: z.literal("problem"), data: problemDataSchema }).strict(),
  eventBase.extend({ eventType: z.literal("medication"), data: medicationDataSchema }).strict(),
  eventBase.extend({ eventType: z.literal("observation"), data: observationDataSchema }).strict(),
  eventBase.extend({ eventType: z.literal("plan"), data: planDataSchema }).strict(),
  eventBase.extend({ eventType: z.literal("outcome"), data: outcomeDataSchema }).strict(),
  eventBase.extend({ eventType: z.literal("safety"), data: safetyDataSchema }).strict(),
]);

export type ClinicalEventInput = z.infer<typeof clinicalEventInputSchema>;

export type ClinicalEvent = ClinicalEventInput & {
  id: string;
  authorUserId?: string | null;
  status: ClinicalEventStatus;
  createdAt: string;
  storageMode?: "remote" | "demo-db";
};

export const clinicalEventQuerySchema = z
  .object({
    patientId: boundedId,
    days: z.number().int().min(1).max(3_650).default(365),
    eventTypes: z.array(z.enum(clinicalEventTypes)).max(clinicalEventTypes.length).optional(),
  })
  .strict();

/**
 * Hard rules do Clinical Core:
 * - ausência de registro nunca equivale a normalidade;
 * - inferência é armazenada como inferência, não como relato/observação;
 * - alteração clínica é append-only: correções supersedem, não apagam história;
 * - o contrato registra decisões já tomadas; não gera prescrição autônoma.
 */
export const CLINICAL_CORE_SAFETY_RULES = Object.freeze({
  noNormalityByOmission: true,
  provenanceRequired: true,
  appendOnlyCorrections: true,
  autonomousPrescription: false,
  autonomousDiagnosis: false,
});
