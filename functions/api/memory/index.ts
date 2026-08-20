import { memoryNoteInputSchema } from "../../../shared/memory";
import { canWriteClinicalData, getContextUser, getPatientAccess, isAdmin } from "../auth/_authorization";

interface Env { DB?: D1Database }

interface Row {
  id: string; patient_id: string | null; title: string; content: string;
  category: string | null; source: string | null; tags: string | null;
  author_user_id: string | null; created_at: string; updated_at: string;
}

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const error = (message: string, code: string, status: number) => json({ error: message, code }, status);

async function ensureSchema(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS clinical_memory_notes_demo (
    id TEXT PRIMARY KEY, patient_id TEXT, title TEXT NOT NULL, content TEXT NOT NULL,
    category TEXT, source TEXT, tags TEXT, author_user_id TEXT,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS clinical_memory_patient_idx ON clinical_memory_notes_demo(patient_id, updated_at DESC)").run();
}

function present(row: Row) {
  let tags: string[] = [];
  try { const value: unknown = JSON.parse(row.tags ?? "[]"); if (Array.isArray(value)) tags = value.filter((tag): tag is string => typeof tag === "string"); } catch { /* legado */ }
  return { id: row.id, patientId: row.patient_id, title: row.title, content: row.content,
    category: row.category, source: row.source, tags, authorUserId: row.author_user_id,
    createdAt: row.created_at, updatedAt: row.updated_at };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return error("Persistência indisponível para a memória.", "DB_REQUIRED", 503);
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  const url = new URL(context.request.url);
  const patientId = url.searchParams.get("patient_id")?.trim() ?? "";
  const query = (url.searchParams.get("q") ?? "").trim();
  if (patientId) {
    const access = await getPatientAccess(context.env.DB, patientId, user);
    if (!access.exists) return error("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return error("Sem permissão.", "FORBIDDEN", 403);
  } else if (!isAdmin(user)) {
    return error("Selecione um paciente para consultar a memória.", "PATIENT_REQUIRED", 400);
  }
  await ensureSchema(context.env.DB);
  const result = await context.env.DB.prepare(`SELECT id, patient_id, title, content, category, source, tags, author_user_id, created_at, updated_at
    FROM clinical_memory_notes_demo WHERE is_demo = 1 AND (? = '' OR patient_id = ?)
      AND (? = '' OR title LIKE ? OR content LIKE ? OR tags LIKE ?)
    ORDER BY updated_at DESC LIMIT 100`)
    .bind(patientId, patientId, query, `%${query}%`, `%${query}%`, `%${query}%`).all<Row>();
  const data = (result.results ?? []).map(present);
  return json({ data, total: data.length, mode: "demo-db" });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return error("Persistência indisponível para a memória. Nenhuma nota foi simulada.", "DB_REQUIRED", 503);
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) return error("Perfil sem permissão para gravar memória clínica.", "FORBIDDEN", 403);
  let body: unknown; try { body = await context.request.json(); } catch { return error("JSON inválido.", "INVALID_JSON", 400); }
  const parsed = memoryNoteInputSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Nota inválida.", code: "VALIDATION_ERROR", details: parsed.error.issues }, 400);
  const patientId = parsed.data.patientId ?? null;
  if (!patientId && !isAdmin(user)) return error("Selecione um paciente.", "PATIENT_REQUIRED", 400);
  if (patientId) {
    const access = await getPatientAccess(context.env.DB, patientId, user);
    if (!access.exists) return error("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return error("Sem permissão.", "FORBIDDEN", 403);
  }
  await ensureSchema(context.env.DB);
  const id = `memory-${crypto.randomUUID()}`; const now = new Date().toISOString();
  await context.env.DB.prepare(`INSERT INTO clinical_memory_notes_demo
    (id, patient_id, title, content, category, source, tags, author_user_id, is_demo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
    .bind(id, patientId, parsed.data.title, parsed.data.content, parsed.data.category ?? null,
      parsed.data.source ?? "registro_clinico", JSON.stringify(parsed.data.tags), user.id, now, now).run();
  return json({ id, patientId, ...parsed.data, authorUserId: user.id, createdAt: now, updatedAt: now }, 201);
};
