import { getContextUser } from "../../auth/_authorization";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  tenantError,
  tenantJson,
  writeSaasAudit,
  type TenantEnv,
} from "../../tenant/_core";
import {
  CLINICAL_ENCRYPTION_VERSION,
  clinicalBlindIndex,
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError(
      "Clinical Core LIVE permanece bloqueado até habilitação explícita.",
      "CLINICAL_LIVE_DISABLED",
      503,
    );
  }
  if (!env.CLINICAL_DATA_KEY?.trim() || env.CLINICAL_DATA_KEY.trim().length < 32) {
    return tenantError(
      "Chave clínica dedicada não configurada.",
      "CLINICAL_CRYPTO_NOT_CONFIGURED",
      503,
    );
  }
  return null;
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

  const url = new URL(context.request.url);
  const clinicId = cleanText(url.searchParams.get("clinicId"), 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }

  const rows = await db
    .prepare(
      `SELECT id, clinic_id, primary_professional_user_id, profile_encrypted,
              encryption_version, status, created_at, updated_at
         FROM live_patients
        WHERE clinic_id = ? AND status != 'merged'
        ORDER BY created_at DESC
        LIMIT 100`,
    )
    .bind(clinicId)
    .all<LivePatientRow>();

  try {
    const data = await Promise.all(
      (rows.results ?? []).map(async (row) => ({
        id: row.id,
        clinicId: row.clinic_id,
        primaryProfessionalUserId: row.primary_professional_user_id,
        profile: await decryptClinicalJson<PatientProfile>(
          context.env,
          clinicId,
          `patient-profile:${row.id}`,
          row.profile_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
    return tenantJson({ data });
  } catch (error) {
    console.error("[live.patients.GET] decrypt failure", error);
    return tenantError("Dados clínicos indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
  }
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

  const profile: PatientProfile = {
    name: cleanText(body.name, 160),
    birthDate: cleanOptional(body.birthDate, 10),
    guardianName: cleanOptional(body.guardianName, 160),
    guardianPhone: cleanOptional(body.guardianPhone, 40),
    diagnosisCode: cleanOptional(body.diagnosisCode, 40),
    notes: cleanOptional(body.notes, 12_000),
  };
  if (profile.name.length < 2) return tenantError("Nome do paciente é obrigatório.", "VALIDATION_ERROR", 400);
  if (!validIsoDate(profile.birthDate)) return tenantError("birthDate deve usar AAAA-MM-DD.", "VALIDATION_ERROR", 400);

  const patientId = crypto.randomUUID();
  const externalReference = cleanOptional(body.externalReference, 240);
  const profileEncrypted = await encryptClinicalJson(
    context.env,
    clinicId,
    `patient-profile:${patientId}`,
    profile,
  );
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
    await db
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
        CLINICAL_ENCRYPTION_VERSION,
        now,
        now,
      )
      .run();

    await writeSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "live_patient_create",
      targetType: "patient",
      targetId: patientId,
      metadata: { encryptionVersion: CLINICAL_ENCRYPTION_VERSION },
    });
  } catch (error) {
    console.error("[live.patients.POST] DB error", error);
    return tenantError("Não foi possível criar o paciente LIVE.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id: patientId,
      clinicId,
      primaryProfessionalUserId: user.id,
      profile,
      encryptionVersion: CLINICAL_ENCRYPTION_VERSION,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    201,
  );
};
