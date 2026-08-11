/**
 * POST/GET /api/scales/results — respostas integrais cifradas no D1.
 */

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
import {
  clinicalCryptoErrorResponse,
  decryptClinicalPayload,
  encryptedLegacySentinel,
  encryptClinicalPayload,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";
import { isPlainObject } from "../_request";

interface Env extends ClinicalCryptoEnv { DB?: D1Database }
interface ScaleRow {
  id: string; patient_id: string; scale_id: string; scale_name: string; score: number | null;
  interpretation: string | null; details: string | null; secure_payload_encrypted: string | null;
  applied_at: string; is_demo: number;
}
interface SecureScalePayload { scaleName: string; score: number | null; interpretation: string | null; details: string }

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function errorResponse(message: string, code: string, status: number): Response { return jsonResponse({ error: message, code }, status); }

function responsesFromDetails(details: string | null | undefined): unknown[] {
  if (!details) return [];
  try {
    const parsed = JSON.parse(details);
    const normalized = normalizeClinicalResponses(parsed?.responses ?? parsed?.answers);
    return normalized.ok ? normalized.responses : [];
  } catch { return []; }
}

async function presentResult(env: Env, row: ScaleRow) {
  const legacyName = row.scale_name !== encryptedLegacySentinel() ? row.scale_name : "";
  const legacyPayload: SecureScalePayload = { scaleName: legacyName, score: row.score, interpretation: row.interpretation, details: row.details ?? JSON.stringify({ responses: [] }) };
  const payload = await decryptClinicalPayload<SecureScalePayload>(
    env, "scale_results_demo", row.id, row.secure_payload_encrypted,
    legacyName ? JSON.stringify(legacyPayload) : null,
  );
  if (!payload?.scaleName) throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  return {
    id: row.id, patient_id: row.patient_id, scale_id: row.scale_id, scale_name: payload.scaleName,
    responses: responsesFromDetails(payload.details), is_demo: Boolean(row.is_demo), applied_at: row.applied_at,
  };
}

const DEMO_RESULTS = [
  { id: "scale-demo-001", patient_id: "demo-001", scale_id: "mchat", scale_name: "M-CHAT-R/F", responses: [{ question: "Exemplo demonstrativo 1", answer: "Sim" }, { question: "Exemplo demonstrativo 2", answer: "Não" }], is_demo: true, applied_at: new Date("2025-04-05").toISOString() },
  { id: "scale-demo-002", patient_id: "demo-002", scale_id: "snap-iv", scale_name: "SNAP-IV", responses: [{ question: "Exemplo demonstrativo 1", answer: "Bastante" }, { question: "Exemplo demonstrativo 2", answer: "Nem um pouco" }], is_demo: true, applied_at: new Date("2025-04-12").toISOString() },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url); const patientId = url.searchParams.get("patient_id")?.trim(); const scaleId = url.searchParams.get("scale_id")?.trim();
  if (patientId && !hasBoundedIdentifier(patientId)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (scaleId && !hasBoundedIdentifier(scaleId)) return errorResponse("'scale_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (!env.DB) {
    let results = DEMO_RESULTS; if (patientId) results = results.filter((r) => r.patient_id === patientId); if (scaleId) results = results.filter((r) => r.scale_id === scaleId);
    return jsonResponse({ data: results, total: results.length, mode: "demo" });
  }
  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (patientId) {
      const access = await getPatientAccess(env.DB, patientId, user);
      if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
      if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    }
    let sql = `SELECT s.id, s.patient_id, s.scale_id, s.scale_name, s.score, s.interpretation, s.details,
      s.secure_payload_encrypted, s.applied_at, s.is_demo FROM scale_results_demo s WHERE s.is_demo = 1`;
    const binds: unknown[] = [];
    if (patientId) { sql += " AND s.patient_id = ?"; binds.push(patientId); }
    if (scaleId) { sql += " AND s.scale_id = ?"; binds.push(scaleId); }
    if (!isAdmin(user)) { sql += " AND s.patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)"; binds.push(user.id); }
    sql += " ORDER BY s.applied_at DESC LIMIT 50";
    const rows = await env.DB.prepare(sql).bind(...binds).all<ScaleRow>();
    const data = await Promise.all((rows.results ?? []).map((row) => presentResult(env, row)));
    return jsonResponse({ data, total: data.length, mode: "db" });
  } catch (err) {
    const cryptoResponse = clinicalCryptoErrorResponse(err); if (cryptoResponse) return cryptoResponse;
    console.error("[scales/results.GET] DB error:", err); return errorResponse("Erro ao buscar resultados.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  let parsed: unknown; try { parsed = await request.json(); } catch { return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400); }
  if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);
  const body = parsed;
  const patient_id = typeof body.patient_id === "string" ? body.patient_id.trim() : "";
  const scale_id = typeof body.scale_id === "string" ? body.scale_id.trim() : "";
  const scale_name = typeof body.scale_name === "string" ? body.scale_name.trim() : "";
  if (!patient_id) return errorResponse("'patient_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!scale_id) return errorResponse("'scale_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!scale_name) return errorResponse("'scale_name' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!hasBoundedIdentifier(patient_id)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (!hasBoundedIdentifier(scale_id)) return errorResponse("'scale_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (scale_name.length > CLINICAL_INPUT_LIMITS.scaleName) return errorResponse(`'scale_name' deve ter no máximo ${CLINICAL_INPUT_LIMITS.scaleName} caracteres.`, "VALIDATION_ERROR", 400);
  const normalizedResponses = normalizeClinicalResponses(body.responses ?? body.answers);
  if (!normalizedResponses.ok) return errorResponse(normalizedResponses.message, normalizedResponses.code, 400);
  if (body.applied_at != null && typeof body.applied_at !== "string") return errorResponse("'applied_at' deve ser texto.", "VALIDATION_ERROR", 400);
  const applied_at = typeof body.applied_at === "string" && body.applied_at.trim() ? body.applied_at.trim() : new Date().toISOString();
  if (!isValidIsoDateTime(applied_at)) return errorResponse("'applied_at' deve ser um instante ISO 8601 válido com timezone.", "VALIDATION_ERROR", 400);
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhum resultado foi registrado.", "DB_REQUIRED", 503);

  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (!canWriteClinicalData(user)) return errorResponse("Perfil sem permissão para registrar resultados.", "FORBIDDEN", 403);
    const access = await getPatientAccess(env.DB, patient_id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    const id = createClinicalRecordId("scale");
    const details = JSON.stringify({ responses: normalizedResponses.responses });
    const secure: SecureScalePayload = { scaleName: scale_name, score: null, interpretation: null, details };
    const encrypted = await encryptClinicalPayload(env, "scale_results_demo", id, secure);
    const result = await env.DB.prepare(
      `INSERT INTO scale_results_demo
        (id, patient_id, scale_id, scale_name, score, interpretation, details, secure_payload_encrypted, is_demo, applied_at)
       VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?, 1, ?)`,
    ).bind(id, patient_id, scale_id, encryptedLegacySentinel(), encrypted, applied_at).run();
    if ((result.meta.changes ?? 0) !== 1) throw new Error("SCALE_RESULT_INSERT_FAILED");
    return jsonResponse({ id, patient_id, scale_id, scale_name, responses: normalizedResponses.responses, is_demo: true, applied_at }, 201);
  } catch (err) {
    const cryptoResponse = clinicalCryptoErrorResponse(err); if (cryptoResponse) return cryptoResponse;
    console.error("[scales/results.POST] DB error:", err); return errorResponse("Erro ao registrar resultado.", "DB_ERROR", 500);
  }
};
