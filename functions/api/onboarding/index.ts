import { getContextUser } from "../auth/_authorization";
import {
  cleanHubText,
  ensureSaasHubSchema,
  hubError,
  hubJson,
  parseJsonBody,
  resolveHubClinic,
  seedClinicDefaults,
  writeHubAudit,
  type HubEnv,
} from "../saas/_core";
import { membershipCanManage } from "../tenant/_core";
import { ONBOARDING_STEP_DEFINITIONS } from "../saas/_core";

type Env = HubEnv;

interface OnboardingStepRow {
  id: string;
  step_key: string;
  label: string;
  position: number;
  required: number;
  completed: number;
  completed_at: string | null;
  completed_by_user_id: string | null;
  updated_at: string;
}

async function reconcileOnboarding(db: D1Database, clinicId: string): Promise<void> {
  const predicates: Record<string, string> = {
    clinic_profile: `EXISTS (SELECT 1 FROM clinics c WHERE c.id = ? AND length(trim(c.name)) > 0 AND length(trim(c.slug)) > 0)`,
    invite_team: `EXISTS (SELECT 1 FROM clinic_memberships m WHERE m.clinic_id = ? AND m.active = 1 GROUP BY m.clinic_id HAVING COUNT(*) > 1)`,
    configure_services: `EXISTS (SELECT 1 FROM booking_services s JOIN users u ON u.id = s.provider_user_id JOIN clinic_memberships m ON m.user_id = u.id WHERE m.clinic_id = ? AND m.active = 1)`,
    configure_availability: `EXISTS (SELECT 1 FROM booking_availability_rules r JOIN clinic_memberships m ON m.user_id = r.provider_user_id WHERE m.clinic_id = ? AND m.active = 1)`,
    first_appointment: `EXISTS (SELECT 1 FROM appointments a JOIN clinic_memberships m ON m.user_id = a.provider_user_id WHERE m.clinic_id = ? AND m.active = 1)`,
  };
  for (const [stepKey, predicate] of Object.entries(predicates)) {
    await db.prepare(
      `UPDATE onboarding_steps
          SET completed = 1, completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
        WHERE clinic_id = ? AND step_key = ? AND completed = 0 AND ${predicate}`,
    ).bind(clinicId, stepKey, clinicId).run();
  }
}

function serialize(row: OnboardingStepRow) {
  return {
    id: row.id,
    key: row.step_key,
    label: row.label,
    position: row.position,
    required: Boolean(row.required),
    completed: Boolean(row.completed),
    completedAt: row.completed_at,
    completedByUserId: row.completed_by_user_id,
    updatedAt: row.updated_at,
  };
}

async function loadPayload(db: D1Database, clinicId: string) {
  await seedClinicDefaults(db, clinicId);
  await reconcileOnboarding(db, clinicId);
  const result = await db.prepare(
    `SELECT id, step_key, label, position, required, completed,
            completed_at, completed_by_user_id, updated_at
       FROM onboarding_steps WHERE clinic_id = ? ORDER BY position`,
  ).bind(clinicId).all<OnboardingStepRow>();
  const steps = (result.results ?? []).map(serialize);
  const required = steps.filter((step) => step.required);
  const completedRequired = required.filter((step) => step.completed).length;
  return {
    steps,
    progress: {
      completed: steps.filter((step) => step.completed).length,
      total: steps.length,
      requiredCompleted: completedRequired,
      requiredTotal: required.length,
      percentage: required.length ? Math.round((completedRequired / required.length) * 100) : 100,
    },
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return hubError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return hubError("Não autenticado.", "UNAUTHENTICATED", 401);
  try {
    await ensureSaasHubSchema(db);
    const resolved = await resolveHubClinic(db, context.request, user);
    if (!resolved) return hubError("Informe uma clínica ativa no cabeçalho X-Clinic-Id.", "HUB_CLINIC_REQUIRED", 400);
    const payload = await loadPayload(db, resolved.clinicId);
    return hubJson({ clinic: resolved.membership, ...payload });
  } catch (error) {
    console.error("[onboarding.GET]", error);
    return hubError("Não foi possível carregar o onboarding.", "ONBOARDING_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return hubError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return hubError("Não autenticado.", "UNAUTHENTICATED", 401);
  const body = await parseJsonBody(context.request);
  if (!body) return hubError("Corpo JSON inválido.", "INVALID_JSON", 400);
  try {
    await ensureSaasHubSchema(db);
    const resolved = await resolveHubClinic(db, context.request, user);
    if (!resolved) return hubError("Informe uma clínica ativa no cabeçalho X-Clinic-Id.", "HUB_CLINIC_REQUIRED", 400);
    if (!membershipCanManage(resolved.membership)) return hubError("Somente administradores da clínica podem alterar o checklist.", "HUB_FORBIDDEN", 403);
    const action = cleanHubText(body.action, 30) || "complete_step";
    const stepKey = cleanHubText(body.stepKey, 60);
    if (!ONBOARDING_STEP_DEFINITIONS.some((step) => step.key === stepKey)) {
      return hubError("Etapa de onboarding inválida.", "ONBOARDING_STEP_INVALID", 400);
    }
    if (action !== "complete_step" && action !== "reset_step") {
      return hubError("Ação de onboarding inválida.", "ONBOARDING_ACTION_INVALID", 400);
    }
    const completed = action === "complete_step" ? 1 : 0;
    const result = await db.prepare(
      `UPDATE onboarding_steps
          SET completed = ?, completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
              completed_by_user_id = CASE WHEN ? = 1 THEN ? ELSE NULL END, updated_at = CURRENT_TIMESTAMP
        WHERE clinic_id = ? AND step_key = ?`,
    ).bind(completed, completed, completed, user.id, resolved.clinicId, stepKey).run();
    if ((result.meta?.changes ?? 0) !== 1) return hubError("Etapa de onboarding não encontrada.", "ONBOARDING_STEP_NOT_FOUND", 404);
    await writeHubAudit(db, {
      clinicId: resolved.clinicId,
      actorUserId: user.id,
      action: completed ? "onboarding_step_completed" : "onboarding_step_reset",
      targetType: "onboarding_step",
      targetId: stepKey,
      metadata: { completed: Boolean(completed) },
    });
    return hubJson({ ok: true, ...(await loadPayload(db, resolved.clinicId)) });
  } catch (error) {
    console.error("[onboarding.POST]", error);
    return hubError("Não foi possível atualizar o onboarding.", "ONBOARDING_WRITE_FAILED", 500);
  }
};
