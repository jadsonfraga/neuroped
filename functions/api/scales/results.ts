/**
 * POST /api/scales/results  — registra resultado de escala aplicada
 * GET  /api/scales/results?patient_id=xxx  — lista resultados de um paciente
 */

interface Env {
  DB?: D1Database;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code }, status);
}

const DEMO_RESULTS = [
  {
    id: "scale-demo-001",
    patient_id: "demo-001",
    scale_id: "mchat",
    scale_name: "M-CHAT-R/F",
    score: 8,
    interpretation: "Risco elevado para TEA — encaminhamento recomendado",
    details: JSON.stringify({ itens: [1,2,3,4,5,6,7,8], positivos: 8 }),
    is_demo: true,
    applied_at: new Date("2025-04-05").toISOString(),
  },
  {
    id: "scale-demo-002",
    patient_id: "demo-002",
    scale_id: "snap-iv",
    scale_name: "SNAP-IV",
    score: 28,
    interpretation: "Sintomas de TDAH tipo combinado — acima do limiar clínico",
    details: JSON.stringify({ subtipo: "combinado", inatencao: 14, hiperatividade: 14 }),
    is_demo: true,
    applied_at: new Date("2025-04-12").toISOString(),
  },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id")?.trim();
  const scaleId = url.searchParams.get("scale_id")?.trim();

  if (!env.DB) {
    let results = DEMO_RESULTS;
    if (patientId) results = results.filter((r) => r.patient_id === patientId);
    if (scaleId) results = results.filter((r) => r.scale_id === scaleId);
    return jsonResponse({ data: results, total: results.length, mode: "demo" });
  }

  try {
    let sql = "SELECT id, patient_id, scale_id, scale_name, score, interpretation, applied_at, is_demo FROM scale_results_demo WHERE is_demo = 1";
    const binds: unknown[] = [];
    if (patientId) { sql += " AND patient_id = ?"; binds.push(patientId); }
    if (scaleId) { sql += " AND scale_id = ?"; binds.push(scaleId); }
    sql += " ORDER BY applied_at DESC LIMIT 50";

    const rows = await env.DB.prepare(sql).bind(...binds).all();
    return jsonResponse({ data: rows.results ?? [], total: rows.results?.length ?? 0, mode: "db" });
  } catch (err) {
    console.error("[scales/results.GET] DB error:", err);
    return errorResponse("Erro ao buscar resultados.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400);
  }

  const patient_id = (body.patient_id as string)?.trim();
  const scale_id = (body.scale_id as string)?.trim();
  const scale_name = (body.scale_name as string)?.trim();

  if (!patient_id) return errorResponse("'patient_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!scale_id) return errorResponse("'scale_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!scale_name) return errorResponse("'scale_name' é obrigatório.", "VALIDATION_ERROR", 400);

  const score = typeof body.score === "number" ? body.score : parseFloat(String(body.score ?? ""));
  if (Number.isNaN(score)) return errorResponse("'score' deve ser um número.", "VALIDATION_ERROR", 400);

  const id = `scale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const applied_at = (body.applied_at as string) ?? new Date().toISOString();

  const payload = {
    id,
    patient_id,
    scale_id,
    scale_name,
    score,
    interpretation: (body.interpretation as string) ?? null,
    details: body.details ? JSON.stringify(body.details) : null,
    is_demo: true,
    applied_at,
  };

  if (!env.DB) {
    return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);
  }

  try {
    await env.DB
      .prepare(
        `INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, score, interpretation, details, is_demo, applied_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .bind(id, patient_id, scale_id, scale_name, score, payload.interpretation, payload.details, applied_at)
      .run();

    return jsonResponse(payload, 201);
  } catch (err) {
    console.error("[scales/results.POST] DB error:", err);
    return errorResponse("Erro ao registrar resultado.", "DB_ERROR", 500);
  }
};
