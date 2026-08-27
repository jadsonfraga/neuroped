import { clinicalCryptoReady, encryptClinicalJson } from "../tenant/_crypto";
import { tenantError, tenantJson, type TenantEnv } from "../tenant/_core";

const MAX_PAYLOAD_BYTES = 100_000;
function text(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function object(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
async function hashToken(token: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }

async function load(db: D1Database, token: string) {
  const hash = await hashToken(token);
  return db.prepare(`SELECT id, clinic_id, patient_id, status, expires_at, payload_encrypted, encryption_version FROM live_previsit_submissions WHERE token_hash = ? LIMIT 1`).bind(hash).first<{ id: string; clinic_id: string; patient_id: string; status: string; expires_at: string; payload_encrypted: string | null; encryption_version: string | null }>();
}

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; if (!db) return tenantError("Pré-consulta indisponível.", "DB_REQUIRED", 503); if (!clinicalCryptoReady(context.env)) return tenantError("Pré-consulta indisponível.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  let body: Record<string, unknown>; try { const parsed = await context.request.json(); if (!object(parsed)) return tenantError("JSON inválido.", "INVALID_JSON", 400); body = parsed; } catch { return tenantError("JSON inválido.", "INVALID_JSON", 400); }
  const token = text(body.token, 256); const action = text(body.action, 20) || "inspect"; if (token.length < 40 || !["inspect", "save", "submit"].includes(action)) return tenantError("Token ou ação inválidos.", "VALIDATION_ERROR", 400);
  const row = await load(db, token); if (!row) return tenantError("Link inválido ou expirado.", "PREVISIT_LINK_INVALID", 404);
  if (Date.parse(row.expires_at) <= Date.now() || ["expired", "revoked"].includes(row.status)) return tenantError("Link expirado ou revogado.", "PREVISIT_LINK_EXPIRED", 410);
  if (action === "inspect") return tenantJson({ status: row.status, expiresAt: row.expires_at, source: "family", sourceLabel: "informação fornecida pelo responsável", reviewRequired: true });
  if (row.status === "incorporated" || row.status === "reviewed") return tenantError("Pré-consulta já revisada e não pode ser sobrescrita.", "PREVISIT_LOCKED", 409);
  const payload = body.payload; if (!object(payload)) return tenantError("payload deve ser objeto.", "VALIDATION_ERROR", 400); const bytes = new TextEncoder().encode(JSON.stringify(payload)); if (bytes.byteLength > MAX_PAYLOAD_BYTES) return tenantError("Pré-consulta excede 100 KB.", "PAYLOAD_TOO_LARGE", 413);
  const encrypted = await encryptClinicalJson(context.env, row.clinic_id, `previsit:${row.id}`, payload); const nextStatus = action === "submit" ? "submitted" : "open";
  await db.prepare(`UPDATE live_previsit_submissions SET status = ?, payload_encrypted = ?, encryption_version = ?, submitted_at = CASE WHEN ? = 'submitted' THEN CURRENT_TIMESTAMP ELSE submitted_at END, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('open','submitted')`).bind(nextStatus, encrypted, "clinical-v1", nextStatus, row.id).run();
  return tenantJson({ id: row.id, status: nextStatus, source: "family", sourceLabel: "informação fornecida pelo responsável", reviewRequired: true });
};
