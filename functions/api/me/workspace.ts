/**
 * GET/PUT/DELETE /api/me/workspace?key=...
 *
 * Persistência segura por clínica e usuário para os itens do secureStorage.
 * Payloads são cifrados com o keyring clínico. Registros canônicos de pacientes
 * e clínicas continuam em seus endpoints tipados.
 *
 * Contrato:
 * - GET responde 200 também para item ausente (`found: false`). Ausência não é
 *   erro; erro (5xx/4xx) nunca pode ser confundido com "vazio" pelo cliente.
 * - Cada gravação troca `version` (token opaco). PUT exige `baseVersion`:
 *   `null` cria apenas se o item não existir; uma string atualiza apenas se for a
 *   versão atual. Divergência responde 409 com `currentVersion` (concorrência
 *   otimista, equivalente a If-Match/ETag), sem sobrescrever outra aba/aparelho.
 */
import { getContextUser } from "../auth/_authorization";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { resolveBillingClinicId } from "../billing/_guard";
import {
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  clinicalBlindIndex,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../tenant/_crypto";

const TABLE = "account_workspace_items";
const MAX_PLAINTEXT_BYTES = 1_400_000;
const ITEM_KEY = /^[A-Za-z0-9][A-Za-z0-9:_./-]{0,159}$/;
const SENSITIVE_KEY = /(?:^|[:/._-])(access|refresh|password|passwd|token|secret|certificate|pfx|p12|private-key)(?:[:/._-]|$)/i;

interface WorkspaceRow {
  clinic_id: string;
  user_id: string;
  item_key_hash: string;
  payload_encrypted: string;
  encryption_version: string;
  version: string;
  expires_at: string | null;
  updated_at: string;
}

const VERSION_TOKEN = /^[A-Za-z0-9-]{16,64}$/;

type WorkspaceContext = {
  env: TenantEnv;
  request: Request;
  data?: unknown;
};

type WorkspaceAccess =
  | {
      db: D1Database;
      user: NonNullable<ReturnType<typeof getContextUser>>;
      clinicId: string;
    }
  | { response: Response };

function validKey(value: unknown): value is string {
  return typeof value === "string" && ITEM_KEY.test(value) && !SENSITIVE_KEY.test(value);
}

function purpose(userId: string, itemKey: string): string {
  return `account-workspace:${userId}:${itemKey}`;
}

async function itemKeyHash(
  env: TenantEnv,
  clinicId: string,
  userId: string,
  itemKey: string,
): Promise<string> {
  return clinicalBlindIndex(
    env,
    clinicId,
    `account-workspace-key:${userId}`,
    itemKey,
  );
}

async function authorizeWorkspace(
  context: WorkspaceContext,
  write: boolean,
): Promise<WorkspaceAccess> {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { response: tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) };
  if (!user) return { response: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) };
  if (!clinicalLiveEnabled(context.env)) {
    return { response: tenantError("Persistência autenticada indisponível.", "CLINICAL_LIVE_DISABLED", 503) };
  }

  let clinicId: string | null;
  try {
    clinicId = await resolveBillingClinicId(db, user.id, context.request);
  } catch {
    return { response: tenantError("Não foi possível validar a clínica ativa.", "TENANT_CONTEXT_ERROR", 500) };
  }
  if (!clinicId) {
    return { response: tenantError("Selecione uma clínica ativa para acessar o workspace.", "TENANT_CONTEXT_REQUIRED", 409) };
  }

  let membership: Awaited<ReturnType<typeof getClinicMembership>>;
  try {
    membership = await getClinicMembership(db, clinicId, user);
  } catch {
    return { response: tenantError("Não foi possível validar a associação à clínica.", "TENANT_MEMBERSHIP_ERROR", 500) };
  }
  if (!membership) {
    return { response: tenantError("Associação ativa à clínica necessária.", "TENANT_MEMBERSHIP_REQUIRED", 403) };
  }
  const permitted = write
    ? membershipCanWriteClinical(membership)
    : membershipCanReadClinical(membership);
  if (!permitted) {
    return { response: tenantError("Permissão clínica insuficiente para o workspace.", "TENANT_FORBIDDEN", 403) };
  }

  return { db, user, clinicId };
}

function cryptoConfigurationError(env: TenantEnv): Response | null {
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

function parseBaseVersion(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" && VERSION_TOKEN.test(value) ? value : undefined;
}

function isExpired(expiresAt: string | null, now = Date.now()): boolean {
  return Boolean(expiresAt && Date.parse(expiresAt) <= now);
}

async function currentVersion(
  db: D1Database,
  clinicId: string,
  userId: string,
  keyHash: string,
): Promise<string | null> {
  const row = await db.prepare(
    `SELECT version, expires_at
       FROM ${TABLE}
      WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ?
      LIMIT 1`,
  ).bind(clinicId, userId, keyHash).first<{ version: string; expires_at: string | null }>();
  if (!row || isExpired(row.expires_at)) return null;
  return row.version;
}

function versionConflict(current: string | null): Response {
  return tenantJson({
    error: "O item foi alterado em outra aba ou aparelho.",
    code: "WORKSPACE_VERSION_CONFLICT",
    currentVersion: current,
  }, 409);
}

function parseExpiry(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const access = await authorizeWorkspace(context, false);
  if ("response" in access) return access.response;
  const { db, user, clinicId } = access;

  const itemKey = new URL(context.request.url).searchParams.get("key");
  if (!validKey(itemKey)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);
  const configError = cryptoConfigurationError(context.env);
  if (configError) return configError;

  let keyHash: string;
  try {
    keyHash = await itemKeyHash(context.env, clinicId, user.id, itemKey);
  } catch {
    return tenantError("Índice criptográfico indisponível.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }

  let row: WorkspaceRow | null;
  try {
    row = await db.prepare(
      `SELECT clinic_id, user_id, item_key_hash, payload_encrypted, encryption_version, version, expires_at, updated_at
         FROM ${TABLE}
        WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ?
        LIMIT 1`,
    ).bind(clinicId, user.id, keyHash).first<WorkspaceRow>();
  } catch {
    return tenantError("Não foi possível consultar o workspace.", "DB_ERROR", 500);
  }
  // Ausência é estado válido, não erro: 200 + found:false. Assim o navegador não
  // registra 404 e o cliente distingue "não existe" de "não consegui ler".
  if (!row) return tenantJson({ found: false });

  if (isExpired(row.expires_at)) {
    try {
      await db.prepare(
        `DELETE FROM ${TABLE}
          WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ? AND expires_at = ?`,
      ).bind(clinicId, user.id, keyHash, row.expires_at).run();
    } catch {
      return tenantError("Não foi possível limpar um item expirado.", "DB_ERROR", 500);
    }
    return tenantJson({ found: false });
  }

  try {
    const data = await decryptClinicalJson<unknown>(
      context.env,
      clinicId,
      purpose(user.id, itemKey),
      row.payload_encrypted,
    );
    return tenantJson({
      found: true,
      data,
      version: row.version,
      expiresAt: row.expires_at,
      updatedAt: row.updated_at,
    });
  } catch {
    return tenantError("Item indisponível para decifragem.", "WORKSPACE_DECRYPT_FAILED", 500);
  }
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const access = await authorizeWorkspace(context, true);
  if ("response" in access) return access.response;
  const { db, user, clinicId } = access;

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
  // Gravação cega é proibida: o cliente declara a versão que leu (ou null para
  // criar). Sem isso uma aba antiga apagaria o histórico salvo por outra.
  if (!Object.prototype.hasOwnProperty.call(body, "baseVersion")) {
    return tenantError("baseVersion obrigatório.", "VALIDATION_ERROR", 400);
  }
  const baseVersion = parseBaseVersion(body.baseVersion);
  if (baseVersion === undefined) return tenantError("baseVersion inválido.", "VALIDATION_ERROR", 400);

  let serialized: string;
  try {
    serialized = JSON.stringify(body.data);
  } catch {
    return tenantError("Conteúdo não serializável.", "VALIDATION_ERROR", 400);
  }
  if (typeof serialized !== "string") return tenantError("Conteúdo não serializável.", "VALIDATION_ERROR", 400);
  const plaintextBytes = new TextEncoder().encode(serialized).byteLength;
  if (plaintextBytes > MAX_PLAINTEXT_BYTES) {
    return tenantError("Item excede o limite de persistência.", "PAYLOAD_TOO_LARGE", 413);
  }
  const configError = cryptoConfigurationError(context.env);
  if (configError) return configError;

  const itemKey = body.key;
  try {
    const keyHash = await itemKeyHash(context.env, clinicId, user.id, itemKey);
    const encrypted = await encryptClinicalJson(
      context.env,
      clinicId,
      purpose(user.id, itemKey),
      body.data,
    );
    const encryptionVersion = currentClinicalEncryptionVersion(context.env);
    const savedAt = new Date().toISOString();
    const nextVersion = crypto.randomUUID();
    // Criação (baseVersion null) só ocupa a chave se ela estiver livre ou com
    // item expirado. Atualização exige a versão lida e membership ativa no
    // predicado final (o gatilho BEFORE UPDATE repete a regra no banco).
    const write = baseVersion === null
      ? db.prepare(
        `INSERT INTO ${TABLE}
          (clinic_id, user_id, item_key_hash, payload_encrypted, encryption_version, version, expires_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(clinic_id, user_id, item_key_hash) DO UPDATE SET
           payload_encrypted = excluded.payload_encrypted,
           encryption_version = excluded.encryption_version,
           version = excluded.version,
           expires_at = excluded.expires_at,
           updated_at = excluded.updated_at
         WHERE ${TABLE}.expires_at IS NOT NULL AND ${TABLE}.expires_at <= ?`,
      ).bind(clinicId, user.id, keyHash, encrypted, encryptionVersion, nextVersion, expiresAt ?? null, savedAt, savedAt)
      : db.prepare(
        `UPDATE ${TABLE}
            SET payload_encrypted = ?, encryption_version = ?, version = ?, expires_at = ?, updated_at = ?
          WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ? AND version = ?
            AND EXISTS (
              SELECT 1 FROM clinic_memberships m
               WHERE m.clinic_id = ? AND m.user_id = ? AND m.active = 1
            )`,
      ).bind(encrypted, encryptionVersion, nextVersion, expiresAt ?? null, savedAt, clinicId, user.id, keyHash, baseVersion, clinicId, user.id);
    // Auditoria só existe se a gravação aconteceu (changes() da instrução anterior).
    const audit = prepareSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "account_workspace.write",
      targetType: "account_workspace_item",
      metadata: { plaintextBytes, mode: baseVersion === null ? "create" : "update" },
    }, true);
    const [result] = await db.batch([write, audit]);
    if (!result?.meta || result.meta.changes !== 1) {
      return versionConflict(await currentVersion(db, clinicId, user.id, keyHash));
    }
    return tenantJson({ ok: true, version: nextVersion, updatedAt: savedAt });
  } catch {
    return tenantError("Não foi possível persistir o item.", "WORKSPACE_WRITE_FAILED", 500);
  }
};

export const onRequestDelete: PagesFunction<TenantEnv> = async (context) => {
  const access = await authorizeWorkspace(context, true);
  if ("response" in access) return access.response;
  const { db, user, clinicId } = access;

  const itemKey = new URL(context.request.url).searchParams.get("key");
  if (!validKey(itemKey)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);
  const configError = cryptoConfigurationError(context.env);
  if (configError) return configError;

  try {
    const keyHash = await itemKeyHash(context.env, clinicId, user.id, itemKey);
    const deletion = db.prepare(
      `DELETE FROM ${TABLE} WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ?`,
    ).bind(clinicId, user.id, keyHash);
    const audit = prepareSaasAudit(db, {
      clinicId,
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
