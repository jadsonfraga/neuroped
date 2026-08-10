export class ImportCryptoConfigurationError extends Error {
  constructor(message = "Chave de criptografia de importação não configurada.") {
    super(message);
    this.name = "ImportCryptoConfigurationError";
  }
}

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

export async function importCryptoKey(secret: string | undefined): Promise<CryptoKey> {
  if (!secret) throw new ImportCryptoConfigurationError();
  const raw = base64UrlToBytes(secret.trim());
  if (raw.byteLength !== 32) {
    throw new ImportCryptoConfigurationError(
      "NEUROPED_IMPORT_ENCRYPTION_KEY deve conter exatamente 32 bytes em Base64/Base64URL.",
    );
  }
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
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
  const encoded = new TextEncoder().encode(input);
  const encrypted = await encryptImportBytes(key, encoded.buffer);
  return {
    ciphertext: bytesToBase64Url(new Uint8Array(encrypted.ciphertext)),
    iv: encrypted.iv,
  };
}

export async function sha256Hex(input: ArrayBuffer | string): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
}
