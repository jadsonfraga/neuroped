/**
 * GET  /api/patients — lista os pacientes visíveis ao usuário autenticado.
 * POST /api/patients — cria um paciente pertencente ao usuário autenticado.
 *
 * Sem D1, mantém somente o catálogo fictício usado no modo de demonstração.
 */

import {
  authorizationError,
  canWriteClinicalData,
  getContextUser,
  isAdmin,
} from "../auth/_authorization";
import {
  escapeLike,
  normalizePatientWrite,
  parsePositiveInteger,
  toPatientApi,
  type PatientDatabaseRow,
} from "./_contract";
import { isPlainObject } from "../_request";

interface Env {
  DB?: D1Database;
}

const DEMO_PATIENTS: PatientDatabaseRow[] = [
  {
    id: "demo-001",
    name: "Demo Paciente 1 — Fictício",
    birth_date: "2018-03-15",
    guardian_name: "Responsável Demo 1",
    guardian_phone: "(81) 99000-0001",
    diagnosis_code: "F84.0",
    notes:
      "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    is_demo: 1,
    created_at: new Date("2025-01-10").toISOString(),
    updated_at: new Date("2025-01-10").toISOString(),
  },
  {
    id: "demo-002",
    name: "Demo Paciente 2 — Fictício",
    birth_date: "2016-07-22",
    guardian_name: "Responsável Demo 2",
    guardian_phone: "(81) 99000-0002",
    diagnosis_code: "F90.0",
    notes:
      "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    is_demo: 1,
    created_at: new Date("2025-02-14").toISOString(),
    updated_at: new Date("2025-02-14").toISOString(),
  },
  {
    id: "demo-003",
    name: "Demo Paciente 3 — Fictício",
    birth_date: "2020-11-05",
    guardian_name: "Responsável Demo 3",
    guardian_phone: "(81) 99000-0003",
    diagnosis_code: "G40.3",
    notes:
      "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    is_demo: 1,
    created_at: new Date("2025-03-01").toISOString(),
    updated_at: new Date("2025-03-01").toISOString(),
  },
];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function errorResponse(
  message: string,
  code: string,
  status: number,
): Response {
  return jsonResponse({ error: message, code }, status);
}

// GET /api/patients
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const page = parsePositiveInteger(url.searchParams.get("page"), 1, 1_000_000);
  const limit = parsePositiveInteger(url.searchParams.get("limit"), 20, 50);
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 160);

  if (!env.DB) {
    let results = DEMO_PATIENTS;
    if (search) {
      const query = search.toLocaleLowerCase("pt-BR");
      results = results.filter((patient) =>
        [patient.name, patient.diagnosis_code, patient.guardian_name].some(
          (value) =>
            String(value ?? "")
              .toLocaleLowerCase("pt-BR")
              .includes(query),
        ),
      );
    }
    const offset = (page - 1) * limit;
    return jsonResponse({
      data: results.slice(offset, offset + limit).map(toPatientApi),
      total: results.length,
      page,
      limit,
      mode: "demo",
      note: "Dados fictícios de demonstração. Configure D1 para persistência real.",
    });
  }

  const user = getContextUser(context);
  if (!user) {
    return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  }

  try {
    const ownershipClause = isAdmin(user) ? "" : "AND owner_user_id = ?";
    const ownershipBinds = isAdmin(user) ? [] : [user.id];
    const searchClause = search
      ? `AND (name LIKE ? ESCAPE '\\' OR diagnosis_code LIKE ? ESCAPE '\\' OR guardian_name LIKE ? ESCAPE '\\')`
      : "";
    const searchTerm = `%${escapeLike(search)}%`;
    const searchBinds = search ? [searchTerm, searchTerm, searchTerm] : [];
    const queryBinds = [...ownershipBinds, ...searchBinds];
    const offset = (page - 1) * limit;

    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) AS total
           FROM patients_demo
          WHERE is_demo = 1 ${ownershipClause} ${searchClause}`,
    )
      .bind(...queryBinds)
      .first<{ total: number }>();

    const rows = await env.DB.prepare(
      `SELECT id, name, birth_date, guardian_name, guardian_phone,
                diagnosis_code, notes, is_demo, created_at, updated_at
           FROM patients_demo
          WHERE is_demo = 1 ${ownershipClause} ${searchClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?`,
    )
      .bind(...queryBinds, limit, offset)
      .all<PatientDatabaseRow>();

    return jsonResponse({
      data: (rows.results ?? []).map(toPatientApi),
      total: countResult?.total ?? 0,
      page,
      limit,
      mode: "db",
    });
  } catch (error) {
    console.error("[patients.GET] DB error:", error);
    return errorResponse("Erro ao buscar pacientes.", "DB_ERROR", 500);
  }
};

// POST /api/patients
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = env.DB ? getContextUser(context) : null;
  if (env.DB && !user) {
    return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  }
  if (user && !canWriteClinicalData(user)) {
    return authorizationError(
      "Perfil sem permissão para criar pacientes.",
      "FORBIDDEN",
      403,
    );
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return errorResponse(
      "Corpo da requisição inválido ou não é JSON.",
      "INVALID_JSON",
      400,
    );
  }
  if (!isPlainObject(parsed)) {
    return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);
  }
  const body = parsed;

  const normalized = normalizePatientWrite(body, { requireName: true });
  if (!normalized.ok) {
    return errorResponse(normalized.message, "VALIDATION_ERROR", 400);
  }

  const id = `demo-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const row: PatientDatabaseRow = {
    id,
    name: normalized.values.name,
    birth_date: normalized.values.birth_date ?? null,
    guardian_name: normalized.values.guardian_name ?? null,
    guardian_phone: normalized.values.guardian_phone ?? null,
    diagnosis_code: normalized.values.diagnosis_code ?? null,
    notes: normalized.values.notes ?? null,
    is_demo: 1,
    created_at: now,
    updated_at: now,
  };

  if (!env.DB) {
    return jsonResponse(
      {
        ...toPatientApi(row),
        mode: "demo",
        note: "Registro simulado — banco não configurado. Configure D1 para persistência real.",
      },
      201,
    );
  }

  try {
    await env.DB.prepare(
      `INSERT INTO patients_demo
          (id, name, birth_date, guardian_name, guardian_phone, diagnosis_code,
           notes, owner_user_id, is_demo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
      .bind(
        row.id,
        row.name,
        row.birth_date,
        row.guardian_name,
        row.guardian_phone,
        row.diagnosis_code,
        row.notes,
        user!.id,
        row.created_at,
        row.updated_at,
      )
      .run();

    return jsonResponse({ ...toPatientApi(row), mode: "db" }, 201);
  } catch (error) {
    console.error("[patients.POST] DB error:", error);
    return errorResponse("Erro ao criar paciente.", "DB_ERROR", 500);
  }
};
