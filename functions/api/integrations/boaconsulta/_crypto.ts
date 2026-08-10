export class ImportCryptoConfigurationError extends Error {
  constructor(message = "Chave de criptografia de importação não configurada.") {
    super(message);
    this.name = "ImportCryptoConfigurationError";
  }
}

const encoder = new TextEncoder();
const HKDF_SALT = encoder.encode("NeuroPed/BoaConsulta/import/v1");
let keyedStringHashKey: CryptoKey | null = null;

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new ImportCryptoConfigurationError("NEUROPED_IMPORT_ENCRYPTION_KEY não é Base64 válido.");
  }
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function importRootKey(secret: string | undefined): Promise<CryptoKey> {
  if (!secret) throw new ImportCryptoConfigurationError();
  const raw = base64UrlToBytes(secret.trim());
  if (raw.byteLength !== 32) {
    throw new ImportCryptoConfigurationError(
      "NEUROPED_IMPORT_ENCRYPTION_KEY deve conter exatamente 32 bytes em Base64/Base64URL.",
    );
  }
  return crypto.subtle.importKey("raw", raw, "HKDF", false, ["deriveKey"]);
}

export async function importCryptoKey(secret: string | undefined): Promise<CryptoKey> {
  const root = await importRootKey(secret);
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: HKDF_SALT,
      info: encoder.encode("aes-gcm-content"),
    },
    root,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  // Mantemos uma subchave HMAC separada no isolate para os hashes de strings
  // executados após a chave de importação ser validada. Isso impede ataques de
  // correlação offline contra CPF/nome/data e contra linhas clínicas conhecidas.
  keyedStringHashKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: HKDF_SALT,
      info: encoder.encode("hmac-identifiers"),
    },
    root,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );

  return encryptionKey;
}

export async function encryptImportBytes(
  key: CryptoKey,
  input: ArrayBuffer,
): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes }, key, input);
  return { ciphertext, iv: bytesToBase64Url(ivBytes) };
}

export async function encryptImportText(
  key: CryptoKey,
  input: string,
): Promise<{ ciphertext: string; iv: string }> {
  const encoded = encoder.encode(input);
  const buffer = encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer;
  const encrypted = await encryptImportBytes(key, buffer);
  return {
    ciphertext: bytesToBase64Url(new Uint8Array(encrypted.ciphertext)),
    iv: encrypted.iv,
  };
}

/**
 * SHA-256 para bytes/arquivos; HMAC-SHA-256 para strings sensíveis depois que
 * importCryptoKey() inicializou a subchave do request/isolate.
 */
export async function sha256Hex(input: ArrayBuffer | string): Promise<string> {
  const bytes = typeof input === "string" ? encoder.encode(input) : new Uint8Array(input);
  if (typeof input === "string" && keyedStringHashKey) {
    const signature = await crypto.subtle.sign("HMAC", keyedStringHashKey, bytes);
    return bytesToHex(new Uint8Array(signature));
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}
