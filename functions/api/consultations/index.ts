/**
 * GET  /api/consultations?patient_id=xxx  — lista consultas de um paciente
 * POST /api/consultations                 — registra nova consulta (SOAP)
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

const DEMO_CONSULTATIONS = [
  {
    id: "cons-demo-001",
    patient_id: "demo-001",
    date: new Date("2025-04-10").toISOString(),
    subjective: "Mãe relata melhora na comunicação após terapia fonoaudiológica. (Demonstração)",
    objective: "Criança colaborativa, contato ocular mantido por períodos mais longos. (Demonstração)",
    assessment: "Evolução favorável em TEA leve. (Demonstração)",
    plan: "Manter fonoaudiologia 2x/semana. Reavaliação em 3 meses. (Demonstração)",
    is_demo: true,
    created_at: new Date("2025-04-10").toISOString(),
  },
  {
    id: "cons-demo-002",
    patient_id: "demo-002",
    date: new Date("2025-04-15").toISOString(),
    subjective: "Responsável refere dificuldade de atenção persistente no ambiente escolar. (Demonstração)",
    objective: "Hiperatividade leve observada na consulta. Sem sinais de ansiedade. (Demonstração)",
    assessment: "TDAH combinado — revisão de medicação necessária. (Demonstração)",
    plan: "Ajuste de dose de metilfenidato. Contato com escola em 30 dias. (Demonstração)",
    is_demo: true,
    created_at: new Date("2025-04-15").toISOString(),
  },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id")?.trim();

  if (!env.DB) {
    let results = DEMO_CONSULTATIONS;
    if (patientId) results = results.filter((c) => c.patient_id === patientId);
    return jsonResponse({ data: results, total: results.length, mode: "demo" });
  }

  try {
    const whereClause = patientId ? "WHERE patient_id = ? AND is_demo = 1" : "WHERE is_demo = 1";
    const binds = patientId ? [patientId] : [];

    const rows = await env.DB
      .prepare(
        `SELECT id, patient_id, date, subjective, objective, assessment, plan, is_demo, created_at
         FROM consultations_demo ${whereClause}
         ORDER BY date DESC LIMIT 50`
      )
      .bind(...binds)
      .all();

    return jsonResponse({ data: rows.results ?? [], total: rows.results?.length ?? 0, mode: "db" });
  } catch (err) {
    console.error("[consultations.GET] DB error:", err);
    return errorResponse("Erro ao buscar consultas.", "DB_ERROR", 500);
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
  const date = (body.date as string) ?? new Date().toISOString();

  if (!patient_id) {
    return errorResponse("'patient_id' é obrigatório.", "VALIDATION_ERROR", 400);
  }

  const id = `cons-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const payload = {
    id,
    patient_id,
    date,
    subjective: (body.subjective as string) ?? null,
    objective: (body.objective as string) ?? null,
    assessment: (body.assessment as string) ?? null,
    plan: (body.plan as string) ?? null,
    is_demo: true,
    created_at: now,
  };

  if (!env.DB) {
    return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);
  }

  try {
    await env.DB
      .prepare(
        `INSERT INTO consultations_demo (id, patient_id, date, subjective, objective, assessment, plan, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .bind(id, patient_id, date, payload.subjective, payload.objective, payload.assessment, payload.plan, now)
      .run();

    return jsonResponse(payload, 201);
  } catch (err) {
    console.error("[consultations.POST] DB error:", err);
    return errorResponse("Erro ao registrar consulta.", "DB_ERROR", 500);
  }
};
