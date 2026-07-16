/**
 * DELETE /api/results/:id — remove um resultado de escala (demo).
 *
 * Servido pelo D1 (scale_results_demo). A UI (paciente-detalhe) chama este path;
 * antes caía no proxy (Railway) e retornava 404.
 */

interface Env {
  DB?: D1Database;
}

import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
} from "../auth/_authorization";
import { hasBoundedIdentifier } from "../_clinicalValidation";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = String(params.id ?? "").trim();

  if (!hasBoundedIdentifier(id)) {
    return json(
      { error: "id inválido ou maior que 128 caracteres.", code: "VALIDATION_ERROR" },
      400,
    );
  }
  if (!env.DB) return json({ deleted: false, mode: "demo" }, 200);

  try {
    const user = getContextUser(context);
    if (!user) return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
    if (!canWriteClinicalData(user)) {
      return json({ error: "Sem permissão para remover resultados.", code: "FORBIDDEN" }, 403);
    }

    const result = await env.DB
      .prepare(`SELECT patient_id FROM scale_results_demo WHERE id = ? AND is_demo = 1 LIMIT 1`)
      .bind(id)
      .first<{ patient_id: string }>();
    if (!result) return json({ error: "Resultado não encontrado.", code: "NOT_FOUND" }, 404);

    const access = await getPatientAccess(env.DB, result.patient_id, user);
    if (!access.exists) return json({ error: "Paciente não encontrado.", code: "NOT_FOUND" }, 404);
    if (!access.allowed) {
      return json({ error: "Sem permissão para este paciente.", code: "FORBIDDEN" }, 403);
    }

    const deletion = await env.DB
      .prepare(`DELETE FROM scale_results_demo WHERE id = ? AND is_demo = 1`)
      .bind(id)
      .run();
    return json({ deleted: Boolean(deletion.meta.changes), id }, 200);
  } catch (err) {
    console.error("[results/:id.DELETE] DB error:", err);
    return json({ error: "Erro ao remover resultado.", code: "DB_ERROR" }, 500);
  }
};
