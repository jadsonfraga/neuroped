export const CLINICAL_ENVELOPE_VERSION = "c1" as const;
export const CLINICAL_LEGACY_SENTINEL = "__NEUROPED_ENCRYPTED_C1__";

export interface ClinicalFieldScope {
  table: string;
  rowId: string;
  field: string;
}

export interface ClinicalKeyring {
  active: string;
  previous?: string | null;
  strict?: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function assertSecret(secret: string, label = "CLINICAL_DATA_KEY"): string {
  const normalized = secret.trim();
  if (normalized.length < 32) throw new Error(`${label}_NOT_CONFIGURED`);
  return normalized;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function scopeAad(scope: ClinicalFieldScope): Uint8Array {
  return encoder.encode(`${CLINICAL_ENVELOPE_VERSION}|${scope.table}|${scope.rowId}|${scope.field}`);
}

async function sha256Bytes(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const material = await sha256Bytes(`neuroped:clinical:data:v1:${assertSecret(secret)}`);
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function blindKey(secret: string): Promise<CryptoKey> {
  const material = await sha256Bytes(`neuroped:clinical:blind:v1:${assertSecret(secret)}`);
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

export async function clinicalKeyId(secret: string): Promise<string> {
  const digest = await sha256Bytes(`neuroped:clinical:key-id:v1:${assertSecret(secret)}`);
  return Array.from(digest.slice(0, 8), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isClinicalEnvelope(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(`${CLINICAL_ENVELOPE_VERSION}.`);
}

export async function encryptClinicalText(secret: string, scope: ClinicalFieldScope, plaintext: string): Promise<string> {
  const normalized = assertSecret(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: scopeAad(scope), tagLength: 128 },
    await aesKey(normalized),
    encoder.encode(plaintext),
  );
  return [
    CLINICAL_ENVELOPE_VERSION,
    await clinicalKeyId(normalized),
    bytesToBase64Url(iv),
    bytesToBase64Url(new Uint8Array(ciphertext)),
  ].join(".");
}

async function decryptWithSecret(secret: string, scope: ClinicalFieldScope, envelope: string): Promise<string | null> {
  const parts = envelope.split(".");
  if (parts.length !== 4 || parts[0] !== CLINICAL_ENVELOPE_VERSION) return null;
  const [, keyId, ivRaw, cipherRaw] = parts;
  if (keyId !== (await clinicalKeyId(secret))) return null;
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(ivRaw), additionalData: scopeAad(scope), tagLength: 128 },
      await aesKey(secret),
      base64UrlToBytes(cipherRaw),
    );
    return decoder.decode(plaintext);
  } catch {
    return null;
  }
}

export async function decryptClinicalText(
  keyring: ClinicalKeyring,
  scope: ClinicalFieldScope,
  stored: string | null | undefined,
  legacyPlaintext?: string | null,
): Promise<string | null> {
  const active = assertSecret(keyring.active);
  if (stored) {
    const current = await decryptWithSecret(active, scope, stored);
    if (current !== null) return current;
    if (keyring.previous?.trim()) {
      const previous = await decryptWithSecret(
        assertSecret(keyring.previous, "CLINICAL_DATA_KEY_PREVIOUS"),
        scope,
        stored,
      );
      if (previous !== null) return previous;
    }
    throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  }
  if (legacyPlaintext && legacyPlaintext !== CLINICAL_LEGACY_SENTINEL) {
    if (keyring.strict) throw new Error("CLINICAL_PLAINTEXT_FORBIDDEN");
    return legacyPlaintext;
  }
  return null;
}

export async function encryptClinicalJson(secret: string, scope: ClinicalFieldScope, value: unknown): Promise<string> {
  return encryptClinicalText(secret, scope, JSON.stringify(value));
}

export async function decryptClinicalJson<T>(
  keyring: ClinicalKeyring,
  scope: ClinicalFieldScope,
  stored: string | null | undefined,
  legacyPlaintext?: string | null,
): Promise<T | null> {
  const text = await decryptClinicalText(keyring, scope, stored, legacyPlaintext);
  if (text === null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("CLINICAL_JSON_INVALID");
  }
}

export function normalizeClinicalSearch(value: string): string[] {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return [];
  return [...new Set(normalized.split(/\s+/).filter((token) => token.length >= 2).map((token) => token.slice(0, 24)))];
}

export function clinicalSearchIndexTerms(value: string): string[] {
  const terms = new Set<string>();
  for (const token of normalizeClinicalSearch(value)) {
    const max = Math.min(token.length, 24);
    for (let size = 2; size <= max; size += 1) terms.add(token.slice(0, size));
  }
  return [...terms];
}

export async function clinicalBlindToken(secret: string, resourceType: string, term: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await blindKey(secret),
    encoder.encode(`${resourceType}\u0000${term}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function clinicalBlindTokensForValue(secret: string, resourceType: string, value: string): Promise<string[]> {
  return Promise.all(clinicalSearchIndexTerms(value).map((term) => clinicalBlindToken(secret, resourceType, term)));
}

/**
 * Um grupo por termo pesquisado. Cada grupo contém o hash da chave ativa e,
 * durante rotação, o hash equivalente da chave anterior. O SQL pode exigir
 * pelo menos um hash de cada grupo sem perder resultados durante key rotation.
 */
export async function clinicalBlindTokenGroupsForQuery(
  keyring: ClinicalKeyring,
  resourceType: string,
  query: string,
): Promise<string[][]> {
  const activeSecret = assertSecret(keyring.active);
  const previousSecret = keyring.previous?.trim()
    ? assertSecret(keyring.previous, "CLINICAL_DATA_KEY_PREVIOUS")
    : null;
  const groups: string[][] = [];
  for (const term of normalizeClinicalSearch(query)) {
    const group = [await clinicalBlindToken(activeSecret, resourceType, term)];
    if (previousSecret) group.push(await clinicalBlindToken(previousSecret, resourceType, term));
    groups.push([...new Set(group)]);
  }
  return groups;
}

export async function clinicalBlindTokensForQuery(
  keyring: ClinicalKeyring,
  resourceType: string,
  query: string,
): Promise<string[]> {
  return [...new Set((await clinicalBlindTokenGroupsForQuery(keyring, resourceType, query)).flat())];
}
