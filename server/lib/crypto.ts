/**
 * Criptografia simetrica AES-256-GCM para campos sensiveis em repouso.
 *
 * Formato novo (v1):  0x01 | IV(12) | TAG(16) | CT(N)  — chave derivada uma vez na inicializacao.
 * Formato legado:     SALT(16) | IV(12) | TAG(16) | CT(N) — PBKDF2 por chamada (compatibilidade leitura).
 *
 * A chave de instancia e derivada via PBKDF2-SHA256 com salt fixo (sha256 da master key)
 * uma unica vez ao primeiro uso. Isso elimina o bloqueio do event loop causado por
 * 100k iteracoes PBKDF2 em cada chamada de encrypt/decrypt.
 */

import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;
const SALT_LEN = 16;
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DIGEST = "sha256";
const VERSION_V1 = 0x01;

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

  /**
   * Compatibilidade criptografica:
   *
   * O secret e normalmente GERADO como texto Base64, mas historicamente o
   * NeuroPed usa esse valor como segredo opaco UTF-8 na PBKDF2/HMAC. Decodificar
   * silenciosamente a string como Base64 muda o material da chave e torna
   * ciphertexts e hashes determinísticos anteriores incompativeis.
   *
   * Qualquer mudanca futura de representacao exige envelope/versionamento de
   * chave e migracao coordenada; nunca reinterpretar um secret existente.
   */
  return Buffer.from(raw, "utf8");
}

// Chave de instancia: derivada uma vez e armazenada em memoria.
let _instanceKey: Buffer | null = null;

function getInstanceKey(): Buffer {
  if (_instanceKey) return _instanceKey;
  const masterKey = getMasterKey();
  // Salt fixo e determinístico: primeiros 16 bytes do SHA-256 da master key.
  const fixedSalt = crypto.createHash("sha256").update(masterKey).digest().subarray(0, SALT_LEN);
  _instanceKey = crypto.pbkdf2Sync(masterKey, fixedSalt, PBKDF2_ITERATIONS, KEY_LEN, PBKDF2_DIGEST);
  return _instanceKey;
}

/**
 * Criptografa uma string e retorna payload em base64 pronto para gravar.
 * Retorna null para entrada nula/vazia (politica de minimizacao).
 * Formato: 0x01 | IV(12) | TAG(16) | CT(N).
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;

  const key = getInstanceKey();
  const iv = crypto.randomBytes(IV_LEN);

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([Buffer.from([VERSION_V1]), iv, tag, ct]).toString("base64");
}

/**
 * Descriptografa um payload produzido por encrypt() ou pelo formato legado.
 * Detecta o formato pelo primeiro byte: 0x01 = novo, outro valor = legado.
 */
export function decrypt(payload: string | null | undefined): string | null {
  if (payload == null || payload === "") return null;

  const buf = Buffer.from(payload, "base64");

  if (buf.length >= 1 + IV_LEN + TAG_LEN + 1 && buf[0] === VERSION_V1) {
    return _decryptV1(buf);
  }

  if (buf.length >= SALT_LEN + IV_LEN + TAG_LEN + 1) {
    return _decryptLegacy(buf);
  }

  throw new CryptoIntegrityError("Payload criptografado muito curto");
}

function _decryptV1(buf: Buffer): string {
  const iv = buf.subarray(1, 1 + IV_LEN);
  const tag = buf.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN);
  const ct = buf.subarray(1 + IV_LEN + TAG_LEN);
  const key = getInstanceKey();

  try {
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch (_e) {
    // Guarda: se o primeiro byte do salt legado era 0x01 por acaso, tenta formato legado.
    if (buf.length >= SALT_LEN + IV_LEN + TAG_LEN + 1) {
      return _decryptLegacy(buf);
    }
    throw new CryptoIntegrityError(
      "Falha ao decriptar (auth tag invalido). Possivel adulteracao do dado ou chave mestra alterada.",
    );
  }
}

function _decryptLegacy(buf: Buffer): string {
  const salt = buf.subarray(0, SALT_LEN);
  const iv = buf.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = buf.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const ct = buf.subarray(SALT_LEN + IV_LEN + TAG_LEN);
  const key = crypto.pbkdf2Sync(getMasterKey(), salt, PBKDF2_ITERATIONS, KEY_LEN, PBKDF2_DIGEST);

  try {
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    throw new CryptoIntegrityError(
      "Falha ao decriptar (auth tag invalido). Possivel adulteracao do dado ou chave mestra alterada.",
    );
  }
}

/**
 * Hash determinístico para busca de campos sensiveis sem expor o plaintext.
 * Usa HMAC-SHA256 com a chave mestra como segredo.
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
