import { canReadClinicMemory, canWriteClinicMemory, type ClinicMembershipRole } from "../../../../shared/tenant";
import {
  normalizeClinicMemoryTokens,
  type ClinicMemoryKind,
  type ClinicMemoryRecord,
  type ClinicMemoryScope,
} from "../../../../shared/live-clinic-memory";
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  prepareSaasAudit,
  tenantError,
  type ClinicMembership,
  type TenantEnv,
} from "../../tenant/_core";
import {
  clinicalBlindIndex,
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../tenant/_crypto";

export interface MemoryBody {
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  source: string;
}

export interface MemoryRow {
  id: string;
  clinic_id: string;
  scope: ClinicMemoryScope;
  kind: ClinicMemoryKind;
  patient_id: string | null;
  appointment_id: string | null;
  author_user_id: string;
  updated_by_user_id: string;
  body_encrypted: string;
  encryption_version: string;
  client_request_id: string;
  revision: number;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) return tenantError("A persistência LIVE da clínica está desativada.", "CLINICAL_LIVE_DISABLED", 503);
  if (!clinicalCryptoReady(env)) return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  if (!env.DB) return tenantError("Banco persistente da clínica não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  return null;
}

export async function resolveMemoryAccess(
  context: { data?: unknown; env: TenantEnv },
  clinicId: string,
  kind: ClinicMemoryKind | undefined,
  mode: "read" | "write",
): Promise<{ db: D1Database; user: PublicUser; membership: ClinicMembership } | Response> {
  const env = context.env;
  if (!env.DB) return tenantError("Banco persistente da clínica não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  const user = getContextUser(context);
  if (!user) return tenantError("Sessão necessária para acessar a memória da clínica.", "AUTH_REQUIRED", 401);
  const membership = await getClinicMembership(env.DB, clinicId, user);
  if (!membership || !canReadClinicMemory(membership.role)) {
    return tenantError("Acesso à memória desta clínica negado.", "TENANT_FORBIDDEN", 403);
  }
  if (kind === "clinical" && !membershipCanReadClinical(membership)) {
    return tenantError("Acesso à memória clínica negado para este perfil.", "TENANT_FORBIDDEN", 403);
  }
  const billingError = await requireBillingEntitlement(env.DB, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  if (mode === "write" && kind && !canWriteClinicMemory(membership.role, kind)) {
    return tenantError("Este perfil não pode gravar este tipo de memória.", "TENANT_FORBIDDEN", 403);
  }
  return { db: env.DB, user, membership };
}

export function canReadKind(role: ClinicMembershipRole, kind: ClinicMemoryKind): boolean {
  return kind === "operational" || role === "owner" || role === "clinic_admin" || role === "professional";
}

export async function tokenHashes(env: TenantEnv, clinicId: string, values: string[]): Promise<string[]> {
  const tokens = normalizeClinicMemoryTokens(values.join(" "));
  return Promise.all(tokens.map((token) => clinicalBlindIndex(env, clinicId, "clinic-memory-term", token)));
}

export async function decryptRow(env: TenantEnv, row: MemoryRow): Promise<ClinicMemoryRecord> {
  const body = await decryptClinicalJson<MemoryBody>(env, row.clinic_id, `clinic-memory:${row.id}`, row.body_encrypted);
  return {
    id: row.id,
    clinicId: row.clinic_id,
    scope: row.scope,
    kind: row.kind,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    title: body.title,
    content: body.content,
    category: body.category,
    tags: body.tags,
    source: body.source,
    authorUserId: row.author_user_id,
    status: row.status,
    revision: row.revision,
    encryptionVersion: row.encryption_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function auditForMemory(
  db: D1Database,
  params: { clinicId: string; actorUserId: string; memoryId: string; action: string; revision: number },
): D1PreparedStatement {
  return db.prepare(`INSERT INTO live_clinic_memory_audit
    (id, clinic_id, memory_id, actor_user_id, action, revision)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), params.clinicId, params.memoryId, params.actorUserId, params.action, params.revision);
}

export { getContextUser, prepareSaasAudit, encryptClinicalJson, currentClinicalEncryptionVersion, tenantError };
