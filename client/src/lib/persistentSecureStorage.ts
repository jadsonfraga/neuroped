// ============================================================
// persistentSecureStorage.ts
// Armazenamento cifrado persistente para preferências locais que PRECISAM
// sobreviver a reload, sem mudar a semântica efêmera do secureStorage clínico.
//
// A chave AES-GCM é não exportável e persistida pelo IndexedDB via structured
// clone de CryptoKey. O ciphertext e a chave ficam em object stores separadas.
// Isso reduz exposição em repouso e evita voltar a gravar frases da CAA em
// texto puro no localStorage. Como todo storage browser-side, não protege contra
// JavaScript malicioso executando na mesma origem (XSS).
// ============================================================

const DB_NAME = "neuroped-persistent-secure-v1";
const DB_VERSION = 1;
const KEY_STORE = "keys";
const VALUE_STORE = "values";
const MASTER_KEY_ID = "aes-gcm-master-v1";
const AAD_PREFIX = "neuroped:persistent-secure:";
const MAX_PERSISTENT_PLAINTEXT_BYTES = 2_000_000;

interface PersistentEnvelope {
  v: 1;
  iv: Uint8Array;
  ct: ArrayBuffer;
  savedAt: number;
}

function idbAvailable(): boolean {
  return (
    typeof indexedDB !== "undefined" &&
    typeof globalThis.crypto?.subtle !== "undefined"
  );
}

function isCryptoKey(value: unknown): value is CryptoKey {
  return typeof CryptoKey !== "undefined" && value instanceof CryptoKey;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

async function openDatabase(): Promise<IDBDatabase | null> {
  if (!idbAvailable()) return null;
  try {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
      if (!db.objectStoreNames.contains(VALUE_STORE)) db.createObjectStore(VALUE_STORE);
    };
    return await requestResult(request);
  } catch {
    return null;
  }
}

/**
 * Seleciona/cria a chave dentro de UMA transação readwrite serializada pelo IDB.
 * O candidato é gerado antes da transação; assim nenhum `await` externo deixa a
 * transação inativa, e duas abas que inicializem juntas convergem para a mesma
 * chave em vez de sobrescreverem uma à outra.
 */
async function getOrCreateMasterKey(db: IDBDatabase): Promise<CryptoKey> {
  const candidate = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return new Promise<CryptoKey>((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, "readwrite");
    const store = tx.objectStore(KEY_STORE);
    const request = store.get(MASTER_KEY_ID);
    let selected: CryptoKey = candidate;

    request.onsuccess = () => {
      if (isCryptoKey(request.result)) {
        selected = request.result;
      } else {
        store.put(candidate, MASTER_KEY_ID);
      }
    };
    request.onerror = () => {
      try {
        tx.abort();
      } catch {
        // A rejeição abaixo é suficiente.
      }
    };
    tx.oncomplete = () => resolve(selected);
    tx.onabort = () =>
      reject(tx.error ?? request.error ?? new Error("Persistent key transaction aborted"));
    tx.onerror = () =>
      reject(tx.error ?? request.error ?? new Error("Persistent key transaction failed"));
  });
}

function isEnvelope(value: unknown): value is PersistentEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistentEnvelope>;
  return (
    candidate.v === 1 &&
    candidate.iv instanceof Uint8Array &&
    candidate.ct instanceof ArrayBuffer &&
    typeof candidate.savedAt === "number" &&
    Number.isFinite(candidate.savedAt)
  );
}

/**
 * Persiste um valor cifrado. Retorna false se IndexedDB/WebCrypto não estiverem
 * disponíveis ou se a gravação falhar; nunca faz fallback para texto puro.
 */
export async function persistentSecureSet<T>(
  key: string,
  value: T,
): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;

  try {
    const masterKey = await getOrCreateMasterKey(db);
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    if (plaintext.byteLength > MAX_PERSISTENT_PLAINTEXT_BYTES) return false;

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const additionalData = new TextEncoder().encode(AAD_PREFIX + key);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData },
      masterKey,
      plaintext,
    );

    const envelope: PersistentEnvelope = {
      v: 1,
      iv,
      ct: ciphertext,
      savedAt: Date.now(),
    };
    const tx = db.transaction(VALUE_STORE, "readwrite");
    tx.objectStore(VALUE_STORE).put(envelope, key);
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  } finally {
    db.close();
  }
}

/** Recupera um valor persistente; corrupção/falha de cifra nunca vira plaintext. */
export async function persistentSecureGet<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  try {
    const readTx = db.transaction(VALUE_STORE, "readonly");
    const raw = await requestResult(readTx.objectStore(VALUE_STORE).get(key));
    await transactionDone(readTx);
    if (raw === undefined) return null;
    if (!isEnvelope(raw)) {
      // Estrutura incompatível é verificavelmente inválida e pode ser removida.
      await deleteValue(db, key);
      return null;
    }

    const masterKey = await getOrCreateMasterKey(db);
    const additionalData = new TextEncoder().encode(AAD_PREFIX + key);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: raw.iv, additionalData },
      masterKey,
      raw.ct,
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    // Falha de IndexedDB/WebCrypto pode ser transitória. Não destruir a única
    // cópia cifrada: uma leitura futura pode se recuperar sem perda da prancha.
    return null;
  } finally {
    db.close();
  }
}

async function deleteValue(db: IDBDatabase, key: string): Promise<void> {
  const tx = db.transaction(VALUE_STORE, "readwrite");
  tx.objectStore(VALUE_STORE).delete(key);
  await transactionDone(tx);
}

export async function persistentSecureClear(key: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  try {
    await deleteValue(db, key);
  } finally {
    db.close();
  }
}

/**
 * Limpeza de sessão/login: remove valores E a chave não exportável, garantindo
 * que ciphertext residual não permaneça recuperável após troca de usuário.
 */
export async function persistentSecureClearAll(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

export const PERSISTENT_SECURE_STORAGE_DB = DB_NAME;
