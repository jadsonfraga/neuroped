import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { enforceTenantRateLimit } from "./_rate-limit";

interface BackupEvidenceRow {
  id: string;
  clinic_id: string;
  provider: string;
  snapshot_digest_sha256: string;
  status: "recorded" | "verified" | "failed";
  rpo_minutes: number;
  rto_minutes: number;
  restore_verified_at: string | null;
  created_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integerBetween(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function clinicIdFrom(request: Request, body?: Record<string, unknown>): string {
  const url = new URL(request.url);
  return cleanText(
    body?.clinicId ?? request.headers.get("x-tenant-id") ?? request.headers.get("x-clinic-id") ?? url.searchParams.get("clinicId"),
    80,
  );
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
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return { error: billingError } as const;
  return { db, user } as const;
}

function toApi(row: BackupEvidenceRow) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    provider: row.provider,
    snapshotDigestSha256: row.snapshot_digest_sha256,
    status: row.status,
    rpoMinutes: row.rpo_minutes,
    rtoMinutes: row.rto_minutes,
    restoreVerifiedAt: row.restore_verified_at,
    createdAt: row.created_at,
  };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const clinicId = clinicIdFrom(context.request);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  try {
    const rows = await authorized.db
      .prepare(
        `SELECT id, clinic_id, provider, snapshot_digest_sha256, status,
                rpo_minutes, rto_minutes, restore_verified_at, created_at
           FROM saas_backup_evidence
          WHERE clinic_id = ?
          ORDER BY created_at DESC
          LIMIT 50`,
      )
      .bind(clinicId)
      .all<BackupEvidenceRow>();
    return tenantJson({ clinicId, data: (rows.results ?? []).map(toApi) });
  } catch (error) {
    console.error("[saas.backup-evidence.GET] failed", error);
    return tenantError("Não foi possível carregar as evidências de continuidade.", "BACKUP_EVIDENCE_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const clinicId = clinicIdFrom(context.request, body);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  const rateLimitError = await enforceTenantRateLimit(authorized.db, clinicId, "saas:continuity:write", 10, 60);
  if (rateLimitError) return rateLimitError;

  const provider = cleanText(body.provider, 80);
  const digest = cleanText(body.snapshotDigestSha256, 64).toLowerCase();
  const status = cleanText(body.status, 20);
  const rpoMinutes = integerBetween(body.rpoMinutes, 0, 10080);
  const rtoMinutes = integerBetween(body.rtoMinutes, 0, 10080);
  const restoreVerifiedAt = cleanText(body.restoreVerifiedAt, 40) || null;
  if (provider.length < 2 || !/^[a-f0-9]{64}$/.test(digest)) {
    return tenantError("Provider ou digest SHA-256 inválido.", "VALIDATION_ERROR", 400);
  }
  if (!['recorded', 'verified', 'failed'].includes(status) || rpoMinutes === null || rtoMinutes === null) {
    return tenantError("Status, RPO ou RTO inválido.", "VALIDATION_ERROR", 400);
  }
  if (status === "verified" && !restoreVerifiedAt) {
    return tenantError("Uma evidência verificada exige restore_verified_at.", "RESTORE_TIMESTAMP_REQUIRED", 400);
  }
  if (restoreVerifiedAt && !/^\d{4}-\d{2}-\d{2}T/.test(restoreVerifiedAt)) {
    return tenantError("restoreVerifiedAt deve ser ISO-8601.", "VALIDATION_ERROR", 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    const results = await authorized.db.batch([
      authorized.db
        .prepare(
          `INSERT INTO saas_backup_evidence
             (id, clinic_id, provider, snapshot_digest_sha256, status,
              rpo_minutes, rto_minutes, restore_verified_at, recorded_by_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, clinicId, provider, digest, status, rpoMinutes, rtoMinutes, restoreVerifiedAt, authorized.user.id, now),
      prepareSaasAudit(
        authorized.db,
        {
          clinicId,
          actorUserId: authorized.user.id,
          action: "saas_backup_evidence_record",
          targetType: "backup_evidence",
          targetId: id,
          metadata: { status, rpoMinutes, rtoMinutes },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A evidência não pôde ser auditada.", "AUDIT_WRITE_FAILED", 500);
    }
    return tenantJson({ data: { id, clinicId, provider, snapshotDigestSha256: digest, status, rpoMinutes, rtoMinutes, restoreVerifiedAt, createdAt: now } }, 201);
  } catch (error) {
    console.error("[saas.backup-evidence.POST] failed", error);
    return tenantError("Não foi possível registrar a evidência de continuidade.", "BACKUP_EVIDENCE_WRITE_FAILED", 500);
  }
};
