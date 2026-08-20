import type { PublicUser } from "../auth/_shared";
import {
  canAccessClinicFinance,
  canManageClinic,
  canReadClinicClinicalData,
  canWriteClinicClinicalData,
  isClinicMembershipRole,
  type ClinicMembershipRole,
} from "../../../shared/tenant";

export interface TenantEnv {
  DB?: D1Database;
  CLINICAL_DATA_KEY?: string;
  CLINICAL_DATA_KEY_ID?: string;
  CLINICAL_DATA_KEY_PREVIOUS?: string;
  CLINICAL_DATA_KEY_PREVIOUS_ID?: string;
  CLINICAL_INDEX_KEY?: string;
  CLINICAL_LIVE_ENABLED?: string;
  CLINICAL_LGPD_READY?: string;
}

export interface ClinicMembership {
  clinicId: string;
  userId: string;
  role: ClinicMembershipRole;
  clinicName: string;
  clinicSlug: string;
  clinicStatus: "active" | "suspended" | "closed";
}

interface MembershipRow {
  clinic_id: string;
  user_id: string;
  role: string;
  active: number;
  clinic_name: string;
  clinic_slug: string;
  clinic_status: "active" | "suspended" | "closed";
}

export interface SaasAuditParams {
  clinicId?: string | null;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export function tenantJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function tenantError(message: string, code: string, status: number): Response {
  return tenantJson({ error: message, code }, status);
}

export function clinicalLiveEnabled(env: TenantEnv): boolean {
  return env.CLINICAL_LIVE_ENABLED?.trim().toLowerCase() === "true";
}

export function clinicalLgpdReady(env: TenantEnv): boolean {
  return env.CLINICAL_LGPD_READY?.trim().toLowerCase() === "true";
}

/**
 * Resolve acesso exclusivamente por membership explícita.
 * O role global `admin` NÃO é bypass entre clínicas: um administrador técnico
 * precisa ser membro da clínica para ler dados clínicos daquele tenant.
 */
export async function getClinicMembership(
  db: D1Database,
  clinicId: string,
  user: PublicUser,
): Promise<ClinicMembership | null> {
  const row = await db
    .prepare(
      `SELECT m.clinic_id, m.user_id, m.role, m.active,
              c.name AS clinic_name, c.slug AS clinic_slug, c.status AS clinic_status
         FROM clinic_memberships m
         JOIN clinics c ON c.id = m.clinic_id
        WHERE m.clinic_id = ?
          AND m.user_id = ?
          AND m.active = 1
        LIMIT 1`,
    )
    .bind(clinicId, user.id)
    .first<MembershipRow>();

  if (!row || !isClinicMembershipRole(row.role)) return null;
  return {
    clinicId: row.clinic_id,
    userId: row.user_id,
    role: row.role,
    clinicName: row.clinic_name,
    clinicSlug: row.clinic_slug,
    clinicStatus: row.clinic_status,
  };
}

export function membershipCanManage(membership: ClinicMembership): boolean {
  return membership.clinicStatus === "active" && canManageClinic(membership.role);
}

export function membershipCanReadClinical(membership: ClinicMembership): boolean {
  return membership.clinicStatus === "active" && canReadClinicClinicalData(membership.role);
}

export function membershipCanWriteClinical(membership: ClinicMembership): boolean {
  return membership.clinicStatus === "active" && canWriteClinicClinicalData(membership.role);
}

export function membershipCanAccessFinance(membership: ClinicMembership): boolean {
  return membership.clinicStatus === "active" && canAccessClinicFinance(membership.role);
}

/**
 * Prepara a escrita de auditoria para poder compô-la no mesmo `db.batch()` da
 * mutação que está sendo auditada. Quando `onlyIfPreviousChanged` é true, o
 * INSERT só ocorre se o statement imediatamente anterior alterou exatamente uma
 * linha; isso evita audit log órfão em updates condicionais concorrentes.
 */
export function prepareSaasAudit(
  db: D1Database,
  params: SaasAuditParams,
  onlyIfPreviousChanged = false,
): D1PreparedStatement {
  const sql = onlyIfPreviousChanged
    ? `INSERT INTO saas_audit_log
        (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json)
       SELECT ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1`
    : `INSERT INTO saas_audit_log
        (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`;

  return db
    .prepare(sql)
    .bind(
      crypto.randomUUID(),
      params.clinicId ?? null,
      params.actorUserId,
      params.action,
      params.targetType,
      params.targetId ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    );
}

export async function writeSaasAudit(
  db: D1Database,
  params: SaasAuditParams,
): Promise<void> {
  await prepareSaasAudit(db, params).run();
}
