import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import { getClinicMembership, membershipCanManage, tenantError, tenantJson, type TenantEnv } from "../tenant/_core";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const PERMISSIONS = new Set(["view", "form", "diary", "document"]);
function text(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function bytesToToken(bytes: Uint8Array): string { let raw = ""; for (const byte of bytes) raw += String.fromCharCode(byte); return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
async function hashToken(token: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function access(db: D1Database | undefined, user: ReturnType<typeof getContextUser>, clinicId: string): Promise<Response | null> {
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return tenantError("Somente gestores podem administrar convites.", "TENANT_FORBIDDEN", 403);
  return requireBillingEntitlement(db, user.id, clinicId, "admin");
}

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context);
  let body: Record<string, unknown>; try { const parsed = await context.request.json(); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("JSON inválido.", "INVALID_JSON", 400); body = parsed as Record<string, unknown>; } catch { return tenantError("JSON inválido.", "INVALID_JSON", 400); }
  const clinicId = text(body.clinicId, 80); const patientId = text(body.patientId, 120); const expiresAt = text(body.expiresAt, 64); const maxUses = body.maxUses ?? 1; const permissions = Array.isArray(body.permissions) ? body.permissions.map((item) => text(item, 30)).filter((item) => PERMISSIONS.has(item)) : [];
  if (!OPAQUE_ID.test(clinicId) || !OPAQUE_ID.test(patientId) || !Number.isInteger(maxUses) || Number(maxUses) < 1 || Number(maxUses) > 20 || permissions.length === 0 || !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now()) return tenantError("Dados do convite inválidos.", "VALIDATION_ERROR", 400);
  const denial = await access(db, user, clinicId); if (denial) return denial;
  const patient = await db!.prepare(`SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? AND status <> 'merged' LIMIT 1`).bind(patientId, clinicId).first<{ id: string }>();
  if (!patient) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  const bytes = crypto.getRandomValues(new Uint8Array(32)); const token = bytesToToken(bytes); const tokenHash = await hashToken(token); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await db!.prepare(`INSERT INTO family_portal_invites (id, clinic_id, patient_id, created_by_user_id, token_hash, permissions_json, expires_at, max_uses, uses, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`).bind(id, clinicId, patientId, user!.id, tokenHash, JSON.stringify(Array.from(new Set(permissions))), new Date(expiresAt).toISOString(), Number(maxUses), now, now).run();
  return tenantJson({ id, clinicId, patientId, expiresAt: new Date(expiresAt).toISOString(), permissions: Array.from(new Set(permissions)), token, tokenDeliveredOnce: true }, 201);
};

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); const url = new URL(context.request.url); const clinicId = text(url.searchParams.get("clinicId"), 80); const patientId = text(url.searchParams.get("patientId"), 120);
  if (!OPAQUE_ID.test(clinicId)) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400); const denial = await access(db, user, clinicId); if (denial) return denial;
  const rows = await db!.prepare(`SELECT id, clinic_id, patient_id, permissions_json, expires_at, max_uses, uses, revoked_at, created_at, updated_at FROM family_portal_invites WHERE clinic_id = ? AND (? = '' OR patient_id = ?) ORDER BY created_at DESC LIMIT 100`).bind(clinicId, patientId, patientId).all();
  return tenantJson({ data: rows.results ?? [] });
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); let body: Record<string, unknown>; try { const parsed = await context.request.json(); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("JSON inválido.", "INVALID_JSON", 400); body = parsed as Record<string, unknown>; } catch { return tenantError("JSON inválido.", "INVALID_JSON", 400); }
  const clinicId = text(body.clinicId, 80); const inviteId = text(body.inviteId, 120); if (!OPAQUE_ID.test(clinicId) || !OPAQUE_ID.test(inviteId)) return tenantError("Identificadores inválidos.", "VALIDATION_ERROR", 400); const denial = await access(db, user, clinicId); if (denial) return denial;
  const result = await db!.prepare(`UPDATE family_portal_invites SET revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ? AND revoked_at IS NULL`).bind(inviteId, clinicId).run(); if (Number(result.meta?.changes ?? 0) !== 1) return tenantError("Convite não encontrado ou já revogado.", "INVITE_NOT_ACTIVE", 409); return tenantJson({ id: inviteId, revoked: true });
};
