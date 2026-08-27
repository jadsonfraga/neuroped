import { tenantError, tenantJson, type TenantEnv } from "../tenant/_core";

function text(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
async function hashToken(token: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; if (!db) return tenantError("Portal indisponível.", "DB_REQUIRED", 503);
  let body: Record<string, unknown>; try { const parsed = await context.request.json(); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("JSON inválido.", "INVALID_JSON", 400); body = parsed as Record<string, unknown>; } catch { return tenantError("JSON inválido.", "INVALID_JSON", 400); }
  const token = text(body.token, 256); const action = text(body.action, 20) || "inspect"; if (token.length < 40 || !["inspect", "consume"].includes(action)) return tenantError("Token ou ação inválidos.", "VALIDATION_ERROR", 400);
  const tokenHash = await hashToken(token);
  const row = await db.prepare(`SELECT id, clinic_id, patient_id, permissions_json, expires_at, max_uses, uses, revoked_at FROM family_portal_invites WHERE token_hash = ? LIMIT 1`).bind(tokenHash).first<{ id: string; clinic_id: string; patient_id: string; permissions_json: string; expires_at: string; max_uses: number; uses: number; revoked_at: string | null }>();
  if (!row || row.revoked_at || Date.parse(row.expires_at) <= Date.now() || row.uses >= row.max_uses) return tenantError("Convite inválido, expirado, revogado ou já utilizado.", "FAMILY_INVITE_INVALID", 404);
  let permissions: string[]; try { permissions = JSON.parse(row.permissions_json); } catch { return tenantError("Convite inválido.", "FAMILY_INVITE_INVALID", 404); }
  if (action === "consume") {
    const updated = await db.prepare(`UPDATE family_portal_invites SET uses = uses + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND token_hash = ? AND revoked_at IS NULL AND uses < max_uses AND expires_at > CURRENT_TIMESTAMP`).bind(row.id, tokenHash).run();
    if (Number(updated.meta?.changes ?? 0) !== 1) return tenantError("Convite não está mais disponível.", "FAMILY_INVITE_REPLAY", 409);
  }
  return tenantJson({ inviteId: row.id, permissions, expiresAt: row.expires_at, consumed: action === "consume", authorization: "token-bound-tenant-patient" });
};
