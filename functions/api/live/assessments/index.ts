import { z } from "zod";
import { clinicalSources } from "../../../../shared/clinical-core";
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
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../tenant/_crypto";

const SOURCES = new Set<string>(clinicalSources);
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const ISO_INSTANT = z.string().datetime({ offset: true });
const MAX_PAYLOAD_BYTES = 100_000;
const MAX_RESPONSE_COUNT = 1_000;

interface LiveAssessmentRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  instrument_id: string;
  instrument_version: string;
  applied_by_user_id: string;
  applied_at: string;
  provenance_source: string;
  payload_encrypted: string;
  encryption_version: string;
  supersedes_assessment_id: string | null;
  status: "active" | "corrected" | "voided";
  created_at: string;
  updated_at: string;
}

interface LiveAssessmentResponseRow {
  id: string;
  assessment_id: string;
  item_id: string;
  item_position: number;
  response_encrypted: string;
  encryption_version: string;
  created_at: string;
}

interface AssessmentResponseInput {
  itemId: string;
  itemPosition: number;
  value: unknown;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanOptional(value: unknown, max: number): string | null {
  const result = cleanText(value, max);
  return result || null;
}

function isPlainJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedInstant(value: unknown): string | null {
  const raw = cleanText(value, 64);
  if (!raw) return new Date().toISOString();
  const parsed = ISO_INSTANT.safeParse(raw);
  if (!parsed.success) return null;
  const millis = Date.parse(parsed.data);
  return Number.isFinite(millis) ? new Date(millis).toISOString() : null;
}

function payloadBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError("Clinical Core LIVE permanece bloqueado.", "CLINICAL_LIVE_DISABLED", 503);
  }
  if (!clinicalCryptoReady(env)) {
    return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }
  return null;
}

async function patientBelongsToClinic(
  db: D1Database,
  clinicId: string,
  patientId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT id FROM live_patients
        WHERE id = ? AND clinic_id = ? AND status <> 'merged' LIMIT 1`,
    )
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

async function readResponses(
  db: D1Database,
  env: TenantEnv,
  clinicId: string,
  assessmentId: string,
): Promise<AssessmentResponseInput[]> {
  const rows = await db
    .prepare(
      `SELECT id, assessment_id, item_id, item_position, response_encrypted,
              encryption_version, created_at
         FROM live_assessment_responses
        WHERE clinic_id = ? AND assessment_id = ?
        ORDER BY item_position ASC, created_at ASC`,
    )
    .bind(clinicId, assessmentId)
    .all<LiveAssessmentResponseRow>();

  return Promise.all(
    (rows.results ?? []).map(async (row) => ({
      itemId: row.item_id,
      itemPosition: row.item_position,
      value: await decryptClinicalJson<unknown>(
        env,
        clinicId,
        `assessment-response:${row.id}`,
        row.response_encrypted,
      ),
    })),
  );
}

async function decodeAssessment(
  db: D1Database,
  env: TenantEnv,
  clinicId: string,
  row: LiveAssessmentRow,
): Promise<Record<string, unknown>> {
  const [payload, responses] = await Promise.all([
    decryptClinicalJson<Record<string, unknown>>(
      env,
      clinicId,
      `assessment:${row.id}`,
      row.payload_encrypted,
    ),
    readResponses(db, env, clinicId, row.id),
  ]);
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    instrumentId: row.instrument_id,
    instrumentVersion: row.instrument_version,
    appliedByUserId: row.applied_by_user_id,
    appliedAt: row.applied_at,
    provenanceSource: row.provenance_source,
    payload,
    responses,
    encryptionVersion: row.encryption_version,
    supersedesAssessmentId: row.supersedes_assessment_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    interpretationNotice:
      "A pontuação é apoio clínico e não constitui diagnóstico automático.",
  };
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
  const patientId = cleanText(url.searchParams.get("patientId"), 80);
  if (!clinicId || !patientId) {
    return tenantError("clinicId e patientId são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  if (!OPAQUE_ID.test(patientId)) return tenantError("patientId inválido.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingReadError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingReadError) return billingReadError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  const rows = await db
    .prepare(
      `SELECT id, clinic_id, patient_id, instrument_id, instrument_version,
              applied_by_user_id, applied_at, provenance_source, payload_encrypted,
              encryption_version, supersedes_assessment_id, status, created_at, updated_at
         FROM live_assessments
        WHERE clinic_id = ? AND patient_id = ?
        ORDER BY applied_at DESC, created_at DESC
        LIMIT 200`,
    )
    .bind(clinicId, patientId)
    .all<LiveAssessmentRow>();

  try {
    const data = await Promise.all((rows.results ?? []).map((row) => decodeAssessment(db, context.env, clinicId, row)));
    return tenantJson({ data });
  } catch (error) {
    console.error("[live.assessments.GET] decrypt failure", error);
    return tenantError("Avaliações clínicas indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
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
  const patientId = cleanText(body.patientId, 80);
  const instrumentId = cleanText(body.instrumentId, 160);
  const instrumentVersion = cleanText(body.instrumentVersion, 80);
  const appliedAt = normalizedInstant(body.appliedAt);
  const provenanceSource = cleanText(body.provenanceSource, 40);
  const supersedesAssessmentId = cleanOptional(body.supersedesAssessmentId, 120);
  const payload = body.payload;
  const responseRaw = body.responses ?? [];

  if (!clinicId || !OPAQUE_ID.test(patientId) || !instrumentId || !instrumentVersion) {
    return tenantError(
      "clinicId, patientId, instrumentId e instrumentVersion são obrigatórios.",
      "VALIDATION_ERROR",
      400,
    );
  }
  if (!appliedAt || !SOURCES.has(provenanceSource)) {
    return tenantError("appliedAt e provenanceSource controlados são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  if (supersedesAssessmentId && !OPAQUE_ID.test(supersedesAssessmentId)) {
    return tenantError("supersedesAssessmentId inválido.", "VALIDATION_ERROR", 400);
  }
  if (!isPlainJsonObject(payload)) {
    return tenantError("payload da avaliação deve ser um objeto JSON.", "VALIDATION_ERROR", 400);
  }
  if (!Array.isArray(responseRaw) || responseRaw.length > MAX_RESPONSE_COUNT) {
    return tenantError("responses deve ser uma lista de no máximo 1.000 itens.", "VALIDATION_ERROR", 400);
  }

  const responses: AssessmentResponseInput[] = [];
  const responseIds = new Set<string>();
  for (const item of responseRaw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return tenantError("Cada resposta deve ser um objeto.", "VALIDATION_ERROR", 400);
    }
    const record = item as Record<string, unknown>;
    const itemId = cleanText(record.itemId, 160);
    const itemPosition = record.itemPosition;
    if (!itemId || !OPAQUE_ID.test(itemId) || !Number.isInteger(itemPosition) || Number(itemPosition) < 0) {
      return tenantError("Cada resposta exige itemId opaco e itemPosition inteiro.", "VALIDATION_ERROR", 400);
    }
    if (responseIds.has(itemId)) return tenantError("itemId duplicado na avaliação.", "VALIDATION_ERROR", 400);
    responseIds.add(itemId);
    responses.push({ itemId, itemPosition: Number(itemPosition), value: record.value });
  }

  if (payloadBytes(payload) > MAX_PAYLOAD_BYTES || payloadBytes(responses) > MAX_PAYLOAD_BYTES) {
    return tenantError("payload clínico excede 100 KB.", "PAYLOAD_TOO_LARGE", 413);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) {
    return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingWriteError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingWriteError) return billingWriteError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  if (supersedesAssessmentId) {
    const previous = await db
      .prepare(
        `SELECT id, status FROM live_assessments
          WHERE id = ? AND clinic_id = ? AND patient_id = ? LIMIT 1`,
      )
      .bind(supersedesAssessmentId, clinicId, patientId)
      .first<{ id: string; status: "active" | "corrected" | "voided" }>();
    if (!previous) return tenantError("Avaliação sucessora não pertence ao mesmo tenant/paciente.", "INVALID_SUPERSESSION", 409);
    if (previous.status !== "active") return tenantError("Somente avaliação ativa pode ser corrigida.", "ASSESSMENT_NOT_ACTIVE", 409);
  }

  const assessmentId = crypto.randomUUID();
  const now = new Date().toISOString();
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const payloadEncrypted = await encryptClinicalJson(
    context.env,
    clinicId,
    `assessment:${assessmentId}`,
    payload,
  );
  const responseRows = await Promise.all(
    responses.map(async (response) => {
      const id = crypto.randomUUID();
      return {
        id,
        response,
        encrypted: await encryptClinicalJson(
          context.env,
          clinicId,
          `assessment-response:${id}`,
          response.value,
        ),
      };
    }),
  );

  const statements: D1PreparedStatement[] = [];
  if (supersedesAssessmentId) {
    statements.push(
      db
        .prepare(
          `UPDATE live_assessments SET status = 'corrected', updated_at = ?
            WHERE id = ? AND clinic_id = ? AND patient_id = ? AND status = 'active'`,
        )
        .bind(now, supersedesAssessmentId, clinicId, patientId),
    );
  }
  const assessmentInsert = supersedesAssessmentId
    ? db
        .prepare(
          `INSERT INTO live_assessments
            (id, clinic_id, patient_id, instrument_id, instrument_version,
             applied_by_user_id, applied_at, provenance_source, payload_encrypted,
             encryption_version, supersedes_assessment_id, status, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?
            WHERE changes() = 1`,
        )
        .bind(
          assessmentId,
          clinicId,
          patientId,
          instrumentId,
          instrumentVersion,
          user.id,
          appliedAt,
          provenanceSource,
          payloadEncrypted,
          encryptionVersion,
          supersedesAssessmentId,
          now,
          now,
        )
    : db
        .prepare(
          `INSERT INTO live_assessments
            (id, clinic_id, patient_id, instrument_id, instrument_version,
             applied_by_user_id, applied_at, provenance_source, payload_encrypted,
             encryption_version, supersedes_assessment_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'active', ?, ?)`,
        )
        .bind(
          assessmentId,
          clinicId,
          patientId,
          instrumentId,
          instrumentVersion,
          user.id,
          appliedAt,
          provenanceSource,
          payloadEncrypted,
          encryptionVersion,
          now,
          now,
        );
  statements.push(assessmentInsert);
  for (const row of responseRows) {
    statements.push(
      db
        .prepare(
          `INSERT INTO live_assessment_responses
            (id, clinic_id, patient_id, assessment_id, item_id, item_position,
             response_encrypted, encryption_version, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          row.id,
          clinicId,
          patientId,
          assessmentId,
          row.response.itemId,
          row.response.itemPosition,
          row.encrypted,
          encryptionVersion,
          now,
        ),
    );
  }
  statements.push(
    prepareSaasAudit(
      db,
      {
        clinicId,
        actorUserId: user.id,
        action: "live_assessment_create",
        targetType: "assessment",
        targetId: assessmentId,
        metadata: { instrumentId, instrumentVersion, encryptionVersion },
      },
      true,
    ),
  );

  try {
    const results = await db.batch(statements);
    const assessmentIndex = supersedesAssessmentId ? 1 : 0;
    const auditResult = results[results.length - 1];
    if (
      Number(results[assessmentIndex]?.meta?.changes ?? 0) !== 1 ||
      Number(auditResult?.meta?.changes ?? 0) !== 1
    ) {
      return tenantError("A avaliação mudou durante a correção. Recarregue o paciente.", "STALE_SUPERSESSION", 409);
    }
  } catch (error) {
    console.error("[live.assessments.POST] DB error", error);
    return tenantError("Não foi possível registrar a avaliação LIVE.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id: assessmentId,
      clinicId,
      patientId,
      instrumentId,
      instrumentVersion,
      appliedByUserId: user.id,
      appliedAt,
      provenanceSource,
      payload,
      responses: responses.map(({ itemId, itemPosition, value }) => ({ itemId, itemPosition, value })),
      encryptionVersion,
      supersedesAssessmentId,
      status: "active",
      createdAt: now,
      updatedAt: now,
      interpretationNotice: "A pontuação é apoio clínico e não constitui diagnóstico automático.",
    },
    201,
  );
};
