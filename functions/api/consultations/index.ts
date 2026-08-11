/**
 * GET/POST /api/consultations — SOAP cifrado em repouso no D1.
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
  isValidIsoDate,
} from "../_clinicalValidation";
import {
  clinicalCryptoErrorResponse,
  decryptClinicalPayload,
  encryptClinicalPayload,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";
import { isPlainObject } from "../_request";

interface Env extends ClinicalCryptoEnv { DB?: D1Database }
interface ConsultationRow {
  id: string; patient_id: string; date: string; subjective: string | null; objective: string | null;
  assessment: string | null; plan: string | null; secure_payload_encrypted: string | null; is_demo: number; created_at: string;
}
interface ConsultationPayload { subjective: string | null; objective: string | null; assessment: string | null; plan: string | null }

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function errorResponse(message: string, code: string, status: number): Response { return jsonResponse({ error: message, code }, status); }

const DEMO_CONSULTATIONS = [
  { id: "cons-demo-001", patient_id: "demo-001", date: new Date("2025-04-10").toISOString(), subjective: "Mãe relata melhora na comunicação após terapia fonoaudiológica. (Demonstração)", objective: "Criança colaborativa, contato ocular mantido por períodos mais longos. (Demonstração)", assessment: "Evolução favorável em TEA leve. (Demonstração)", plan: "Manter fonoaudiologia 2x/semana. Reavaliação em 3 meses. (Demonstração)", is_demo: true, created_at: new Date("2025-04-10").toISOString() },
  { id: "cons-demo-002", patient_id: "demo-002", date: new Date("2025-04-15").toISOString(), subjective: "Responsável refere dificuldade de atenção persistente no ambiente escolar. (Demonstração)", objective: "Hiperatividade leve observada na consulta. Sem sinais de ansiedade. (Demonstração)", assessment: "TDAH combinado — revisão de medicação necessária. (Demonstração)", plan: "Ajuste de dose de metilfenidato. Contato com escola em 30 dias. (Demonstração)", is_demo: true, created_at: new Date("2025-04-15").toISOString() },
];

async function present(env: Env, row: ConsultationRow) {
  const payload = await decryptClinicalPayload<ConsultationPayload>(
    env, "consultations_demo", row.id, row.secure_payload_encrypted,
    JSON.stringify({ subjective: row.subjective, objective: row.objective, assessment: row.assessment, plan: row.plan }),
  );
  if (!payload) throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  return { id: row.id, patient_id: row.patient_id, date: row.date, ...payload, is_demo: Boolean(row.is_demo), created_at: row.created_at };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const patientId = new URL(request.url).searchParams.get("patient_id")?.trim();
  if (patientId && !hasBoundedIdentifier(patientId)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (!env.DB) {
    const results = patientId ? DEMO_CONSULTATIONS.filter((c) => c.patient_id === patientId) : DEMO_CONSULTATIONS;
    return jsonResponse({ data: results, total: results.length, mode: "demo" });
  }
  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (patientId) {
      const access = await getPatientAccess(env.DB, patientId, user);
      if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
      if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    }
    let whereClause = patientId ? "WHERE c.patient_id = ? AND c.is_demo = 1" : "WHERE c.is_demo = 1";
    const binds: unknown[] = patientId ? [patientId] : [];
    if (!isAdmin(user)) {
      whereClause += " AND c.patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)";
      binds.push(user.id);
    }
    const rows = await env.DB.prepare(
      `SELECT c.id, c.patient_id, c.date, c.subjective, c.objective, c.assessment, c.plan,
              c.secure_payload_encrypted, c.is_demo, c.created_at
         FROM consultations_demo c ${whereClause}
        ORDER BY c.date DESC LIMIT 50`,
    ).bind(...binds).all<ConsultationRow>();
    const data = await Promise.all((rows.results ?? []).map((row) => present(env, row)));
    return jsonResponse({ data, total: data.length, mode: "db" });
  } catch (err) {
    const cryptoResponse = clinicalCryptoErrorResponse(err); if (cryptoResponse) return cryptoResponse;
    console.error("[consultations.GET] DB error:", err); return errorResponse("Erro ao buscar consultas.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  let parsed: unknown; try { parsed = await request.json(); } catch { return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400); }
  if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);
  const body = parsed;
  const patient_id = typeof body.patient_id === "string" ? body.patient_id.trim() : "";
  if (body.date != null && typeof body.date !== "string") return errorResponse("'date' deve ser texto.", "VALIDATION_ERROR", 400);
  const clinicalFields = ["subjective", "objective", "assessment", "plan"] as const;
  for (const field of clinicalFields) if (body[field] != null && typeof body[field] !== "string") return errorResponse(`'${field}' deve ser texto ou nulo.`, "VALIDATION_ERROR", 400);
  const date = typeof body.date === "string" ? body.date.trim() : new Date().toISOString();
  if (!patient_id) return errorResponse("'patient_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!hasBoundedIdentifier(patient_id)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (!isValidIsoDate(date)) return errorResponse("'date' deve ser uma data ISO válida (YYYY-MM-DD) ou um instante ISO 8601 com timezone.", "VALIDATION_ERROR", 400);

  const sections: ConsultationPayload = { subjective: null, objective: null, assessment: null, plan: null };
  let totalSectionCharacters = 0;
  for (const field of clinicalFields) {
    const text = typeof body[field] === "string" ? body[field].trim() : "";
    if (text.length > CLINICAL_INPUT_LIMITS.consultationSection) return errorResponse(`'${field}' deve ter no máximo ${CLINICAL_INPUT_LIMITS.consultationSection} caracteres.`, "VALIDATION_ERROR", 400);
    totalSectionCharacters += text.length; sections[field] = text || null;
  }
  if (totalSectionCharacters > CLINICAL_INPUT_LIMITS.consultationTotal) return errorResponse(`Os campos clínicos devem somar no máximo ${CLINICAL_INPUT_LIMITS.consultationTotal} caracteres.`, "VALIDATION_ERROR", 400);
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhuma consulta foi registrada.", "DB_REQUIRED", 503);

  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (!canWriteClinicalData(user)) return errorResponse("Perfil sem permissão para registrar consultas.", "FORBIDDEN", 403);
    const access = await getPatientAccess(env.DB, patient_id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    const id = createClinicalRecordId("cons"); const now = new Date().toISOString();
    const encrypted = await encryptClinicalPayload(env, "consultations_demo", id, sections);
    const result = await env.DB.prepare(
      `INSERT INTO consultations_demo
        (id, patient_id, date, subjective, objective, assessment, plan, secure_payload_encrypted, is_demo, created_at)
       VALUES (?, ?, ?, NULL, NULL, NULL, NULL, ?, 1, ?)`,
    ).bind(id, patient_id, date, encrypted, now).run();
    if ((result.meta.changes ?? 0) !== 1) throw new Error("CONSULTATION_INSERT_FAILED");
    return jsonResponse({ id, patient_id, date, ...sections, is_demo: true, created_at: now }, 201);
  } catch (err) {
    const cryptoResponse = clinicalCryptoErrorResponse(err); if (cryptoResponse) return cryptoResponse;
    console.error("[consultations.POST] DB error:", err); return errorResponse("Erro ao registrar consulta.", "DB_ERROR", 500);
  }
};
