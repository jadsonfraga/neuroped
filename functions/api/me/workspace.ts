/**
 * GET/PUT/DELETE /api/me/workspace?key=...
 *
 * Account-owned persistence for secureStorage workspaces. Payloads are encrypted
 * with the clinical keyring and bound to the authenticated user and item key.
 * Canonical patient and clinic records remain on their typed LIVE endpoints.
 */
import { getContextUser } from "../auth/_authorization";
import {
  clinicalLiveEnabled,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import {
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../tenant/_crypto";

const TABLE = "account_workspace_items";
const MAX_PLAINTEXT_BYTES = 1_400_000;
const ITEM_KEY = /^[A-Za-z0-9][A-Za-z0-9:_./-]{0,159}$/;
const SENSITIVE_KEY = /(?:^|[:/._-])(access|refresh|password|passwd|token|secret|certificate|pfx|p12|private-key)(?:[:/._-]|$)/i;

interface WorkspaceRow {
  user_id: string;
  item_key: string;
  payload_encrypted: string;
  encryption_version: string;
  expires_at: string | null;
  updated_at: string;
}

function validKey(value: unknown): value is string {
  return typeof value === "string" && ITEM_KEY.test(value) && !SENSITIVE_KEY.test(value);
}

function userScope(userId: string): string {
  return `account:${userId}`;
}

function purpose(itemKey: string): string {
  return `account-workspace:${itemKey}`;
}

function configurationError(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError("Persistência autenticada indisponível.", "CLINICAL_LIVE_DISABLED", 503);
  }
  if (!clinicalCryptoReady(env)) {
    return tenantError("Keyring de dados não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }
  return null;
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

function parseExpiry(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = configurationError(context.env);
  if (configError) return configError;

  const itemKey = new URL(context.request.url).searchParams.get("key");
  if (!validKey(itemKey)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);

  let row: WorkspaceRow | null;
  try {
    row = await db.prepare(
      `SELECT user_id, item_key, payload_encrypted, encryption_version, expires_at, updated_at
         FROM ${TABLE}
        WHERE user_id = ? AND item_key = ?
        LIMIT 1`,
    ).bind(user.id, itemKey).first<WorkspaceRow>();
  } catch {
    return tenantError("Não foi possível consultar o workspace.", "DB_ERROR", 500);
  }
  if (!row) return tenantError("Item não encontrado.", "WORKSPACE_ITEM_NOT_FOUND", 404);

  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    try {
      await db.prepare(
        `DELETE FROM ${TABLE} WHERE user_id = ? AND item_key = ? AND expires_at = ?`,
      ).bind(user.id, itemKey, row.expires_at).run();
    } catch {
      return tenantError("Não foi possível limpar um item expirado.", "DB_ERROR", 500);
    }
    return tenantError("Item expirado.", "WORKSPACE_ITEM_NOT_FOUND", 404);
  }

  try {
    const data = await decryptClinicalJson<unknown>(
      context.env,
      userScope(user.id),
      purpose(itemKey),
      row.payload_encrypted,
    );
    return tenantJson({ data, expiresAt: row.expires_at, updatedAt: row.updated_at });
  } catch {
    return tenantError("Item indisponível para decifragem.", "WORKSPACE_DECRYPT_FAILED", 500);
  }
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = configurationError(context.env);
  if (configError) return configError;

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  if (!validKey(body.key)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);
  if (!Object.prototype.hasOwnProperty.call(body, "data")) {
    return tenantError("Campo data obrigatório.", "VALIDATION_ERROR", 400);
  }
  const expiresAt = Object.prototype.hasOwnProperty.call(body, "expiresAt")
    ? parseExpiry(body.expiresAt)
    : null;
  if (expiresAt === undefined) return tenantError("Expiração inválida.", "VALIDATION_ERROR", 400);

  let serialized: string;
  try {
    serialized = JSON.stringify(body.data);
  } catch {
    return tenantError("Conteúdo não serializável.", "VALIDATION_ERROR", 400);
  }
  if (typeof serialized !== "string") return tenantError("Conteúdo não serializável.", "VALIDATION_ERROR", 400);
  if (new TextEncoder().encode(serialized).byteLength > MAX_PLAINTEXT_BYTES) {
    return tenantError("Item excede o limite de persistência.", "PAYLOAD_TOO_LARGE", 413);
  }

  const itemKey = body.key;
  try {
    const encrypted = await encryptClinicalJson(
      context.env,
      userScope(user.id),
      purpose(itemKey),
      body.data,
    );
    const version = currentClinicalEncryptionVersion(context.env);
    const savedAt = new Date().toISOString();
    const upsert = db.prepare(
      `INSERT INTO ${TABLE}
        (user_id, item_key, payload_encrypted, encryption_version, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, item_key) DO UPDATE SET
         payload_encrypted = excluded.payload_encrypted,
         encryption_version = excluded.encryption_version,
         expires_at = excluded.expires_at,
         updated_at = excluded.updated_at`,
    ).bind(user.id, itemKey, encrypted, version, expiresAt ?? null, savedAt);
    const audit = prepareSaasAudit(db, {
      actorUserId: user.id,
      action: "account_workspace.write",
      targetType: "account_workspace_item",
      metadata: { plaintextBytes: new TextEncoder().encode(serialized).byteLength },
    });
    await db.batch([upsert, audit]);
    return tenantJson({ ok: true, updatedAt: savedAt });
  } catch {
    return tenantError("Não foi possível persistir o item.", "WORKSPACE_WRITE_FAILED", 500);
  }
};

export const onRequestDelete: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = configurationError(context.env);
  if (configError) return configError;

  const itemKey = new URL(context.request.url).searchParams.get("key");
  if (!validKey(itemKey)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);

  try {
    const deletion = db.prepare(
      `DELETE FROM ${TABLE} WHERE user_id = ? AND item_key = ?`,
    ).bind(user.id, itemKey);
    const audit = prepareSaasAudit(db, {
      actorUserId: user.id,
      action: "account_workspace.delete",
      targetType: "account_workspace_item",
    }, true);
    await db.batch([deletion, audit]);
    return tenantJson({ ok: true });
  } catch {
    return tenantError("Não foi possível remover o item.", "WORKSPACE_DELETE_FAILED", 500);
  }
};
