import {
  clampClinicalEventQueryDays,
  parseClinicalEventTypesParam,
  clinicalEventInputSchema,
  type ClinicalEvent,
  type ClinicalEventStatus,
  type ClinicalEventType,
  type ClinicalProvenanceKind,
  type ClinicalSource,
} from "../../../shared/clinical-core";
import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
} from "../auth/_authorization";
import { ensureClinicalCoreDemoSchema } from "./_schema";
import { json } from "../_request";

interface Env {
  DB?: D1Database;
}

interface D1ClinicalEventRow {
  id: string;
  patient_id: string;
  author_user_id: string | null;
  event_type: ClinicalEventType;
  occurred_at: string;
  encounter_id: string | null;
  provenance_kind: ClinicalProvenanceKind;
  provenance_source: ClinicalSource;
  payload_json: string;
  supersedes_event_id: string | null;
  status: ClinicalEventStatus;
  created_at: string;
}

interface DemoPayload {
  data: ClinicalEvent["data"];
  note?: string;
  sourceLabel?: string;
  capturedAt?: string;
}

function error(message: string, code: string, status: number): Response {
  return json({ error: message, code }, status);
}

function present(row: D1ClinicalEventRow): ClinicalEvent | null {
  try {
    const payload = JSON.parse(row.payload_json) as DemoPayload;
    const parsed = clinicalEventInputSchema.safeParse({
      patientId: row.patient_id,
      eventType: row.event_type,
      occurredAt: row.occurred_at,
      ...(row.encounter_id ? { encounterId: row.encounter_id } : {}),
      provenance: {
        kind: row.provenance_kind,
        source: row.provenance_source,
        ...(payload.sourceLabel ? { sourceLabel: payload.sourceLabel } : {}),
        ...(payload.capturedAt ? { capturedAt: payload.capturedAt } : {}),
      },
      ...(payload.note ? { note: payload.note } : {}),
      ...(row.supersedes_event_id ? { supersedesEventId: row.supersedes_event_id } : {}),
      data: payload.data,
    });
    if (!parsed.success) return null;
    return {
      id: row.id,
      ...parsed.data,
      authorUserId: row.author_user_id,
      status: row.status,
      createdAt: row.created_at,
      storageMode: "demo-db",
    };
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) {
    return json({ data: [], total: 0, mode: "unavailable", reason: "Banco clínico não configurado." });
  }
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id")?.trim() ?? "";
  if (!patientId || patientId.length > 128) {
    return error("patient_id inválido.", "VALIDATION_ERROR", 400);
  }
  const access = await getPatientAccess(env.DB, patientId, user);
  if (!access.exists) return error("Paciente não encontrado.", "NOT_FOUND", 404);
  if (!access.allowed) return error("Sem permissão para este paciente.", "FORBIDDEN", 403);

  const days = clampClinicalEventQueryDays(url.searchParams.get("days"));
  const eventTypes = parseClinicalEventTypesParam(url.searchParams.get("types"));
  if (eventTypes == null) return error("types inválido.", "VALIDATION_ERROR", 400);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const placeholders = eventTypes.map(() => "?").join(", ");
  const typeClause = eventTypes.length ? ` AND event_type IN (${placeholders})` : "";

  try {
    await ensureClinicalCoreDemoSchema(env.DB);
    const result = await env.DB
      .prepare(
        `SELECT id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
                provenance_kind, provenance_source, payload_json, supersedes_event_id,
                status, created_at
           FROM clinical_events_demo
          WHERE patient_id = ? AND is_demo = 1 AND occurred_at >= ?${typeClause}
          ORDER BY occurred_at DESC
          LIMIT 2000`,
      )
      .bind(patientId, cutoff, ...eventTypes)
      .all<D1ClinicalEventRow>();
    const data = (result.results ?? []).map(present).filter((item): item is ClinicalEvent => item != null);
    return json({ data, total: data.length, mode: "demo-db" });
  } catch (cause) {
    console.error("[clinical-core.GET]", cause);
    return error("Não foi possível carregar a linha clínica.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) {
    return error("Registro remoto indisponível. Nenhum dado foi simulado.", "STORAGE_UNAVAILABLE", 503);
  }
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) {
    return error("Perfil sem permissão para registrar eventos clínicos.", "FORBIDDEN", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const parsed = clinicalEventInputSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Evento clínico inválido.", code: "VALIDATION_ERROR", details: parsed.error.issues }, 400);
  }
  const input = parsed.data;
  const access = await getPatientAccess(env.DB, input.patientId, user);
  if (!access.exists) return error("Paciente não encontrado.", "NOT_FOUND", 404);
  if (!access.allowed) return error("Sem permissão para este paciente.", "FORBIDDEN", 403);

  try {
    await ensureClinicalCoreDemoSchema(env.DB);
    if (input.supersedesEventId) {
      const previous = await env.DB
        .prepare("SELECT id, patient_id, status FROM clinical_events_demo WHERE id = ? AND is_demo = 1 LIMIT 1")
        .bind(input.supersedesEventId)
        .first<{ id: string; patient_id: string; status: ClinicalEventStatus }>();
      if (!previous || previous.patient_id !== input.patientId) {
        return error("Evento supersedido inválido para este paciente.", "INVALID_SUPERSESSION", 400);
      }
      if (previous.status !== "active") {
        return error("O evento já foi supersedido. Recarregue a linha clínica.", "STALE_SUPERSESSION", 409);
      }
    }

    const id = `clinical-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const payload: DemoPayload = {
      data: input.data,
      ...(input.note ? { note: input.note } : {}),
      ...(input.provenance.sourceLabel ? { sourceLabel: input.provenance.sourceLabel } : {}),
      ...(input.provenance.capturedAt ? { capturedAt: input.provenance.capturedAt } : {}),
    };

    const insertSql = `INSERT INTO clinical_events_demo
            (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
             provenance_kind, provenance_source, payload_json, supersedes_event_id,
             status, is_demo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)`;
    const insertBindings = [
      id,
      input.patientId,
      user.id,
      input.eventType,
      input.occurredAt,
      input.encounterId ?? null,
      input.provenance.kind,
      input.provenance.source,
      JSON.stringify(payload),
      input.supersedesEventId ?? null,
      createdAt,
    ];

    if (input.supersedesEventId) {
      const correctionResults = await env.DB.batch([
        env.DB
          .prepare(
            "UPDATE clinical_events_demo SET status = 'corrected' WHERE id = ? AND patient_id = ? AND is_demo = 1 AND status = 'active'",
          )
          .bind(input.supersedesEventId, input.patientId),
        env.DB
          .prepare(
            `INSERT INTO clinical_events_demo
              (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
               provenance_kind, provenance_source, payload_json, supersedes_event_id,
               status, is_demo, created_at)
             SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?
              WHERE changes() = 1`,
          )
          .bind(...insertBindings),
      ]);
      if (
        (correctionResults[0]?.meta?.changes ?? 0) !== 1 ||
        (correctionResults[1]?.meta?.changes ?? 0) !== 1
      ) {
        return error("O evento mudou durante a correção. Recarregue a linha clínica.", "STALE_SUPERSESSION", 409);
      }
    } else {
      const inserted = await env.DB.prepare(insertSql).bind(...insertBindings).run();
      if ((inserted.meta?.changes ?? 0) !== 1) {
        return error("Não foi possível persistir o evento clínico.", "DB_ERROR", 500);
      }
    }

    const created: ClinicalEvent = {
      id,
      ...input,
      authorUserId: user.id,
      status: "active",
      createdAt,
      storageMode: "demo-db",
    };
    return json(created, 201);
  } catch (cause) {
    console.error("[clinical-core.POST]", cause);
    return error("Não foi possível salvar o evento clínico.", "DB_ERROR", 500);
  }
};
