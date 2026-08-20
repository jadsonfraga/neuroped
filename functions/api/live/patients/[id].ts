import { getContextUser } from "../../auth/_authorization";
import {
  clinicalLiveEnabled,
  clinicalLgpdReady,
  getClinicMembership,
  membershipCanReadClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import { clinicalCryptoReady, decryptClinicalJson } from "../../tenant/_crypto";

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

interface PatientProfile {
  name: string;
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  diagnosisCode: string | null;
  notes: string | null;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError("Clinical Core LIVE permanece bloqueado até habilitação explícita.", "CLINICAL_LIVE_DISABLED", 503);
  }
  if (!clinicalLgpdReady(env)) {
    return tenantError("Governança LGPD do Clinical Core ainda não foi aprovada.", "CLINICAL_LGPD_NOT_READY", 503);
  }
  if (!clinicalCryptoReady(env)) {
    return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
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
  const patientId = cleanText(context.params.id, 120);
  if (!clinicId || !patientId) {
    return tenantError("clinicId e patientId são obrigatórios.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }

  const row = await db
    .prepare(
      `SELECT id, clinic_id, primary_professional_user_id, profile_encrypted,
              encryption_version, status, created_at, updated_at
         FROM live_patients
        WHERE id = ? AND clinic_id = ? AND status != 'merged'
        LIMIT 1`,
    )
    .bind(patientId, clinicId)
    .first<LivePatientRow>();

  if (!row) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);

  try {
    const profile = await decryptClinicalJson<PatientProfile>(
      context.env,
      clinicId,
      `patient-profile:${row.id}`,
      row.profile_encrypted,
    );
    await context.env.DB!.batch([
      prepareSaasAudit(context.env.DB!, {
        clinicId,
        actorUserId: user.id,
        action: "live_patient_read",
        targetType: "live_patient",
        targetId: row.id,
        metadata: { encryptionVersion: row.encryption_version },
      }),
    ]);
    return tenantJson({
      id: row.id,
      clinicId: row.clinic_id,
      primaryProfessionalUserId: row.primary_professional_user_id,
      profile,
      encryptionVersion: row.encryption_version,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error("[live.patients/:id.GET] read/audit failure", error);
    return tenantError("Dados clínicos indisponíveis.", "CLINICAL_READ_AUDIT_FAILED", 500);
  }
};
