/**
 * GET  /api/documents?patient_id=xxx   — lista documentos clínicos
 * POST /api/documents                  — cria novo documento (laudo, relatório, encaminhamento)
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

const DOCUMENT_TYPES = ["laudo", "relatorio", "encaminhamento", "prescricao", "atestado", "orientacao"];

const DEMO_DOCS = [
  {
    id: "doc-demo-001",
    patient_id: "demo-001",
    type: "laudo",
    title: "Laudo de Avaliação Neuropediátrica — Demo",
    content: "Este é um documento de demonstração. Conteúdo fictício para fins de teste da plataforma. Não representa avaliação clínica real.",
    is_family_visible: false,
    is_demo: true,
    created_at: new Date("2025-04-20").toISOString(),
  },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id")?.trim();
  const type = url.searchParams.get("type")?.trim();

  if (!env.DB) {
    let results = DEMO_DOCS;
    if (patientId) results = results.filter((d) => d.patient_id === patientId);
    if (type) results = results.filter((d) => d.type === type);
    return jsonResponse({ data: results, total: results.length, mode: "demo" });
  }

  try {
    let sql = "SELECT id, patient_id, type, title, is_family_visible, is_demo, created_at FROM documents_demo WHERE is_demo = 1";
    const binds: unknown[] = [];

    if (patientId) { sql += " AND patient_id = ?"; binds.push(patientId); }
    if (type) { sql += " AND type = ?"; binds.push(type); }
    sql += " ORDER BY created_at DESC LIMIT 50";

    const rows = await env.DB.prepare(sql).bind(...binds).all();
    return jsonResponse({ data: rows.results ?? [], total: rows.results?.length ?? 0, mode: "db" });
  } catch (err) {
    console.error("[documents.GET] DB error:", err);
    return errorResponse("Erro ao buscar documentos.", "DB_ERROR", 500);
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
  const type = (body.type as string)?.trim();
  const title = (body.title as string)?.trim();
  const content = (body.content as string)?.trim();

  if (!patient_id) return errorResponse("'patient_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!type || !DOCUMENT_TYPES.includes(type)) {
    return errorResponse(
      `'type' deve ser um de: ${DOCUMENT_TYPES.join(", ")}`,
      "VALIDATION_ERROR",
      400
    );
  }
  if (!title || title.length < 3) return errorResponse("'title' é obrigatório (mín. 3 chars).", "VALIDATION_ERROR", 400);
  if (!content) return errorResponse("'content' é obrigatório.", "VALIDATION_ERROR", 400);

  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const is_family_visible = Boolean(body.is_family_visible);

  const payload = { id, patient_id, type, title, content, is_family_visible, is_demo: true, created_at: now };

  if (!env.DB) {
    return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);
  }

  try {
    await env.DB
      .prepare(
        `INSERT INTO documents_demo (id, patient_id, type, title, content, is_family_visible, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .bind(id, patient_id, type, title, content, is_family_visible ? 1 : 0, now)
      .run();

    return jsonResponse(payload, 201);
  } catch (err) {
    console.error("[documents.POST] DB error:", err);
    return errorResponse("Erro ao criar documento.", "DB_ERROR", 500);
  }
};
