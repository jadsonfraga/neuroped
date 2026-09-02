import {
  getRemoteIntakeTemplate,
  REMOTE_INTAKE_CONSENT_NOTICE,
  REMOTE_INTAKE_CONSENT_VERSION,
  type RemoteIntakeFormKind,
  type RemoteIntakeRespondentKind,
} from "../../shared/remote-intake";
import {
  cleanIntakeText,
  intakePayloadBytes,
  parseRemoteIntakeToken,
  readRemoteIntakeToken,
  requireRemoteIntakeConfiguration,
  validateRemoteIntakeResponses,
  verifyRemoteIntakeSecret,
} from "./intake/_shared";
import { tenantError, tenantJson, type TenantEnv } from "./tenant/_core";
import {
  currentClinicalEncryptionVersion,
  encryptClinicalJson,
} from "./tenant/_crypto";

interface PublicInvitationRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  respondent_kind: RemoteIntakeRespondentKind;
  form_kind: RemoteIntakeFormKind;
  form_id: string;
  token_hash: string;
  status: "pending" | "submitted" | "revoked";
  expires_at: string;
  clinic_name: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return isPlainObject(value) ? value : null;
  } catch {
    return null;
  }
}

async function resolveInvitation(
  db: D1Database,
  env: TenantEnv,
  token: string,
): Promise<{ row: PublicInvitationRow | null; tokenValid: boolean }> {
  const parsed = parseRemoteIntakeToken(token);
  if (!parsed) return { row: null, tokenValid: false };

  const row = await db
    .prepare(
      `SELECT invitation.id, invitation.clinic_id, invitation.patient_id,
              invitation.respondent_kind, invitation.form_kind, invitation.form_id,
              invitation.token_hash, invitation.status, invitation.expires_at,
              clinic.name AS clinic_name
         FROM live_intake_invitations invitation
         JOIN clinics clinic ON clinic.id = invitation.clinic_id
        WHERE invitation.id = ?
        LIMIT 1`,
    )
    .bind(parsed.invitationId)
    .first<PublicInvitationRow>();
  if (!row) return { row: null, tokenValid: false };

  const tokenValid = await verifyRemoteIntakeSecret(env, row.clinic_id, parsed.secret, row.token_hash);
  return { row, tokenValid };
}

function invitationStateFailure(row: PublicInvitationRow): Response | null {
  if (row.status === "revoked") {
    return tenantError("Este convite foi revogado.", "INTAKE_REVOKED", 410);
  }
  if (row.status === "submitted") {
    return tenantError("Este formulário já foi enviado.", "INTAKE_ALREADY_SUBMITTED", 409);
  }
  if (Date.parse(row.expires_at) <= Date.now()) {
    return tenantError("Este convite expirou.", "INTAKE_EXPIRED", 410);
  }
  return null;
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Serviço de intake indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;

  const token = readRemoteIntakeToken(context.request);
  const resolved = await resolveInvitation(db, context.env, token);
  if (!resolved.row || !resolved.tokenValid) {
    return tenantError("Convite inválido.", "INTAKE_INVALID", 404);
  }
  const stateFailure = invitationStateFailure(resolved.row);
  if (stateFailure) return stateFailure;

  const template = getRemoteIntakeTemplate(resolved.row.form_kind);
  return tenantJson({
    clinicName: resolved.row.clinic_name,
    respondentKind: resolved.row.respondent_kind,
    formKind: resolved.row.form_kind,
    formId: resolved.row.form_id,
    template,
    expiresAt: resolved.row.expires_at,
    consent: {
      version: REMOTE_INTAKE_CONSENT_VERSION,
      notice: REMOTE_INTAKE_CONSENT_NOTICE,
    },
    safetyNotice:
      "Este formulário não é monitorado como canal de urgência. Em emergência, procure atendimento imediato ou acione o SAMU 192.",
  });
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Serviço de intake indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;

  const token = readRemoteIntakeToken(context.request);
  const resolved = await resolveInvitation(db, context.env, token);
  if (!resolved.row || !resolved.tokenValid) {
    return tenantError("Convite inválido.", "INTAKE_INVALID", 404);
  }
  const stateFailure = invitationStateFailure(resolved.row);
  if (stateFailure) return stateFailure;

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  if (body.consentAccepted !== true) {
    return tenantError("É necessário confirmar a ciência do envio antes de continuar.", "CONSENT_REQUIRED", 400);
  }

  const validation = validateRemoteIntakeResponses(resolved.row.form_kind, body.responses);
  if (!validation.ok) {
    return tenantError(validation.message, "VALIDATION_ERROR", 400);
  }

  const respondentName = cleanIntakeText(body.respondentName, 160);
  const relationship = cleanIntakeText(body.relationship, 160);
  const submittedAt = new Date().toISOString();
  const submissionId = crypto.randomUUID();
  const payload = {
    respondent: {
      ...(respondentName ? { name: respondentName } : {}),
      ...(relationship ? { relationship } : {}),
    },
    responses: validation.responses,
    consent: {
      accepted: true,
      noticeVersion: REMOTE_INTAKE_CONSENT_VERSION,
      acceptedAt: submittedAt,
    },
  };
  if (intakePayloadBytes(payload) > 100_000) {
    return tenantError("Conteúdo excede o limite permitido.", "PAYLOAD_TOO_LARGE", 413);
  }

  const payloadEncrypted = await encryptClinicalJson(
    context.env,
    resolved.row.clinic_id,
    `remote-intake-submission:${submissionId}`,
    payload,
  );
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);

  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO live_intake_submissions
            (id, invitation_id, clinic_id, patient_id, respondent_kind, form_kind,
             form_id, payload_encrypted, encryption_version, consent_notice_version,
             consented_at, review_status, submitted_at, created_at)
           SELECT ?, id, clinic_id, patient_id, respondent_kind, form_kind,
                  form_id, ?, ?, ?, ?, 'pending', ?, ?
             FROM live_intake_invitations
            WHERE id = ? AND clinic_id = ? AND status = 'pending' AND expires_at > ?`,
        )
        .bind(
          submissionId,
          payloadEncrypted,
          encryptionVersion,
          REMOTE_INTAKE_CONSENT_VERSION,
          submittedAt,
          submittedAt,
          submittedAt,
          resolved.row.id,
          resolved.row.clinic_id,
          submittedAt,
        ),
      db
        .prepare(
          `UPDATE live_intake_invitations
              SET status = 'submitted', submitted_at = ?, updated_at = ?
            WHERE id = ? AND clinic_id = ? AND status = 'pending'
              AND EXISTS (
                SELECT 1 FROM live_intake_submissions
                 WHERE id = ? AND invitation_id = live_intake_invitations.id
              )`,
        )
        .bind(
          submittedAt,
          submittedAt,
          resolved.row.id,
          resolved.row.clinic_id,
          submissionId,
        ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("O convite não está mais disponível.", "INTAKE_SUBMIT_RACE", 409);
    }
  } catch (error) {
    console.error("[public-intake.POST] persistence failure", error);
    return tenantError("Não foi possível concluir o envio.", "INTAKE_SUBMIT_FAILED", 500);
  }

  return tenantJson(
    {
      submitted: true,
      message: "Informações enviadas para revisão da equipe assistencial.",
      reviewNotice: "O envio não gera diagnóstico, prescrição ou conclusão clínica automática.",
    },
    201,
  );
};
