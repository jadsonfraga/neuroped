import { getContextUser } from "../../auth/_authorization";
import { boundedText, isPlainObject } from "../../_request";
import { isClinicFeatureKey, type ClinicFeatureKey } from "../../../../shared/clinicFeatures";
import {
  getClinicMembership,
  membershipHas,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import { ensureClinicFeatureSchema, getClinicFeatures, setClinicFeatures } from "../../tenant/_features";

/**
 * GET/PATCH /api/tenants/:id/features — feature flags da clínica.
 *
 * GET: qualquer membro ativo (a tela precisa saber o que está ligado).
 * PATCH: `organization.manage`; corpo `{ "features": { "<chave>": boolean } }`.
 * Chave fora do catálogo ou valor não booleano é recusado inteiro (400): não
 * se grava metade de um pedido. Cada mudança entra na trilha da clínica.
 */

function baseContext(context: Parameters<PagesFunction<TenantEnv>>[0]) {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = boundedText(context.params.id, 80);
  if (!db) return { error: tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  if (!clinicId) return { error: tenantError("Clínica inválida.", "VALIDATION_ERROR", 400) } as const;
  return { db, user, clinicId } as const;
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const base = baseContext(context);
  if ("error" in base) return base.error;
  const { db, user, clinicId } = base;

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || membership.clinicStatus !== "active") {
    return tenantError("Acesso negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  try {
    return tenantJson({
      clinicId,
      canManage: membershipHas(membership, "organization.manage"),
      features: await getClinicFeatures(db, clinicId),
    });
  } catch (error) {
    console.error("[tenants/:id/features.GET] DB error", error);
    return tenantError("Não foi possível ler os recursos da clínica.", "DB_ERROR", 500);
  }
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const base = baseContext(context);
  if ("error" in base) return base.error;
  const { db, user, clinicId } = base;

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipHas(membership, "organization.manage")) {
    return tenantError("Somente gestores podem alterar os recursos da clínica.", "TENANT_FORBIDDEN", 403);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!isPlainObject(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  if (!isPlainObject(body.features)) {
    return tenantError("Informe `features` como objeto chave → booleano.", "VALIDATION_ERROR", 400);
  }
  const changes: Array<{ key: ClinicFeatureKey; enabled: boolean }> = [];
  for (const [key, value] of Object.entries(body.features)) {
    if (!isClinicFeatureKey(key)) return tenantError("Recurso desconhecido.", "VALIDATION_ERROR", 400);
    if (typeof value !== "boolean") return tenantError("Valor de recurso precisa ser booleano.", "VALIDATION_ERROR", 400);
    changes.push({ key, enabled: value });
  }
  if (changes.length === 0) return tenantError("Nenhum recurso informado.", "VALIDATION_ERROR", 400);

  try {
    await ensureClinicFeatureSchema(db);
    const applied = await setClinicFeatures(db, { clinicId, actorUserId: user.id, changes });
    if (!applied) return tenantError("Gestão não autorizada para esta clínica.", "TENANT_FORBIDDEN", 403);
    return tenantJson({
      clinicId,
      canManage: true,
      features: await getClinicFeatures(db, clinicId),
    });
  } catch (error) {
    console.error("[tenants/:id/features.PATCH] DB error", error);
    return tenantError("Não foi possível atualizar os recursos da clínica.", "DB_ERROR", 500);
  }
};
