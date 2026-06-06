/**
 * Criptografia simetrica AES-256-GCM para campos sensiveis em repouso.
 *
 * Convencoes:
 *  - Algoritmo: AES-256-GCM (autenticado).
 *  - Chave: 32 bytes (256 bits) derivados de NEUROPED_MASTER_KEY via PBKDF2-SHA256.
 *  - IV: 12 bytes aleatorios por mensagem (NIST recomendacao para GCM).
 *  - Auth tag: 16 bytes anexado ao payload.
 *  - Formato de saida: base64( salt(16) | iv(12) | tag(16) | ciphertext(N) ).
 *
 * Cada chamada de encrypt usa um salt novo. PBKDF2 e re-executado a cada chamada
 * (custo: ~100k iteracoes). Em ambiente de alta carga, considerar cache de
 * chaves derivadas em memoria por (salt -> key).
 */

import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32; // 256 bits
const IV_LEN = 12; // 96 bits para GCM
const TAG_LEN = 16; // 128 bits
const SALT_LEN = 16; // 128 bits
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DIGEST = "sha256";

export class CryptoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CryptoConfigurationError";
  }
}

export class CryptoIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CryptoIntegrityError";
  }
}

function getMasterKey(): Buffer {
  const raw = process.env.NEUROPED_MASTER_KEY;
  if (!raw) {
    throw new CryptoConfigurationError(
      "NEUROPED_MASTER_KEY ausente no ambiente. Defina-a com pelo menos 32 caracteres aleatorios em .env.",
    );
  }
  if (raw.length < 32) {
    throw new CryptoConfigurationError(
      "NEUROPED_MASTER_KEY muito curta. Minimo 32 caracteres aleatorios.",
    );
  }
  return Buffer.from(raw, "utf8");
}

function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    getMasterKey(),
    salt,
    PBKDF2_ITERATIONS,
    KEY_LEN,
    PBKDF2_DIGEST,
  );
}

/**
 * Criptografa uma string e retorna payload em base64 pronto para gravar.
 * Retorna null para entrada nula/vazia (politica de minimizacao).
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;

  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(salt);

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, ct]).toString("base64");
}

/**
 * Descriptografa um payload produzido por encrypt(). Lanca CryptoIntegrityError
 * se o auth tag nao bater (indica adulteracao ou chave incorreta).
 */
export function decrypt(payload: string | null | undefined): string | null {
  if (payload == null || payload === "") return null;

  const buf = Buffer.from(payload, "base64");
  if (buf.length < SALT_LEN + IV_LEN + TAG_LEN + 1) {
    throw new CryptoIntegrityError("Payload criptografado muito curto");
  }

  const salt = buf.subarray(0, SALT_LEN);
  const iv = buf.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = buf.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const ct = buf.subarray(SALT_LEN + IV_LEN + TAG_LEN);

  const key = deriveKey(salt);

  try {
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch (e) {
    throw new CryptoIntegrityError(
      "Falha ao decriptar (auth tag invalido). Possivel adulteracao do dado ou chave mestra alterada.",
    );
  }
}

/**
 * Hash determinístico para busca de campos sensiveis sem expor o plaintext.
 * Usa HMAC-SHA256 com a chave mestra como segredo.
 *
 * Util para criar indice pesquisavel de CPF: armazena cpfEncrypted (AES-GCM,
 * nao pesquisavel) + cpfHash (HMAC, pesquisavel mas nao reversivel).
 */
export function deterministicHash(input: string | null | undefined): string | null {
  if (input == null || input === "") return null;
  const normalized = input.trim().replace(/\D/g, "");
  if (!normalized) return null;
  return crypto
    .createHmac("sha256", getMasterKey())
    .update(normalized)
    .digest("hex");
}

/**
 * Gera token aleatorio criptograficamente seguro em base64url.
 * Tamanho padrao: 32 bytes (256 bits).
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Hash SHA-256 de um valor em hex. Usado para guardar refresh tokens
 * sem armazenar o valor original em claro.
 */
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
