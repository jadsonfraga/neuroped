export interface ClinicalCryptoEnv {
  CLINICAL_DATA_KEY?: string;
  CLINICAL_DATA_KEY_ID?: string;
  CLINICAL_DATA_KEY_K1?: string;
  CLINICAL_INDEX_KEY?: string;
  CLINICAL_INDEX_KEY_ID?: string;
  CLINICAL_INDEX_KEY_K1?: string;
  CLINICAL_REQUIRE_ENCRYPTED?: string;
}

export interface ClinicalAad {
  entityType: string;
  entityId: string;
  patientId?: string | null;
}

export interface BlindTokenGroup {
  keyId: string;
  tokens: string[];
}

export class ClinicalCryptoError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ClinicalCryptoError";
    this.code = code;
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ENVELOPE_VERSION = "c1";
const INDEX_VERSION = "i1";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function validKeyId(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,31}$/i.test(value);
}

function activeDataKey(env: ClinicalCryptoEnv): { keyId: string; secret: string } {
  const secret = env.CLINICAL_DATA_KEY?.trim() ?? "";
  const keyId = env.CLINICAL_DATA_KEY_ID?.trim() || "k1";
  if (secret.length < 32 || !validKeyId(keyId)) {
    throw new ClinicalCryptoError(
      "CLINICAL_CRYPTO_NOT_CONFIGURED",
      "Criptografia clínica não está configurada corretamente.",
    );
  }
  return { keyId, secret };
}

function dataSecretFor(env: ClinicalCryptoEnv, keyId: string): string {
  const activeId = env.CLINICAL_DATA_KEY_ID?.trim() || "k1";
  const active = env.CLINICAL_DATA_KEY?.trim() ?? "";
  if (keyId === activeId && active.length >= 32) return active;
  if (keyId === "k1") {
    const archived = env.CLINICAL_DATA_KEY_K1?.trim() ?? "";
    if (archived.length >= 32) return archived;
    if (activeId === "k1" && active.length >= 32) return active;
  }
  throw new ClinicalCryptoError("CLINICAL_KEY_UNAVAILABLE", `Chave clínica '${keyId}' indisponível.`);
}

function indexKeys(env: ClinicalCryptoEnv): Array<{ keyId: string; secret: string }> {
  const activeId = env.CLINICAL_INDEX_KEY_ID?.trim() || "k1";
  const active = env.CLINICAL_INDEX_KEY?.trim() ?? "";
  if (active.length < 32 || !validKeyId(activeId)) {
    throw new ClinicalCryptoError(
      "CLINICAL_INDEX_NOT_CONFIGURED",
      "Índice cego clínico não está configurado corretamente.",
    );
  }
  const keys = [{ keyId: activeId, secret: active }];
  const archived = env.CLINICAL_INDEX_KEY_K1?.trim() ?? "";
  if (activeId !== "k1" && archived.length >= 32) keys.push({ keyId: "k1", secret: archived });
  return keys;
}

async function deriveAesKey(secret: string, keyId: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("neuroped-clinical-data-v1"),
      info: encoder.encode(`aes-gcm:${keyId}`),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function deriveIndexKey(secret: string, keyId: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("neuroped-clinical-index-v1"),
      info: encoder.encode(`hmac:${keyId}`),
    },
    material,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"],
  );
}

function aadBytes(aad: ClinicalAad): Uint8Array {
  return encoder.encode(
    JSON.stringify({
      entityType: aad.entityType,
      entityId: aad.entityId,
      patientId: aad.patientId ?? null,
    }),
  );
}

export function clinicalStrictMode(env: ClinicalCryptoEnv): boolean {
  return env.CLINICAL_REQUIRE_ENCRYPTED?.trim().toLowerCase() === "true";
}

export function clinicalCryptoConfigured(env: ClinicalCryptoEnv): boolean {
  try {
    activeDataKey(env);
    indexKeys(env);
    return true;
  } catch {
    return false;
  }
}

export function isEncryptedClinicalValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(`${ENVELOPE_VERSION}.`);
}

export async function encryptClinicalPayload(
  env: ClinicalCryptoEnv,
  aad: ClinicalAad,
  payload: unknown,
): Promise<string> {
  const { keyId, secret } = activeDataKey(env);
  const key = await deriveAesKey(secret, keyId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aadBytes(aad), tagLength: 128 },
    key,
    encoder.encode(JSON.stringify(payload)),
  );
  return `${ENVELOPE_VERSION}.${keyId}.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptClinicalPayload<T>(
  env: ClinicalCryptoEnv,
  aad: ClinicalAad,
  envelope: string,
): Promise<T> {
  const [version, keyId, ivEncoded, cipherEncoded, ...extra] = envelope.split(".");
  if (
    version !== ENVELOPE_VERSION ||
    !keyId ||
    !validKeyId(keyId) ||
    !ivEncoded ||
    !cipherEncoded ||
    extra.length > 0
  ) {
    throw new ClinicalCryptoError("CLINICAL_CIPHERTEXT_INVALID", "Envelope clínico inválido.");
  }
  try {
    const secret = dataSecretFor(env, keyId);
    const key = await deriveAesKey(secret, keyId);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64UrlToBytes(ivEncoded),
        additionalData: aadBytes(aad),
        tagLength: 128,
      },
      key,
      base64UrlToBytes(cipherEncoded),
    );
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch (error) {
    if (error instanceof ClinicalCryptoError) throw error;
    throw new ClinicalCryptoError(
      "CLINICAL_DECRYPTION_FAILED",
      "Registro clínico não pôde ser decifrado com a chave correspondente.",
    );
  }
}

export async function decryptClinicalOrLegacy<T>(
  env: ClinicalCryptoEnv,
  aad: ClinicalAad,
  stored: unknown,
  legacy: () => T,
): Promise<T> {
  if (isEncryptedClinicalValue(stored)) {
    return decryptClinicalPayload<T>(env, aad, stored);
  }
  if (clinicalStrictMode(env)) {
    throw new ClinicalCryptoError(
      "CLINICAL_PLAINTEXT_REJECTED",
      "Registro legado em texto aberto foi rejeitado pelo modo estrito.",
    );
  }
  return legacy();
}

function normalizeSearchText(value: string): string[] {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

function termsForIndexedText(values: Array<string | null | undefined>): string[] {
  const terms = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const word of normalizeSearchText(value)) {
      const capped = word.slice(0, 64);
      terms.add(`w:${capped}`);
      const maxPrefix = Math.min(capped.length, 32);
      for (let length = 1; length <= maxPrefix; length += 1) {
        terms.add(`p:${capped.slice(0, length)}`);
      }
    }
  }
  return [...terms].slice(0, 4096);
}

function termsForQuery(query: string): string[] {
  const terms = normalizeSearchText(query).map((word) => {
    const capped = word.slice(0, 64);
    return capped.length <= 32 ? `p:${capped}` : `w:${capped}`;
  });
  return [...new Set(terms)];
}

async function hmacHex(secret: string, keyId: string, value: string): Promise<string> {
  const key = await deriveIndexKey(secret, keyId);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function blindIndexTokens(
  env: ClinicalCryptoEnv,
  values: Array<string | null | undefined>,
): Promise<BlindTokenGroup> {
  const active = indexKeys(env)[0];
  const terms = termsForIndexedText(values);
  const tokens = await Promise.all(terms.map((term) => hmacHex(active.secret, active.keyId, term)));
  return { keyId: active.keyId, tokens: [...new Set(tokens)] };
}

export async function blindQueryTokenGroups(
  env: ClinicalCryptoEnv,
  query: string,
): Promise<BlindTokenGroup[]> {
  const terms = termsForQuery(query);
  if (terms.length === 0) return [];
  return Promise.all(
    indexKeys(env).map(async ({ keyId, secret }) => ({
      keyId,
      tokens: await Promise.all(terms.map((term) => hmacHex(secret, keyId, term))),
    })),
  );
}

export async function searchEncryptedEntityIds(
  env: ClinicalCryptoEnv,
  db: D1Database,
  entityType: string,
  fieldScope: string,
  query: string,
  limit = 500,
): Promise<string[]> {
  const groups = await blindQueryTokenGroups(env, query);
  const ids = new Set<string>();
  for (const group of groups) {
    if (group.tokens.length === 0) continue;
    const placeholders = group.tokens.map(() => "?").join(",");
    const rows = await db
      .prepare(
        `SELECT entity_id
           FROM clinical_search_tokens
          WHERE entity_type = ? AND field_scope = ? AND key_id = ?
            AND token_hash IN (${placeholders})
          GROUP BY entity_id
         HAVING COUNT(DISTINCT token_hash) = ?
          LIMIT ?`,
      )
      .bind(entityType, fieldScope, group.keyId, ...group.tokens, group.tokens.length, limit)
      .all<{ entity_id: string }>();
    for (const row of rows.results ?? []) ids.add(row.entity_id);
    if (ids.size >= limit) break;
  }
  return [...ids].slice(0, limit);
}

export function replaceBlindTokensStatements(
  db: D1Database,
  entityType: string,
  entityId: string,
  fieldScope: string,
  group: BlindTokenGroup,
): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `DELETE FROM clinical_search_tokens
          WHERE entity_type = ? AND entity_id = ? AND field_scope = ?`,
      )
      .bind(entityType, entityId, fieldScope),
  ];
  const chunkSize = 40;
  for (let index = 0; index < group.tokens.length; index += chunkSize) {
    const chunk = group.tokens.slice(index, index + chunkSize);
    const values = chunk.map(() => "(?, ?, ?, ?, ?)").join(",");
    const binds: unknown[] = [];
    for (const token of chunk) {
      binds.push(entityType, entityId, fieldScope, group.keyId, token);
    }
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO clinical_search_tokens
            (entity_type, entity_id, field_scope, key_id, token_hash)
           VALUES ${values}`,
        )
        .bind(...binds),
    );
  }
  return statements;
}
