from pathlib import Path

Path('functions/api/consultations/index.ts').write_text(r'''/**
 * Consultas SOAP no D1: payload clínico cifrado em repouso.
 */
import type { ClinicalCryptoEnv } from "../_clinicalCrypto";
import { ClinicalCryptoError } from "../_clinicalCrypto";
import { consultationStorage, readConsultationPayload } from "../_clinicalRecords";
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
import { isPlainObject } from "../_request";

interface Env extends ClinicalCryptoEnv { DB?: D1Database }

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function errorResponse(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code }, status);
}
function cryptoError(error: unknown): Response | null {
  if (!(error instanceof ClinicalCryptoError)) return null;
  return errorResponse(error.message, error.code, 503);
}

const DEMO_CONSULTATIONS = [
  { id: "cons-demo-001", patient_id: "demo-001", date: new Date("2025-04-10").toISOString(), subjective: "Mãe relata melhora na comunicação após terapia fonoaudiológica. (Demonstração)", objective: "Criança colaborativa, contato ocular mantido por períodos mais longos. (Demonstração)", assessment: "Evolução favorável em TEA leve. (Demonstração)", plan: "Manter fonoaudiologia 2x/semana. Reavaliação em 3 meses. (Demonstração)", is_demo: true, created_at: new Date("2025-04-10").toISOString() },
  { id: "cons-demo-002", patient_id: "demo-002", date: new Date("2025-04-15").toISOString(), subjective: "Responsável refere dificuldade de atenção persistente no ambiente escolar. (Demonstração)", objective: "Hiperatividade leve observada na consulta. Sem sinais de ansiedade. (Demonstração)", assessment: "TDAH combinado — revisão de medicação necessária. (Demonstração)", plan: "Ajuste de dose de metilfenidato. Contato com escola em 30 dias. (Demonstração)", is_demo: true, created_at: new Date("2025-04-15").toISOString() },
];

async function present(env: Env, row: Record<string, unknown>) {
  const secure = await readConsultationPayload(env, row);
  return {
    id: row.id,
    patient_id: row.patient_id,
    date: row.date,
    ...secure,
    is_demo: row.is_demo === 1 || row.is_demo === true,
    created_at: row.created_at,
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const patientId = new URL(request.url).searchParams.get("patient_id")?.trim();
  if (patientId && !hasBoundedIdentifier(patientId)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (!env.DB) {
    const results = patientId ? DEMO_CONSULTATIONS.filter((item) => item.patient_id === patientId) : DEMO_CONSULTATIONS;
    return jsonResponse({ data: results, total: results.length, mode: "demo" });
  }
  try {
    const user = getContextUser(context);
    if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (patientId) {
      const access = await getPatientAccess(env.DB, patientId, user);
      if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
      if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    }
    let whereClause = patientId ? "WHERE patient_id = ? AND is_demo = 1" : "WHERE is_demo = 1";
    const binds: unknown[] = patientId ? [patientId] : [];
    if (!isAdmin(user)) {
      whereClause += " AND patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)";
      binds.push(user.id);
    }
    const rows = await env.DB.prepare(
      `SELECT id, patient_id, date, subjective, objective, assessment, plan, is_demo, created_at
         FROM consultations_demo ${whereClause} ORDER BY date DESC LIMIT 50`,
    ).bind(...binds).all<Record<string, unknown>>();
    const data = await Promise.all((rows.results ?? []).map((row) => present(env, row)));
    return jsonResponse({ data, total: data.length, mode: "db" });
  } catch (error) {
    const response = cryptoError(error); if (response) return response;
    console.error("[consultations.GET] DB error");
    return errorResponse("Erro ao buscar consultas.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  let parsed: unknown;
  try { parsed = await request.json(); } catch { return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400); }
  if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);
  const body = parsed;
  const patient_id = typeof body.patient_id === "string" ? body.patient_id.trim() : "";
  if (body.date != null && typeof body.date !== "string") return errorResponse("'date' deve ser texto.", "VALIDATION_ERROR", 400);
  const clinicalFields = ["subjective", "objective", "assessment", "plan"] as const;
  for (const field of clinicalFields) if (body[field] != null && typeof body[field] !== "string") return errorResponse(`'${field}' deve ser texto ou nulo.`, "VALIDATION_ERROR", 400);
  const date = typeof body.date === "string" ? body.date.trim() : new Date().toISOString();
  if (!patient_id || !hasBoundedIdentifier(patient_id)) return errorResponse("'patient_id' é obrigatório e deve ser válido.", "VALIDATION_ERROR", 400);
  if (!isValidIsoDate(date)) return errorResponse("'date' deve ser uma data ISO válida ou instante ISO 8601 com timezone.", "VALIDATION_ERROR", 400);
  const sections = { subjective: null as string | null, objective: null as string | null, assessment: null as string | null, plan: null as string | null };
  let total = 0;
  for (const field of clinicalFields) {
    const text = typeof body[field] === "string" ? body[field].trim() : "";
    if (text.length > CLINICAL_INPUT_LIMITS.consultationSection) return errorResponse(`'${field}' deve ter no máximo ${CLINICAL_INPUT_LIMITS.consultationSection} caracteres.`, "VALIDATION_ERROR", 400);
    total += text.length; sections[field] = text || null;
  }
  if (total > CLINICAL_INPUT_LIMITS.consultationTotal) return errorResponse(`Os campos clínicos devem somar no máximo ${CLINICAL_INPUT_LIMITS.consultationTotal} caracteres.`, "VALIDATION_ERROR", 400);
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhuma consulta foi registrada.", "DB_REQUIRED", 503);
  const id = createClinicalRecordId("cons");
  const now = new Date().toISOString();
  try {
    const user = getContextUser(context);
    if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (!canWriteClinicalData(user)) return errorResponse("Perfil sem permissão para registrar consultas.", "FORBIDDEN", 403);
    const access = await getPatientAccess(env.DB, patient_id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    const envelope = await consultationStorage(env, id, patient_id, sections);
    await env.DB.prepare(
      `INSERT INTO consultations_demo (id, patient_id, date, subjective, objective, assessment, plan, is_demo, created_at)
       VALUES (?, ?, ?, ?, NULL, NULL, NULL, 1, ?)`,
    ).bind(id, patient_id, date, envelope, now).run();
    return jsonResponse({ id, patient_id, date, ...sections, is_demo: true, created_at: now }, 201);
  } catch (error) {
    const response = cryptoError(error); if (response) return response;
    console.error("[consultations.POST] DB error");
    return errorResponse("Erro ao registrar consulta.", "DB_ERROR", 500);
  }
};
''')

Path('functions/api/documents/index.ts').write_text(r'''/** Documentos clínicos cifrados em repouso. */
import type { ClinicalCryptoEnv } from "../_clinicalCrypto";
import { ClinicalCryptoError } from "../_clinicalCrypto";
import { documentStorage, readDocumentPayload } from "../_clinicalRecords";
import { canWriteClinicalData, getContextUser, getPatientAccess, isAdmin } from "../auth/_authorization";
import { CLINICAL_INPUT_LIMITS, createClinicalRecordId, hasBoundedIdentifier } from "../_clinicalValidation";
import { isPlainObject } from "../_request";
interface Env extends ClinicalCryptoEnv { DB?: D1Database }
function jsonResponse(data: unknown, status = 200): Response { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
function errorResponse(message: string, code: string, status: number): Response { return jsonResponse({ error: message, code }, status); }
function cryptoError(error: unknown): Response | null { return error instanceof ClinicalCryptoError ? errorResponse(error.message, error.code, 503) : null; }
const DOCUMENT_TYPES = ["laudo", "relatorio", "encaminhamento", "prescricao", "atestado", "orientacao"];
const DEMO_DOCS = [{ id: "doc-demo-001", patient_id: "demo-001", type: "laudo", title: "Laudo de Avaliação Neuropediátrica — Demo", content: "Este é um documento de demonstração. Conteúdo fictício para fins de teste da plataforma. Não representa avaliação clínica real.", is_family_visible: false, is_demo: true, created_at: new Date("2025-04-20").toISOString() }];
async function present(env: Env, row: Record<string, unknown>) { const secure = await readDocumentPayload(env, row); return { id: row.id, patient_id: row.patient_id, type: row.type, ...secure, is_family_visible: row.is_family_visible === 1 || row.is_family_visible === true, is_demo: row.is_demo === 1 || row.is_demo === true, created_at: row.created_at }; }
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context; const url = new URL(request.url); const patientId = url.searchParams.get("patient_id")?.trim(); const type = url.searchParams.get("type")?.trim(); const rawFamilyOnly = url.searchParams.get("family_only"); const familyOnly = rawFamilyOnly === "true";
  if (patientId && !hasBoundedIdentifier(patientId)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (type && !DOCUMENT_TYPES.includes(type)) return errorResponse(`'type' deve ser um de: ${DOCUMENT_TYPES.join(", ")}`, "VALIDATION_ERROR", 400);
  if (rawFamilyOnly !== null && rawFamilyOnly !== "true" && rawFamilyOnly !== "false") return errorResponse("'family_only' deve ser true ou false.", "VALIDATION_ERROR", 400);
  if (!env.DB) { let results = DEMO_DOCS; if (patientId) results = results.filter((item) => item.patient_id === patientId); if (type) results = results.filter((item) => item.type === type); return jsonResponse({ data: results, total: results.length, mode: "demo" }); }
  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (patientId) { const access = await getPatientAccess(env.DB, patientId, user); if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404); if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403); }
    let sql = "SELECT id, patient_id, type, title, content, is_family_visible, is_demo, created_at FROM documents_demo WHERE is_demo = 1"; const binds: unknown[] = [];
    if (patientId) { sql += " AND patient_id = ?"; binds.push(patientId); } if (type) { sql += " AND type = ?"; binds.push(type); } if (familyOnly) sql += " AND is_family_visible = 1"; if (!isAdmin(user)) { sql += " AND patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)"; binds.push(user.id); } sql += " ORDER BY created_at DESC LIMIT 50";
    const rows = await env.DB.prepare(sql).bind(...binds).all<Record<string, unknown>>(); const data = await Promise.all((rows.results ?? []).map((row) => present(env, row))); return jsonResponse({ data, total: data.length, mode: "db" });
  } catch (error) { const response = cryptoError(error); if (response) return response; console.error("[documents.GET] DB error"); return errorResponse("Erro ao buscar documentos.", "DB_ERROR", 500); }
};
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context; let parsed: unknown; try { parsed = await request.json(); } catch { return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400); } if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400); const body = parsed;
  const patient_id = typeof body.patient_id === "string" ? body.patient_id.trim() : ""; const type = typeof body.type === "string" ? body.type.trim() : ""; const title = typeof body.title === "string" ? body.title.trim() : ""; const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!patient_id || !hasBoundedIdentifier(patient_id)) return errorResponse("'patient_id' é obrigatório e deve ser válido.", "VALIDATION_ERROR", 400); if (!type || !DOCUMENT_TYPES.includes(type)) return errorResponse(`'type' deve ser um de: ${DOCUMENT_TYPES.join(", ")}`, "VALIDATION_ERROR", 400); if (title.length < 3 || title.length > CLINICAL_INPUT_LIMITS.documentTitle) return errorResponse("'title' é inválido.", "VALIDATION_ERROR", 400); if (!content || content.length > CLINICAL_INPUT_LIMITS.documentContent) return errorResponse("'content' é inválido.", "VALIDATION_ERROR", 400); if (body.is_family_visible != null && typeof body.is_family_visible !== "boolean") return errorResponse("'is_family_visible' deve ser booleano.", "VALIDATION_ERROR", 400);
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhum documento foi criado.", "DB_REQUIRED", 503);
  const id = createClinicalRecordId("doc"); const now = new Date().toISOString(); const is_family_visible = body.is_family_visible === true;
  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401); if (!canWriteClinicalData(user)) return errorResponse("Perfil sem permissão para criar documentos.", "FORBIDDEN", 403); const access = await getPatientAccess(env.DB, patient_id, user); if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404); if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    const envelope = await documentStorage(env, id, patient_id, { title, content });
    await env.DB.prepare(`INSERT INTO documents_demo (id, patient_id, type, title, content, is_family_visible, is_demo, created_at) VALUES (?, ?, ?, '[encrypted]', ?, ?, 1, ?)`).bind(id, patient_id, type, envelope, is_family_visible ? 1 : 0, now).run();
    return jsonResponse({ id, patient_id, type, title, content, is_family_visible, is_demo: true, created_at: now }, 201);
  } catch (error) { const response = cryptoError(error); if (response) return response; console.error("[documents.POST] DB error"); return errorResponse("Erro ao criar documento.", "DB_ERROR", 500); }
};
''')

Path('functions/api/results.ts').write_text(r'''/** POST /api/results — resultado de escala cifrado quando vinculado a paciente. */
import type { ClinicalCryptoEnv } from "./_clinicalCrypto";
import { ClinicalCryptoError } from "./_clinicalCrypto";
import { scaleStorage } from "./_clinicalRecords";
import { canWriteClinicalData, getContextUser, getPatientAccess } from "./auth/_authorization";
import { CLINICAL_INPUT_LIMITS, createClinicalRecordId, hasBoundedIdentifier, isValidIsoDateTime, normalizeClinicalResponses } from "./_clinicalValidation";
import { isPlainObject } from "./_request";
interface Env extends ClinicalCryptoEnv { DB?: D1Database }
function json(data: unknown, status = 200): Response { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
function slug(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "escala"; }
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context; let parsed: unknown; try { parsed = await request.json(); } catch { return json({ error: "Corpo da requisição inválido.", code: "INVALID_JSON" }, 400); } if (!isPlainObject(parsed)) return json({ error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" }, 400); const body = parsed;
  const rawPatientId = body.patientId ?? body.patient_id; if (rawPatientId != null && typeof rawPatientId !== "string") return json({ error: "'patientId' deve ser texto.", code: "VALIDATION_ERROR" }, 400); const patient_id = rawPatientId?.trim() ?? ""; if (patient_id && !hasBoundedIdentifier(patient_id)) return json({ error: "'patientId' é inválido ou excede 128 caracteres.", code: "VALIDATION_ERROR" }, 400);
  const rawScaleName = body.scaleName ?? body.scale_name; if (rawScaleName != null && typeof rawScaleName !== "string") return json({ error: "'scaleName' deve ser texto.", code: "VALIDATION_ERROR" }, 400); const scale_name = rawScaleName?.trim() || "Escala"; if (scale_name.length > CLINICAL_INPUT_LIMITS.scaleName) return json({ error: "'scaleName' excede o limite.", code: "VALIDATION_ERROR" }, 400); const rawScaleId = body.scaleId ?? body.scale_id; if (rawScaleId != null && typeof rawScaleId !== "string") return json({ error: "'scaleId' deve ser texto.", code: "VALIDATION_ERROR" }, 400); const scale_id = rawScaleId?.trim() || slug(scale_name); if (!hasBoundedIdentifier(scale_id)) return json({ error: "'scaleId' é inválido.", code: "VALIDATION_ERROR" }, 400);
  const normalized = normalizeClinicalResponses(body.responses ?? body.answers); if (!normalized.ok) return json({ error: normalized.message, code: normalized.code }, 400); const responses = normalized.responses;
  if (body.patientAge != null && typeof body.patientAge !== "string" && typeof body.patientAge !== "number") return json({ error: "'patientAge' deve ser texto ou número.", code: "VALIDATION_ERROR" }, 400); if ((typeof body.patientAge === "string" && body.patientAge.trim().length > 80) || (typeof body.patientAge === "number" && (!Number.isFinite(body.patientAge) || body.patientAge < 0 || body.patientAge > 130))) return json({ error: "'patientAge' é inválido.", code: "VALIDATION_ERROR" }, 400);
  const details = JSON.stringify({ responses, patientAge: typeof body.patientAge === "string" ? body.patientAge.trim() || null : body.patientAge ?? null }); const id = createClinicalRecordId("scale"); if (body.applied_at != null && typeof body.applied_at !== "string") return json({ error: "'applied_at' deve ser texto.", code: "VALIDATION_ERROR" }, 400); const applied_at = body.applied_at?.trim() || new Date().toISOString(); if (!isValidIsoDateTime(applied_at)) return json({ error: "'applied_at' deve ser um instante ISO 8601 válido com timezone.", code: "VALIDATION_ERROR" }, 400);
  const payload = { id, patient_id, scale_id, scale_name, responses, applied_at };
  if (!patient_id) return json({ ...payload, stored: false, note: "Resultado não vinculado a paciente — não persistido." }, 200);
  if (!env.DB) return json({ error: "Persistência indisponível. Nenhum resultado foi registrado.", code: "DB_REQUIRED" }, 503);
  try {
    const user = getContextUser(context); if (!user) return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401); if (!canWriteClinicalData(user)) return json({ error: "Perfil sem permissão para registrar resultados.", code: "FORBIDDEN" }, 403); const access = await getPatientAccess(env.DB, patient_id, user); if (!access.exists) return json({ error: "Paciente não encontrado.", code: "NOT_FOUND" }, 404); if (!access.allowed) return json({ error: "Sem permissão para este paciente.", code: "FORBIDDEN" }, 403);
    const envelope = await scaleStorage(env, id, patient_id, { score: null, interpretation: null, details });
    await env.DB.prepare(`INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, score, interpretation, details, is_demo, applied_at) VALUES (?, ?, ?, ?, NULL, NULL, ?, 1, ?)`).bind(id, patient_id, scale_id, scale_name, envelope, applied_at).run();
    return json({ ...payload, mode: "db" }, 201);
  } catch (error) { if (error instanceof ClinicalCryptoError) return json({ error: error.message, code: error.code }, 503); console.error("[results.POST] DB error"); return json({ error: "Erro ao registrar resultado.", code: "DB_ERROR" }, 500); }
};
''')

Path('functions/api/scales/results.ts').write_text(r'''/** GET/POST de resultados de escalas com detalhes cifrados em repouso. */
import type { ClinicalCryptoEnv } from "../_clinicalCrypto";
import { ClinicalCryptoError } from "../_clinicalCrypto";
import { readScalePayload, scaleStorage } from "../_clinicalRecords";
import { canWriteClinicalData, getContextUser, getPatientAccess, isAdmin } from "../auth/_authorization";
import { CLINICAL_INPUT_LIMITS, createClinicalRecordId, hasBoundedIdentifier, isValidIsoDateTime, normalizeClinicalResponses } from "../_clinicalValidation";
import { isPlainObject } from "../_request";
interface Env extends ClinicalCryptoEnv { DB?: D1Database }
function jsonResponse(data: unknown, status = 200): Response { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
function errorResponse(message: string, code: string, status: number): Response { return jsonResponse({ error: message, code }, status); }
function responsesFromDetails(details: string | null): unknown[] { if (!details) return []; try { const parsed = JSON.parse(details); const normalized = normalizeClinicalResponses(parsed?.responses ?? parsed?.answers); return normalized.ok ? normalized.responses : []; } catch { return []; } }
async function present(env: Env, row: Record<string, unknown>) { const secure = await readScalePayload(env, row); return { id: row.id, patient_id: row.patient_id, scale_id: row.scale_id, scale_name: row.scale_name, responses: responsesFromDetails(secure.details), is_demo: row.is_demo === 1 || row.is_demo === true, applied_at: row.applied_at }; }
const DEMO_RESULTS = [{ id: "scale-demo-001", patient_id: "demo-001", scale_id: "mchat", scale_name: "M-CHAT-R/F", details: JSON.stringify({ responses: [{ question: "Exemplo demonstrativo 1", answer: "Sim" }, { question: "Exemplo demonstrativo 2", answer: "Não" }] }), is_demo: true, applied_at: new Date("2025-04-05").toISOString() }, { id: "scale-demo-002", patient_id: "demo-002", scale_id: "snap-iv", scale_name: "SNAP-IV", details: JSON.stringify({ responses: [{ question: "Exemplo demonstrativo 1", answer: "Bastante" }, { question: "Exemplo demonstrativo 2", answer: "Nem um pouco" }] }), is_demo: true, applied_at: new Date("2025-04-12").toISOString() }];
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context; const url = new URL(request.url); const patientId = url.searchParams.get("patient_id")?.trim(); const scaleId = url.searchParams.get("scale_id")?.trim(); if (patientId && !hasBoundedIdentifier(patientId)) return errorResponse("'patient_id' é inválido.", "VALIDATION_ERROR", 400); if (scaleId && !hasBoundedIdentifier(scaleId)) return errorResponse("'scale_id' é inválido.", "VALIDATION_ERROR", 400);
  if (!env.DB) { let results = DEMO_RESULTS; if (patientId) results = results.filter((item) => item.patient_id === patientId); if (scaleId) results = results.filter((item) => item.scale_id === scaleId); const data = results.map((row) => ({ id: row.id, patient_id: row.patient_id, scale_id: row.scale_id, scale_name: row.scale_name, responses: responsesFromDetails(row.details), is_demo: row.is_demo, applied_at: row.applied_at })); return jsonResponse({ data, total: data.length, mode: "demo" }); }
  try { const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401); if (patientId) { const access = await getPatientAccess(env.DB, patientId, user); if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404); if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403); } let sql = "SELECT id, patient_id, scale_id, scale_name, score, interpretation, details, applied_at, is_demo FROM scale_results_demo WHERE is_demo = 1"; const binds: unknown[] = []; if (patientId) { sql += " AND patient_id = ?"; binds.push(patientId); } if (scaleId) { sql += " AND scale_id = ?"; binds.push(scaleId); } if (!isAdmin(user)) { sql += " AND patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)"; binds.push(user.id); } sql += " ORDER BY applied_at DESC LIMIT 50"; const rows = await env.DB.prepare(sql).bind(...binds).all<Record<string, unknown>>(); const data = await Promise.all((rows.results ?? []).map((row) => present(env, row))); return jsonResponse({ data, total: data.length, mode: "db" }); } catch (error) { if (error instanceof ClinicalCryptoError) return errorResponse(error.message, error.code, 503); console.error("[scales/results.GET] DB error"); return errorResponse("Erro ao buscar resultados.", "DB_ERROR", 500); }
};
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context; let parsed: unknown; try { parsed = await request.json(); } catch { return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400); } if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400); const body = parsed; const patient_id = typeof body.patient_id === "string" ? body.patient_id.trim() : ""; const scale_id = typeof body.scale_id === "string" ? body.scale_id.trim() : ""; const scale_name = typeof body.scale_name === "string" ? body.scale_name.trim() : "";
  if (!patient_id || !hasBoundedIdentifier(patient_id) || !scale_id || !hasBoundedIdentifier(scale_id) || !scale_name || scale_name.length > CLINICAL_INPUT_LIMITS.scaleName) return errorResponse("Identificação da escala/paciente inválida.", "VALIDATION_ERROR", 400); const normalized = normalizeClinicalResponses(body.responses ?? body.answers); if (!normalized.ok) return errorResponse(normalized.message, normalized.code, 400); const responses = normalized.responses; const id = createClinicalRecordId("scale"); if (body.applied_at != null && typeof body.applied_at !== "string") return errorResponse("'applied_at' deve ser texto.", "VALIDATION_ERROR", 400); const applied_at = body.applied_at?.trim() || new Date().toISOString(); if (!isValidIsoDateTime(applied_at)) return errorResponse("'applied_at' deve ser ISO 8601 com timezone.", "VALIDATION_ERROR", 400); if (!env.DB) return errorResponse("Persistência indisponível. Nenhum resultado foi registrado.", "DB_REQUIRED", 503); const details = JSON.stringify({ responses });
  try { const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401); if (!canWriteClinicalData(user)) return errorResponse("Perfil sem permissão para registrar resultados.", "FORBIDDEN", 403); const access = await getPatientAccess(env.DB, patient_id, user); if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404); if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403); const envelope = await scaleStorage(env, id, patient_id, { score: null, interpretation: null, details }); await env.DB.prepare(`INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, score, interpretation, details, is_demo, applied_at) VALUES (?, ?, ?, ?, NULL, NULL, ?, 1, ?)`).bind(id, patient_id, scale_id, scale_name, envelope, applied_at).run(); return jsonResponse({ id, patient_id, scale_id, scale_name, responses, details, is_demo: true, applied_at }, 201); } catch (error) { if (error instanceof ClinicalCryptoError) return errorResponse(error.message, error.code, 503); console.error("[scales/results.POST] DB error"); return errorResponse("Erro ao registrar resultado.", "DB_ERROR", 500); }
};
''')

print('encrypted endpoint patch prepared')
