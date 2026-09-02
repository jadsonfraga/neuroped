/**
 * POST /api/scales/results  — registra resultado de escala aplicada
 * GET  /api/scales/results?patient_id=xxx  — lista resultados de um paciente
 */

interface Env {
  DB?: D1Database;
}

import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
  isAdmin,
} from "../auth/_authorization";
import {
  CLINICAL_INPUT_LIMITS,
  createClinicalRecordId,
  hasBoundedIdentifier,
  isValidIsoDateTime,
  normalizeClinicalResponses,
} from "../_clinicalValidation";
import { isPlainObject } from "../_request";
import { json as jsonResponse } from "../_request";

function errorResponse(
  message: string,
  code: string,
  status: number,
): Response {
  return jsonResponse({ error: message, code }, status);
}

function presentResult(row: any) {
  let responses: unknown[] = [];
  if (typeof row.details === "string") {
    try {
      const parsed = JSON.parse(row.details);
      const normalized = normalizeClinicalResponses(parsed?.responses);
      responses = normalized.ok ? normalized.responses : [];
    } catch {
      responses = [];
    }
  }
  return {
    id: row.id,
    patient_id: row.patient_id,
    scale_id: row.scale_id,
    scale_name: row.scale_name,
    responses,
    is_demo: row.is_demo,
    applied_at: row.applied_at,
  };
}

const DEMO_RESULTS = [
  {
    id: "scale-demo-001",
    patient_id: "demo-001",
    scale_id: "mchat",
    scale_name: "M-CHAT-R/F",
    details: JSON.stringify({
      responses: [
        { question: "Exemplo demonstrativo 1", answer: "Sim" },
        { question: "Exemplo demonstrativo 2", answer: "Não" },
      ],
    }),
    is_demo: true,
    applied_at: new Date("2025-04-05").toISOString(),
  },
  {
    id: "scale-demo-002",
    patient_id: "demo-002",
    scale_id: "snap-iv",
    scale_name: "SNAP-IV",
    details: JSON.stringify({
      responses: [
        { question: "Exemplo demonstrativo 1", answer: "Bastante" },
        { question: "Exemplo demonstrativo 2", answer: "Nem um pouco" },
      ],
    }),
    is_demo: true,
    applied_at: new Date("2025-04-12").toISOString(),
  },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id")?.trim();
  const scaleId = url.searchParams.get("scale_id")?.trim();

  if (patientId && !hasBoundedIdentifier(patientId)) {
    return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  }
  if (scaleId && !hasBoundedIdentifier(scaleId)) {
    return errorResponse("'scale_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  }

  if (!env.DB) {
    let results = DEMO_RESULTS;
    if (patientId) results = results.filter((r) => r.patient_id === patientId);
    if (scaleId) results = results.filter((r) => r.scale_id === scaleId);
    return jsonResponse({
      data: results.map(presentResult),
      total: results.length,
      mode: "demo",
    });
  }

  try {
    const user = getContextUser(context);
    if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (patientId) {
      const access = await getPatientAccess(env.DB, patientId, user);
      if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
      if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    }

    let sql =
      "SELECT id, patient_id, scale_id, scale_name, details, applied_at, is_demo FROM scale_results_demo WHERE is_demo = 1";
    const binds: unknown[] = [];
    if (patientId) {
      sql += " AND patient_id = ?";
      binds.push(patientId);
    }
    if (scaleId) {
      sql += " AND scale_id = ?";
      binds.push(scaleId);
    }
    if (!isAdmin(user)) {
      sql += " AND patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)";
      binds.push(user.id);
    }
    sql += " ORDER BY applied_at DESC LIMIT 50";

    const rows = await env.DB.prepare(sql)
      .bind(...binds)
      .all();
    const data = (rows.results ?? []).map(presentResult);
    return jsonResponse({ data, total: data.length, mode: "db" });
  } catch (err) {
    console.error("[scales/results.GET] DB error:", err);
    return errorResponse("Erro ao buscar resultados.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400);
  }
  if (!isPlainObject(parsed)) {
    return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);
  }
  const body = parsed;

  const patient_id = typeof body.patient_id === "string" ? body.patient_id.trim() : "";
  const scale_id = typeof body.scale_id === "string" ? body.scale_id.trim() : "";
  const scale_name = typeof body.scale_name === "string" ? body.scale_name.trim() : "";

  if (!patient_id)
    return errorResponse(
      "'patient_id' é obrigatório.",
      "VALIDATION_ERROR",
      400,
    );
  if (!scale_id)
    return errorResponse("'scale_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!scale_name)
    return errorResponse(
      "'scale_name' é obrigatório.",
      "VALIDATION_ERROR",
      400,
    );
  if (!hasBoundedIdentifier(patient_id)) {
    return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  }
  if (!hasBoundedIdentifier(scale_id)) {
    return errorResponse("'scale_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  }
  if (scale_name.length > CLINICAL_INPUT_LIMITS.scaleName) {
    return errorResponse(
      `'scale_name' deve ter no máximo ${CLINICAL_INPUT_LIMITS.scaleName} caracteres.`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const normalizedResponses = normalizeClinicalResponses(body.responses ?? body.answers);
  if (!normalizedResponses.ok) {
    return errorResponse(
      normalizedResponses.message,
      normalizedResponses.code,
      400,
    );
  }
  const responses = normalizedResponses.responses;

  const id = createClinicalRecordId("scale");
  if (body.applied_at != null && typeof body.applied_at !== "string") {
    return errorResponse("'applied_at' deve ser texto.", "VALIDATION_ERROR", 400);
  }
  const applied_at = body.applied_at?.trim() || new Date().toISOString();
  if (!isValidIsoDateTime(applied_at)) {
    return errorResponse(
      "'applied_at' deve ser um instante ISO 8601 válido com timezone.",
      "VALIDATION_ERROR",
      400,
    );
  }

  const payload = {
    id,
    patient_id,
    scale_id,
    scale_name,
    responses,
    details: JSON.stringify({ responses }),
    is_demo: true,
    applied_at,
  };

  if (!env.DB) {
    return errorResponse(
      "Persistência indisponível. Nenhum resultado foi registrado.",
      "DB_REQUIRED",
      503,
    );
  }

  try {
    const user = getContextUser(context);
    if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (!canWriteClinicalData(user)) {
      return errorResponse(
        "Perfil sem permissão para registrar resultados.",
        "FORBIDDEN",
        403,
      );
    }
    const access = await getPatientAccess(env.DB, patient_id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);

    await env.DB.prepare(
      `INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, score, interpretation, details, is_demo, applied_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    )
      .bind(
        id,
        patient_id,
        scale_id,
        scale_name,
        null,
        null,
        payload.details,
        applied_at,
      )
      .run();

    return jsonResponse(payload, 201);
  } catch (err) {
    console.error("[scales/results.POST] DB error:", err);
    return errorResponse("Erro ao registrar resultado.", "DB_ERROR", 500);
  }
};
