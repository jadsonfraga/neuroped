import { z } from "zod";
import {
  clinicalEventInputSchema,
  clinicalEventTypes,
  clinicalSources,
} from "../../../../shared/clinical-core";
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

const EVENT_TYPES = new Set([
  ...clinicalEventTypes,
  "document",
  "scale_result",
]);
const CANONICAL_EVENT_TYPES = new Set<string>(clinicalEventTypes);
const PROVENANCE_KINDS = new Set([
  "reported",
  "observed",
  "measured",
  "documented",
  "inferred",
  "decision",
  "imported",
]);
const PROVENANCE_SOURCES = new Set<string>(clinicalSources);
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const ISO_INSTANT = z.string().datetime({ offset: true });
const ACTIVE_PAGE_SIZE = 100;
const eventCursorSchema = z.tuple([
  z.string().min(1).max(64), z.string().min(1).max(64), z.string().regex(OPAQUE_ID),
]);

function decodeEventCursor(value: string | null) {
  if (value === null || value.length > 1024) return null;
  try {
    const cursor = eventCursorSchema.safeParse(JSON.parse(decodeURIComponent(value)));
    return cursor.success ? cursor.data : null;
  } catch {
    return null;
  }
}

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

function normalizedOccurredAt(value: unknown): string | null {
  const raw = cleanText(value, 64);
  if (!raw) return new Date().toISOString();
  const parsed = ISO_INSTANT.safeParse(raw);
  if (!parsed.success) return null;
  const millis = Date.parse(parsed.data);
  return Number.isFinite(millis) ? new Date(millis).toISOString() : null;
}

function isPlainJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateCanonicalPayload(params: {
  patientId: string;
  eventType: string;
  occurredAt: string;
  encounterId: string | null;
  provenanceKind: string;
  provenanceSource: string;
  supersedesEventId: string | null;
  payload: unknown;
}): z.ZodIssue[] | null {
  if (!CANONICAL_EVENT_TYPES.has(params.eventType)) return null;
  // Dados importados não podem se fantasiar de evento canônico sem passar pela
  // normalização clínica. Material bruto deve entrar como document/scale_result.
  if (params.provenanceKind === "imported") {
    return [
      {
        code: z.ZodIssueCode.custom,
        path: ["provenanceKind"],
        message: "Evento canônico importado deve ser normalizado antes do registro.",
      },
    ];
  }
  const parsed = clinicalEventInputSchema.safeParse({
    patientId: params.patientId,
    eventType: params.eventType,
    occurredAt: params.occurredAt,
    ...(params.encounterId ? { encounterId: params.encounterId } : {}),
    provenance: {
      kind: params.provenanceKind,
      source: params.provenanceSource,
    },
    ...(params.supersedesEventId ? { supersedesEventId: params.supersedesEventId } : {}),
    data: params.payload,
  });
  return parsed.success ? null : parsed.error.issues;
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
  const billingReadError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingReadError) return billingReadError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  // O histórico conserva o formato e o limite existentes; só o prontuário
  // solicita paginação explícita das entradas ativas.
  const status = url.searchParams.get("status");
  const activeOnly = status === "active";
  const rawCursor = url.searchParams.get("cursor");
  const cursor = decodeEventCursor(rawCursor);
  if ((status !== null && !activeOnly) || (rawCursor !== null && (!activeOnly || !cursor))) {
    return tenantError("Filtro ou página de eventos inválidos.", "VALIDATION_ERROR", 400);
  }
  const rows = await db
    .prepare(
      `SELECT id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
              encounter_id, provenance_kind, provenance_source, payload_encrypted,
              encryption_version, source_record_hash, supersedes_event_id, status, created_at
         FROM live_clinical_events
        WHERE clinic_id = ? AND patient_id = ?
          ${activeOnly ? "AND status = 'active'" : ""}
          ${cursor ? "AND (occurred_at, created_at, id) < (?, ?, ?)" : ""}
        ORDER BY occurred_at DESC, created_at DESC${activeOnly ? ", id DESC" : ""}
        LIMIT ?`,
    )
    .bind(clinicId, patientId, ...(cursor ?? []), activeOnly ? ACTIVE_PAGE_SIZE + 1 : 500)
    .all<LiveEventRow>();

  try {
    const records = rows.results ?? [];
    const page = activeOnly ? records.slice(0, ACTIVE_PAGE_SIZE) : records;
    const data = await Promise.all(
      page.map(async (row) => ({
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
    const last = page.at(-1);
    const nextCursor = last && records.length > page.length
      ? encodeURIComponent(JSON.stringify([last.occurred_at, last.created_at, last.id]))
      : null;
    return tenantJson(activeOnly ? { data, nextCursor } : { data });
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
  const provenanceSource = cleanText(body.provenanceSource, 40);
  const encounterId = cleanOptional(body.encounterId, 120);
  const sourceRecordReference = cleanOptional(body.sourceRecordReference, 500);
  const supersedesEventId = cleanOptional(body.supersedesEventId, 80);
  const occurredAt = normalizedOccurredAt(body.occurredAt);
  const payload = body.payload;

  if (!clinicId || !patientId || !EVENT_TYPES.has(eventType)) {
    return tenantError("clinicId, patientId e eventType válido são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  if (!PROVENANCE_KINDS.has(provenanceKind) || !PROVENANCE_SOURCES.has(provenanceSource)) {
    return tenantError(
      "Proveniência exige kind e source da taxonomia clínica controlada.",
      "VALIDATION_ERROR",
      400,
    );
  }
  if (!occurredAt) {
    return tenantError("occurredAt deve ser um instante ISO 8601 com fuso.", "VALIDATION_ERROR", 400);
  }
  if (encounterId && !OPAQUE_ID.test(encounterId)) {
    return tenantError("encounterId deve ser um identificador opaco.", "VALIDATION_ERROR", 400);
  }
  if (supersedesEventId && !OPAQUE_ID.test(supersedesEventId)) {
    return tenantError("supersedesEventId inválido.", "VALIDATION_ERROR", 400);
  }
  if (!isPlainJsonObject(payload)) {
    return tenantError("payload clínico deve ser um objeto JSON.", "VALIDATION_ERROR", 400);
  }
  const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  if (payloadSize > 100_000) {
    return tenantError("payload clínico excede 100 KB.", "PAYLOAD_TOO_LARGE", 413);
  }

  const coreIssues = validateCanonicalPayload({
    patientId,
    eventType,
    occurredAt,
    encounterId,
    provenanceKind,
    provenanceSource,
    supersedesEventId,
    payload,
  });
  if (coreIssues) {
    return tenantError(
      `Evento não atende ao Clinical Core: ${coreIssues.map((issue) => issue.message).join("; ")}`,
      "CLINICAL_CORE_VALIDATION_ERROR",
      400,
    );
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

  const sourceRecordHash = sourceRecordReference
    ? await clinicalBlindIndex(
        context.env,
        clinicId,
        `source-record:${provenanceSource}`,
        sourceRecordReference,
      )
    : null;

  const isProntuarioRetry = sourceRecordReference?.startsWith("nppr-save-v1-") === true;
  const acknowledgeProntuarioReplay = async (): Promise<Response | null> => {
    if (!isProntuarioRetry || !sourceRecordHash) return null;
    const row = await db.prepare(
      `SELECT id, author_user_id, event_type, occurred_at, encounter_id, provenance_kind,
              supersedes_event_id, status, payload_encrypted
         FROM live_clinical_events
        WHERE clinic_id = ? AND patient_id = ? AND provenance_source = ? AND source_record_hash = ? LIMIT 1`,
    ).bind(clinicId, patientId, provenanceSource, sourceRecordHash).first<LiveEventRow>();
    if (!row) return null;
    if (row.status !== "active" || row.author_user_id !== user.id || row.event_type !== eventType
      || row.occurred_at !== occurredAt || row.encounter_id !== encounterId || row.provenance_kind !== provenanceKind
      || row.supersedes_event_id !== supersedesEventId) {
      return tenantError("A gravação anterior não corresponde à versão ativa desta seção.", "PRONTUARIO_REPLAY_CONFLICT", 409);
    }
    const saved = await decryptClinicalJson<unknown>(context.env, clinicId, `clinical-event:${row.id}`, row.payload_encrypted);
    if (JSON.stringify(saved) !== JSON.stringify(payload)) {
      return tenantError("A gravação anterior tem outro conteúdo.", "PRONTUARIO_REPLAY_CONFLICT", 409);
    }
    return tenantJson({ id: row.id, duplicate: true }, 200);
  };

  const replay = await acknowledgeProntuarioReplay();
  if (replay) return replay;

  if (supersedesEventId) {
    const superseded = await db
      .prepare(
        `SELECT id, status
           FROM live_clinical_events
          WHERE id = ? AND clinic_id = ? AND patient_id = ?
          LIMIT 1`,
      )
      .bind(supersedesEventId, clinicId, patientId)
      .first<{ id: string; status: "active" | "corrected" | "voided" }>();
    if (!superseded) {
      return tenantError("Evento supersedido não pertence ao mesmo paciente/tenant.", "INVALID_SUPERSESSION", 409);
    }
    if (superseded.status !== "active") {
      const completed = await acknowledgeProntuarioReplay();
      if (completed) return completed;
      return tenantError("Somente evento ativo pode ser supersedido.", "EVENT_NOT_ACTIVE", 409);
    }
  }

  if (sourceRecordHash && !isProntuarioRetry) {
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

  const insertBindings = [
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
  ];
  const auditParams = {
    clinicId,
    actorUserId: user.id,
    action: "live_clinical_event_create",
    targetType: "clinical_event",
    targetId: eventId,
    metadata: { eventType, provenanceKind, imported: provenanceKind === "imported", encryptionVersion },
  };

  try {
    if (supersedesEventId) {
      // Correção supersede o evento anterior no mesmo batch transacional: se o
      // UPDATE não atingir exatamente o evento ativo, o INSERT e a auditoria
      // (guardados por changes() = 1) não acontecem — nada parcial persiste.
      const results = await db.batch([
        db
          .prepare(
            `UPDATE live_clinical_events
                SET status = 'corrected'
              WHERE id = ? AND clinic_id = ? AND patient_id = ? AND status = 'active'`,
          )
          .bind(supersedesEventId, clinicId, patientId),
        db
          .prepare(
            `INSERT INTO live_clinical_events
              (id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
               encounter_id, provenance_kind, provenance_source, payload_encrypted,
               encryption_version, source_record_hash, supersedes_event_id, status, created_at)
             SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?
              WHERE changes() = 1`,
          )
          .bind(...insertBindings),
        prepareSaasAudit(db, auditParams, true),
      ]);
      if (
        (results[0]?.meta?.changes ?? 0) !== 1 ||
        (results[1]?.meta?.changes ?? 0) !== 1 ||
        (results[2]?.meta?.changes ?? 0) !== 1
      ) {
        const completed = await acknowledgeProntuarioReplay();
        if (completed) return completed;
        return tenantError("O evento mudou durante a correção. Recarregue a linha clínica.", "STALE_SUPERSESSION", 409);
      }
    } else {
      const results = await db.batch([
        db
          .prepare(
            `INSERT INTO live_clinical_events
              (id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
               encounter_id, provenance_kind, provenance_source, payload_encrypted,
               encryption_version, source_record_hash, supersedes_event_id, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
          )
          .bind(...insertBindings),
        prepareSaasAudit(db, auditParams, true),
      ]);
      if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) {
        return tenantError("Não foi possível registrar o evento clínico.", "DB_ERROR", 500);
      }
    }
  } catch (error) {
    // Corridas de deduplicação devem continuar idempotentes, não virar falso 500.
    const completed = await acknowledgeProntuarioReplay();
    if (completed) return completed;
    if (sourceRecordHash && !isProntuarioRetry) {
      const duplicate = await db
        .prepare(
          `SELECT id FROM live_clinical_events
            WHERE clinic_id = ? AND provenance_source = ? AND source_record_hash = ? LIMIT 1`,
        )
        .bind(clinicId, provenanceSource, sourceRecordHash)
        .first<{ id: string }>();
      if (duplicate) return tenantJson({ id: duplicate.id, duplicate: true }, 200);
    }
    if (supersedesEventId) {
      const successor = await db
        .prepare(
          `SELECT id FROM live_clinical_events
            WHERE supersedes_event_id = ? LIMIT 1`,
        )
        .bind(supersedesEventId)
        .first<{ id: string }>();
      if (successor) {
        return tenantError("Evento já possui uma correção sucessora.", "EVENT_ALREADY_SUPERSEDED", 409);
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
