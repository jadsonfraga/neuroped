/**
 * Cofre local do certificado A1 (.pfx/.p12) do administrador.
 *
 * - Somente usuário autenticado com papel "admin" pode memorizar/carregar.
 * - O .pfx (já cifrado pela própria senha PKCS#12) recebe um segundo envelope
 *   AES-GCM-256 com chave WebCrypto NÃO-EXTRAÍVEL gerada neste dispositivo.
 *   A chave fica no IndexedDB como CryptoKey opaca: nenhum script consegue
 *   exportá-la e o arquivo copiado do disco não é utilizável fora deste perfil.
 * - A SENHA DO CERTIFICADO NUNCA É ARMAZENADA. Ela é digitada a cada assinatura
 *   e descartada da memória junto com a chave privada.
 * - Nada é enviado ao servidor nem publicado em hospedagem estática.
 *
 * Banco distinto do cache legado ("neuroped-icp"), que continua sendo apagado.
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
