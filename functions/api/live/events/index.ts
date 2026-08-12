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
  clinicalBlindIndex,
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../tenant/_crypto";

const EVENT_TYPES = new Set([
  "encounter",
  "problem",
  "medication",
  "observation",
  "plan",
  "outcome",
  "safety",
  "document",
  "scale_result",
]);
const PROVENANCE_KINDS = new Set([
  "reported",
  "observed",
  "measured",
  "documented",
  "inferred",
  "decision",
  "imported",
]);

interface LiveEventRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  author_user_id: string;
  event_type: string;
  occurred_at: string;
  encounter_id: string | null;
  provenance_kind: string;
  provenance_source: string;
  payload_encrypted: string;
  encryption_version: string;
  source_record_hash: string | null;
  supersedes_event_id: string | null;
  status: "active" | "corrected" | "voided";
  created_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanOptional(value: unknown, max: number): string | null {
  const result = cleanText(value, max);
  return result || null;
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
    .prepare(`SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? AND status != 'merged' LIMIT 1`)
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
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

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  const rows = await db
    .prepare(
      `SELECT id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
              encounter_id, provenance_kind, provenance_source, payload_encrypted,
              encryption_version, source_record_hash, supersedes_event_id, status, created_at
         FROM live_clinical_events
        WHERE clinic_id = ? AND patient_id = ?
        ORDER BY occurred_at DESC, created_at DESC
        LIMIT 500`,
    )
    .bind(clinicId, patientId)
    .all<LiveEventRow>();

  try {
    const data = await Promise.all(
      (rows.results ?? []).map(async (row) => ({
        id: row.id,
        clinicId: row.clinic_id,
        patientId: row.patient_id,
        authorUserId: row.author_user_id,
        eventType: row.event_type,
        occurredAt: row.occurred_at,
        encounterId: row.encounter_id,
        provenanceKind: row.provenance_kind,
        provenanceSource: row.provenance_source,
        payload: await decryptClinicalJson<unknown>(
          context.env,
          clinicId,
          `clinical-event:${row.id}`,
          row.payload_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        supersedesEventId: row.supersedes_event_id,
        status: row.status,
        createdAt: row.created_at,
      })),
    );
    return tenantJson({ data });
  } catch (error) {
    console.error("[live.events.GET] decrypt failure", error);
    return tenantError("Eventos clínicos indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
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
  const eventType = cleanText(body.eventType, 40);
  const provenanceKind = cleanText(body.provenanceKind, 40);
  const provenanceSource = cleanText(body.provenanceSource, 240);
  const encounterId = cleanOptional(body.encounterId, 120);
  const sourceRecordReference = cleanOptional(body.sourceRecordReference, 500);
  const supersedesEventId = cleanOptional(body.supersedesEventId, 80);
  const occurredAt = cleanText(body.occurredAt, 40) || new Date().toISOString();
  const payload = body.payload;

  if (!clinicId || !patientId || !EVENT_TYPES.has(eventType)) {
    return tenantError("clinicId, patientId e eventType válido são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  if (!PROVENANCE_KINDS.has(provenanceKind) || !provenanceSource) {
    return tenantError("Proveniência clínica é obrigatória.", "VALIDATION_ERROR", 400);
  }
  if (Number.isNaN(Date.parse(occurredAt))) {
    return tenantError("occurredAt inválido.", "VALIDATION_ERROR", 400);
  }
  if (payload === undefined) {
    return tenantError("payload clínico é obrigatório.", "VALIDATION_ERROR", 400);
  }
  const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  if (payloadSize > 100_000) {
    return tenantError("payload clínico excede 100 KB.", "PAYLOAD_TOO_LARGE", 413);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) {
    return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  if (supersedesEventId) {
    const superseded = await db
      .prepare(
        `SELECT id FROM live_clinical_events
          WHERE id = ? AND clinic_id = ? AND patient_id = ? LIMIT 1`,
      )
      .bind(supersedesEventId, clinicId, patientId)
      .first<{ id: string }>();
    if (!superseded) {
      return tenantError("Evento supersedido não pertence ao mesmo paciente/tenant.", "INVALID_SUPERSESSION", 409);
    }
  }

  const sourceRecordHash = sourceRecordReference
    ? await clinicalBlindIndex(
        context.env,
        clinicId,
        `source-record:${provenanceSource}`,
        sourceRecordReference,
      )
    : null;

  if (sourceRecordHash) {
    const existing = await db
      .prepare(
        `SELECT id FROM live_clinical_events
          WHERE clinic_id = ? AND provenance_source = ? AND source_record_hash = ? LIMIT 1`,
      )
      .bind(clinicId, provenanceSource, sourceRecordHash)
      .first<{ id: string }>();
    if (existing) {
      return tenantJson({ id: existing.id, duplicate: true }, 200);
    }
  }

  const eventId = crypto.randomUUID();
  const payloadEncrypted = await encryptClinicalJson(
    context.env,
    clinicId,
    `clinical-event:${eventId}`,
    payload,
  );
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const now = new Date().toISOString();

  try {
    await db
      .prepare(
        `INSERT INTO live_clinical_events
          (id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
           encounter_id, provenance_kind, provenance_source, payload_encrypted,
           encryption_version, source_record_hash, supersedes_event_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      )
      .bind(
        eventId,
        clinicId,
        patientId,
        user.id,
        eventType,
        occurredAt,
        encounterId,
        provenanceKind,
        provenanceSource,
        payloadEncrypted,
        encryptionVersion,
        sourceRecordHash,
        supersedesEventId,
        now,
      )
      .run();

    await writeSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "live_clinical_event_create",
      targetType: "clinical_event",
      targetId: eventId,
      metadata: { eventType, provenanceKind, imported: provenanceKind === "imported", encryptionVersion },
    });
  } catch (error) {
    console.error("[live.events.POST] DB error", error);
    return tenantError("Não foi possível registrar o evento clínico.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id: eventId,
      clinicId,
      patientId,
      authorUserId: user.id,
      eventType,
      occurredAt,
      encounterId,
      provenanceKind,
      provenanceSource,
      payload,
      encryptionVersion,
      supersedesEventId,
      status: "active",
      createdAt: now,
      duplicate: false,
    },
    201,
  );
};
