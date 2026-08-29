import { memoryNotePatchSchema } from "../../../shared/memory";
import { canWriteClinicalData, getContextUser, getPatientAccess, isAdmin } from "../auth/_authorization";

interface Env { DB?: D1Database }
interface Row { id: string; patient_id: string | null; title: string; content: string; category: string | null; source: string | null; tags: string | null }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const error = (message: string, code: string, status: number) => json({ error: message, code }, status);

async function authorize(context: { env: Env; data?: unknown }, row: Row) {
  const user = getContextUser(context);
  if (!user) return { failure: error("Não autenticado.", "UNAUTHENTICATED", 401), user: null };
  if (!canWriteClinicalData(user)) return { failure: error("Sem permissão.", "FORBIDDEN", 403), user: null };
  if (!row.patient_id) return isAdmin(user) ? { failure: null, user } : { failure: error("Sem permissão.", "FORBIDDEN", 403), user: null };
  const access = await getPatientAccess(context.env.DB!, row.patient_id, user);
  if (access.allowed) return { failure: null, user };
  // Paciente apagado fora do cascade: a nota órfã precisa continuar corrigível
  // e apagável pelo admin (LGPD) — antes, 403 para todo mundo tornava o
  // registro imortal via API.
  if (!access.exists && isAdmin(user)) return { failure: null, user };
  return { failure: error("Sem permissão.", "FORBIDDEN", 403), user: null };
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return error("Persistência indisponível para a memória.", "DB_REQUIRED", 503);
  const id = String(context.params.id ?? "");
  const row = await context.env.DB.prepare("SELECT id, patient_id, title, content, category, source, tags FROM clinical_memory_notes_demo WHERE id = ? AND is_demo = 1").bind(id).first<Row>();
  if (!row) return error("Nota não encontrada.", "NOT_FOUND", 404);
  const auth = await authorize(context, row); if (auth.failure) return auth.failure;
  let body: unknown; try { body = await context.request.json(); } catch { return error("JSON inválido.", "INVALID_JSON", 400); }
  const parsed = memoryNotePatchSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Atualização inválida.", code: "VALIDATION_ERROR", details: parsed.error.issues }, 400);
  const currentTags = (() => { try { return JSON.parse(row.tags ?? "[]"); } catch { return []; } })();
  const nextPatient = parsed.data.patientId ?? row.patient_id;
  if (nextPatient) {
    const access = await getPatientAccess(context.env.DB, nextPatient, auth.user!);
    if (!access.allowed) return error("Sem permissão para o paciente.", "FORBIDDEN", 403);
  }
  const now = new Date().toISOString();
  await context.env.DB.prepare(`UPDATE clinical_memory_notes_demo SET patient_id=?, title=?, content=?, category=?, source=?, tags=?, updated_at=? WHERE id=? AND is_demo=1`)
    .bind(nextPatient, parsed.data.title ?? row.title, parsed.data.content ?? row.content,
      parsed.data.category ?? row.category, parsed.data.source ?? row.source,
      JSON.stringify(parsed.data.tags ?? currentTags), now, id).run();
  return json({ id, patientId: nextPatient, title: parsed.data.title ?? row.title, content: parsed.data.content ?? row.content,
    category: parsed.data.category ?? row.category, source: parsed.data.source ?? row.source,
    tags: parsed.data.tags ?? currentTags, updatedAt: now });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return error("Persistência indisponível para a memória.", "DB_REQUIRED", 503);
  const id = String(context.params.id ?? "");
  const row = await context.env.DB.prepare("SELECT id, patient_id, title, content, category, source, tags FROM clinical_memory_notes_demo WHERE id=? AND is_demo=1").bind(id).first<Row>();
  if (!row) return error("Nota não encontrada.", "NOT_FOUND", 404);
  const auth = await authorize(context, row); if (auth.failure) return auth.failure;
  await context.env.DB.prepare("DELETE FROM clinical_memory_notes_demo WHERE id=? AND is_demo=1").bind(id).run();
  return new Response(null, { status: 204 });
};
