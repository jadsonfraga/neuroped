import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import {
  clinicalBlindIndex,
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../tenant/_crypto";

interface PatientProfile {
  name: string;
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  diagnosisCode: string | null;
  notes: string | null;
}

interface LivePatientRow {
  id: string;
  clinic_id: string;
  primary_professional_user_id: string | null;
  profile_encrypted: string;
  encryption_version: string;
  status: "active" | "archived" | "merged";
  created_at: string;
  updated_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanOptional(value: unknown, max: number): string | null {
  const cleaned = cleanText(value, max);
  return cleaned || null;
}

function validIsoDate(value: string | null): boolean {
  if (!value) return true;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError(
      "Clinical Core LIVE permanece bloqueado até habilitação explícita.",
      "CLINICAL_LIVE_DISABLED",
      503,
    );
  }
  if (!clinicalCryptoReady(env)) {
    return tenantError(
      "Keyring clínico dedicado não configurado.",
      "CLINICAL_CRYPTO_NOT_CONFIGURED",
      503,
    );
  }
  return null;
}

const PAGE_SIZE = 50;
const SEARCH_SCAN_SIZE = 150;
type PatientCursor = [createdAt: string, id: string];

function decodeCursor(raw: unknown): PatientCursor | null {
  if (typeof raw !== "string" || raw.length > 1024) return null;
  try {
    const value: unknown = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(value) || value.length !== 2) return null;
    const [createdAt, id] = value;
    if (
      typeof createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}[ T][0-9:.+Z-]{8,35}$/.test(createdAt) ||
      typeof id !== "string" || !id || id.length > 128
    ) return null;
    return [createdAt, id];
  } catch {
    return null;
  }
}

export async function listLivePatients(
  context: EventContext<TenantEnv, string, Record<string, unknown>>,
  input: { clinicId?: unknown; q?: unknown; cursor?: unknown },
): Promise<Response> {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

  const clinicId = cleanText(input.clinicId, 80);
  const searchQuery = cleanText(input.q, 80).toLocaleLowerCase("pt-BR");
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingReadError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingReadError) return billingReadError;
  const cursor = input.cursor == null ? null : decodeCursor(input.cursor);
  if (input.cursor != null && !cursor) {
    return tenantError("Página inválida. Reinicie a busca.", "VALIDATION_ERROR", 400);
  }

  const limit = searchQuery ? SEARCH_SCAN_SIZE : PAGE_SIZE;
  const rows = (await db
    .prepare(
      `SELECT id, clinic_id, primary_professional_user_id, profile_encrypted,
              encryption_version, status, created_at, updated_at
         FROM live_patients
        WHERE clinic_id = ? AND status != 'merged'
          ${cursor ? "AND (created_at, id) < (?, ?)" : ""}
        ORDER BY created_at DESC, id DESC
        LIMIT ?`,
    )
    .bind(clinicId, ...(cursor ?? []), limit + 1)
    .all<LivePatientRow>()).results ?? [];

  try {
    const data = [];
    let consumed = 0;
    // Busca no servidor: só as fichas correspondentes são devolvidas. O cursor
    // avança até o último registro examinado, não só até a última ocorrência.
    for (const row of rows.slice(0, limit)) {
      const profile = await decryptClinicalJson<PatientProfile>(
        context.env, clinicId, `patient-profile:${row.id}`, row.profile_encrypted,
      );
      consumed++;
      if (searchQuery && !profile.name.toLocaleLowerCase("pt-BR").includes(searchQuery)) continue;
      data.push({
        id: row.id,
        clinicId: row.clinic_id,
        primaryProfessionalUserId: row.primary_professional_user_id,
        profile,
        encryptionVersion: row.encryption_version,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
      if (data.length === PAGE_SIZE) break;
    }
    const last = rows[consumed - 1];
    const nextCursor = last && consumed < rows.length
      ? encodeURIComponent(JSON.stringify([last.created_at, last.id]))
      : null;
    return tenantJson({ data, total: data.length, filtered: Boolean(searchQuery), nextCursor });
  } catch (error) {
    console.error("[live.patients.GET] decrypt failure", error);
    return tenantError("Dados clínicos indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
  }
}

export const onRequestGet: PagesFunction<TenantEnv> = (context) => {
  const params = new URL(context.request.url).searchParams;
  return listLivePatients(context, { clinicId: params.get("clinicId"), q: params.get("q"), cursor: params.get("cursor") });
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

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

  const clinicId = cleanText(body.clinicId, 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) {
    return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingWriteError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingWriteError) return billingWriteError;

  const profile: PatientProfile = {
    name: cleanText(body.name, 160),
    birthDate: cleanOptional(body.birthDate, 10),
    guardianName: cleanOptional(body.guardianName, 160),
    guardianPhone: cleanOptional(body.guardianPhone, 40),
    diagnosisCode: cleanOptional(body.diagnosisCode, 40),
    notes: cleanOptional(body.notes, 12_000),
  };
  if (profile.name.length < 2) return tenantError("Nome do paciente é obrigatório.", "VALIDATION_ERROR", 400);
  if (!validIsoDate(profile.birthDate)) return tenantError("birthDate deve usar uma data real AAAA-MM-DD.", "VALIDATION_ERROR", 400);

  const patientId = crypto.randomUUID();
  const externalReference = cleanOptional(body.externalReference, 240);
  const profileEncrypted = await encryptClinicalJson(
    context.env,
    clinicId,
    `patient-profile:${patientId}`,
    profile,
  );
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const patientIdentityHash = profile.birthDate
    ? await clinicalBlindIndex(
        context.env,
        clinicId,
        "patient-identity",
        `${profile.name}|${profile.birthDate}`,
      )
    : null;
  const externalReferenceHash = externalReference
    ? await clinicalBlindIndex(context.env, clinicId, "external-reference", externalReference)
    : null;
  const now = new Date().toISOString();

  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO live_patients
            (id, clinic_id, primary_professional_user_id, created_by_user_id,
             external_reference_hash, patient_identity_hash, profile_encrypted,
             encryption_version, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        )
        .bind(
          patientId,
          clinicId,
          user.id,
          user.id,
          externalReferenceHash,
          patientIdentityHash,
          profileEncrypted,
          encryptionVersion,
          now,
          now,
        ),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "live_patient_create",
          targetType: "patient",
          targetId: patientId,
          metadata: { encryptionVersion },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("Não foi possível criar o paciente LIVE.", "DB_ERROR", 500);
    }
  } catch (error) {
    if (externalReferenceHash) {
      const existing = await db
        .prepare(
          `SELECT id FROM live_patients
            WHERE clinic_id = ? AND external_reference_hash = ? LIMIT 1`,
        )
        .bind(clinicId, externalReferenceHash)
        .first<{ id: string }>();
      if (existing) {
        return tenantError("A referência externa já está vinculada a outro paciente.", "EXTERNAL_REFERENCE_CONFLICT", 409);
      }
    }
    console.error("[live.patients.POST] DB error", error);
    return tenantError("Não foi possível criar o paciente LIVE.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id: patientId,
      clinicId,
      primaryProfessionalUserId: user.id,
      profile,
      encryptionVersion,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    201,
  );
};
