/**
 * GET   /api/patients/:id  — detalhe de um paciente
 * PATCH /api/patients/:id  — atualiza campos do paciente
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

function errorResponse(
  message: string,
  code: string,
  status: number,
): Response {
  return jsonResponse({ error: message, code }, status);
}

function parseScaleResponses(details: unknown): unknown[] {
  if (typeof details !== "string") return [];
  try {
    const parsed = JSON.parse(details);
    return Array.isArray(parsed?.responses) ? parsed.responses : [];
  } catch {
    return [];
  }
}

// GET /api/patients/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = params.id as string;

  if (!id)
    return errorResponse("ID do paciente não fornecido.", "MISSING_ID", 400);

  if (!env.DB) {
    // Demo fallback
    const demoPatients: Record<string, unknown> = {
      "demo-001": {
        id: "demo-001",
        name: "Demo Paciente 1 — Fictício",
        birth_date: "2018-03-15",
        guardian_name: "Responsável Demo 1",
        guardian_phone: "(81) 99000-0001",
        diagnosis_code: "F84.0",
        notes: "Dados fictícios de demonstração.",
        is_demo: true,
        created_at: new Date("2025-01-10").toISOString(),
        consultations: [],
        scale_results: [],
      },
    };
    if (demoPatients[id])
      return jsonResponse({ ...demoPatients[id], mode: "demo" });
    return errorResponse("Paciente demo não encontrado.", "NOT_FOUND", 404);
  }

  try {
    const patient = await env.DB.prepare(
      "SELECT * FROM patients_demo WHERE id = ? AND is_demo = 1",
    )
      .bind(id)
      .first();

    if (!patient)
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);

    // Busca consultas associadas
    const consultations = await env.DB.prepare(
      "SELECT id, date, assessment, plan FROM consultations_demo WHERE patient_id = ? AND is_demo = 1 ORDER BY date DESC LIMIT 10",
    )
      .bind(id)
      .all();

    // Busca resultados de escalas
    const scales = await env.DB.prepare(
      "SELECT id, scale_name, details, applied_at FROM scale_results_demo WHERE patient_id = ? AND is_demo = 1 ORDER BY applied_at DESC LIMIT 20",
    )
      .bind(id)
      .all();

    return jsonResponse({
      ...patient,
      consultations: consultations.results ?? [],
      scale_results: (scales.results ?? []).map((row: any) => ({
        id: row.id,
        scaleName: row.scale_name,
        responses: parseScaleResponses(row.details),
        createdAt: row.applied_at,
      })),
      mode: "db",
    });
  } catch (err) {
    console.error("[patients/:id.GET] DB error:", err);
    return errorResponse("Erro ao buscar paciente.", "DB_ERROR", 500);
  }
};

// PATCH /api/patients/:id
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const id = params.id as string;

  if (!id)
    return errorResponse("ID do paciente não fornecido.", "MISSING_ID", 400);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "Corpo da requisição inválido ou não é JSON.",
      "INVALID_JSON",
      400,
    );
  }

  // Campos permitidos para atualização
  const ALLOWED_FIELDS = [
    "name",
    "birth_date",
    "guardian_name",
    "guardian_phone",
    "diagnosis_code",
    "notes",
  ];
  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse(
      "Nenhum campo válido para atualizar.",
      "NO_UPDATES",
      400,
    );
  }

  if (!env.DB) {
    return jsonResponse({
      id,
      ...updates,
      updated: true,
      mode: "demo",
      note: "Atualização simulada — banco não configurado.",
    });
  }

  try {
    updates.updated_at = new Date().toISOString();
    const setClauses = Object.keys(updates)
      .map((f) => `${f} = ?`)
      .join(", ");
    const values = [...Object.values(updates), id];

    const result = await env.DB.prepare(
      `UPDATE patients_demo SET ${setClauses} WHERE id = ? AND is_demo = 1`,
    )
      .bind(...values)
      .run();

    if (!result.meta.changes || result.meta.changes === 0) {
      return errorResponse(
        "Paciente não encontrado ou sem alterações.",
        "NOT_FOUND",
        404,
      );
    }

    return jsonResponse({ id, ...updates, updated: true });
  } catch (err) {
    console.error("[patients/:id.PATCH] DB error:", err);
    return errorResponse("Erro ao atualizar paciente.", "DB_ERROR", 500);
  }
};
