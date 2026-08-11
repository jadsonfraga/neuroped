/**
 * GET/PATCH/DELETE /api/patients/:id
 * Dados identificáveis e clínicos em D1 usam envelope AES-GCM versionado.
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
  type PatientApiRecord,
  type PatientDatabaseRow,
  type PatientWriteField,
} from "./_contract";
import {
  clinicalCryptoErrorResponse,
  decryptClinicalPayload,
  encryptedLegacySentinel,
  encryptClinicalPayload,
  replaceClinicalSearchTokensStatements,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";
import { isPlainObject } from "../_request";

interface Env extends ClinicalCryptoEnv { DB?: D1Database }
interface SecurePatientRow extends PatientDatabaseRow { owner_user_id?: unknown; secure_payload_encrypted?: unknown }
interface SecurePatientPayload {
  name: string;
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  diagnosisCode: string | null;
  notes: string | null;
}
interface SecureConsultationRow {
  id: string; date: string; subjective: string | null; objective: string | null;
  assessment: string | null; plan: string | null; secure_payload_encrypted: string | null; created_at: string;
}
interface SecureScaleRow {
  id: string; scale_id: string; scale_name: string; details: string | null;
  secure_payload_encrypted: string | null; applied_at: string;
}

const DEMO_PATIENTS: Record<string, PatientApiRecord> = {
  "demo-001": { id: "demo-001", name: "Demo Paciente 1 — Fictício", birthDate: "2018-03-15", guardianName: "Responsável Demo 1", guardianPhone: "(81) 99000-0001", diagnosisCode: "F84.0", notes: "Dados fictícios de demonstração.", isDemo: true, createdAt: new Date("2025-01-10").toISOString(), updatedAt: new Date("2025-01-10").toISOString() },
  "demo-002": { id: "demo-002", name: "Demo Paciente 2 — Fictício", birthDate: "2016-07-22", guardianName: "Responsável Demo 2", guardianPhone: "(81) 99000-0002", diagnosisCode: "F90.0", notes: "Dados fictícios de demonstração.", isDemo: true, createdAt: new Date("2025-02-14").toISOString(), updatedAt: new Date("2025-02-14").toISOString() },
  "demo-003": { id: "demo-003", name: "Demo Paciente 3 — Fictício", birthDate: "2020-11-05", guardianName: "Responsável Demo 3", guardianPhone: "(81) 99000-0003", diagnosisCode: "G40.3", notes: "Dados fictícios de demonstração.", isDemo: true, createdAt: new Date("2025-03-01").toISOString(), updatedAt: new Date("2025-03-01").toISOString() },
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function errorResponse(message: string, code: string, status: number): Response { return jsonResponse({ error: message, code }, status); }
function patientIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id; return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim();
}
function invalidIdResponse(id: string): Response | null {
  if (!id) return errorResponse("ID do paciente não fornecido.", "MISSING_ID", 400);
  if (!isValidPatientId(id)) return errorResponse("ID do paciente inválido.", "INVALID_ID", 400);
  return null;
}
function nullable(value: unknown): string | null { return typeof value === "string" && value.length ? value : null; }
function legacyPatientPayload(row: SecurePatientRow): SecurePatientPayload {
  const name = nullable(row.name);
  return {
    name: name && name !== encryptedLegacySentinel() ? name : "",
    birthDate: nullable(row.birth_date), guardianName: nullable(row.guardian_name), guardianPhone: nullable(row.guardian_phone),
    diagnosisCode: nullable(row.diagnosis_code), notes: nullable(row.notes),
  };
}
async function decodePatient(env: Env, row: SecurePatientRow): Promise<{ api: PatientApiRecord; payload: SecurePatientPayload }> {
  const id = String(row.id ?? "");
  const legacy = legacyPatientPayload(row);
  const payload = await decryptClinicalPayload<SecurePatientPayload>(env, "patients_demo", id, nullable(row.secure_payload_encrypted), legacy.name ? JSON.stringify(legacy) : null);
  if (!payload?.name) throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  return { payload, api: {
    id, name: payload.name, birthDate: payload.birthDate ?? null, guardianName: payload.guardianName ?? null,
    guardianPhone: payload.guardianPhone ?? null, diagnosisCode: payload.diagnosisCode ?? null, notes: payload.notes ?? null,
    isDemo: row.is_demo === true || row.is_demo === 1 || row.is_demo === "1", createdAt: nullable(row.created_at), updatedAt: nullable(row.updated_at),
  }};
}
function parseScaleResponses(details: unknown): unknown[] {
  if (typeof details !== "string") return [];
  try { const parsed = JSON.parse(details); const responses = parsed?.responses ?? parsed?.answers; return Array.isArray(responses) ? responses : []; }
  catch { return []; }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = patientIdFrom(params); const invalidId = invalidIdResponse(id); if (invalidId) return invalidId;
  if (!env.DB) {
    const patient = DEMO_PATIENTS[id];
    if (!patient) return errorResponse("Paciente demo não encontrado.", "NOT_FOUND", 404);
    return jsonResponse({ ...patient, consultations: [], scaleResults: [], mode: "demo" });
  }
  const user = getContextUser(context); if (!user) return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  try {
    const access = await getPatientAccess(env.DB, id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return authorizationError("Você não tem acesso a este paciente.", "FORBIDDEN", 403);

    const patient = await env.DB.prepare(
      `SELECT id, owner_user_id, name, birth_date, guardian_name, guardian_phone, diagnosis_code, notes,
              secure_payload_encrypted, is_demo, created_at, updated_at
         FROM patients_demo WHERE id = ? AND is_demo = 1 LIMIT 1`,
    ).bind(id).first<SecurePatientRow>();
    if (!patient) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    const decodedPatient = await decodePatient(env, patient);

    const consultationsResult = await env.DB.prepare(
      `SELECT id, date, subjective, objective, assessment, plan, secure_payload_encrypted, created_at
         FROM consultations_demo WHERE patient_id = ? AND is_demo = 1 ORDER BY date DESC LIMIT 10`,
    ).bind(id).all<SecureConsultationRow>();
    const consultations = await Promise.all((consultationsResult.results ?? []).map(async (row) => {
      const payload = await decryptClinicalPayload<{ subjective: string | null; objective: string | null; assessment: string | null; plan: string | null }>(
        env, "consultations_demo", row.id, row.secure_payload_encrypted,
        JSON.stringify({ subjective: row.subjective, objective: row.objective, assessment: row.assessment, plan: row.plan }),
      );
      return { id: row.id, date: row.date, subjective: payload?.subjective ?? null, objective: payload?.objective ?? null, assessment: payload?.assessment ?? null, plan: payload?.plan ?? null, created_at: row.created_at };
    }));

    const scalesResult = await env.DB.prepare(
      `SELECT id, scale_id, scale_name, details, secure_payload_encrypted, applied_at
         FROM scale_results_demo WHERE patient_id = ? AND is_demo = 1 ORDER BY applied_at DESC LIMIT 20`,
    ).bind(id).all<SecureScaleRow>();
    const scaleResults = await Promise.all((scalesResult.results ?? []).map(async (row) => {
      const legacyName = row.scale_name !== encryptedLegacySentinel() ? row.scale_name : null;
      const payload = await decryptClinicalPayload<{ scaleName: string | null; details: string | null }>(
        env, "scale_results_demo", row.id, row.secure_payload_encrypted,
        JSON.stringify({ scaleName: legacyName, details: row.details }),
      );
      return { id: row.id, scaleId: row.scale_id, scaleName: payload?.scaleName ?? legacyName ?? "", responses: parseScaleResponses(payload?.details), createdAt: row.applied_at };
    }));

    return jsonResponse({ ...decodedPatient.api, consultations, scaleResults, mode: "db" });
  } catch (error) {
    const cryptoResponse = clinicalCryptoErrorResponse(error); if (cryptoResponse) return cryptoResponse;
    console.error("[patients/:id.GET] DB error:", error); return errorResponse("Erro ao buscar paciente.", "DB_ERROR", 500);
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const id = patientIdFrom(params); const invalidId = invalidIdResponse(id); if (invalidId) return invalidId;
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhum paciente foi atualizado.", "DB_REQUIRED", 503);
  const user = getContextUser(context); if (!user) return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) return authorizationError("Perfil sem permissão para atualizar pacientes.", "FORBIDDEN", 403);

  let parsed: unknown; try { parsed = await request.json(); } catch { return errorResponse("Corpo da requisição inválido ou não é JSON.", "INVALID_JSON", 400); }
  if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);
  const normalized = normalizePatientWrite(parsed, { requireName: false });
  if (!normalized.ok) return errorResponse(normalized.message, "VALIDATION_ERROR", 400);
  const entries = Object.entries(normalized.values) as Array<[PatientWriteField, string | null]>;
  if (!entries.length) return errorResponse("Nenhum campo válido para atualizar.", "NO_UPDATES", 400);

  try {
    const access = await getPatientAccess(env.DB, id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return authorizationError("Você não tem acesso a este paciente.", "FORBIDDEN", 403);
    const row = await env.DB.prepare(
      `SELECT id, owner_user_id, name, birth_date, guardian_name, guardian_phone, diagnosis_code, notes,
              secure_payload_encrypted, is_demo, created_at, updated_at
         FROM patients_demo WHERE id = ? AND is_demo = 1 LIMIT 1`,
    ).bind(id).first<SecurePatientRow>();
    if (!row) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    const current = (await decodePatient(env, row)).payload;
    const next: SecurePatientPayload = { ...current };
    for (const [field, value] of entries) {
      if (field === "name") next.name = value ?? current.name;
      if (field === "birth_date") next.birthDate = value;
      if (field === "guardian_name") next.guardianName = value;
      if (field === "guardian_phone") next.guardianPhone = value;
      if (field === "diagnosis_code") next.diagnosisCode = value;
      if (field === "notes") next.notes = value;
    }
    const encrypted = await encryptClinicalPayload(env, "patients_demo", id, next);
    const now = new Date().toISOString();
    const ownerClause = isAdmin(user) ? "" : "AND owner_user_id = ?";
    const ownerBinds = isAdmin(user) ? [] : [user.id];
    const update = env.DB.prepare(
      `UPDATE patients_demo SET name = ?, birth_date = NULL, guardian_name = NULL, guardian_phone = NULL,
        diagnosis_code = NULL, notes = NULL, secure_payload_encrypted = ?, updated_at = ?
       WHERE id = ? AND is_demo = 1 ${ownerClause}`,
    ).bind(encryptedLegacySentinel(), encrypted, now, id, ...ownerBinds);
    const tokenStatements = await replaceClinicalSearchTokensStatements(env.DB, env, {
      resourceType: "patient", resourceId: id, patientId: id, ownerUserId: access.ownerUserId,
      values: [next.name, next.guardianName, next.diagnosisCode],
    });
    const results = await env.DB.batch([update, ...tokenStatements]);
    if ((results[0]?.meta.changes ?? 0) !== 1) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    return jsonResponse({ id, name: next.name, birthDate: next.birthDate, guardianName: next.guardianName, guardianPhone: next.guardianPhone, diagnosisCode: next.diagnosisCode, notes: next.notes, isDemo: true, createdAt: nullable(row.created_at), updatedAt: now, updated: true });
  } catch (error) {
    const cryptoResponse = clinicalCryptoErrorResponse(error); if (cryptoResponse) return cryptoResponse;
    console.error("[patients/:id.PATCH] DB error:", error); return errorResponse("Erro ao atualizar paciente.", "DB_ERROR", 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const id = patientIdFrom(params); const invalidId = invalidIdResponse(id); if (invalidId) return invalidId;
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhum paciente foi removido.", "DB_REQUIRED", 503);
  const user = getContextUser(context); if (!user) return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) return authorizationError("Perfil sem permissão para remover pacientes.", "FORBIDDEN", 403);
  try {
    const access = await getPatientAccess(env.DB, id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return authorizationError("Você não tem acesso a este paciente.", "FORBIDDEN", 403);
    const ownerClause = isAdmin(user) ? "" : "AND owner_user_id = ?"; const ownerBinds = isAdmin(user) ? [] : [user.id];
    const statements = [
      env.DB.prepare("DELETE FROM clinical_search_tokens WHERE patient_id = ? OR (resource_type = 'patient' AND resource_id = ?)").bind(id, id),
      env.DB.prepare("DELETE FROM consultations_demo WHERE patient_id = ? AND is_demo = 1").bind(id),
      env.DB.prepare("DELETE FROM scale_results_demo WHERE patient_id = ? AND is_demo = 1").bind(id),
      env.DB.prepare("DELETE FROM documents_demo WHERE patient_id = ? AND is_demo = 1").bind(id),
      env.DB.prepare("DELETE FROM memory_notes WHERE patient_id = ?").bind(id),
      env.DB.prepare(`DELETE FROM patients_demo WHERE id = ? AND is_demo = 1 ${ownerClause}`).bind(id, ...ownerBinds),
    ];
    const results = await env.DB.batch(statements);
    if ((results[5]?.meta.changes ?? 0) !== 1) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? null;
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, action, resource, resource_id, user_id, ip, details, created_at)
       VALUES (?, 'patient.delete', 'patient', ?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), id, user.id, ip, JSON.stringify({ ownerUserId: access.ownerUserId, cascadedResources: ["consultations","scaleResults","documents","memoryNotes","blindIndexes"] }), new Date().toISOString()).run();
    return jsonResponse({ id, deleted: true });
  } catch (error) {
    console.error("[patients/:id.DELETE] DB error:", error); return errorResponse("Erro ao remover paciente.", "DB_ERROR", 500);
  }
};
