/**
 * GET/PUT/DELETE /api/certificate-vault
 *
 * Cofre por conta para certificado ICP-Brasil A1. O cliente valida a senha do
 * PFX, cifra os bytes no navegador usando PBKDF2 + AES-GCM e envia somente o
 * envelope. O servidor nunca recebe senha, PFX em claro ou chave desbloqueada.
 */
import { getContextUser } from "./auth/_authorization";
import { prepareSaasAudit, tenantError, tenantJson, type TenantEnv } from "./tenant/_core";

const TABLE = "certificate_vault";
const KDF = "PBKDF2-SHA256";
const KDF_ITERATIONS = 310_000;
const MAX_CIPHERTEXT_B64_CHARS = 1_700_000;

interface CertificateRow {
  format_version: number;
  kdf: string;
  kdf_iterations: number;
  salt_b64: string;
  iv_b64: string;
  ciphertext_b64: string;
  updated_at: string;
}

function adminUser(context: { data?: unknown }) {
  const user = getContextUser(context);
  return user?.role === "admin" ? user : null;
}

function validBase64(value: unknown, minBytes: number, maxBytes: number): value is string {
  if (typeof value !== "string" || value.length > MAX_CIPHERTEXT_B64_CHARS || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    return false;
  }
  try {
    const length = atob(value).length;
    return length >= minBytes && length <= maxBytes;
  } catch {
    return false;
  }
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = adminUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Acesso ao certificado negado.", "TENANT_FORBIDDEN", 403);
  try {
    const row = await db.prepare(
      `SELECT format_version, kdf, kdf_iterations, salt_b64, iv_b64, ciphertext_b64, updated_at
         FROM ${TABLE}
        WHERE user_id = ?
        LIMIT 1`,
    ).bind(user.id).first<CertificateRow>();
    if (!row) return tenantJson({ certificate: null });
    return tenantJson({
      certificate: {
        formatVersion: row.format_version,
        kdf: row.kdf,
        iterations: row.kdf_iterations,
        salt: row.salt_b64,
        iv: row.iv_b64,
        ciphertext: row.ciphertext_b64,
        updatedAt: row.updated_at,
      },
    });
  } catch {
    return tenantError("Cofre de certificado indisponível.", "CERTIFICATE_VAULT_UNAVAILABLE", 503);
  }
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = adminUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Acesso ao certificado negado.", "TENANT_FORBIDDEN", 403);

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const allowed = new Set(["formatVersion", "kdf", "iterations", "salt", "iv", "ciphertext"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return tenantError("O cofre aceita somente o envelope cifrado.", "CERTIFICATE_ENVELOPE_INVALID", 400);
  }
  if (
    body.formatVersion !== 1 ||
    body.kdf !== KDF ||
    body.iterations !== KDF_ITERATIONS ||
    !validBase64(body.salt, 16, 16) ||
    !validBase64(body.iv, 12, 12) ||
    !validBase64(body.ciphertext, 16, Math.floor(MAX_CIPHERTEXT_B64_CHARS * 3 / 4))
  ) {
    return tenantError("Envelope do certificado inválido.", "CERTIFICATE_ENVELOPE_INVALID", 400);
  }

  const updatedAt = new Date().toISOString();
  try {
    const save = db.prepare(
      `INSERT INTO ${TABLE}
        (user_id, format_version, kdf, kdf_iterations, salt_b64, iv_b64, ciphertext_b64, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         format_version = excluded.format_version,
         kdf = excluded.kdf,
         kdf_iterations = excluded.kdf_iterations,
         salt_b64 = excluded.salt_b64,
         iv_b64 = excluded.iv_b64,
         ciphertext_b64 = excluded.ciphertext_b64,
         updated_at = excluded.updated_at`,
    ).bind(user.id, KDF, KDF_ITERATIONS, body.salt, body.iv, body.ciphertext, updatedAt);
    const audit = prepareSaasAudit(db, {
      actorUserId: user.id,
      action: "certificate_vault.save",
      targetType: "certificate_vault",
      metadata: { formatVersion: 1, kdf: KDF },
    });
    await db.batch([save, audit]);
    return tenantJson({ ok: true, updatedAt });
  } catch {
    return tenantError("Não foi possível guardar o certificado.", "CERTIFICATE_VAULT_WRITE_FAILED", 503);
  }
};

export const onRequestDelete: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = adminUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Acesso ao certificado negado.", "TENANT_FORBIDDEN", 403);
  try {
    const deletion = db.prepare(`DELETE FROM ${TABLE} WHERE user_id = ?`).bind(user.id);
    const audit = prepareSaasAudit(db, {
      actorUserId: user.id,
      action: "certificate_vault.delete",
      targetType: "certificate_vault",
    }, true);
    await db.batch([deletion, audit]);
    return tenantJson({ ok: true });
  } catch {
    return tenantError("Não foi possível remover o certificado.", "CERTIFICATE_VAULT_DELETE_FAILED", 503);
  }
};
