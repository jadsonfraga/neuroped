/**
 * GET    /api/patients/:id — detalhe de um paciente autorizado.
 * PATCH  /api/patients/:id — atualiza campos do paciente autorizado.
 * DELETE /api/patients/:id — remove paciente e registros clínicos dependentes.
 */

import {
  authorizationError,
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
  isAdmin,
} from "../auth/_authorization";
import {
  isValidPatientId,
  normalizePatientWrite,
  toPatientApi,
  type PatientDatabaseRow,
  type PatientWriteField,
} from "./_contract";
import { isPlainObject } from "../_request";

interface Env {
  DB?: D1Database;
}

const DEMO_PATIENTS: Record<string, PatientDatabaseRow> = {
  "demo-001": {
    id: "demo-001",
    name: "Demo Paciente 1 — Fictício",
    birth_date: "2018-03-15",
    guardian_name: "Responsável Demo 1",
    guardian_phone: "(81) 99000-0001",
    diagnosis_code: "F84.0",
    notes: "Dados fictícios de demonstração.",
    is_demo: 1,
    created_at: new Date("2025-01-10").toISOString(),
    updated_at: new Date("2025-01-10").toISOString(),
  },
  "demo-002": {
    id: "demo-002",
    name: "Demo Paciente 2 — Fictício",
    birth_date: "2016-07-22",
    guardian_name: "Responsável Demo 2",
    guardian_phone: "(81) 99000-0002",
    diagnosis_code: "F90.0",
    notes: "Dados fictícios de demonstração.",
    is_demo: 1,
    created_at: new Date("2025-02-14").toISOString(),
    updated_at: new Date("2025-02-14").toISOString(),
  },
  "demo-003": {
    id: "demo-003",
    name: "Demo Paciente 3 — Fictício",
    birth_date: "2020-11-05",
    guardian_name: "Responsável Demo 3",
    guardian_phone: "(81) 99000-0003",
    diagnosis_code: "G40.3",
    notes: "Dados fictícios de demonstração.",
    is_demo: 1,
    created_at: new Date("2025-03-01").toISOString(),
    updated_at: new Date("2025-03-01").toISOString(),
  },
};

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

function patientIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim();
}

function invalidIdResponse(id: string): Response | null {
  if (!id) {
    return errorResponse("ID do paciente não fornecido.", "MISSING_ID", 400);
  }
  if (!isValidPatientId(id)) {
    return errorResponse("ID do paciente inválido.", "INVALID_ID", 400);
  }
  return null;
}

function parseScaleResponses(details: unknown): unknown[] {
  if (typeof details !== "string") return [];
  try {
    const parsed = JSON.parse(details);
    const responses = parsed?.responses ?? parsed?.answers;
    return Array.isArray(responses) ? responses : [];
  } catch {
    return [];
  }
}

// GET /api/patients/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = patientIdFrom(params);
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;

  if (!env.DB) {
    const patient = DEMO_PATIENTS[id];
    if (!patient) {
      return errorResponse("Paciente demo não encontrado.", "NOT_FOUND", 404);
    }
    return jsonResponse({
      ...toPatientApi(patient),
      consultations: [],
      scaleResults: [],
      mode: "demo",
    });
  }

  const user = getContextUser(context);
  if (!user) {
    return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  }

  try {
    const access = await getPatientAccess(env.DB, id, user);
    if (!access.exists) {
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    }
    if (!access.allowed) {
      return authorizationError(
        "Você não tem acesso a este paciente.",
        "FORBIDDEN",
        403,
      );
    }

    const patient = await env.DB.prepare(
      `SELECT id, name, birth_date, guardian_name, guardian_phone,
                diagnosis_code, notes, is_demo, created_at, updated_at
           FROM patients_demo
          WHERE id = ? AND is_demo = 1
          LIMIT 1`,
    )
      .bind(id)
      .first<PatientDatabaseRow>();

    if (!patient) {
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    }

    const consultations = await env.DB.prepare(
      `SELECT id, date, subjective, objective, assessment, plan, created_at
           FROM consultations_demo
          WHERE patient_id = ? AND is_demo = 1
          ORDER BY date DESC
          LIMIT 10`,
    )
      .bind(id)
      .all();

    const scales = await env.DB.prepare(
      `SELECT id, scale_id, scale_name, details, applied_at
           FROM scale_results_demo
          WHERE patient_id = ? AND is_demo = 1
          ORDER BY applied_at DESC
          LIMIT 20`,
    )
      .bind(id)
      .all();

    return jsonResponse({
      ...toPatientApi(patient),
      consultations: consultations.results ?? [],
      scaleResults: (scales.results ?? []).map(
        (row: Record<string, unknown>) => ({
          id: row.id,
          scaleId: row.scale_id,
          scaleName: row.scale_name,
          responses: parseScaleResponses(row.details),
          createdAt: row.applied_at,
        }),
      ),
      mode: "db",
    });
  } catch (error) {
    console.error("[patients/:id.GET] DB error:", error);
    return errorResponse("Erro ao buscar paciente.", "DB_ERROR", 500);
  }
};

// PATCH /api/patients/:id
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const id = patientIdFrom(params);
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;

  const user = env.DB ? getContextUser(context) : null;
  if (env.DB && !user) {
    return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  }
  if (user && !canWriteClinicalData(user)) {
    return authorizationError(
      "Perfil sem permissão para atualizar pacientes.",
      "FORBIDDEN",
      403,
    );
  }

  if (env.DB && user) {
    try {
      const access = await getPatientAccess(env.DB, id, user);
      if (!access.exists) {
        return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
      }
      if (!access.allowed) {
        return authorizationError(
          "Você não tem acesso a este paciente.",
          "FORBIDDEN",
          403,
        );
      }
    } catch (error) {
      console.error("[patients/:id.PATCH] ownership error:", error);
      return errorResponse(
        "Erro ao validar acesso ao paciente.",
        "DB_ERROR",
        500,
      );
    }
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

  const normalized = normalizePatientWrite(body, { requireName: false });
  if (!normalized.ok) {
    return errorResponse(normalized.message, "VALIDATION_ERROR", 400);
  }
  const entries = Object.entries(normalized.values) as Array<
    [PatientWriteField, string | null]
  >;
  if (entries.length === 0) {
    return errorResponse(
      "Nenhum campo válido para atualizar.",
      "NO_UPDATES",
      400,
    );
  }

  const now = new Date().toISOString();
  if (!env.DB) {
    return errorResponse(
      "Persistência indisponível. Nenhum paciente foi atualizado.",
      "DB_REQUIRED",
      503,
    );
  }

  try {
    const setClauses = entries.map(([field]) => `${field} = ?`);
    setClauses.push("updated_at = ?");
    const values = entries.map(([, value]) => value);
    const ownerClause = isAdmin(user!) ? "" : "AND owner_user_id = ?";
    const ownerBinds = isAdmin(user!) ? [] : [user!.id];

    const result = await env.DB.prepare(
      `UPDATE patients_demo
            SET ${setClauses.join(", ")}
          WHERE id = ? AND is_demo = 1 ${ownerClause}`,
    )
      .bind(...values, now, id, ...ownerBinds)
      .run();

    if (!result.meta.changes) {
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    }

    const patient = await env.DB.prepare(
      `SELECT id, name, birth_date, guardian_name, guardian_phone,
                diagnosis_code, notes, is_demo, created_at, updated_at
           FROM patients_demo
          WHERE id = ? AND is_demo = 1
          LIMIT 1`,
    )
      .bind(id)
      .first<PatientDatabaseRow>();

    if (!patient) {
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    }
    return jsonResponse({ ...toPatientApi(patient), updated: true });
  } catch (error) {
    console.error("[patients/:id.PATCH] DB error:", error);
    return errorResponse("Erro ao atualizar paciente.", "DB_ERROR", 500);
  }
};

// DELETE /api/patients/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const id = patientIdFrom(params);
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;

  if (!env.DB) {
    return errorResponse(
      "Persistência indisponível. Nenhum paciente foi removido.",
      "DB_REQUIRED",
      503,
    );
  }

  const user = getContextUser(context);
  if (!user) {
    return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  }
  if (!canWriteClinicalData(user)) {
    return authorizationError(
      "Perfil sem permissão para remover pacientes.",
      "FORBIDDEN",
      403,
    );
  }

  try {
    const access = await getPatientAccess(env.DB, id, user);
    if (!access.exists) {
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    }
    if (!access.allowed) {
      return authorizationError(
        "Você não tem acesso a este paciente.",
        "FORBIDDEN",
        403,
      );
    }

    const ownerClause = isAdmin(user) ? "" : "AND owner_user_id = ?";
    const ownerBinds = isAdmin(user) ? [] : [user.id];
    const deletePatient = env.DB.prepare(
      `DELETE FROM patients_demo
          WHERE id = ? AND is_demo = 1 ${ownerClause}`,
    ).bind(id, ...ownerBinds);
    const auditId = crypto.randomUUID();
    const ip =
      request.headers.get("CF-Connecting-IP") ??
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
      null;

    const statements = [
      env.DB.prepare(
        "DELETE FROM consultations_demo WHERE patient_id = ? AND is_demo = 1",
      ).bind(id),
      env.DB.prepare(
        "DELETE FROM scale_results_demo WHERE patient_id = ? AND is_demo = 1",
      ).bind(id),
      env.DB.prepare(
        "DELETE FROM documents_demo WHERE patient_id = ? AND is_demo = 1",
      ).bind(id),
      // Apagava de `memory_notes`, a tabela legada de db/schema.d1.sql, e não
      // de onde as notas realmente são gravadas — o log de auditoria declarava
      // memoryNotes entre os recursos cascateados enquanto as notas do paciente
      // sobreviviam à exclusão. A FK de 0011_clinical_memory.sql tem ON DELETE
      // CASCADE, então este DELETE é redundante quando as foreign keys estão
      // ativas; mantido explícito para a exclusão não depender desse pragma.
      env.DB.prepare(
        "DELETE FROM clinical_memory_notes_demo WHERE patient_id = ?",
      ).bind(id),
      deletePatient,
      env.DB.prepare(
        `INSERT INTO audit_logs
            (id, action, resource, resource_id, user_id, ip, details, created_at)
           VALUES (?, 'patient.delete', 'patient', ?, ?, ?, ?, ?)`,
      ).bind(
        auditId,
        id,
        user.id,
        ip,
        JSON.stringify({
          ownerUserId: access.ownerUserId,
          cascadedResources: [
            "consultations",
            "scaleResults",
            "documents",
            "memoryNotes",
          ],
        }),
        new Date().toISOString(),
      ),
    ];

    const results = await env.DB.batch(statements);
    if (!results[4]?.meta.changes) {
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    }

    return jsonResponse({ id, deleted: true });
  } catch (error) {
    console.error("[patients/:id.DELETE] DB error:", error);
    return errorResponse("Erro ao remover paciente.", "DB_ERROR", 500);
  }
};
