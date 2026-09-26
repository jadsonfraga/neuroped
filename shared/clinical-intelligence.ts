import type { ClinicalEventType, ClinicalProvenanceKind, ClinicalSource } from "./clinical-core";

/** Read model over the existing LIVE event API. No parallel clinical store or autonomous decision. */
export interface LongitudinalEvent {
  id: string;
  clinicId: string;
  patientId: string;
  authorUserId: string;
  eventType: ClinicalEventType | "document" | "scale_result";
  occurredAt: string;
  createdAt: string;
  provenanceKind: ClinicalProvenanceKind | "imported";
  provenanceSource: ClinicalSource;
  payload: Record<string, unknown>;
  status: "active" | "corrected" | "voided";
}

export const INTELLIGENCE_VERSION = "neuroped-longitudinal-v1";
export const INTELLIGENCE_DOMAINS = [
  "communication", "social_interaction", "attention", "executive_functions", "learning",
  "behavior", "sleep", "feeding", "sensory", "motor_development", "language", "mood",
  "anxiety", "epilepsy", "medications", "school", "autonomy",
] as const;
const ALIASES: Readonly<Record<string, string>> = Object.freeze({
  appetite: "feeding", language_speech: "language", mood_affect: "mood",
  seizure: "epilepsy", school_function: "school", strength_tone: "motor_development",
  gait_balance: "motor_development", coordination: "motor_development",
});
const KINDS = new Set(["reported", "observed", "measured", "documented", "inferred", "decision", "imported"]);
const SOURCES = new Set(["patient", "family", "school", "therapist", "clinician", "instrument", "laboratory", "imaging", "eeg", "genetics", "document", "device", "system", "other"]);
const TYPES = new Set(["encounter", "problem", "medication", "observation", "plan", "outcome", "safety", "document", "scale_result"]);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const DAY = 86_400_000;

function instant(value: unknown): number {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error("INTELLIGENCE_INVALID_INSTANT");
  }
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const check = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  const time = Date.parse(value);
  if (!Number.isFinite(time) || check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day || Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) {
    throw new Error("INTELLIGENCE_INVALID_INSTANT");
  }
  return time;
}

function nature(event: LongitudinalEvent): string {
  if (event.eventType === "problem" && ["suspected", "working"].includes(String(event.payload.certainty))) return "HIPOTESE";
  const names: Record<string, string> = {
    reported: "RELATO", observed: "OBSERVACAO", measured: "RESULTADO",
    documented: "REGISTRO_DOCUMENTAL", inferred: "INTERPRETACAO", decision: "DECISAO_PROFISSIONAL", imported: "DOCUMENTO_ORIGINAL",
  };
  return names[event.provenanceKind];
}

function domainOf(event: LongitudinalEvent): string | null {
  if (event.eventType === "medication") return "medications";
  const raw = event.eventType === "plan" ? event.payload.goalDomain : event.payload.domain;
  if (!text(raw)) return null;
  const mapped = Object.hasOwn(ALIASES, raw) ? ALIASES[raw] : raw;
  return (INTELLIGENCE_DOMAINS as readonly string[]).includes(mapped) ? mapped : null;
}

function comparable(event: LongitudinalEvent): boolean {
  const data = event.payload;
  // A stable, professionally defined goal/measure is necessary. Domain alone is not a measure.
  // Raw questionnaires, interpretations and generic observations cannot enter numeric comparisons.
  return event.eventType === "outcome" && ["reported", "observed", "measured"].includes(event.provenanceKind)
    && text(data.goalId) && text(data.domain) && text(data.measure) && text(data.unit)
    && text(data.context) && finite(data.valueNumber);
}

function measureKey(event: LongitudinalEvent): string {
  const data = event.payload;
  return JSON.stringify([data.goalId, data.domain, data.measure, data.unit, data.context]);
}

export function buildClinicalIntelligence(
  input: readonly unknown[],
  scope: { clinicId: string; patientId: string },
  options: { now: string; recencyDays?: number; sourceWindowComplete?: boolean },
) {
  if (!text(scope.clinicId) || !text(scope.patientId)) throw new Error("INTELLIGENCE_SCOPE_REQUIRED");
  const now = instant(options.now);
  const recencyDays = options.recencyDays ?? 90;
  if (!Number.isInteger(recencyDays) || recencyDays < 1 || recencyDays > 3650) throw new Error("INTELLIGENCE_INVALID_WINDOW");
  if (!Array.isArray(input) || input.length > 500) throw new Error("INTELLIGENCE_WINDOW_LIMIT");
  const encoded = JSON.stringify(input, (_key, value: unknown) => {
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("INTELLIGENCE_NON_FINITE_VALUE");
    return value;
  });
  if (new TextEncoder().encode(encoded).byteLength > 2_000_000) throw new Error("INTELLIGENCE_PAYLOAD_LIMIT");
  const ids = new Set<string>();
  const events = (JSON.parse(encoded) as LongitudinalEvent[]).map((event) => {
    if (!event || typeof event !== "object") throw new Error("INTELLIGENCE_INVALID_EVENT");
    if (event.clinicId !== scope.clinicId || event.patientId !== scope.patientId) throw new Error("INTELLIGENCE_SCOPE_MISMATCH");
    if (!text(event.id) || !text(event.authorUserId) || !KINDS.has(event.provenanceKind) || !SOURCES.has(event.provenanceSource)
      || !TYPES.has(event.eventType) || !["active", "corrected", "voided"].includes(event.status)
      || !event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) {
      throw new Error("INTELLIGENCE_PROVENANCE_OR_EVENT_INVALID");
    }
    instant(event.occurredAt); instant(event.createdAt);
    if (ids.has(event.id)) throw new Error("INTELLIGENCE_DUPLICATE_ID");
    ids.add(event.id);
    return event;
  }).sort((a, b) => instant(a.occurredAt) - instant(b.occurredAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const active = events.filter(event => event.status === "active" && instant(event.occurredAt) <= now);
  const sourceWindowComplete = options.sourceWindowComplete === true && events.length < 500;
  const limitations = new Set<string>([
    "PROFESSIONAL_REVIEW_REQUIRED", "SOURCE_CATEGORY_IS_NOT_RATER_IDENTITY",
    "NUMERIC_CHANGE_IS_NOT_CLINICAL_IMPROVEMENT", "UNSTRUCTURED_DOCUMENTS_NOT_AUTOMATICALLY_EXTRACTED",
  ]);
  if (!sourceWindowComplete) limitations.add("SOURCE_WINDOW_INCOMPLETE");
  if (events.some(event => instant(event.occurredAt) > now)) limitations.add("FUTURE_EVENTS_EXCLUDED_FROM_ANALYSIS");

  const numericDeltas: Array<{ goalId: string; domain: string; measure: string; unit: string; context: string;
    eventIds: [string, string]; before: number; after: number; change: number; comparability: "structural_only"; requiresReview: true; clinicalDirection: "not_inferred" }> = [];
  const groups = new Map<string, LongitudinalEvent[]>();
  const measurements = active.filter(comparable);
  for (const event of measurements) {
    const key = JSON.stringify([measureKey(event), event.provenanceSource, event.provenanceKind, event.authorUserId]);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    if (new Set(group.map(event => instant(event.occurredAt))).size !== group.length) {
      limitations.add("AMBIGUOUS_SAME_INSTANT_POINTS");
      continue;
    }
    const before = group[0], after = group[group.length - 1];
    const data = after.payload;
    const change = Number(data.valueNumber) - Number(before.payload.valueNumber);
    if (!Number.isFinite(change)) { limitations.add("NUMERIC_OVERFLOW_NOT_COMPARED"); continue; }
    numericDeltas.push({ goalId: String(data.goalId), domain: String(data.domain), measure: String(data.measure),
      unit: String(data.unit), context: String(data.context), eventIds: [before.id, after.id],
      before: Number(before.payload.valueNumber), after: Number(data.valueNumber), change, comparability: "structural_only", requiresReview: true, clinicalDirection: "not_inferred" });
  }

  const potentialDivergences: Array<{ eventIds: [string, string]; requiresReview: true }> = [];
  divergenceLoop: for (let a = 0; a < measurements.length; a++) {
    for (let b = a + 1; b < measurements.length; b++) {
      const left = measurements[a], right = measurements[b];
      if (measureKey(left) !== measureKey(right) || left.provenanceSource === right.provenanceSource
        || Math.floor(instant(left.occurredAt) / DAY) !== Math.floor(instant(right.occurredAt) / DAY)
        || left.payload.valueNumber === right.payload.valueNumber) continue;
      if (potentialDivergences.length === 100) { limitations.add("DIVERGENCES_TRUNCATED"); break divergenceLoop; }
      potentialDivergences.push({ eventIds: [left.id, right.id], requiresReview: true });
    }
  }

  const safetyAlerts: Array<{ code: string; eventIds: string[]; requiresReview: true }> = [];
  const alert = (code: string, eventIds: string[]) => safetyAlerts.push({ code, eventIds, requiresReview: true });
  for (const event of active) {
    const data = event.payload;
    if (event.eventType === "observation" && data.redFlag === true) alert("DOCUMENTED_RED_FLAG", [event.id]);
    if (event.eventType === "safety" && data.severity === "critical" && ["identified", "escalated"].includes(String(data.status))) alert("DOCUMENTED_CRITICAL_ALERT", [event.id]);
    if (event.eventType === "safety" && data.domain === "medication_adverse_event" && data.status !== "resolved") alert("DOCUMENTED_ADVERSE_EVENT", [event.id]);
    if (event.eventType === "observation" && finite(data.valueNumber) && !text(data.unit)) alert("NUMERIC_UNIT_NOT_DOCUMENTED", [event.id]);
    if (event.eventType !== "medication" || ["stop", "hold"].includes(String(data.action))) continue;
    if ([data.doseMg, data.doseMgKgDay, data.doseMgKgDose].some(value => finite(value) && value < 0)) alert("NEGATIVE_DOSE_REQUIRES_CORRECTION", [event.id]);
    if (finite(data.doseMgKgDay) || finite(data.doseMgKgDose)) {
      const weight = active.some(candidate => candidate.eventType === "observation" && candidate.payload.domain === "growth"
        && candidate.payload.unit === "kg" && finite(candidate.payload.valueNumber) && candidate.payload.valueNumber > 0
        && instant(candidate.occurredAt) <= instant(event.occurredAt)
        && instant(event.occurredAt) - instant(candidate.occurredAt) <= recencyDays * DAY);
      if (!weight) alert("WEIGHT_NOT_DOCUMENTED_AT_MEDICATION_EVENT", [event.id]);
    }
  }
  const domainCoverage = INTELLIGENCE_DOMAINS.map(domain => {
    const matching = active.filter(event => domainOf(event) === domain);
    const last = matching[matching.length - 1];
    return { domain, lastEventId: last?.id ?? null, lastOccurredAt: last?.occurredAt ?? null,
      status: !last ? "not_documented_in_window" : now - instant(last.occurredAt) > recencyDays * DAY ? "not_recent_in_window" : "documented_in_window" };
  });
  return {
    version: INTELLIGENCE_VERSION, scope: { ...scope }, asOf: new Date(now).toISOString(),
    coverage: { sourceWindowComplete, eventCount: events.length, eligibleEventCount: active.length, recencyDays,
      scope: "returned_live_events_only", historicalCompletenessVerified: false },
    timeline: events.map(event => ({ ...event, nature: nature(event) })),
    numericDeltas, potentialDivergences, domainCoverage, safetyAlerts,
    unstructuredSourceIds: active.filter(event => ["document", "scale_result"].includes(event.eventType)).map(event => event.id).sort(),
    limitations: [...limitations].sort(),
    draft: { status: "draft", sourceIds: active.map(event => event.id), professionalReviewRequired: true,
      finalDocument: false, autonomousDiagnosis: false, autonomousPrescription: false },
  };
}
