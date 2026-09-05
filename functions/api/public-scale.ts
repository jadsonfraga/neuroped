import { getRemoteScaleDescriptor, REMOTE_SCALE_CONSENT_NOTICE, REMOTE_SCALE_CONSENT_VERSION, REMOTE_SCALE_SAFETY_NOTICE, type RemoteScaleId, type RemoteScaleRespondentKind } from "../../shared/remoteScaleCatalog";
import {
  cleanScaleText,
  parseRemoteScaleToken,
  readRemoteScaleToken,
  requireRemoteScaleConfiguration,
  validateRemoteScaleAnswers,
  verifyRemoteScaleSecret,
} from "./scale/_shared";
import { tenantError, tenantJson, type TenantEnv } from "./tenant/_core";
import { currentClinicalEncryptionVersion, encryptClinicalJson } from "./tenant/_crypto";

interface PublicScaleInvitationRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  respondent_kind: RemoteScaleRespondentKind;
  scale_id: RemoteScaleId;
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
): Promise<{ row: PublicScaleInvitationRow | null; tokenValid: boolean }> {
  const parsed = parseRemoteScaleToken(token);
  if (!parsed) return { row: null, tokenValid: false };

  const row = await db
    .prepare(
      `SELECT invitation.id, invitation.clinic_id, invitation.patient_id,
              invitation.respondent_kind, invitation.scale_id,
              invitation.token_hash, invitation.status, invitation.expires_at,
              clinic.name AS clinic_name
         FROM live_scale_invitations invitation
         JOIN clinics clinic ON clinic.id = invitation.clinic_id
        WHERE invitation.id = ?
        LIMIT 1`,
    )
    .bind(parsed.invitationId)
    .first<PublicScaleInvitationRow>();
  if (!row) return { row: null, tokenValid: false };

  const tokenValid = await verifyRemoteScaleSecret(env, row.clinic_id, parsed.secret, row.token_hash);
  return { row, tokenValid };
}

function invitationStateFailure(row: PublicScaleInvitationRow): Response | null {
  if (row.status === "revoked") {
    return tenantError("Este convite foi revogado.", "SCALE_INVITATION_REVOKED", 410);
  }
  if (row.status === "submitted") {
    return tenantError("Este questionário já foi enviado.", "SCALE_ALREADY_SUBMITTED", 409);
  }
  if (Date.parse(row.expires_at) <= Date.now()) {
    return tenantError("Este convite expirou.", "SCALE_INVITATION_EXPIRED", 410);
  }
  return null;
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Serviço indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  const configError = requireRemoteScaleConfiguration(context.env);
  if (configError) return configError;

  const token = readRemoteScaleToken(context.request);
  const resolved = await resolveInvitation(db, context.env, token);
  if (!resolved.row || !resolved.tokenValid) {
    return tenantError("Convite inválido.", "SCALE_INVITATION_INVALID", 404);
  }
  const stateFailure = invitationStateFailure(resolved.row);
  if (stateFailure) return stateFailure;

  const descriptor = getRemoteScaleDescriptor(resolved.row.scale_id);
  if (!descriptor) {
    return tenantError("Escala indisponível.", "SCALE_NOT_FOUND", 404);
  }

  return tenantJson({
    clinicName: resolved.row.clinic_name,
    respondentKind: resolved.row.respondent_kind,
    scaleId: resolved.row.scale_id,
    // Só texto/opções — sem `value` de pontuação nem `bands` de interpretação.
    scale: {
      name: descriptor.name,
      fullName: descriptor.fullName,
      instructions: descriptor.instructions,
      ageLabel: descriptor.ageLabel,
      items: descriptor.items,
    },
    expiresAt: resolved.row.expires_at,
    consent: {
      version: REMOTE_SCALE_CONSENT_VERSION,
      notice: REMOTE_SCALE_CONSENT_NOTICE,
    },
    safetyNotice: REMOTE_SCALE_SAFETY_NOTICE,
  });
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Serviço indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  const configError = requireRemoteScaleConfiguration(context.env);
  if (configError) return configError;

  const token = readRemoteScaleToken(context.request);
  const resolved = await resolveInvitation(db, context.env, token);
  if (!resolved.row || !resolved.tokenValid) {
    return tenantError("Convite inválido.", "SCALE_INVITATION_INVALID", 404);
  }
  const stateFailure = invitationStateFailure(resolved.row);
  if (stateFailure) return stateFailure;

  const descriptor = getRemoteScaleDescriptor(resolved.row.scale_id);
  if (!descriptor) {
    return tenantError("Escala indisponível.", "SCALE_NOT_FOUND", 404);
  }

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  if (body.consentAccepted !== true) {
    return tenantError("É necessário confirmar a ciência do envio antes de continuar.", "CONSENT_REQUIRED", 400);
  }

  const itemOptionCounts = descriptor.items.map((item) => item.options.length);
  const validation = validateRemoteScaleAnswers(resolved.row.scale_id, body.answers, itemOptionCounts);
  if (!validation.ok) {
    return tenantError(validation.message, "VALIDATION_ERROR", 400);
  }

  const respondentName = cleanScaleText(body.respondentName, 160);
  const relationship = cleanScaleText(body.relationship, 160);
  const submittedAt = new Date().toISOString();
  const responseId = crypto.randomUUID();
  const payload = {
    respondent: {
      ...(respondentName ? { name: respondentName } : {}),
      ...(relationship ? { relationship } : {}),
    },
    // Índices de opção por item, na mesma ordem do descritor — o profissional
    // reconstrói o rótulo/pontuação ao revisar (fonte única do catálogo).
    answers: validation.answers,
    consent: {
      accepted: true,
      noticeVersion: REMOTE_SCALE_CONSENT_VERSION,
      acceptedAt: submittedAt,
    },
  };

  const answersEncrypted = await encryptClinicalJson(
    context.env,
    resolved.row.clinic_id,
    `remote-scale-response:${responseId}`,
    payload,
  );
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);

  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO live_scale_responses
            (id, invitation_id, clinic_id, patient_id, respondent_kind, scale_id,
             answers_encrypted, encryption_version, consent_notice_version,
             consented_at, review_status, submitted_at, created_at)
           SELECT ?, id, clinic_id, patient_id, respondent_kind, scale_id,
                  ?, ?, ?, ?, 'pending', ?, ?
             FROM live_scale_invitations
            WHERE id = ? AND clinic_id = ? AND status = 'pending' AND expires_at > ?`,
        )
        .bind(
          responseId,
          answersEncrypted,
          encryptionVersion,
          REMOTE_SCALE_CONSENT_VERSION,
          submittedAt,
          submittedAt,
          submittedAt,
          resolved.row.id,
          resolved.row.clinic_id,
          submittedAt,
        ),
      db
        .prepare(
          `UPDATE live_scale_invitations
              SET status = 'submitted', submitted_at = ?, updated_at = ?
            WHERE id = ? AND clinic_id = ? AND status = 'pending'
              AND EXISTS (
                SELECT 1 FROM live_scale_responses
                 WHERE id = ? AND invitation_id = live_scale_invitations.id
              )`,
        )
        .bind(submittedAt, submittedAt, resolved.row.id, resolved.row.clinic_id, responseId),
      // Auditoria no MESMO batch e condicionada à resposta ter persistido: a
      // trilha não existe sem o envio, e o envio não existe sem a trilha.
      // Metadata-only — nenhuma coluna aqui aceita nome, resposta, paciente,
      // token ou qualquer conteúdo clínico.
      db
        .prepare(
          `INSERT INTO public_submission_audit_log
            (id, clinic_id, surface, action, invitation_id, consent_version,
             outcome, origin, created_at)
           SELECT ?, ?, 'public_scale', 'submitted', ?, ?, 'accepted',
                  'public_invitation', ?
            WHERE EXISTS (SELECT 1 FROM live_scale_responses WHERE id = ?)`,
        )
        .bind(
          crypto.randomUUID(),
          resolved.row.clinic_id,
          resolved.row.id,
          REMOTE_SCALE_CONSENT_VERSION,
          submittedAt,
          responseId,
        ),
    ]);
    if (
      (results[0]?.meta?.changes ?? 0) !== 1 ||
      (results[1]?.meta?.changes ?? 0) !== 1 ||
      (results[2]?.meta?.changes ?? 0) !== 1
    ) {
      return tenantError("O convite não está mais disponível.", "SCALE_SUBMIT_RACE", 409);
    }
  } catch (error) {
    console.error("[public-scale.POST] persistence failure", error);
    return tenantError("Não foi possível concluir o envio.", "SCALE_SUBMIT_FAILED", 500);
  }

  return tenantJson(
    {
      submitted: true,
      message: "Respostas enviadas para revisão da equipe assistencial.",
      reviewNotice: "O envio não gera diagnóstico, prescrição ou conduta clínica automática.",
    },
    201,
  );
};
