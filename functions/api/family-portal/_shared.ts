import type { PortalDocument } from "../../../shared/family-portal";
import { FAMILY_PORTAL_LIMITS } from "../../../shared/family-portal";
import { clinicalBlindIndex } from "../tenant/_crypto";
import type { TenantEnv } from "../tenant/_core";

const SHARE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const SECRET = /^[A-Za-z0-9_-]{40,80}$/;
const PURPOSE = "family-portal-token";

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function createFamilyPortalToken(
  env: TenantEnv,
  clinicId: string,
  shareId: string,
): Promise<{ token: string; tokenHash: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = base64Url(bytes);
  return { token: `${shareId}.${secret}`, tokenHash: await clinicalBlindIndex(env, clinicId, PURPOSE, secret) };
}

export function parseFamilyPortalToken(token: string): { shareId: string; secret: string } | null {
  const sep = token.indexOf(".");
  if (sep <= 0 || sep !== token.lastIndexOf(".")) return null;
  const shareId = token.slice(0, sep);
  const secret = token.slice(sep + 1);
  return SHARE_ID.test(shareId) && SECRET.test(secret) ? { shareId, secret } : null;
}

function constantTimeEqual(a: string, b: string): boolean {
  const n = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < n; i += 1) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function verifyFamilyPortalSecret(env: TenantEnv, clinicId: string, secret: string, expectedHash: string): Promise<boolean> {
  return constantTimeEqual(await clinicalBlindIndex(env, clinicId, PURPOSE, secret), expectedHash);
}

export function readFamilyPortalToken(request: Request): string {
  const authorization = request.headers.get("Authorization") ?? "";
  return authorization.startsWith("Portal ") ? authorization.slice(7).trim() : "";
}

/**
 * Consumo atômico: só incrementa se o link ainda estiver ativo, não expirado
 * e abaixo do limite. A auditoria entra no mesmo batch, condicionada a
 * `changes() = 1`, então não há trilha sem acesso nem acesso sem trilha.
 */
export const CONSUME_SHARE_SQL = `UPDATE family_portal_shares
   SET view_count = view_count + 1,
       last_viewed_at = ?,
       first_consented_at = COALESCE(first_consented_at, ?),
       consent_version = ?
 WHERE id = ? AND clinic_id = ? AND status = 'active'
   AND expires_at > ? AND view_count < max_views`;

export const AUDIT_IF_CHANGED_SQL = `INSERT INTO family_portal_audit_log (id, clinic_id, share_id, action, consent_version, created_at)
   SELECT ?, ?, ?, ?, ?, ? WHERE changes() = 1`;

export const AUDIT_SQL = `INSERT INTO family_portal_audit_log (id, clinic_id, share_id, action, consent_version, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`;

type DocContent = string | Record<string, unknown>;

/** Extrai título e texto de um documento já liberado (family_visibility) sem inventar conteúdo. */
export function extractDocumentForFamily(
  documentId: string,
  documentType: string,
  issuedAt: string,
  content: DocContent,
): PortalDocument | null {
  let titulo = "Documento";
  let texto = "";
  if (typeof content === "string") {
    texto = content;
  } else {
    if (typeof content.title === "string" && content.title.trim()) titulo = content.title.trim();
    for (const key of ["text", "texto", "body", "conteudo", "content", "note"]) {
      const value = content[key];
      if (typeof value === "string" && value.trim()) { texto = value; break; }
    }
  }
  texto = texto.trim().slice(0, FAMILY_PORTAL_LIMITS.maxDocumentText);
  if (!texto) return null;
  return { documentId, titulo: titulo.slice(0, FAMILY_PORTAL_LIMITS.maxTitle), tipo: documentType, emitidoEm: issuedAt, texto };
}

