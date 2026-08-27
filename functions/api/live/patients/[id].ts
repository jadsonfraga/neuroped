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
import { preparePatientSearchTokenStatements } from "./_search";

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
  external_reference_hash: string | null;
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
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function patientIdFrom(context: Parameters<PagesFunction<TenantEnv>>[0]): string {
  const raw = context.params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 120);
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) return tenantError("Clinical Core LIVE permanece bloqueado.", "CLINICAL_LIVE_DISABLED", 503);
  if (!clinicalCryptoReady(env)) return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  return null;
}

async function loadPatient(db: D1Database, env: TenantEnv, clinicId: string, patientId: string): Promise<PatientProfile & { row: LivePatientRow } | null> {
  const row = await db
    .prepare(
      `SELECT id, clinic_id, primary_professional_user_id, external_reference_hash,
              profile_encrypted, encryption_version, status, created_at, updated_at
         FROM live_patients WHERE id = ? AND clinic_id = ? LIMIT 1`,
    )
    .bind(patientId, clinicId)
    .first<LivePatientRow>();
  if (!row) return null;
  const profile = await decryptClinicalJson<PatientProfile>(env, clinicId, `patient-profile:${patientId}`, row.profile_encrypted);
  return { ...profile, row };
}

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const patientId = patientIdFrom(context);
  if (!patientId) return tenantError("patientId inválido.", "VALIDATION_ERROR", 400);

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = cleanText(body.clinicId, 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingWriteError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingWriteError) return billingWriteError;

  let current: PatientProfile & { row: LivePatientRow };
  try {
    const loaded = await loadPatient(db, context.env, clinicId, patientId);
    if (!loaded) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
    current = loaded;
  } catch (error) {
    console.error("[live.patients.PATCH] decrypt failure", error);
    return tenantError("Dados clínicos indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
  }
  if (current.row.status === "merged") return tenantError("Paciente merged não pode ser editado.", "PATIENT_MERGED", 409);

  const profile: PatientProfile = {
    name: cleanText(body.name ?? current.name, 160),
    birthDate: body.birthDate === null ? null : cleanOptional(body.birthDate ?? current.birthDate, 10),
    guardianName: body.guardianName === null ? null : cleanOptional(body.guardianName ?? current.guardianName, 160),
    guardianPhone: body.guardianPhone === null ? null : cleanOptional(body.guardianPhone ?? current.guardianPhone, 40),
    diagnosisCode: body.diagnosisCode === null ? null : cleanOptional(body.diagnosisCode ?? current.diagnosisCode, 40),
    notes: body.notes === null ? null : cleanOptional(body.notes ?? current.notes, 12_000),
  };
  if (profile.name.length < 2) return tenantError("Nome do paciente é obrigatório.", "VALIDATION_ERROR", 400);
  if (!validIsoDate(profile.birthDate)) return tenantError("birthDate deve usar uma data real AAAA-MM-DD.", "VALIDATION_ERROR", 400);

  const encrypted = await encryptClinicalJson(context.env, clinicId, `patient-profile:${patientId}`, profile);
  const identityHash = profile.birthDate
    ? await clinicalBlindIndex(context.env, clinicId, "patient-identity", `${profile.name}|${profile.birthDate}`)
    : null;
  const now = new Date().toISOString();
  const searchTokenStatements = await preparePatientSearchTokenStatements(
    db,
    context.env,
    clinicId,
    patientId,
    profile,
    null,
    false,
    now,
    now,
  );
  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE live_patients
              SET profile_encrypted = ?, patient_identity_hash = ?,
                  encryption_version = ?, updated_at = ?
            WHERE id = ? AND clinic_id = ? AND status <> 'merged' AND updated_at = ?`,
        )
        .bind(encrypted, identityHash, currentClinicalEncryptionVersion(context.env), now, patientId, clinicId, current.row.updated_at),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "live_patient_update",
          targetType: "patient",
          targetId: patientId,
          metadata: {
            encryptionVersion: currentClinicalEncryptionVersion(context.env),
            searchTokenCount: searchTokenStatements.length,
          },
        },
        true,
      ),
      db
        .prepare(
          `DELETE FROM live_patient_search_tokens
            WHERE clinic_id = ? AND patient_id = ? AND field IN ('name', 'guardian_name')
              AND EXISTS (
                SELECT 1 FROM live_patients
                 WHERE id = ? AND clinic_id = ? AND updated_at = ?
              )`,
        )
        .bind(clinicId, patientId, patientId, clinicId, now),
      ...searchTokenStatements,
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) return tenantError("Paciente mudou durante a edição.", "PATIENT_STALE", 409);
  } catch (error) {
    console.error("[live.patients.PATCH] DB error", error);
    return tenantError("Não foi possível atualizar o paciente LIVE.", "DB_ERROR", 500);
  }
  return tenantJson({
    id: patientId,
    clinicId,
    profile,
    encryptionVersion: currentClinicalEncryptionVersion(context.env),
    status: current.row.status,
    createdAt: current.row.created_at,
    updatedAt: now,
  });
};

export const onRequestDelete: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const patientId = patientIdFrom(context);
  const clinicId = cleanText(new URL(context.request.url).searchParams.get("clinicId"), 80);
  if (!clinicId || !patientId) return tenantError("clinicId e patientId são obrigatórios.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingWriteError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingWriteError) return billingWriteError;
  const now = new Date().toISOString();
  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE live_patients SET status = 'archived', updated_at = ?
            WHERE id = ? AND clinic_id = ? AND status = 'active'`,
        )
        .bind(now, patientId, clinicId),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "live_patient_archive",
          targetType: "patient",
          targetId: patientId,
        },
        true,
      ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) return tenantError("Paciente não encontrado ou já arquivado.", "PATIENT_NOT_FOUND", 404);
  } catch (error) {
    console.error("[live.patients.DELETE] DB error", error);
    return tenantError("Não foi possível arquivar o paciente LIVE.", "DB_ERROR", 500);
  }
  return tenantJson({ id: patientId, clinicId, status: "archived", deleted: false, archivedAt: now });
};

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const patientId = patientIdFrom(context);
  const clinicId = cleanText(new URL(context.request.url).searchParams.get("clinicId"), 80);
  if (!clinicId || !patientId) return tenantError("clinicId e patientId são obrigatórios.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingReadError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingReadError) return billingReadError;
  try {
    const patient = await loadPatient(db, context.env, clinicId, patientId);
    if (!patient) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
    return tenantJson({
      id: patient.row.id,
      clinicId: patient.row.clinic_id,
      primaryProfessionalUserId: patient.row.primary_professional_user_id,
      profile: {
        name: patient.name,
        birthDate: patient.birthDate,
        guardianName: patient.guardianName,
        guardianPhone: patient.guardianPhone,
        diagnosisCode: patient.diagnosisCode,
        notes: patient.notes,
      },
      encryptionVersion: patient.row.encryption_version,
      status: patient.row.status,
      createdAt: patient.row.created_at,
      updatedAt: patient.row.updated_at,
    });
  } catch (error) {
    console.error("[live.patients.GET] decrypt failure", error);
    return tenantError("Dados clínicos indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
  }
};
