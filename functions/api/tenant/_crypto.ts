import type { TenantEnv } from "./_core";

const FORMAT_VERSION = "v1";
const CRYPTO_FAMILY = "clinical-v1";
const KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

interface DataKeyDescriptor {
  id: string;
  secret: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.charCodeAt(index);
  }
  return out;
}

function keyId(value: string | undefined, fallback: string): string {
  const normalized = value?.trim() || fallback;
  if (!KEY_ID_PATTERN.test(normalized)) throw new Error("CLINICAL_KEY_ID_INVALID");
  return normalized;
}

function descriptor(secret: string | undefined, id: string | undefined, fallbackId: string): DataKeyDescriptor | null {
  const normalizedSecret = secret?.trim();
  if (!normalizedSecret || normalizedSecret.length < 32) return null;
  return { id: keyId(id, fallbackId), secret: normalizedSecret };
}

function currentDataKey(env: TenantEnv): DataKeyDescriptor {
  const current = descriptor(env.CLINICAL_DATA_KEY, env.CLINICAL_DATA_KEY_ID, "k1");
  if (!current) throw new Error("CLINICAL_CRYPTO_NOT_CONFIGURED");
  return current;
}

function dataKeyForId(env: TenantEnv, requestedId: string): DataKeyDescriptor {
  const current = descriptor(env.CLINICAL_DATA_KEY, env.CLINICAL_DATA_KEY_ID, "k1");
  if (current?.id === requestedId) return current;
  const previous = descriptor(
    env.CLINICAL_DATA_KEY_PREVIOUS,
    env.CLINICAL_DATA_KEY_PREVIOUS_ID,
    "previous",
  );
  if (previous?.id === requestedId) return previous;
  throw new Error("CLINICAL_KEY_VERSION_UNAVAILABLE");
}

function requireIndexSecret(env: TenantEnv): Uint8Array {
  const source = env.CLINICAL_INDEX_KEY?.trim();
  if (!source || source.length < 32) throw new Error("CLINICAL_INDEX_KEY_NOT_CONFIGURED");
  return new TextEncoder().encode(source);
}

export function clinicalCryptoReady(env: TenantEnv): boolean {
  try {
    currentDataKey(env);
    requireIndexSecret(env);
    return true;
  } catch {
    return false;
  }
}

export function currentClinicalEncryptionVersion(env: TenantEnv): string {
  return `${CRYPTO_FAMILY}:${currentDataKey(env).id}`;
}

async function deriveClinicAesKey(
  descriptorValue: DataKeyDescriptor,
  clinicId: string,
): Promise<CryptoKey> {
  const source = new TextEncoder().encode(descriptorValue.secret);
  const keyMaterial = await crypto.subtle.importKey("raw", source, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode(`neuroped:${CRYPTO_FAMILY}:${descriptorValue.id}:${clinicId}`),
      info: new TextEncoder().encode("clinical-payload"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function blindIndexKey(env: TenantEnv): Promise<CryptoKey> {
  const source = requireIndexSecret(env);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array([
      ...new TextEncoder().encode("neuroped-clinical-blind-index-v1:"),
      ...source,
    ]),
  );
  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function aad(clinicId: string, purpose: string, keyVersion: string): Uint8Array {
  return new TextEncoder().encode(`${CRYPTO_FAMILY}:${keyVersion}:${clinicId}:${purpose}`);
}

export async function encryptClinicalJson(
  env: TenantEnv,
  clinicId: string,
  purpose: string,
  value: unknown,
): Promise<string> {
  const dataKey = currentDataKey(env);
  const key = await deriveClinicAesKey(dataKey, clinicId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad(clinicId, purpose, dataKey.id) },
    key,
    plain,
  );
  return `${FORMAT_VERSION}.${dataKey.id}.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipher))}`;
}

export async function decryptClinicalJson<T>(
  env: TenantEnv,
  clinicId: string,
  purpose: string,
  payload: string,
): Promise<T> {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  }
  const [, requestedKeyId, ivB64, cipherB64] = parts;
  if (!requestedKeyId || !KEY_ID_PATTERN.test(requestedKeyId) || !ivB64 || !cipherB64) {
    throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  }
  const dataKey = dataKeyForId(env, requestedKeyId);
  const key = await deriveClinicAesKey(dataKey, clinicId);
  try {
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(ivB64),
        additionalData: aad(clinicId, purpose, dataKey.id),
      },
      key,
      base64ToBytes(cipherB64),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    throw new Error("CLINICAL_DECRYPT_FAILED");
  }
}

export async function clinicalBlindIndex(
  env: TenantEnv,
  clinicId: string,
  purpose: string,
  value: string,
): Promise<string> {
  const key = await blindIndexKey(env);
  const normalized = value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${clinicId}:${purpose}:${normalized}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
