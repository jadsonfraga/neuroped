/**
 * Cofre do certificado A1 (.pfx/.p12) do administrador.
 *
 * - No app remoto, só o envelope cifrado com PBKDF2 + AES-GCM é enviado ao
 *   backend e fica vinculado à conta autenticada. PFX em claro e senha nunca
 *   são enviados nem persistidos.
 * - No modo local, mantém o cofre IndexedDB protegido por CryptoKey não-extraível.
 * - A senha só existe em memória enquanto o usuário valida/assina.
 * - Banco distinto do cache legado ("neuroped-icp"), que continua sendo apagado.
 */
export const VAULT_DB_NAME = "neuroped-cert-vault";
const STORE = "vault";
const DB_VERSION = 1;

export interface VaultUser {
  id: string;
  role: string;
}

interface VaultRecord {
  key: string;
  wrapKey: CryptoKey;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  fileName: string;
  savedAt: string;
}

export interface StoredCertificate {
  p12: ArrayBuffer;
  fileName: string;
  savedAt: string;
}

export function canUseCertificateVault(user: VaultUser | null | undefined): user is VaultUser {
  return !!user && user.role === "admin" && typeof user.id === "string" && user.id.length > 0;
}

function recordKey(userId: string): string {
  return `admin:${userId}`;
}

function hasPlatformSupport(): boolean {
  return typeof indexedDB !== "undefined" && typeof crypto !== "undefined" && !!crypto.subtle;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(VAULT_DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB indisponível."));
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = run(t.objectStore(STORE));
      let result: T;
      req.onsuccess = () => { result = req.result; };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error ?? new Error("Falha no cofre do certificado."));
      t.onabort = () => reject(t.error ?? new Error("Operação no cofre abortada."));
    });
  } finally {
    db.close();
  }
}

export async function saveCertificate(user: VaultUser | null | undefined, p12: ArrayBuffer, fileName: string): Promise<void> {
  if (!canUseCertificateVault(user)) throw new Error("Somente o administrador pode memorizar o certificado.");
  if (!hasPlatformSupport()) throw new Error("Este navegador não permite armazenar o certificado com segurança.");
  const wrapKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(recordKey(user.id));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, wrapKey, p12);
  const record: VaultRecord = {
    key: recordKey(user.id),
    wrapKey,
    iv,
    ciphertext,
    fileName: fileName.slice(0, 200),
    savedAt: new Date().toISOString(),
  };
  await tx("readwrite", (s) => s.put(record));
}

export async function loadCertificate(user: VaultUser | null | undefined): Promise<StoredCertificate | null> {
  if (!canUseCertificateVault(user) || !hasPlatformSupport()) return null;
  const record = await tx<VaultRecord | undefined>("readonly", (s) => s.get(recordKey(user.id)));
  if (!record) return null;
  const aad = new TextEncoder().encode(recordKey(user.id));
  try {
    const p12 = await crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv, additionalData: aad }, record.wrapKey, record.ciphertext);
    return { p12, fileName: record.fileName, savedAt: record.savedAt };
  } catch {
    return null;
  }
}

export async function forgetCertificate(user: VaultUser | null | undefined): Promise<void> {
  if (!user?.id || !hasPlatformSupport()) return;
  await tx("readwrite", (s) => s.delete(recordKey(user.id)));
}


// Cofre remoto: cifra no cliente com a senha confirmada do PFX antes do envio.
export const CERTIFICATE_VAULT_FORMAT_VERSION = 1;
// PBKDF2-HMAC-SHA256: 600.000 é o piso atual do OWASP (Bitwarden adotou o mesmo
// padrão em 2023). A contagem viaja no envelope: novos envelopes usam o valor
// corrente e envelopes antigos continuam abrindo com a contagem com que foram
// gravados, dentro da faixa aceita pelo banco.
export const CERTIFICATE_VAULT_KDF_ITERATIONS = 600_000;
export const CERTIFICATE_VAULT_MIN_ITERATIONS = 600_000;
export const CERTIFICATE_VAULT_MAX_ITERATIONS = 5_000_000;
const MAX_ACCOUNT_P12_BYTES = 1_200_000;

export interface AccountCertificateEnvelope {
  formatVersion: 1;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  updatedAt: string;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function certificateAad(userId: string): Uint8Array {
  return new TextEncoder().encode(`neuroped:certificate-vault:v${CERTIFICATE_VAULT_FORMAT_VERSION}:${userId}`);
}

function acceptedIterations(value: unknown): value is number {
  return Number.isInteger(value)
    && (value as number) >= CERTIFICATE_VAULT_MIN_ITERATIONS
    && (value as number) <= CERTIFICATE_VAULT_MAX_ITERATIONS;
}

async function passwordWrapKey(
  password: string,
  salt: Uint8Array,
  iterations: number = CERTIFICATE_VAULT_KDF_ITERATIONS,
): Promise<CryptoKey> {
  if (!password) throw new Error("Informe a senha correta do certificado.");
  if (!acceptedIterations(iterations)) throw new Error("Formato de cofre de certificado incompatível.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function accountVaultRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { authFetch } = await import("@/lib/authClient");
  const response = await authFetch(path, init);
  if (!response.ok) throw new Error(`Cofre de certificado indisponível (HTTP ${response.status}).`);
  return await response.json() as T;
}

/** Guarda somente ciphertext no backend, depois da validação local da senha do PFX. */
export async function saveCertificateToAccount(
  user: VaultUser | null | undefined,
  p12: ArrayBuffer,
  password: string,
): Promise<AccountCertificateEnvelope> {
  if (!canUseCertificateVault(user)) throw new Error("Somente o administrador pode guardar o certificado na conta.");
  if (!password) throw new Error("Valide o certificado com a senha antes de memorizar.");
  if (p12.byteLength === 0 || p12.byteLength > MAX_ACCOUNT_P12_BYTES) {
    throw new Error("Arquivo de certificado excede o limite do cofre.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await passwordWrapKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: certificateAad(user.id) },
    key,
    p12,
  );
  const payload = {
    formatVersion: CERTIFICATE_VAULT_FORMAT_VERSION,
    kdf: "PBKDF2-SHA256",
    iterations: CERTIFICATE_VAULT_KDF_ITERATIONS,
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(new Uint8Array(ciphertext)),
  } as const;

  const result = await accountVaultRequest<{ ok: true; updatedAt: string }>("/api/certificate-vault", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return { ...payload, updatedAt: result.updatedAt };
}

export async function loadCertificateFromAccount(
  user: VaultUser | null | undefined,
): Promise<AccountCertificateEnvelope | null> {
  if (!canUseCertificateVault(user)) return null;
  const result = await accountVaultRequest<{ certificate: AccountCertificateEnvelope | null }>("/api/certificate-vault", {
    method: "GET",
    cache: "no-store",
  });
  return result.certificate;
}

export async function unlockCertificateFromAccount(
  user: VaultUser | null | undefined,
  envelope: AccountCertificateEnvelope,
  password: string,
): Promise<ArrayBuffer> {
  if (!canUseCertificateVault(user)) throw new Error("Somente o administrador pode acessar o certificado da conta.");
  if (envelope.formatVersion !== CERTIFICATE_VAULT_FORMAT_VERSION ||
      envelope.kdf !== "PBKDF2-SHA256" ||
      !acceptedIterations(envelope.iterations)) {
    throw new Error("Formato de cofre de certificado incompatível.");
  }
  try {
    const key = await passwordWrapKey(password, decodeBase64(envelope.salt), envelope.iterations);
    return await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decodeBase64(envelope.iv),
        additionalData: certificateAad(user.id),
      },
      key,
      decodeBase64(envelope.ciphertext),
    );
  } catch {
    throw new Error("Senha incorreta ou certificado salvo indisponível.");
  }
}

export async function forgetCertificateFromAccount(
  user: VaultUser | null | undefined,
): Promise<void> {
  if (!canUseCertificateVault(user)) return;
  const { authFetch } = await import("@/lib/authClient");
  const response = await authFetch("/api/certificate-vault", { method: "DELETE" });
  if (!response.ok) throw new Error(`Não foi possível remover o certificado (HTTP ${response.status}).`);
}
