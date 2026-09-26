/** Server-authored progress over persisted records. Not a financial or commercial-readiness attestation. */
export const ONBOARDING_STEPS = [
  { id: "account_created", label: "Conta criada", source: "users.created_at" },
  { id: "email_verified", label: "Posse do e-mail verificada", source: "users.email_verified_at" },
  { id: "clinic_created", label: "Clínica criada", source: "clinics.created_at" },
  { id: "plan_selected", label: "Checkout do plano iniciado", source: "billing_provider_checkouts.created_at" },
  { id: "billing_configured", label: "Cobrança real validada no provedor", source: "external_provider_confirmation_required" },
  { id: "first_member", label: "Primeiro vínculo de equipe (inclui proprietário)", source: "clinic_memberships.created_at" },
  { id: "first_patient", label: "Paciente cadastrado", source: "live_patients.created_at" },
  { id: "first_consultation", label: "Consulta registrada", source: "live_clinical_events.created_at:encounter" },
  { id: "first_document", label: "Documento salvo (inclui rascunho)", source: "live_documents.created_at" },
  { id: "first_assessment", label: "Avaliação registrada", source: "live_assessments.created_at" },
] as const;
export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];
export interface OnboardingProgress {
  schemaVersion: "neuroped-onboarding-v1";
  asOf: string;
  sourceScope: "retained_tenant_records";
  steps: Array<{ id: OnboardingStepId; label: string; source: string; status: "observed" | "not_observed" | "not_measured"; observedAt: string | null }>;
  observedSteps: number;
  totalSteps: number;
  percent: number;
  commercialReadinessVerified: false;
}

function timestamp(value: unknown, now: Date): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error("ONBOARDING_INVALID_TIMESTAMP");
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(" ", "T")}Z` : value;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)) throw new Error("ONBOARDING_INVALID_TIMESTAMP");
  const date = new Date(normalized);
  const day = new Date(`${normalized.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(day.getTime()) || date.getTime() > now.getTime()
    || day.toISOString().slice(0, 10) !== normalized.slice(0, 10)
    || Number(normalized.slice(11, 13)) > 23 || Number(normalized.slice(14, 16)) > 59 || Number(normalized.slice(17, 19)) > 59) throw new Error("ONBOARDING_INVALID_TIMESTAMP");
  return date.toISOString();
}

export function buildOnboardingProgress(facts: unknown, now = new Date()): OnboardingProgress {
  if (!Number.isFinite(now.getTime()) || !facts || typeof facts !== "object" || Array.isArray(facts)) throw new Error("ONBOARDING_INVALID_SOURCE");
  const record = facts as Record<string, unknown>;
  const steps: OnboardingProgress["steps"] = ONBOARDING_STEPS.map(step => {
    if (step.id === "billing_configured") return { ...step, status: "not_measured", observedAt: null };
    if (!Object.hasOwn(record, step.id)) throw new Error("ONBOARDING_MISSING_SOURCE_COLUMN");
    const observedAt = timestamp(record[step.id], now);
    return { ...step, status: observedAt === null ? "not_observed" : "observed", observedAt };
  });
  const observedSteps = steps.filter(step => step.status === "observed").length;
  return { schemaVersion: "neuroped-onboarding-v1", asOf: now.toISOString(), sourceScope: "retained_tenant_records",
    steps, observedSteps, totalSteps: steps.length, percent: Math.round(observedSteps / steps.length * 100), commercialReadinessVerified: false };
}

/** Validate the server DTO before rendering; missing/error data must never become fabricated zero. */
export function parseOnboardingProgress(value: unknown): OnboardingProgress {
  if (!value || typeof value !== "object") throw new Error("ONBOARDING_RESPONSE_INVALID");
  const row = value as OnboardingProgress;
  if (row.schemaVersion !== "neuroped-onboarding-v1" || row.sourceScope !== "retained_tenant_records" || row.commercialReadinessVerified !== false
    || !Array.isArray(row.steps) || row.steps.length !== ONBOARDING_STEPS.length || typeof row.asOf !== "string") throw new Error("ONBOARDING_RESPONSE_INVALID");
  const asOf = new Date(row.asOf);
  if (!Number.isFinite(asOf.getTime())) throw new Error("ONBOARDING_RESPONSE_INVALID");
  const facts: Record<string, unknown> = {};
  ONBOARDING_STEPS.forEach((step, index) => {
    const entry = row.steps[index];
    if (!entry || entry.id !== step.id || entry.label !== step.label || entry.source !== step.source) throw new Error("ONBOARDING_RESPONSE_INVALID");
    facts[step.id] = entry.observedAt;
  });
  const expected = buildOnboardingProgress(facts, asOf);
  if (row.observedSteps !== expected.observedSteps || row.totalSteps !== expected.totalSteps || row.percent !== expected.percent
    || row.steps.some((step, index) => step.status !== expected.steps[index].status || step.observedAt !== expected.steps[index].observedAt)) throw new Error("ONBOARDING_RESPONSE_INVALID");
  return expected;
}
