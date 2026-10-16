import {
  FAMILY_PORTAL_CONSENT_NOTICE,
  FAMILY_PORTAL_CONSENT_VERSION,
  FAMILY_PORTAL_SUPPORT_NOTICE,
  OWN_TEST_HOW_DONE,
  OWN_TEST_LABELS,
  SHARE_STATE_MESSAGES,
  shareAccessState,
  type PortalContent,
  type ShareAccessState,
} from "../../shared/family-portal";
import { requireRemoteIntakeConfiguration } from "./intake/_shared";
import {
  AUDIT_IF_CHANGED_SQL,
  AUDIT_SQL,
  CONSUME_SHARE_SQL,
  parseFamilyPortalToken,
  readFamilyPortalToken,
  verifyFamilyPortalSecret,
} from "./family-portal/_shared";
import { tenantError, tenantJson, type TenantEnv } from "./tenant/_core";
import { decryptClinicalJson } from "./tenant/_crypto";

interface ShareRow {
  id: string;
  clinic_id: string;
  token_hash: string;
  status: "active" | "revoked";
  expires_at: string;
  max_views: number;
  view_count: number;
  content_encrypted: string;
  clinic_name: string;
  clinic_status: string;
}

async function resolve(db: D1Database, env: TenantEnv, token: string): Promise<ShareRow | null> {
  const parsed = parseFamilyPortalToken(token);
  if (!parsed) return null;
  const row = await db
    .prepare(
      `SELECT s.id, s.clinic_id, s.token_hash, s.status, s.expires_at, s.max_views, s.view_count,
              s.content_encrypted, c.name AS clinic_name, c.status AS clinic_status
         FROM family_portal_shares s JOIN clinics c ON c.id = s.clinic_id
        WHERE s.id = ? LIMIT 1`,
    )
    .bind(parsed.shareId)
    .first<ShareRow>();
  if (!row) return null;
  return (await verifyFamilyPortalSecret(env, row.clinic_id, parsed.secret, row.token_hash)) ? row : null;
}

function stateResponse(state: Exclude<ShareAccessState, "ok">): Response {
  const status = state === "exhausted" ? 429 : 410;
  return tenantError(SHARE_STATE_MESSAGES[state], `PORTAL_${state.toUpperCase()}`, status);
}

function audit(db: D1Database, row: ShareRow, action: string, consent: string | null) {
  return db.prepare(AUDIT_SQL).bind(crypto.randomUUID(), row.clinic_id, row.id, action, consent, new Date().toISOString()).run();
}

/** GET: só metadados + aviso de consentimento. NÃO entrega conteúdo e NÃO consome abertura. */
export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Serviço indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;
  const row = await resolve(db, context.env, readFamilyPortalToken(context.request));
  if (!row) return tenantError("Link inválido.", "PORTAL_INVALID", 404);
  const state = shareAccessState({ status: row.status, expiresAt: row.expires_at, viewCount: row.view_count, maxViews: row.max_views, clinicStatus: row.clinic_status });
  if (state !== "ok") {
    await audit(db, row, `denied_${state === "clinic_unavailable" ? "revoked" : state}`, null).catch(() => undefined);
    return stateResponse(state);
  }
  await audit(db, row, "opened", null).catch(() => undefined);
  return tenantJson({
    clinicName: row.clinic_name,
    expiresAt: row.expires_at,
    remainingViews: row.max_views - row.view_count,
    consent: { version: FAMILY_PORTAL_CONSENT_VERSION, notice: FAMILY_PORTAL_CONSENT_NOTICE },
    supportNotice: FAMILY_PORTAL_SUPPORT_NOTICE,
  });
};

/** POST: exige consentimento explícito, consome 1 abertura de forma atômica e então entrega o conteúdo. */
export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Serviço indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;
  const row = await resolve(db, context.env, readFamilyPortalToken(context.request));
  if (!row) return tenantError("Link inválido.", "PORTAL_INVALID", 404);
  const state = shareAccessState({ status: row.status, expiresAt: row.expires_at, viewCount: row.view_count, maxViews: row.max_views, clinicStatus: row.clinic_status });
  if (state !== "ok") {
    await audit(db, row, `denied_${state === "clinic_unavailable" ? "revoked" : state}`, null).catch(() => undefined);
    return stateResponse(state);
  }

  const body = await context.request
    .json()
    .then((parsed: unknown) => (parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null))
    .catch(() => null);
  if (!body || body.consentAccepted !== true || body.consentVersion !== FAMILY_PORTAL_CONSENT_VERSION) {
    await audit(db, row, "denied_invalid_consent", null).catch(() => undefined);
    return tenantError("É necessário aceitar o consentimento para abrir o conteúdo.", "CONSENT_REQUIRED", 400);
  }

  let content: PortalContent;
  try {
    content = await decryptClinicalJson<PortalContent>(context.env, row.clinic_id, `family-portal-share:${row.id}`, row.content_encrypted);
  } catch (error) {
    console.error("[public-family-portal.POST] decrypt failure", error);
    return tenantError("Não foi possível abrir o conteúdo.", "PORTAL_DECRYPT_FAILED", 500);
  }

  const now = new Date().toISOString();
  try {
    const results = await db.batch([
      db.prepare(CONSUME_SHARE_SQL).bind(now, now, FAMILY_PORTAL_CONSENT_VERSION, row.id, row.clinic_id, now),
      db.prepare(AUDIT_IF_CHANGED_SQL).bind(crypto.randomUUID(), row.clinic_id, row.id, "consent_accepted", FAMILY_PORTAL_CONSENT_VERSION, now),
      db.prepare(AUDIT_IF_CHANGED_SQL).bind(crypto.randomUUID(), row.clinic_id, row.id, "content_viewed", FAMILY_PORTAL_CONSENT_VERSION, now),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      return stateResponse("exhausted");
    }
  } catch (error) {
    console.error("[public-family-portal.POST] consume failure", error);
    return tenantError("Não foi possível abrir o conteúdo.", "PORTAL_CONSUME_FAILED", 500);
  }

  return tenantJson({
    clinicName: row.clinic_name,
    expiresAt: row.expires_at,
    remainingViews: Math.max(0, row.max_views - row.view_count - 1),
    supportNotice: FAMILY_PORTAL_SUPPORT_NOTICE,
    content: {
      ...content,
      avaliacoesProprias: content.avaliacoesProprias.map((t) => ({
        instrumento: t.instrumento,
        nome: OWN_TEST_LABELS[t.instrumento],
        data: t.data,
        comoFoiFeita: OWN_TEST_HOW_DONE,
        comoRespondeu: t.comoRespondeu,
      })),
    },
  });
};
