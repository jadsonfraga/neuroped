import type { TenantEnv } from "./_core";

const VERSION = "clinical-v1";

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

function requireClinicalSecret(env: TenantEnv): Uint8Array {
  const source = env.CLINICAL_DATA_KEY?.trim();
  if (!source || source.length < 32) {
    throw new Error("CLINICAL_CRYPTO_NOT_CONFIGURED");
  }
  return new TextEncoder().encode(source);
}

async function deriveClinicAesKey(env: TenantEnv, clinicId: string): Promise<CryptoKey> {
  const source = requireClinicalSecret(env);
  const keyMaterial = await crypto.subtle.importKey("raw", source, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode(`neuroped:${VERSION}:${clinicId}`),
      info: new TextEncoder().encode("clinical-payload"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function blindIndexKey(env: TenantEnv): Promise<CryptoKey> {
  const source = requireClinicalSecret(env);
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

function aad(clinicId: string, purpose: string): Uint8Array {
  return new TextEncoder().encode(`${VERSION}:${clinicId}:${purpose}`);
}

export async function encryptClinicalJson(
  env: TenantEnv,
  clinicId: string,
  purpose: string,
  value: unknown,
): Promise<string> {
  const key = await deriveClinicAesKey(env, clinicId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad(clinicId, purpose) },
    key,
    plain,
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipher))}`;
}

export async function decryptClinicalJson<T>(
  env: TenantEnv,
  clinicId: string,
  purpose: string,
  payload: string,
): Promise<T> {
  const [version, ivB64, cipherB64] = payload.split(".");
  if (version !== "v1" || !ivB64 || !cipherB64) {
    throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  }
  const key = await deriveClinicAesKey(env, clinicId);
  try {
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(ivB64),
        additionalData: aad(clinicId, purpose),
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

export const CLINICAL_ENCRYPTION_VERSION = VERSION;
