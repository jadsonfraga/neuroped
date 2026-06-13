/**
 * DELETE /api/results/:id — remove um resultado de escala (demo).
 *
 * Servido pelo D1 (scale_results_demo). A UI (paciente-detalhe) chama este path;
 * antes caía no proxy (Railway) e retornava 404.
 */

interface Env {
  DB?: D1Database;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = String(params.id ?? "").trim();

  if (!id) return json({ error: "id obrigatorio.", code: "VALIDATION_ERROR" }, 400);
  if (!env.DB) return json({ deleted: false, mode: "demo" }, 200);

  try {
    await env.DB
      .prepare(`DELETE FROM scale_results_demo WHERE id = ? AND is_demo = 1`)
      .bind(id)
      .run();
    return json({ deleted: true, id }, 200);
  } catch (err) {
    console.error("[results/:id.DELETE] DB error:", err);
    return json({ error: "Erro ao remover resultado.", code: "DB_ERROR" }, 500);
  }
};
