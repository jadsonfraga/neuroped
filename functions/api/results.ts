/**
 * POST /api/results — registra resultado de escala vindo da UI.
 *
 * Adaptador: a UI envia o corpo em camelCase com a transcrição integral das
 * perguntas e respostas. Escore, classificação e interpretação não fazem parte
 * da entrega; a análise é realizada pelo profissional.
 * Esta function traduz para a tabela `scale_results_demo` do D1. Existe para que
 * o path /api/results (usado pela UI) seja servido pelo D1 — antes caía no proxy
 * (Railway) e retornava 404.
 */

interface Env {
  DB?: D1Database;
}

import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
} from "./auth/_authorization";
import {
  CLINICAL_INPUT_LIMITS,
  createClinicalRecordId,
  hasBoundedIdentifier,
  isValidIsoDateTime,
  normalizeClinicalResponses,
} from "./_clinicalValidation";
import { isPlainObject } from "./_request";
import { json } from "./_request";

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "escala"
  );
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return json(
      { error: "Corpo da requisição inválido.", code: "INVALID_JSON" },
      400,
    );
  }
  if (!isPlainObject(parsed)) {
    return json(
      { error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" },
      400,
    );
  }
  const body = parsed;

  const rawPatientId = body.patientId ?? body.patient_id;
  if (rawPatientId != null && typeof rawPatientId !== "string") {
    return json({ error: "'patientId' deve ser texto.", code: "VALIDATION_ERROR" }, 400);
  }
  const patient_id = rawPatientId?.trim() ?? "";
  if (patient_id && !hasBoundedIdentifier(patient_id)) {
    return json(
      { error: "'patientId' é inválido ou excede 128 caracteres.", code: "VALIDATION_ERROR" },
      400,
    );
  }

  const rawScaleName = body.scaleName ?? body.scale_name;
  if (rawScaleName != null && typeof rawScaleName !== "string") {
    return json({ error: "'scaleName' deve ser texto.", code: "VALIDATION_ERROR" }, 400);
  }
  const scale_name = rawScaleName?.trim() || "Escala";
  if (scale_name.length > CLINICAL_INPUT_LIMITS.scaleName) {
    return json(
      { error: `'scaleName' deve ter no máximo ${CLINICAL_INPUT_LIMITS.scaleName} caracteres.`, code: "VALIDATION_ERROR" },
      400,
    );
  }
  const rawScaleId = body.scaleId ?? body.scale_id;
  if (rawScaleId != null && typeof rawScaleId !== "string") {
    return json({ error: "'scaleId' deve ser texto.", code: "VALIDATION_ERROR" }, 400);
  }
  const scale_id = rawScaleId?.trim() || slug(scale_name);
  if (!hasBoundedIdentifier(scale_id)) {
    return json(
      { error: "'scaleId' é inválido ou excede 128 caracteres.", code: "VALIDATION_ERROR" },
      400,
    );
  }

  const normalizedResponses = normalizeClinicalResponses(body.responses ?? body.answers);
  if (!normalizedResponses.ok) {
    return json(
      { error: normalizedResponses.message, code: normalizedResponses.code },
      400,
    );
  }
  const responses = normalizedResponses.responses;
  if (
    body.patientAge != null &&
    typeof body.patientAge !== "string" &&
    typeof body.patientAge !== "number"
  ) {
    return json({ error: "'patientAge' deve ser texto ou número.", code: "VALIDATION_ERROR" }, 400);
  }
  if (
    (typeof body.patientAge === "string" && body.patientAge.trim().length > 80) ||
    (typeof body.patientAge === "number" &&
      (!Number.isFinite(body.patientAge) || body.patientAge < 0 || body.patientAge > 130))
  ) {
    return json({ error: "'patientAge' é inválido ou excede o limite permitido.", code: "VALIDATION_ERROR" }, 400);
  }
  const details = JSON.stringify({
    responses,
    patientAge: typeof body.patientAge === "string"
      ? body.patientAge.trim() || null
      : body.patientAge ?? null,
  });

  const id = createClinicalRecordId("scale");
  if (body.applied_at != null && typeof body.applied_at !== "string") {
    return json({ error: "'applied_at' deve ser texto.", code: "VALIDATION_ERROR" }, 400);
  }
  const applied_at = body.applied_at?.trim() || new Date().toISOString();
  if (!isValidIsoDateTime(applied_at)) {
    return json(
      { error: "'applied_at' deve ser um instante ISO 8601 válido com timezone.", code: "VALIDATION_ERROR" },
      400,
    );
  }

  const payload = {
    id,
    patient_id,
    scale_id,
    scale_name,
    responses,
    applied_at,
  };

  // Aplicação avulsa continua aceita, mas somente depois de validar integralmente
  // perguntas/respostas e tipos; payload malformado nunca vira falso sucesso.
  if (!patient_id) {
    return json(
      {
        ...payload,
        stored: false,
        note: "Resultado não vinculado a paciente — não persistido.",
      },
      200,
    );
  }

  if (!env.DB) {
    return json(
      {
        error: "Persistência indisponível. Nenhum resultado foi registrado.",
        code: "DB_REQUIRED",
      },
      503,
    );
  }

  try {
    const user = getContextUser(context);
    if (!user) {
      return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
    }
    if (!canWriteClinicalData(user)) {
      return json(
        { error: "Perfil sem permissão para registrar resultados.", code: "FORBIDDEN" },
        403,
      );
    }
    const access = await getPatientAccess(env.DB, patient_id, user);
    if (!access.exists) {
      return json({ error: "Paciente não encontrado.", code: "NOT_FOUND" }, 404);
    }
    if (!access.allowed) {
      return json({ error: "Sem permissão para este paciente.", code: "FORBIDDEN" }, 403);
    }

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
        details,
        applied_at,
      )
      .run();
    return json({ ...payload, mode: "db" }, 201);
  } catch (err) {
    console.error("[results.POST] DB error:", err);
    return json(
      { error: "Erro ao registrar resultado.", code: "DB_ERROR" },
      500,
    );
  }
};
