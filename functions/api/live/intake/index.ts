import {
  getRemoteIntakeTemplate,
  isRemoteIntakeFormKind,
  isRemoteIntakeRespondentKind,
  type RemoteIntakeRespondentKind,
} from "../../../../shared/remote-intake";
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  cleanIntakeText,
  createRemoteIntakeToken,
  remoteIntakeFormId,
  requireRemoteIntakeConfiguration,
} from "../../intake/_shared";
import {
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
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../tenant/_crypto";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

interface IntakeRow {
  invitation_id: string;
  clinic_id: string;
  patient_id: string;
  respondent_kind: RemoteIntakeRespondentKind;
  form_kind: "pre_consulta" | "pre_retorno" | "school_report";
  form_id: string;
  invitation_status: "pending" | "submitted" | "revoked";
  expires_at: string;
  invitation_created_at: string;
  submission_id: string | null;
  payload_encrypted: string | null;
  encryption_version: string | null;
  consent_notice_version: string | null;
  consented_at: string | null;
  review_status: "pending" | "accepted" | "rejected" | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  clinical_event_id: string | null;
  submitted_at: string | null;
}

interface SubmissionForReview {
  id: string;
  invitation_id: string;
  clinic_id: string;
  patient_id: string;
  respondent_kind: RemoteIntakeRespondentKind;
  form_kind: "pre_consulta" | "pre_retorno" | "school_report";
  form_id: string;
  payload_encrypted: string;
  consent_notice_version: string;
  consented_at: string;
  review_status: "pending" | "accepted" | "rejected";
  submitted_at: string;
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

function respondentToClinicalSource(kind: RemoteIntakeRespondentKind): "family" | "school" | "therapist" | "patient" {
  return kind;
}

function computedInvitationStatus(row: IntakeRow): "pending" | "submitted" | "revoked" | "expired" {
  if (row.invitation_status !== "pending") return row.invitation_status;
  return Date.parse(row.expires_at) <= Date.now() ? "expired" : "pending";
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;

  const url = new URL(context.request.url);
  const clinicId = cleanIntakeText(url.searchParams.get("clinicId"), 80);
  const patientId = cleanIntakeText(url.searchParams.get("patientId"), 120);
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
         invitation.form_kind,
         invitation.form_id,
         invitation.status AS invitation_status,
         invitation.expires_at,
         invitation.created_at AS invitation_created_at,
         submission.id AS submission_id,
         submission.payload_encrypted,
         submission.encryption_version,
         submission.consent_notice_version,
         submission.consented_at,
         submission.review_status,
         submission.reviewed_by_user_id,
         submission.reviewed_at,
         submission.clinical_event_id,
         submission.submitted_at
       FROM live_intake_invitations invitation
       LEFT JOIN live_intake_submissions submission
         ON submission.invitation_id = invitation.id
       WHERE invitation.clinic_id = ? AND invitation.patient_id = ?
       ORDER BY invitation.created_at DESC
       LIMIT 100`,
    )
    .bind(clinicId, patientId)
    .all<IntakeRow>();

  try {
    const data = await Promise.all(
      (rows.results ?? []).map(async (row) => ({
        invitationId: row.invitation_id,
        respondentKind: row.respondent_kind,
        formKind: row.form_kind,
        formId: row.form_id,
        formTitle: getRemoteIntakeTemplate(row.form_kind).title,
        invitationStatus: computedInvitationStatus(row),
        expiresAt: row.expires_at,
        createdAt: row.invitation_created_at,
        submission: row.submission_id
          ? {
              id: row.submission_id,
              payload: row.payload_encrypted
                ? await decryptClinicalJson<Record<string, unknown>>(
                    context.env,
                    clinicId,
                    `remote-intake-submission:${row.submission_id}`,
                    row.payload_encrypted,
                  )
                : null,
              consentNoticeVersion: row.consent_notice_version,
              consentedAt: row.consented_at,
              reviewStatus: row.review_status,
              reviewedByUserId: row.reviewed_by_user_id,
              reviewedAt: row.reviewed_at,
              clinicalEventId: row.clinical_event_id,
              submittedAt: row.submitted_at,
            }
          : null,
      })),
    );
    return tenantJson({ data });
  } catch (error) {
    console.error("[live.intake.GET] decrypt failure", error);
    return tenantError("Intakes indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);

  const clinicId = cleanIntakeText(body.clinicId, 80);
  const patientId = cleanIntakeText(body.patientId, 120);
  const respondentKind = body.respondentKind;
  const formKind = body.formKind;
  const requestedHours = Number(body.expiresInHours ?? 168);

  if (
    !clinicId ||
    !OPAQUE_ID.test(patientId) ||
    !isRemoteIntakeRespondentKind(respondentKind) ||
    !isRemoteIntakeFormKind(formKind)
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
  const { token, tokenHash } = await createRemoteIntakeToken(context.env, clinicId, invitationId);
  const formId = remoteIntakeFormId(formKind);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + requestedHours * 60 * 60 * 1000).toISOString();

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO live_intake_invitations
            (id, clinic_id, patient_id, created_by_user_id, respondent_kind,
             form_kind, form_id, token_hash, status, expires_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        )
        .bind(
          invitationId,
          clinicId,
          patientId,
          user.id,
          respondentKind,
          formKind,
          formId,
          tokenHash,
          expiresAt,
          now.toISOString(),
          now.toISOString(),
        ),
      prepareSaasAudit(db, {
        clinicId,
        actorUserId: user.id,
        action: "remote_intake_invite_create",
        targetType: "remote_intake_invitation",
        targetId: invitationId,
        metadata: { respondentKind, formKind, expiresInHours: requestedHours },
      }),
    ]);
  } catch (error) {
    console.error("[live.intake.POST] create failure", error);
    return tenantError("Não foi possível criar o convite.", "INTAKE_CREATE_FAILED", 500);
  }

  return tenantJson(
    {
      id: invitationId,
      token,
      respondentKind,
      formKind,
      formTitle: getRemoteIntakeTemplate(formKind).title,
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
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);

  const clinicId = cleanIntakeText(body.clinicId, 80);
  const patientId = cleanIntakeText(body.patientId, 120);
  const action = cleanIntakeText(body.action, 20);
  if (!clinicId || !OPAQUE_ID.test(patientId) || !["revoke", "accept", "reject"].includes(action)) {
    return tenantError("Ação de intake inválida.", "VALIDATION_ERROR", 400);
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
    const invitationId = cleanIntakeText(body.invitationId, 120);
    if (!OPAQUE_ID.test(invitationId)) {
      return tenantError("invitationId inválido.", "VALIDATION_ERROR", 400);
    }
    const results = await db.batch([
      db
        .prepare(
          `UPDATE live_intake_invitations
              SET status = 'revoked', updated_at = ?
            WHERE id = ? AND clinic_id = ? AND patient_id = ? AND status = 'pending'`,
        )
        .bind(now, invitationId, clinicId, patientId),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "remote_intake_invite_revoke",
          targetType: "remote_intake_invitation",
          targetId: invitationId,
          metadata: {},
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      return tenantError("Convite não está pendente ou não pertence ao paciente.", "INTAKE_NOT_PENDING", 409);
    }
    return tenantJson({ id: invitationId, status: "revoked" });
  }

  const submissionId = cleanIntakeText(body.submissionId, 120);
  if (!OPAQUE_ID.test(submissionId)) {
    return tenantError("submissionId inválido.", "VALIDATION_ERROR", 400);
  }
  const submission = await db
    .prepare(
      `SELECT id, invitation_id, clinic_id, patient_id, respondent_kind, form_kind,
              form_id, payload_encrypted, consent_notice_version, consented_at,
              review_status, submitted_at
         FROM live_intake_submissions
        WHERE id = ? AND clinic_id = ? AND patient_id = ?
        LIMIT 1`,
    )
    .bind(submissionId, clinicId, patientId)
    .first<SubmissionForReview>();
  if (!submission) {
    return tenantError("Submissão não encontrada neste paciente/tenant.", "INTAKE_NOT_FOUND", 404);
  }
  if (submission.review_status !== "pending") {
    return tenantError("Esta submissão já foi revisada.", "INTAKE_ALREADY_REVIEWED", 409);
  }

  if (action === "reject") {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE live_intake_submissions
              SET review_status = 'rejected', reviewed_by_user_id = ?, reviewed_at = ?
            WHERE id = ? AND clinic_id = ? AND patient_id = ? AND review_status = 'pending'`,
        )
        .bind(user.id, now, submissionId, clinicId, patientId),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "remote_intake_reject",
          targetType: "remote_intake_submission",
          targetId: submissionId,
          metadata: { respondentKind: submission.respondent_kind, formKind: submission.form_kind },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A submissão mudou durante a revisão.", "INTAKE_REVIEW_RACE", 409);
    }
    return tenantJson({ id: submissionId, reviewStatus: "rejected" });
  }

  let intakePayload: Record<string, unknown>;
  try {
    intakePayload = await decryptClinicalJson<Record<string, unknown>>(
      context.env,
      clinicId,
      `remote-intake-submission:${submission.id}`,
      submission.payload_encrypted,
    );
  } catch (error) {
    console.error("[live.intake.PATCH] decrypt failure", error);
    return tenantError("Submissão indisponível para revisão.", "CLINICAL_DECRYPT_FAILED", 500);
  }

  const eventId = crypto.randomUUID();
  const provenanceSource = respondentToClinicalSource(submission.respondent_kind);
  const sourceRecordHash = await clinicalBlindIndex(
    context.env,
    clinicId,
    `source-record:${provenanceSource}`,
    `remote-intake:${submission.id}`,
  );
  const eventPayload = {
    documentKind: "remote_intake",
    intakeSubmissionId: submission.id,
    invitationId: submission.invitation_id,
    formKind: submission.form_kind,
    formId: submission.form_id,
    respondentKind: submission.respondent_kind,
    submittedAt: submission.submitted_at,
    consentNoticeVersion: submission.consent_notice_version,
    consentedAt: submission.consented_at,
    content: intakePayload,
    review: {
      status: "accepted",
      reviewedAt: now,
      reviewerUserId: user.id,
    },
  };
  const payloadEncrypted = await encryptClinicalJson(
    context.env,
    clinicId,
    `clinical-event:${eventId}`,
    eventPayload,
  );
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);

  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE live_intake_submissions
              SET review_status = 'accepted', reviewed_by_user_id = ?, reviewed_at = ?, clinical_event_id = ?
            WHERE id = ? AND clinic_id = ? AND patient_id = ? AND review_status = 'pending'`,
        )
        .bind(user.id, now, eventId, submissionId, clinicId, patientId),
      db
        .prepare(
          `INSERT INTO live_clinical_events
            (id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
             encounter_id, provenance_kind, provenance_source, payload_encrypted,
             encryption_version, source_record_hash, supersedes_event_id, status, created_at)
           SELECT ?, ?, ?, ?, 'document', ?, NULL, 'imported', ?, ?, ?, ?, NULL, 'active', ?
            WHERE changes() = 1`,
        )
        .bind(
          eventId,
          clinicId,
          patientId,
          user.id,
          submission.submitted_at,
          provenanceSource,
          payloadEncrypted,
          encryptionVersion,
          sourceRecordHash,
          now,
        ),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "remote_intake_accept",
          targetType: "remote_intake_submission",
          targetId: submissionId,
          metadata: {
            eventId,
            eventType: "document",
            provenanceKind: "imported",
            provenanceSource,
            formKind: submission.form_kind,
          },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A submissão mudou durante a revisão.", "INTAKE_REVIEW_RACE", 409);
    }
  } catch (error) {
    console.error("[live.intake.PATCH] accept failure", error);
    return tenantError("Não foi possível incorporar a submissão ao Clinical Core.", "INTAKE_ACCEPT_FAILED", 500);
  }

  return tenantJson({ id: submissionId, reviewStatus: "accepted", clinicalEventId: eventId });
};
