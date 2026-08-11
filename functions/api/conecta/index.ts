import { conectaEventInputSchema, type ConectaEvent } from "../../../shared/conecta";
import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
} from "../auth/_authorization";
import {
  clinicalCryptoErrorResponse,
  decryptClinicalPayload,
  encryptClinicalPayload,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";
import { ensureConectaDemoSchema } from "./_schema";

interface Env extends ClinicalCryptoEnv {
  DB?: D1Database;
}

interface D1ConectaRow {
  id: string;
  patient_id: string;
  author_user_id: string | null;
  category: ConectaEvent["category"];
  occurred_at: string;
  context: ConectaEvent["context"] | null;
  value: number | null;
  duration_minutes: number | null;
  payload_json: string | null;
  secure_payload_encrypted: string | null;
  created_at: string;
}

interface SecureConectaPayload {
  context?: ConectaEvent["context"] | null;
  payload?: Pick<ConectaEvent, "note" | "detail"> | null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function error(message: string, code: string, status: number): Response {
  return json({ error: message, code }, status);
}

async function present(env: Env, row: D1ConectaRow): Promise<ConectaEvent> {
  let legacyPayload: Pick<ConectaEvent, "note" | "detail"> | null = null;
  if (row.payload_json) {
    try {
      const parsed = JSON.parse(row.payload_json) as Pick<ConectaEvent, "note" | "detail">;
      legacyPayload = parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      legacyPayload = null;
    }
  }
  const secure = await decryptClinicalPayload<SecureConectaPayload>(
    env,
    "conecta_events_demo",
    row.id,
    row.secure_payload_encrypted,
    JSON.stringify({ context: row.context, payload: legacyPayload }),
  );
  const payload = secure?.payload ?? {};
  return {
    id: row.id,
    patientId: row.patient_id,
    authorUserId: row.author_user_id,
    category: row.category,
    occurredAt: row.occurred_at,
    ...(secure?.context ? { context: secure.context } : {}),
    ...(typeof row.value === "number" ? { value: row.value } : {}),
    ...(typeof row.duration_minutes === "number" ? { durationMinutes: row.duration_minutes } : {}),
    ...(payload ?? {}),
    createdAt: row.created_at,
    storageMode: "demo-db",
  };
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
  const rawDays = Number(url.searchParams.get("days") ?? 90);
  const days = Number.isFinite(rawDays) ? Math.min(365, Math.max(1, Math.round(rawDays))) : 90;
  if (!patientId || patientId.length > 128) {
    return error("patient_id inválido.", "VALIDATION_ERROR", 400);
  }
  const access = await getPatientAccess(env.DB, patientId, user);
  if (!access.exists) return error("Paciente não encontrado.", "NOT_FOUND", 404);
  if (!access.allowed) return error("Sem permissão para este paciente.", "FORBIDDEN", 403);

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  try {
    await ensureConectaDemoSchema(env.DB);
    const result = await env.DB
      .prepare(
        `SELECT id, patient_id, author_user_id, category, occurred_at, context,
                value, duration_minutes, payload_json, secure_payload_encrypted, created_at
           FROM conecta_events_demo
          WHERE patient_id = ? AND is_demo = 1 AND occurred_at >= ?
          ORDER BY occurred_at DESC
          LIMIT 1000`,
      )
      .bind(patientId, cutoff)
      .all<D1ConectaRow>();
    const rows = result.results ?? [];
    const data = await Promise.all(rows.map((row) => present(env, row)));
    return json({ data, total: data.length, mode: "demo-db" });
  } catch (cause) {
    const cryptoResponse = clinicalCryptoErrorResponse(cause);
    if (cryptoResponse) return cryptoResponse;
    console.error("[conecta.GET]", cause);
    return error("Não foi possível carregar os registros agora.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) {
    return error(
      "Registro remoto indisponível. Nenhum dado foi simulado.",
      "STORAGE_UNAVAILABLE",
      503,
    );
  }
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) {
    return error("Perfil sem permissão para registrar eventos.", "FORBIDDEN", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const parsed = conectaEventInputSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Registro inválido.", code: "VALIDATION_ERROR", details: parsed.error.issues }, 400);
  }
  const access = await getPatientAccess(env.DB, parsed.data.patientId, user);
  if (!access.exists) return error("Paciente não encontrado.", "NOT_FOUND", 404);
  if (!access.allowed) return error("Sem permissão para este paciente.", "FORBIDDEN", 403);

  const id = `conecta-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const securePayload: SecureConectaPayload = {
    context: parsed.data.context ?? null,
    payload: parsed.data.note || parsed.data.detail
      ? { note: parsed.data.note, detail: parsed.data.detail }
      : null,
  };

  try {
    await ensureConectaDemoSchema(env.DB);
    const encrypted = await encryptClinicalPayload(env, "conecta_events_demo", id, securePayload);
    await env.DB
      .prepare(
        `INSERT INTO conecta_events_demo
          (id, patient_id, author_user_id, category, occurred_at, context,
           value, duration_minutes, payload_json, secure_payload_encrypted, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, ?, 1, ?)`,
      )
      .bind(
        id,
        parsed.data.patientId,
        user.id,
        parsed.data.category,
        parsed.data.occurredAt,
        parsed.data.value ?? null,
        parsed.data.durationMinutes ?? null,
        encrypted,
        createdAt,
      )
      .run();

    const created: ConectaEvent = {
      id,
      ...parsed.data,
      authorUserId: user.id,
      createdAt,
      storageMode: "demo-db",
    };
    return json(created, 201);
  } catch (cause) {
    const cryptoResponse = clinicalCryptoErrorResponse(cause);
    if (cryptoResponse) return cryptoResponse;
    console.error("[conecta.POST]", cause);
    return error("Não foi possível salvar o registro.", "DB_ERROR", 500);
  }
};
