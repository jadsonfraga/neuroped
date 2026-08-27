import {
  clinicMemoryInputSchema,
  clinicMemoryQuerySchema,
  type ClinicMemoryInput,
  type ClinicMemoryQuery,
} from "../../../../shared/live-clinic-memory";
import { prepareSaasAudit, tenantError, tenantJson } from "../../tenant/_core";
import {
  auditForMemory,
  decryptRow,
  encryptClinicalJson,
  currentClinicalEncryptionVersion,
  requireLiveConfiguration,
  resolveMemoryAccess,
  tokenHashes,
  type MemoryBody,
  type MemoryRow,
} from "./_core";

function encodeCursor(updatedAt: string, id: string): string {
  return btoa(JSON.stringify({ updatedAt, id }));
}

function decodeCursor(value: string | undefined): { updatedAt: string; id: string } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(atob(value)) as { updatedAt?: unknown; id?: unknown };
    if (typeof parsed.updatedAt !== "string" || typeof parsed.id !== "string") return null;
    return { updatedAt: parsed.updatedAt, id: parsed.id };
  } catch {
    return null;
  }
}

async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function queryFromRequest(request: Request): ClinicMemoryQuery | null {
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") || "50");
  const parsed = clinicMemoryQuerySchema.safeParse({
    clinicId: url.searchParams.get("clinicId") || "",
    scope: url.searchParams.get("scope") || undefined,
    kind: url.searchParams.get("kind") || undefined,
    patientId: url.searchParams.get("patientId") || undefined,
    appointmentId: url.searchParams.get("appointmentId") || undefined,
    q: url.searchParams.get("q") || undefined,
    limit: Number.isFinite(limitRaw) ? limitRaw : 50,
    ...(url.searchParams.get("cursor") ? { cursor: url.searchParams.get("cursor") } : {}),
  });
  return parsed.success ? parsed.data : null;
}

async function patientBelongsToClinic(db: D1Database, clinicId: string, patientId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? AND status != 'merged' LIMIT 1")
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

async function appointmentBelongsToClinic(db: D1Database, clinicId: string, appointmentId: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT a.id
                FROM appointments a
                JOIN clinic_memberships m ON m.user_id = a.provider_user_id
               WHERE a.id = ? AND m.clinic_id = ? AND m.active = 1
               LIMIT 1`)
    .bind(appointmentId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

function toBody(input: ClinicMemoryInput): MemoryBody {
  return {
    title: input.title,
    content: input.content,
    category: input.category ?? null,
    tags: input.tags,
    source: input.source,
  };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const query = queryFromRequest(context.request);
  if (!query) return tenantError("Parâmetros inválidos para memória da clínica.", "VALIDATION_ERROR", 400);

  const requestedKind = query.kind;
  const access = await resolveMemoryAccess(context, query.clinicId, requestedKind, "read");
  if (access instanceof Response) return access;
  const { db, membership } = access;
  const effectiveKind = membership.role === "assistant" ? "operational" : requestedKind;
  const searchTokens = query.q ? await tokenHashes(context.env, query.clinicId, [query.q]) : [];
  const cursor = decodeCursor(query.cursor);
  if (query.cursor && !cursor) return tenantError("Cursor inválido.", "VALIDATION_ERROR", 400);

  const filters = ["m.clinic_id = ?", "m.status = 'active'"];
  const bindings: unknown[] = [query.clinicId];
  if (effectiveKind) { filters.push("m.kind = ?"); bindings.push(effectiveKind); }
  if (query.scope) { filters.push("m.scope = ?"); bindings.push(query.scope); }
  if (query.patientId) { filters.push("m.patient_id = ?"); bindings.push(query.patientId); }
  if (query.appointmentId) { filters.push("m.appointment_id = ?"); bindings.push(query.appointmentId); }
  if (cursor) {
    filters.push("(m.updated_at < ? OR (m.updated_at = ? AND m.id < ?))");
    bindings.push(cursor.updatedAt, cursor.updatedAt, cursor.id);
  }

  let searchClause = "";
  if (searchTokens.length > 0) {
    searchClause = `AND m.id IN (
      SELECT t.memory_id FROM live_clinic_memory_terms t
       WHERE t.clinic_id = ? AND t.token_hash IN (${searchTokens.map(() => "?").join(",")})
       GROUP BY t.memory_id
      HAVING COUNT(DISTINCT t.token_hash) = ?
    )`;
    bindings.push(query.clinicId, ...searchTokens, searchTokens.length);
  }

  const rows = await db
    .prepare(`SELECT m.id, m.clinic_id, m.scope, m.kind, m.patient_id, m.appointment_id,
                     m.author_user_id, m.updated_by_user_id, m.body_encrypted,
                     m.encryption_version, m.client_request_id, m.revision, m.status,
                     m.created_at, m.updated_at
                FROM live_clinic_memory m
               WHERE ${filters.join(" AND ")} ${searchClause}
               ORDER BY m.updated_at DESC, m.id DESC
               LIMIT ?`)
    .bind(...bindings, query.limit + 1)
    .all<MemoryRow>();

  const hasMore = rows.results.length > query.limit;
  const page = hasMore ? rows.results.slice(0, query.limit) : rows.results;
  try {
    const items = await Promise.all(page.map((row) => decryptRow(context.env, row)));
    const last = page.at(-1);
    return tenantJson({
      items,
      nextCursor: hasMore && last ? encodeCursor(last.updated_at, last.id) : null,
      sync: { persisted: true, storage: "cloud-d1", clinicId: query.clinicId },
    });
  } catch {
    return tenantError("Não foi possível descriptografar a memória da clínica.", "CLINICAL_DECRYPT_FAILED", 503);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const raw = await parseJson(context.request);
  const parsed = clinicMemoryInputSchema.safeParse(raw);
  if (!parsed.success) return tenantJson({ error: "Dados inválidos para memória da clínica.", code: "VALIDATION_ERROR", issues: parsed.error.issues }, 400);
  const input = parsed.data;
  const access = await resolveMemoryAccess(context, input.clinicId, input.kind, "write");
  if (access instanceof Response) return access;
  const { db, user } = access;

  if (input.patientId && !(await patientBelongsToClinic(db, input.clinicId, input.patientId))) {
    return tenantError("Paciente não pertence à clínica selecionada.", "PATIENT_NOT_FOUND", 404);
  }
  if (input.appointmentId && !(await appointmentBelongsToClinic(db, input.clinicId, input.appointmentId))) {
    return tenantError("Atendimento não pertence à clínica selecionada.", "APPOINTMENT_NOT_FOUND", 404);
  }

  const existing = await db
    .prepare(`SELECT id, clinic_id, scope, kind, patient_id, appointment_id, author_user_id,
                     updated_by_user_id, body_encrypted, encryption_version, client_request_id,
                     revision, status, created_at, updated_at
                FROM live_clinic_memory
               WHERE clinic_id = ? AND author_user_id = ? AND client_request_id = ?
               LIMIT 1`)
    .bind(input.clinicId, user.id, input.clientRequestId)
    .first<MemoryRow>();
  if (existing) {
    return tenantJson({ item: await decryptRow(context.env, existing), idempotent: true, sync: { persisted: true, storage: "cloud-d1", clinicId: input.clinicId } });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const bodyEncrypted = await encryptClinicalJson(context.env, input.clinicId, `clinic-memory:${id}`, toBody(input));
  const terms = await tokenHashes(context.env, input.clinicId, [input.title, input.content, input.category ?? "", ...input.tags]);
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const statements = [
    db.prepare(`INSERT INTO live_clinic_memory
      (id, clinic_id, scope, kind, patient_id, appointment_id, author_user_id, updated_by_user_id,
       body_encrypted, encryption_version, client_request_id, revision, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?, ?)`)
      .bind(id, input.clinicId, input.scope, input.kind, input.patientId ?? null, input.appointmentId ?? null,
        user.id, user.id, bodyEncrypted, encryptionVersion, input.clientRequestId, now, now),
    ...terms.map((term) => db.prepare("INSERT INTO live_clinic_memory_terms (clinic_id, memory_id, token_hash) VALUES (?, ?, ?)").bind(input.clinicId, id, term)),
    auditForMemory(db, { clinicId: input.clinicId, actorUserId: user.id, memoryId: id, action: "created", revision: 1 }),
    prepareSaasAudit(db, { clinicId: input.clinicId, actorUserId: user.id, action: "clinic_memory.created", targetType: "clinic_memory", targetId: id, metadata: { kind: input.kind, scope: input.scope } }),
  ];
  await db.batch(statements);
  const created = await db.prepare(`SELECT id, clinic_id, scope, kind, patient_id, appointment_id, author_user_id,
      updated_by_user_id, body_encrypted, encryption_version, client_request_id, revision, status, created_at, updated_at
      FROM live_clinic_memory WHERE id = ? AND clinic_id = ?`).bind(id, input.clinicId).first<MemoryRow>();
  if (!created) return tenantError("Memória criada, mas não pôde ser confirmada.", "DB_ERROR", 500);
  return tenantJson({ item: await decryptRow(context.env, created), idempotent: false, sync: { persisted: true, storage: "cloud-d1", clinicId: input.clinicId, revision: 1, updatedAt: now } }, 201);
};
