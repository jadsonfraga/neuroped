import type { BillingProviderEnv } from "../../billing/_provider";
import { getContextUser } from "../../auth/_authorization";
import {
  computeOnboardingProgress,
  onboardingMilestoneDefinitions,
  type BillingEvidenceStatus,
  type OnboardingMilestone,
  type OnboardingMilestoneKey,
  type TenantOnboardingSnapshot,
} from "../../../../shared/onboarding";
import { rolesWithPermission } from "../../../../shared/permissions";
import { tenantError, tenantJson, type TenantEnv } from "../../tenant/_core";

interface Env extends TenantEnv, BillingProviderEnv {}

interface OnboardingFactsRow {
  account_created_at: string | null;
  email_verified_at: string | null;
  clinic_created_at: string | null;
  plan_selected_at: string | null;
  billing_configured_at: string | null;
  first_member_at: string | null;
  first_patient_at: string | null;
  first_consultation_at: string | null;
  first_document_at: string | null;
  first_assessment_at: string | null;
}

const MILESTONE_COLUMNS: Readonly<Record<OnboardingMilestoneKey, keyof OnboardingFactsRow>> = {
  account_created: "account_created_at",
  email_verified: "email_verified_at",
  clinic_created: "clinic_created_at",
  plan_selected: "plan_selected_at",
  billing_configured: "billing_configured_at",
  first_member: "first_member_at",
  first_patient: "first_patient_at",
  first_consultation: "first_consultation_at",
  first_document: "first_document_at",
  first_assessment: "first_assessment_at",
};

const MANAGER_ROLES_JSON = JSON.stringify(
  rolesWithPermission("organization.manage"),
);

function asaasEnvironment(
  value: string | undefined,
): "sandbox" | "production" | null {
  const normalized = value?.trim().toLowerCase();
  return normalized === "sandbox" || normalized === "production"
    ? normalized
    : null;
}

function providerConfigurationPresent(env: BillingProviderEnv): boolean {
  return Boolean(
    (env.ASAAS_API_KEY?.trim().length ?? 0) >= 16 &&
      (env.ASAAS_WEBHOOK_TOKEN?.trim().length ?? 0) >= 32 &&
      asaasEnvironment(env.ASAAS_ENVIRONMENT),
  );
}

function billingEvidence(
  env: BillingProviderEnv,
  confirmedAt: string | null,
): TenantOnboardingSnapshot["billingEvidence"] {
  let status: BillingEvidenceStatus;
  if (confirmedAt) status = "SERVER_CONFIRMED";
  else if (providerConfigurationPresent(env)) status = "AWAITING_PROVIDER_EVENT";
  else status = "BLOCKED_EXTERNAL";

  return {
    status,
    provider: "asaas",
    environment: asaasEnvironment(env.ASAAS_ENVIRONMENT),
    confirmedAt,
    source: confirmedAt ? "billing_invoice_events.charge_paid" : null,
    limitation: confirmedAt
      ? "Concluído por evento autenticado e persistido no servidor; redirect do checkout não concede este marco."
      : status === "BLOCKED_EXTERNAL"
        ? "Credenciais/configuração do provedor não estão disponíveis neste ambiente; nenhuma cobrança foi presumida."
        : "Configuração detectada, mas nenhum evento de pagamento confirmado foi persistido pelo servidor.",
  };
}

export async function readTenantOnboarding(
  db: D1Database,
  clinicId: string,
  actorUserId: string,
  env: BillingProviderEnv,
  now = new Date(),
): Promise<TenantOnboardingSnapshot | null> {
  const facts = await db
    .prepare(
      `WITH authorized AS (
         SELECT c.id, c.created_at, c.created_by_user_id
           FROM clinic_memberships m
           JOIN clinics c ON c.id = m.clinic_id
           JOIN users actor ON actor.id = m.user_id AND actor.is_active = 1
          WHERE m.clinic_id = ?
            AND m.user_id = ?
            AND m.active = 1
            AND c.status = 'active'
            AND m.role IN (SELECT value FROM json_each(?))
       )
       SELECT
         u.created_at AS account_created_at,
         u.email_verified_at,
         c.created_at AS clinic_created_at,
         (SELECT bs.created_at
            FROM billing_customers bc
            JOIN billing_subscriptions bs ON bs.customer_id = bc.id
           WHERE bc.clinic_id = c.id AND bs.plan_id IS NOT NULL
           ORDER BY julianday(bs.created_at) LIMIT 1)
           AS plan_selected_at,
         (SELECT COALESCE(bie.occurred_at, bie.created_at)
            FROM billing_customers bc
            JOIN billing_subscriptions bs ON bs.customer_id = bc.id
            JOIN billing_invoice_events bie ON bie.subscription_id = bs.id
           WHERE bc.clinic_id = c.id
             AND bc.provider <> 'none'
             AND bie.kind = 'charge_paid'
             AND bie.status = 'done'
           ORDER BY julianday(COALESCE(bie.occurred_at, bie.created_at)) LIMIT 1)
           AS billing_configured_at,
         (SELECT cm.created_at
            FROM clinic_memberships cm
           WHERE cm.clinic_id = c.id AND cm.user_id <> c.created_by_user_id
           ORDER BY julianday(cm.created_at) LIMIT 1)
           AS first_member_at,
         (SELECT a.created_at FROM saas_audit_log a
           WHERE a.clinic_id = c.id AND a.action = 'live_patient_create'
           ORDER BY julianday(a.created_at) LIMIT 1)
           AS first_patient_at,
         (SELECT a.created_at FROM saas_audit_log a
           WHERE a.clinic_id = c.id
             AND a.action = 'live_clinical_event_create'
             AND a.metadata_json LIKE '%"eventType":"encounter"%'
           ORDER BY julianday(a.created_at) LIMIT 1)
           AS first_consultation_at,
         (SELECT a.created_at FROM saas_audit_log a
           WHERE a.clinic_id = c.id AND a.action = 'live_document_create'
           ORDER BY julianday(a.created_at) LIMIT 1)
           AS first_document_at,
         (SELECT a.created_at FROM saas_audit_log a
           WHERE a.clinic_id = c.id AND a.action = 'live_assessment_create'
           ORDER BY julianday(a.created_at) LIMIT 1)
           AS first_assessment_at
       FROM authorized c
       JOIN users u ON u.id = c.created_by_user_id
      LIMIT 1`,
    )
    .bind(clinicId, actorUserId, MANAGER_ROLES_JSON)
    .first<OnboardingFactsRow>();
  if (!facts) return null;

  const providerReady = providerConfigurationPresent(env);
  const milestones: OnboardingMilestone[] = onboardingMilestoneDefinitions.map(
    (definition) => {
      const completedAt = facts[MILESTONE_COLUMNS[definition.key]] ?? null;
      return {
        ...definition,
        completedAt,
        status: completedAt
          ? "completed"
          : definition.key === "billing_configured" && !providerReady
            ? "blocked_external"
            : "pending",
      };
    },
  );

  return {
    clinicId,
    generatedAt: now.toISOString(),
    progress: computeOnboardingProgress(milestones),
    billingEvidence: billingEvidence(env, facts.billing_configured_at),
    milestones,
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const clinicId = context.params.id;
  if (typeof clinicId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(clinicId)) {
    return tenantError("Recurso indisponível.", "NOT_FOUND", 404);
  }
  const db = context.env.DB;
  if (!db) return tenantError("Onboarding indisponível sem banco persistente.", "DB_REQUIRED", 503);

  try {
    const snapshot = await readTenantOnboarding(
      db,
      clinicId,
      user.id,
      context.env,
    );
    if (!snapshot) return tenantError("Recurso indisponível.", "NOT_FOUND", 404);
    return tenantJson(snapshot);
  } catch (error) {
    console.error("[tenants/:id/onboarding.GET] DB error", error);
    return tenantError("Não foi possível calcular o onboarding.", "DB_ERROR", 500);
  }
};
