/**
 * Checklist canônico do onboarding SaaS.
 *
 * O backend projeta estes marcos exclusivamente de fatos persistidos. A UI
 * recebe o resultado; ela nunca pode marcar uma etapa como concluída por
 * redirect, localStorage ou estado otimista.
 */
export const onboardingMilestoneDefinitions = [
  { key: "account_created", label: "Conta criada", source: "users.created_at" },
  { key: "email_verified", label: "E-mail verificado", source: "users.email_verified_at" },
  { key: "clinic_created", label: "Clínica criada", source: "clinics.created_at" },
  { key: "plan_selected", label: "Plano selecionado", source: "billing_subscriptions.created_at" },
  {
    key: "billing_configured",
    label: "Billing confirmado",
    source: "billing_invoice_events.charge_paid",
  },
  {
    key: "first_member",
    label: "Primeiro membro da equipe",
    source: "clinic_memberships.created_at",
  },
  {
    key: "first_patient",
    label: "Primeiro paciente",
    source: "saas_audit_log.live_patient_create",
  },
  {
    key: "first_consultation",
    label: "Primeira consulta",
    source: "saas_audit_log.live_clinical_event_create.encounter",
  },
  {
    key: "first_document",
    label: "Primeiro documento",
    source: "saas_audit_log.live_document_create",
  },
  {
    key: "first_assessment",
    label: "Primeira avaliação",
    source: "saas_audit_log.live_assessment_create",
  },
] as const;

export type OnboardingMilestoneKey =
  (typeof onboardingMilestoneDefinitions)[number]["key"];
export type OnboardingMilestoneSource =
  (typeof onboardingMilestoneDefinitions)[number]["source"];
export type OnboardingMilestoneStatus =
  | "completed"
  | "pending"
  | "blocked_external";

export interface OnboardingMilestone {
  key: OnboardingMilestoneKey;
  label: string;
  status: OnboardingMilestoneStatus;
  completedAt: string | null;
  source: OnboardingMilestoneSource;
}

export interface OnboardingProgress {
  completed: number;
  total: number;
  percent: number;
}

export type BillingEvidenceStatus =
  | "SERVER_CONFIRMED"
  | "AWAITING_PROVIDER_EVENT"
  | "BLOCKED_EXTERNAL";

export interface OnboardingBillingEvidence {
  status: BillingEvidenceStatus;
  provider: "asaas";
  environment: "sandbox" | "production" | null;
  confirmedAt: string | null;
  source: "billing_invoice_events.charge_paid" | null;
  limitation: string;
}

export interface TenantOnboardingSnapshot {
  clinicId: string;
  generatedAt: string;
  progress: OnboardingProgress;
  billingEvidence: OnboardingBillingEvidence;
  milestones: OnboardingMilestone[];
}

export function computeOnboardingProgress(
  milestones: readonly OnboardingMilestone[],
): OnboardingProgress {
  const completed = milestones.filter(
    (milestone) => milestone.status === "completed",
  ).length;
  const total = milestones.length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
