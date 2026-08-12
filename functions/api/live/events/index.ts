import { getContextUser } from "../../auth/_authorization";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
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
import { clinicalEventInputSchema } from "../../../../shared/clinical-core";

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
  const provenanceSource = cleanText(body.provenanceSource, 80);
  const provenanceSourceLabel = cleanOptional(body.provenanceSourceLabel, 160);
  const provenanceCapturedAt = cleanOptional(body.provenanceCapturedAt, 40);
  const encounterId = cleanOptional(body.encounterId, 120);
  const sourceRecordReference = cleanOptional(body.sourceRecordReference, 500);
  const supersedesEventId = cleanOptional(body.supersedesEventId, 80);
  const occurredAt = cleanText(body.occurredAt, 40) || new Date().toISOString();
  const note = cleanOptional(body.note, 5_000);
  const payload = body.payload;

  if (!clinicId || !patientId) {
    return tenantError("clinicId e patientId são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  if (payload === undefined) {
    return tenantError("payload clínico é obrigatório.", "VALIDATION_ERROR", 400);
  }

  let payloadSize = 0;
  try {
    payloadSize = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  } catch {
    return tenantError("payload clínico não é serializável.", "VALIDATION_ERROR", 400);
  }
  if (payloadSize > 100_000) {
    return tenantError("payload clínico excede 100 KB.", "PAYLOAD_TOO_LARGE", 413);
  }

  const candidate = {
    eventType,
    patientId,
    occurredAt,
    ...(encounterId ? { encounterId } : {}),
    provenance: {
      kind: provenanceKind,
      source: provenanceSource,
      ...(provenanceSourceLabel ? { sourceLabel: provenanceSourceLabel } : {}),
      ...(provenanceCapturedAt ? { capturedAt: provenanceCapturedAt } : {}),
    },
    ...(note ? { note } : {}),
    ...(supersedesEventId ? { supersedesEventId } : {}),
    data: payload,
  };
  const parsedEvent = clinicalEventInputSchema.safeParse(candidate);
  if (!parsedEvent.success) {
    return tenantError(
      "Evento incompatível com o contrato canônico do Clinical Core.",
      "CLINICAL_EVENT_INVALID",
      400,
    );
  }

  const canonicalEvent = parsedEvent.data;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) {
    return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  if (canonicalEvent.supersedesEventId) {
    const superseded = await db
      .prepare(
        `SELECT id, event_type, status FROM live_clinical_events
          WHERE id = ? AND clinic_id = ? AND patient_id = ? LIMIT 1`,
      )
      .bind(canonicalEvent.supersedesEventId, clinicId, patientId)
      .first<{ id: string; event_type: string; status: string }>();
    if (!superseded) {
      return tenantError("Evento supersedido não pertence ao mesmo paciente/tenant.", "INVALID_SUPERSESSION", 409);
    }
    if (superseded.status !== "active") {
      return tenantError("O evento já foi corrigido ou invalidado.", "EVENT_ALREADY_SUPERSEDED", 409);
    }
    if (superseded.event_type !== canonicalEvent.eventType) {
      return tenantError("A correção deve preservar o tipo do evento original.", "INVALID_SUPERSESSION_TYPE", 409);
    }
  }

  const sourceRecordHash = sourceRecordReference
    ? await clinicalBlindIndex(
        context.env,
        clinicId,
        `source-record:${canonicalEvent.provenance.source}`,
        sourceRecordReference,
      )
    : null;

  if (sourceRecordHash) {
    const existing = await db
      .prepare(
        `SELECT id FROM live_clinical_events
          WHERE clinic_id = ? AND provenance_source = ? AND source_record_hash = ? LIMIT 1`,
      )
      .bind(clinicId, canonicalEvent.provenance.source, sourceRecordHash)
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
    canonicalEvent.data,
  );
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const now = new Date().toISOString();
  const statements = [
    db
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
        canonicalEvent.eventType,
        canonicalEvent.occurredAt,
        canonicalEvent.encounterId ?? null,
        canonicalEvent.provenance.kind,
        canonicalEvent.provenance.source,
        payloadEncrypted,
        encryptionVersion,
        sourceRecordHash,
        canonicalEvent.supersedesEventId ?? null,
        now,
      ),
  ];

  if (canonicalEvent.supersedesEventId) {
    statements.push(
      db
        .prepare(
          `UPDATE live_clinical_events
              SET status = 'corrected'
            WHERE id = ? AND clinic_id = ? AND patient_id = ? AND status = 'active'`,
        )
        .bind(canonicalEvent.supersedesEventId, clinicId, patientId),
    );
  }

  statements.push(
    db
      .prepare(
        `INSERT INTO saas_audit_log
          (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
         VALUES (?, ?, ?, 'live_clinical_event_create', 'clinical_event', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        clinicId,
        user.id,
        eventId,
        JSON.stringify({
          eventType: canonicalEvent.eventType,
          provenanceKind: canonicalEvent.provenance.kind,
          encryptionVersion,
          correction: Boolean(canonicalEvent.supersedesEventId),
        }),
        now,
      ),
  );

  try {
    await db.batch(statements);
  } catch (error) {
    if (sourceRecordHash) {
      const existing = await db
        .prepare(
          `SELECT id FROM live_clinical_events
            WHERE clinic_id = ? AND provenance_source = ? AND source_record_hash = ? LIMIT 1`,
        )
        .bind(clinicId, canonicalEvent.provenance.source, sourceRecordHash)
        .first<{ id: string }>();
      if (existing) return tenantJson({ id: existing.id, duplicate: true }, 200);
    }
    if (canonicalEvent.supersedesEventId) {
      const successor = await db
        .prepare(
          `SELECT id FROM live_clinical_events
            WHERE supersedes_event_id = ? LIMIT 1`,
        )
        .bind(canonicalEvent.supersedesEventId)
        .first<{ id: string }>();
      if (successor) {
        return tenantError("O evento já possui uma correção posterior.", "EVENT_ALREADY_SUPERSEDED", 409);
      }
    }
    console.error("[live.events.POST] DB error", error);
    return tenantError("Não foi possível registrar o evento clínico.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id: eventId,
      clinicId,
      patientId,
      authorUserId: user.id,
      eventType: canonicalEvent.eventType,
      occurredAt: canonicalEvent.occurredAt,
      encounterId: canonicalEvent.encounterId ?? null,
      provenanceKind: canonicalEvent.provenance.kind,
      provenanceSource: canonicalEvent.provenance.source,
      payload: canonicalEvent.data,
      encryptionVersion,
      supersedesEventId: canonicalEvent.supersedesEventId ?? null,
      status: "active",
      createdAt: now,
      duplicate: false,
    },
    201,
  );
};
