import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
} from "../auth/_authorization";
import { ensureConectaDemoSchema } from "./_schema";

interface Env {
  DB?: D1Database;
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

export const onRequestDelete: PagesFunction<Env, "id"> = async (context) => {
  const { env } = context;
  if (!env.DB) return error("Armazenamento remoto indisponível.", "STORAGE_UNAVAILABLE", 503);
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) {
    return error("Perfil sem permissão para excluir registros.", "FORBIDDEN", 403);
  }
  const id = context.params.id?.trim() ?? "";
  if (!id || id.length > 160) return error("Identificador inválido.", "VALIDATION_ERROR", 400);

  try {
    await ensureConectaDemoSchema(env.DB);
    const row = await env.DB
      .prepare("SELECT patient_id FROM conecta_events_demo WHERE id = ? AND is_demo = 1 LIMIT 1")
      .bind(id)
      .first<{ patient_id: string }>();
    if (!row) return error("Registro não encontrado.", "NOT_FOUND", 404);

    const access = await getPatientAccess(env.DB, row.patient_id, user);
    if (!access.exists) return error("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return error("Sem permissão para este paciente.", "FORBIDDEN", 403);

    const deletion = await env.DB.prepare("DELETE FROM conecta_events_demo WHERE id = ?").bind(id).run();
    if ((deletion.meta?.changes ?? 0) !== 1) {
      return error("Registro não encontrado.", "NOT_FOUND", 404);
    }
    return json({ ok: true });
  } catch (cause) {
    console.error("[conecta.DELETE]", cause);
    return error("Não foi possível remover o registro agora.", "DB_ERROR", 500);
  }
};
