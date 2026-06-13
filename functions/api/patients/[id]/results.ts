/**
 * GET /api/patients/:id/results — lista os resultados de escala de um paciente.
 *
 * Servido pelo D1 (tabela scale_results_demo). A UI (paciente-detalhe) espera um
 * ARRAY direto. Existe para que este path (usado pela UI) bata no D1 em vez de
 * cair no proxy (Railway), que retornava 404.
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const patientId = String(params.id ?? "").trim();

  if (!patientId) return json([], 200);
  if (!env.DB) return json([], 200);

  try {
    const rows = await env.DB
      .prepare(
        `SELECT id, patient_id, scale_id, scale_name, score, interpretation, details, applied_at, is_demo
         FROM scale_results_demo
         WHERE patient_id = ? AND is_demo = 1
         ORDER BY applied_at DESC
         LIMIT 200`
      )
      .bind(patientId)
      .all();
    return json(rows.results ?? [], 200);
  } catch (err) {
    console.error("[patients/:id/results.GET] DB error:", err);
    return json([], 200);
  }
};
