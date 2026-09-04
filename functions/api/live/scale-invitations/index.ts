import {
  getRemoteScaleDescriptor,
  isRemoteScaleId,
  isRemoteScaleRespondentKind,
  REMOTE_SCALE_SUMMARIES,
  type RemoteScaleId,
  type RemoteScaleRespondentKind,
} from "../../../../shared/remoteScaleCatalog";
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  cleanScaleText,
  createRemoteScaleToken,
  requireRemoteScaleConfiguration,
} from "../../scale/_shared";
import {
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import { decryptClinicalJson } from "../../tenant/_crypto";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

interface ScaleRow {
  invitation_id: string;
  clinic_id: string;
  patient_id: string;
  respondent_kind: RemoteScaleRespondentKind;
  scale_id: RemoteScaleId;
  invitation_status: "pending" | "submitted" | "revoked";
  expires_at: string;
  invitation_created_at: string;
  response_id: string | null;
  answers_encrypted: string | null;
  consent_notice_version: string | null;
  consented_at: string | null;
  review_status: "pending" | "reviewed" | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
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

async function patientBelongsToClinic(db: D1Database, clinicId: string, patientId: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT id FROM live_patients
        WHERE id = ? AND clinic_id = ? AND status <> 'merged'
        LIMIT 1`,
    )
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

function computedInvitationStatus(row: ScaleRow): "pending" | "submitted" | "revoked" | "expired" {
  if (row.invitation_status !== "pending") return row.invitation_status;
  return Date.parse(row.expires_at) <= Date.now() ? "expired" : "pending";
}

/** Rótulo/opção reconstruídos a partir do catálogo canônico — nunca duplicados. */
function decodeAnswers(scaleId: RemoteScaleId, answers: number[]): Array<{ label: string; value: string }> {
  const descriptor = getRemoteScaleDescriptor(scaleId);
  if (!descriptor) return [];
  return descriptor.items.map((item, index) => ({
    label: item.text,
    value: item.options[answers[index]]?.label ?? "—",
  }));
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireRemoteScaleConfiguration(context.env);
  if (configError) return configError;

  const url = new URL(context.request.url);
  const clinicId = cleanScaleText(url.searchParams.get("clinicId"), 80);
  const patientId = cleanScaleText(url.searchParams.get("patientId"), 120);
  if (!clinicId || !OPAQUE_ID.test(patientId)) {
    return tenantError("clinicId e patientId válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  const rows = await db
    .prepare(
      `SELECT
         invitation.id AS invitation_id,
         invitation.clinic_id,
         invitation.patient_id,
         invitation.respondent_kind,
         invitation.scale_id,
         invitation.status AS invitation_status,
         invitation.expires_at,
         invitation.created_at AS invitation_created_at,
         response.id AS response_id,
         response.answers_encrypted,
         response.consent_notice_version,
         response.consented_at,
         response.review_status,
         response.reviewed_by_user_id,
         response.reviewed_at,
         response.submitted_at
       FROM live_scale_invitations invitation
       LEFT JOIN live_scale_responses response
         ON response.invitation_id = invitation.id
       WHERE invitation.clinic_id = ? AND invitation.patient_id = ?
       ORDER BY invitation.created_at DESC
       LIMIT 100`,
    )
    .bind(clinicId, patientId)
    .all<ScaleRow>();

  try {
    const data = await Promise.all(
      (rows.results ?? []).map(async (row) => {
        const descriptor = getRemoteScaleDescriptor(row.scale_id);
        let answers: Array<{ label: string; value: string }> = [];
        if (row.response_id && row.answers_encrypted) {
          const decrypted = await decryptClinicalJson<{ answers?: number[]; respondent?: { name?: string; relationship?: string } }>(
            context.env,
            clinicId,
            `remote-scale-response:${row.response_id}`,
            row.answers_encrypted,
          );
          answers = decodeAnswers(row.scale_id, decrypted.answers ?? []);
        }
        return {
          invitationId: row.invitation_id,
          respondentKind: row.respondent_kind,
          scaleId: row.scale_id,
          scaleName: descriptor?.name ?? row.scale_id,
          invitationStatus: computedInvitationStatus(row),
          expiresAt: row.expires_at,
          createdAt: row.invitation_created_at,
          response: row.response_id
            ? {
                id: row.response_id,
                answers,
                reviewStatus: row.review_status,
                reviewedByUserId: row.reviewed_by_user_id,
                reviewedAt: row.reviewed_at,
                submittedAt: row.submitted_at,
              }
            : null,
        };
      }),
    );
    return tenantJson({ data, availableScales: REMOTE_SCALE_SUMMARIES });
  } catch (error) {
    console.error("[live.scale-invitations.GET] decrypt failure", error);
    return tenantError("Respostas indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireRemoteScaleConfiguration(context.env);
  if (configError) return configError;

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);

  const clinicId = cleanScaleText(body.clinicId, 80);
  const patientId = cleanScaleText(body.patientId, 120);
  const respondentKind = body.respondentKind;
  const scaleId = body.scaleId;
  const requestedHours = Number(body.expiresInHours ?? 168);

  if (
    !clinicId ||
    !OPAQUE_ID.test(patientId) ||
    !isRemoteScaleRespondentKind(respondentKind) ||
    !isRemoteScaleId(scaleId)
  ) {
    return tenantError("Dados do convite são inválidos.", "VALIDATION_ERROR", 400);
  }
  if (!Number.isInteger(requestedHours) || requestedHours < 1 || requestedHours > 720) {
    return tenantError("expiresInHours deve estar entre 1 e 720 horas.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) {
    return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  const invitationId = crypto.randomUUID();
  const { token, tokenHash } = await createRemoteScaleToken(context.env, clinicId, invitationId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + requestedHours * 60 * 60 * 1000).toISOString();

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO live_scale_invitations
            (id, clinic_id, patient_id, created_by_user_id, respondent_kind,
             scale_id, token_hash, status, expires_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        )
        .bind(
          invitationId,
          clinicId,
          patientId,
          user.id,
          respondentKind,
          scaleId,
          tokenHash,
          expiresAt,
          now.toISOString(),
          now.toISOString(),
        ),
      prepareSaasAudit(db, {
        clinicId,
        actorUserId: user.id,
        action: "remote_scale_invite_create",
        targetType: "remote_scale_invitation",
        targetId: invitationId,
        metadata: { respondentKind, scaleId, expiresInHours: requestedHours },
      }),
    ]);
  } catch (error) {
    console.error("[live.scale-invitations.POST] create failure", error);
    return tenantError("Não foi possível criar o convite.", "SCALE_INVITE_CREATE_FAILED", 500);
  }

  return tenantJson(
    {
      id: invitationId,
      token,
      respondentKind,
      scaleId,
      scaleName: getRemoteScaleDescriptor(scaleId)?.name ?? scaleId,
      expiresAt,
      tokenNotice: "O token é exibido uma única vez e não é armazenado em texto claro.",
    },
    201,
  );
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireRemoteScaleConfiguration(context.env);
  if (configError) return configError;

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);

  const clinicId = cleanScaleText(body.clinicId, 80);
  const patientId = cleanScaleText(body.patientId, 120);
  const action = cleanScaleText(body.action, 20);
  if (!clinicId || !OPAQUE_ID.test(patientId) || !["revoke", "review"].includes(action)) {
    return tenantError("Ação inválida.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) {
    return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  const now = new Date().toISOString();

  if (action === "revoke") {
    const invitationId = cleanScaleText(body.invitationId, 120);
    if (!OPAQUE_ID.test(invitationId)) {
      return tenantError("invitationId inválido.", "VALIDATION_ERROR", 400);
    }
    const results = await db.batch([
      db
        .prepare(
          `UPDATE live_scale_invitations
              SET status = 'revoked', updated_at = ?
            WHERE id = ? AND clinic_id = ? AND patient_id = ? AND status = 'pending'`,
        )
        .bind(now, invitationId, clinicId, patientId),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "remote_scale_invite_revoke",
          targetType: "remote_scale_invitation",
          targetId: invitationId,
          metadata: {},
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      return tenantError("Convite não está pendente ou não pertence ao paciente.", "SCALE_INVITE_NOT_PENDING", 409);
    }
    return tenantJson({ id: invitationId, status: "revoked" });
  }

  const responseId = cleanScaleText(body.responseId, 120);
  if (!OPAQUE_ID.test(responseId)) {
    return tenantError("responseId inválido.", "VALIDATION_ERROR", 400);
  }
  const results = await db.batch([
    db
      .prepare(
        `UPDATE live_scale_responses
            SET review_status = 'reviewed', reviewed_by_user_id = ?, reviewed_at = ?
          WHERE id = ? AND clinic_id = ? AND patient_id = ? AND review_status = 'pending'`,
      )
      .bind(user.id, now, responseId, clinicId, patientId),
    prepareSaasAudit(
      db,
      {
        clinicId,
        actorUserId: user.id,
        action: "remote_scale_response_review",
        targetType: "remote_scale_response",
        targetId: responseId,
        metadata: {},
      },
      true,
    ),
  ]);
  if ((results[0]?.meta?.changes ?? 0) !== 1) {
    return tenantError("Resposta não encontrada, alheia ao paciente ou já revisada.", "SCALE_RESPONSE_NOT_PENDING", 409);
  }
  return tenantJson({ id: responseId, reviewStatus: "reviewed" });
};
