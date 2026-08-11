/**
 * GET/POST /api/documents — título e conteúdo cifrados em repouso no D1.
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
interface DocumentRow {
  id: string; patient_id: string; type: string; title: string; content: string | null;
  secure_payload_encrypted: string | null; is_family_visible: number; is_demo: number; created_at: string;
}
interface SecureDocumentPayload { title: string; content: string }

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function errorResponse(message: string, code: string, status: number): Response { return jsonResponse({ error: message, code }, status); }
const DOCUMENT_TYPES = ["laudo", "relatorio", "encaminhamento", "prescricao", "atestado", "orientacao"];
const DEMO_DOCS = [{ id: "doc-demo-001", patient_id: "demo-001", type: "laudo", title: "Laudo de Avaliação Neuropediátrica — Demo", content: "Este é um documento de demonstração. Conteúdo fictício para fins de teste da plataforma. Não representa avaliação clínica real.", is_family_visible: false, is_demo: true, created_at: new Date("2025-04-20").toISOString() }];

async function present(env: Env, row: DocumentRow) {
  const legacyTitle = row.title !== encryptedLegacySentinel() ? row.title : "";
  const payload = await decryptClinicalPayload<SecureDocumentPayload>(
    env, "documents_demo", row.id, row.secure_payload_encrypted,
    legacyTitle ? JSON.stringify({ title: legacyTitle, content: row.content ?? "" }) : null,
  );
  if (!payload?.title) throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  return { id: row.id, patient_id: row.patient_id, type: row.type, title: payload.title, content: payload.content, is_family_visible: Boolean(row.is_family_visible), is_demo: Boolean(row.is_demo), created_at: row.created_at };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context; const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id")?.trim(); const type = url.searchParams.get("type")?.trim();
  const rawFamilyOnly = url.searchParams.get("family_only"); const familyOnly = rawFamilyOnly === "true";
  if (patientId && !hasBoundedIdentifier(patientId)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (type && !DOCUMENT_TYPES.includes(type)) return errorResponse(`'type' deve ser um de: ${DOCUMENT_TYPES.join(", ")}`, "VALIDATION_ERROR", 400);
  if (rawFamilyOnly !== null && rawFamilyOnly !== "true" && rawFamilyOnly !== "false") return errorResponse("'family_only' deve ser true ou false.", "VALIDATION_ERROR", 400);
  if (!env.DB) {
    let results = DEMO_DOCS; if (patientId) results = results.filter((d) => d.patient_id === patientId); if (type) results = results.filter((d) => d.type === type);
    return jsonResponse({ data: results, total: results.length, mode: "demo" });
  }
  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (patientId) {
      const access = await getPatientAccess(env.DB, patientId, user);
      if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
      if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    }
    let sql = `SELECT d.id, d.patient_id, d.type, d.title, d.content, d.secure_payload_encrypted,
      d.is_family_visible, d.is_demo, d.created_at FROM documents_demo d WHERE d.is_demo = 1`;
    const binds: unknown[] = [];
    if (patientId) { sql += " AND d.patient_id = ?"; binds.push(patientId); }
    if (type) { sql += " AND d.type = ?"; binds.push(type); }
    if (familyOnly) sql += " AND d.is_family_visible = 1";
    if (!isAdmin(user)) { sql += " AND d.patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)"; binds.push(user.id); }
    sql += " ORDER BY d.created_at DESC LIMIT 50";
    const rows = await env.DB.prepare(sql).bind(...binds).all<DocumentRow>();
    const data = await Promise.all((rows.results ?? []).map((row) => present(env, row)));
    return jsonResponse({ data, total: data.length, mode: "db" });
  } catch (err) {
    const cryptoResponse = clinicalCryptoErrorResponse(err); if (cryptoResponse) return cryptoResponse;
    console.error("[documents.GET] DB error:", err); return errorResponse("Erro ao buscar documentos.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  let parsed: unknown; try { parsed = await request.json(); } catch { return errorResponse("Corpo da requisição inválido.", "INVALID_JSON", 400); }
  if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);
  const body = parsed;
  const patient_id = typeof body.patient_id === "string" ? body.patient_id.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!patient_id) return errorResponse("'patient_id' é obrigatório.", "VALIDATION_ERROR", 400);
  if (!hasBoundedIdentifier(patient_id)) return errorResponse("'patient_id' é inválido ou excede 128 caracteres.", "VALIDATION_ERROR", 400);
  if (!type || !DOCUMENT_TYPES.includes(type)) return errorResponse(`'type' deve ser um de: ${DOCUMENT_TYPES.join(", ")}`, "VALIDATION_ERROR", 400);
  if (!title || title.length < 3) return errorResponse("'title' é obrigatório (mín. 3 chars).", "VALIDATION_ERROR", 400);
  if (title.length > CLINICAL_INPUT_LIMITS.documentTitle) return errorResponse(`'title' deve ter no máximo ${CLINICAL_INPUT_LIMITS.documentTitle} caracteres.`, "VALIDATION_ERROR", 400);
  if (!content) return errorResponse("'content' é obrigatório.", "VALIDATION_ERROR", 400);
  if (content.length > CLINICAL_INPUT_LIMITS.documentContent) return errorResponse(`'content' deve ter no máximo ${CLINICAL_INPUT_LIMITS.documentContent} caracteres.`, "VALIDATION_ERROR", 400);
  if (body.is_family_visible != null && typeof body.is_family_visible !== "boolean") return errorResponse("'is_family_visible' deve ser booleano.", "VALIDATION_ERROR", 400);
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhum documento foi criado.", "DB_REQUIRED", 503);
  try {
    const user = getContextUser(context); if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (!canWriteClinicalData(user)) return errorResponse("Perfil sem permissão para criar documentos.", "FORBIDDEN", 403);
    const access = await getPatientAccess(env.DB, patient_id, user);
    if (!access.exists) return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    if (!access.allowed) return errorResponse("Sem permissão para este paciente.", "FORBIDDEN", 403);
    const id = createClinicalRecordId("doc"); const now = new Date().toISOString(); const is_family_visible = body.is_family_visible === true;
    const secure: SecureDocumentPayload = { title, content };
    const encrypted = await encryptClinicalPayload(env, "documents_demo", id, secure);
    const result = await env.DB.prepare(
      `INSERT INTO documents_demo
        (id, patient_id, type, title, content, secure_payload_encrypted, is_family_visible, is_demo, created_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, 1, ?)`,
    ).bind(id, patient_id, type, encryptedLegacySentinel(), encrypted, is_family_visible ? 1 : 0, now).run();
    if ((result.meta.changes ?? 0) !== 1) throw new Error("DOCUMENT_INSERT_FAILED");
    return jsonResponse({ id, patient_id, type, title, content, is_family_visible, is_demo: true, created_at: now }, 201);
  } catch (err) {
    const cryptoResponse = clinicalCryptoErrorResponse(err); if (cryptoResponse) return cryptoResponse;
    console.error("[documents.POST] DB error:", err); return errorResponse("Erro ao criar documento.", "DB_ERROR", 500);
  }
};
