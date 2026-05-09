/**
 * GET  /api/patients       — lista pacientes
 * POST /api/patients       — cria paciente demo
 *
 * LGPD: Em modo demo (is_demo=1), nenhum dado real de paciente é usado.
 * Em produção com DB real, requer autenticação JWT (Authorization: Bearer <token>).
 */

interface Env {
  DB?: D1Database;
}

interface DemoPatient {
  id: string;
  name: string;
  birth_date: string;
  guardian_name: string;
  guardian_phone: string;
  diagnosis_code: string;
  notes: string;
  is_demo: boolean;
  created_at: string;
}

// Dados fictícios para modo demo (sem DB configurado)
const DEMO_PATIENTS: DemoPatient[] = [
  {
    id: "demo-001",
    name: "Demo Paciente 1 — Fictício",
    birth_date: "2018-03-15",
    guardian_name: "Responsável Demo 1",
    guardian_phone: "(81) 99000-0001",
    diagnosis_code: "F84.0",
    notes: "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    is_demo: true,
    created_at: new Date("2025-01-10").toISOString(),
  },
  {
    id: "demo-002",
    name: "Demo Paciente 2 — Fictício",
    birth_date: "2016-07-22",
    guardian_name: "Responsável Demo 2",
    guardian_phone: "(81) 99000-0002",
    diagnosis_code: "F90.0",
    notes: "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    is_demo: true,
    created_at: new Date("2025-02-14").toISOString(),
  },
  {
    id: "demo-003",
    name: "Demo Paciente 3 — Fictício",
    birth_date: "2020-11-05",
    guardian_name: "Responsável Demo 3",
    guardian_phone: "(81) 99000-0003",
    diagnosis_code: "G40.3",
    notes: "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    is_demo: true,
    created_at: new Date("2025-03-01").toISOString(),
  },
];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code }, status);
}

// GET /api/patients
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const search = url.searchParams.get("q")?.trim() ?? "";

  if (!env.DB) {
    // Modo demo sem banco
    let results = DEMO_PATIENTS;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.diagnosis_code.toLowerCase().includes(q) ||
          p.guardian_name.toLowerCase().includes(q)
      );
    }
    const offset = (page - 1) * limit;
    const paginated = results.slice(offset, offset + limit);
    return jsonResponse({
      data: paginated,
      total: results.length,
      page,
      limit,
      mode: "demo",
      note: "Dados fictícios de demonstração. Configure D1 para dados reais.",
    });
  }

  try {
    const searchClause = search ? `AND (name LIKE ? OR diagnosis_code LIKE ? OR guardian_name LIKE ?)` : "";
    const searchBinds = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const offset = (page - 1) * limit;

    const countResult = await env.DB
      .prepare(`SELECT COUNT(*) as total FROM patients_demo WHERE is_demo = 1 ${searchClause}`)
      .bind(...searchBinds)
      .first<{ total: number }>();

    const rows = await env.DB
      .prepare(
        `SELECT id, name, birth_date, guardian_name, diagnosis_code, is_demo, created_at
         FROM patients_demo
         WHERE is_demo = 1 ${searchClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...searchBinds, limit, offset)
      .all();

    return jsonResponse({
      data: rows.results ?? [],
      total: countResult?.total ?? 0,
      page,
      limit,
      mode: "db",
    });
  } catch (err) {
    console.error("[patients.GET] DB error:", err);
    return errorResponse("Erro ao buscar pacientes.", "DB_ERROR", 500);
  }
};

// POST /api/patients
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Corpo da requisição inválido ou não é JSON.", "INVALID_JSON", 400);
  }

  // Validação básica
  const name = (body.name as string)?.trim();
  const birth_date = (body.birth_date as string)?.trim();
  const guardian_name = (body.guardian_name as string)?.trim();

  if (!name || name.length < 2) {
    return errorResponse("'name' é obrigatório e deve ter pelo menos 2 caracteres.", "VALIDATION_ERROR", 400);
  }
  if (birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
    return errorResponse("'birth_date' deve estar no formato YYYY-MM-DD.", "VALIDATION_ERROR", 400);
  }

  const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  if (!env.DB) {
    // Modo demo sem banco — retorna o objeto que seria criado
    return jsonResponse(
      {
        id,
        name,
        birth_date: birth_date ?? null,
        guardian_name: guardian_name ?? null,
        guardian_phone: (body.guardian_phone as string) ?? null,
        diagnosis_code: (body.diagnosis_code as string) ?? null,
        notes: (body.notes as string) ?? null,
        is_demo: true,
        created_at: now,
        mode: "demo",
        note: "Registro simulado — banco não configurado. Configure D1 para persistência real.",
      },
      201
    );
  }

  try {
    await env.DB
      .prepare(
        `INSERT INTO patients_demo (id, name, birth_date, guardian_name, guardian_phone, diagnosis_code, notes, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .bind(
        id,
        name,
        birth_date ?? null,
        guardian_name ?? null,
        (body.guardian_phone as string) ?? null,
        (body.diagnosis_code as string) ?? null,
        (body.notes as string) ?? null,
        now
      )
      .run();

    return jsonResponse({ id, name, birth_date, guardian_name, is_demo: true, created_at: now }, 201);
  } catch (err) {
    console.error("[patients.POST] DB error:", err);
    return errorResponse("Erro ao criar paciente.", "DB_ERROR", 500);
  }
};
