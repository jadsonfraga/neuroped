import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  operationalCryptoReady,
  membershipCanManage,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { clinicalCryptoReady } from "../tenant/_crypto";

const REQUIRED_TABLES = [
  "tenant_lifecycle",
  "saas_audit_log",
  "saas_module_settings",
  "saas_backup_evidence",
  "saas_membership_invites",
  "saas_privacy_requests",
  "saas_retention_policies",
  "saas_integration_connections",
  "saas_integration_idempotency",
  "live_patient_search_tokens",
] as const;

const CHECK_ACTIONS = {
  membership: "Confirmar membership administrativa ativa para esta clínica.",
  migration: "Aplicar migrations SaaS 0016–0020 em ordem e repetir o readiness.",
  keyring: "Configurar o keyring clínico dedicado com IDs separados.",
  operationalKey: "Configurar OPERATIONAL_DATA_KEY no secret manager.",
  clinicalFlag: "Manter Clinical LIVE desabilitado até concluir os gates; o ambiente de produção deve definir a flag explicitamente.",
  billing: "Confirmar entitlement administrativo e assento disponível para o tenant.",
  audit: "Aplicar a trilha SaaS append-only e validar a escrita de auditoria.",
  restore: "Registrar evidência real de restore com digest SHA-256, RPO e RTO.",
} as const;

interface LatestBackupRow {
  status: "recorded" | "verified" | "failed";
  restore_verified_at: string | null;
  created_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function authorize(
  context: Parameters<PagesFunction<TenantEnv>>[0],
  clinicId: string,
) {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { error: tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  if (!clinicId) return { error: tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400) } as const;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return { error: tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403) } as const;
  }
  return { db, user, membership } as const;
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const clinicId = cleanText(new URL(context.request.url).searchParams.get("clinicId"), 80);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;

  try {
    const tableResult = await authorized.db
      .prepare(
        `SELECT name FROM sqlite_master
          WHERE type = 'table' AND name IN (${REQUIRED_TABLES.map(() => "?").join(",")})`,
      )
      .bind(...REQUIRED_TABLES)
      .all<{ name: string }>();
    const existingTables = new Set((tableResult.results ?? []).map((row) => row.name));
    const migrationReady = REQUIRED_TABLES.every((table) => existingTables.has(table));

    let enabledModules = 0;
    let latestBackup: LatestBackupRow | null = null;
    if (existingTables.has("saas_module_settings")) {
      const modules = await authorized.db
        .prepare(`SELECT COUNT(*) AS count FROM saas_module_settings WHERE clinic_id = ? AND enabled = 1`)
        .bind(clinicId)
        .first<{ count: number }>();
      enabledModules = Number(modules?.count ?? 0);
    }
    if (existingTables.has("saas_backup_evidence")) {
      latestBackup = await authorized.db
        .prepare(
          `SELECT status, restore_verified_at, created_at
             FROM saas_backup_evidence
            WHERE clinic_id = ?
            ORDER BY created_at DESC
            LIMIT 1`,
        )
        .bind(clinicId)
        .first<LatestBackupRow>();
    }

    const billingError = await requireBillingEntitlement(authorized.db, authorized.user.id, clinicId, "admin");
    const checks = {
      membership: { ok: true, label: "Membership administrativa ativa", action: CHECK_ACTIONS.membership },
      migration: { ok: migrationReady, label: "Migrations SaaS operacionais aplicadas", action: CHECK_ACTIONS.migration },
      keyring: { ok: clinicalCryptoReady(context.env), label: "Keyring clínico dedicado", action: CHECK_ACTIONS.keyring },
      operationalKey: { ok: operationalCryptoReady(context.env), label: "Chave operacional disponível", action: CHECK_ACTIONS.operationalKey },
      clinicalFlag: { ok: clinicalLiveEnabled(context.env), label: "Clinical LIVE habilitado", action: CHECK_ACTIONS.clinicalFlag },
      billing: { ok: !billingError, label: "Entitlement administrativo válido", action: CHECK_ACTIONS.billing },
      audit: { ok: existingTables.has("saas_audit_log"), label: "Trilha SaaS disponível", action: CHECK_ACTIONS.audit },
      restore: { ok: latestBackup?.status === "verified" && Boolean(latestBackup.restore_verified_at), label: "Restore verificado", action: CHECK_ACTIONS.restore },
    };
    const missing = Object.values(checks).filter((check) => !check.ok).map((check) => check.label);
    const preEnablementMissing = Object.entries(checks).filter(([id, check]) => id !== "clinicalFlag" && !check.ok).map(([, check]) => check.label);

    return tenantJson({
      clinicId,
      readyForProduction: missing.length === 0,
      eligibleForClinicalEnablement: preEnablementMissing.length === 0,
      preEnablementMissing,
      checks,
      missing,
      enabledModules,
            requiredModules: 20,
      correctiveActions: Object.values(checks).filter((check) => !check.ok).map((check) => check.action),
      latestBackup:
 latestBackup
        ? { status: latestBackup.status, restoreVerifiedAt: latestBackup.restore_verified_at, createdAt: latestBackup.created_at }
        : null,
    });
  } catch (error) {
    console.error("[saas.readiness.GET] failed", error);
    return tenantError("Não foi possível calcular o readiness da clínica.", "SAAS_READINESS_FAILED", 500);
  }
};
