/**
 * secureStorage.ts
 * Armazenamento cifrado via AES-GCM (Web Crypto API).
 *
 * USO:
 *   await secureSet("minha-chave", { campo: "valor" });
 *   const dado = await secureGet<MeuTipo>("minha-chave");
 *   await secureClear("minha-chave");
 *   await secureClearAll();   // limpa todos os itens gerenciados
 *
 * SEGURANÇA:
 *  - Chave AES-256 aleatória, não exportável e mantida somente em memória
 *  - IV gerado aleatoriamente por escrita
 *  - Dados expiram automaticamente após SESSION_TTL_MS (padrão 8h)
 *  - O ciphertext fica no sessionStorage, isolado por aba; a chave não é persistida
 *  - Recarregar/fechar a aba invalida os rascunhos, por desenho de segurança
 *
 * EXCEÇÃO DELIBERADA:
 *  - A workspace da CAA é uma preferência funcional de longo prazo e precisa
 *    sobreviver a reload. Só essa chave é delegada ao IndexedDB cifrado com
 *    CryptoKey não exportável; os rascunhos clínicos continuam efêmeros.
 *
 * LGPD / LIMITAÇÕES:
 *  - sessionStorage cifrado NÃO substitui armazenamento server-side para dados de pacientes
 *  - Deve ser usado apenas para rascunhos/contexto de sessão clínica
 *  - Use exclusivamente para dados SEM identificação direta quando possível
 *
 * Dados de pré-consulta/pré-retorno são migrados para este armazenamento e
 * expiram ao fim da sessão clínica. A cifra reduz exposição de dados em repouso,
 * mas não protege contra código malicioso executando na mesma origem (XSS).
 */

import {
  persistentSecureClear,
  persistentSecureClearAll,
  persistentSecureGet,
  persistentSecureSet,
} from "@/lib/persistentSecureStorage";

const NAMESPACE = "neuroped:secure:";
const PERSISTENT_SECURE_KEYS = new Set(["caa:workspace:v3"]);
// Mantido apenas para migrar envelopes da versão anterior, cuja chave era
// derivável do próprio salt. Novas gravações nunca persistem material de chave.
const SESSION_SALT_KEY = "neuroped:secure-salt";
const LEGACY_SENSITIVE_KEYS = [
  "neuroped:pre-consultas",
  "neuroped:pre-retornos",
  "neuroped:assinatura:registros:v1",
  "neuroped:diario:sono:v1",
  "neuroped:diario:alimentar:v1",
  "neuroped:diario:escola:v1",
  "neuroped:cognitive-lab:sessions",
  "neuroped:caa:board:v1",
  "neuroped:caa:favs:v1",
  "neuroped:caa:hist:v1",
  "np_filtro_state_v1",
  "neuroped:filter-flash",
];
// Rascunhos antigos de escalas eram gravados em texto puro no localStorage.
// A limpeza global precisa removê-los mesmo quando ainda não foram migrados
// para o envelope cifrado do useSecureScaleDraft.
const LEGACY_SENSITIVE_PREFIXES = ["neuroped:scale-draft:"];
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas de sessão clínica
const LEGACY_PBKDF2_ITERATIONS = 100_000;
export const MAX_SECURE_PLAINTEXT_BYTES = 2_000_000;
const BASE64_CHUNK_BYTES = 0x8000;

interface StoredEnvelope {
  v?: 2;
  iv: string; // Base64 — 12 bytes aleatórios
  ct: string; // Base64 — ciphertext AES-GCM
  exp: number; // Timestamp de expiração (ms desde epoch)
}

// ---------- Chave de sessão em memória ----------
let _sessionKey: CryptoKey | null = null;

function isPersistentSecureKey(key: string): boolean {
  return PERSISTENT_SECURE_KEYS.has(key);
}

/**
 * Retorna ou cria uma chave AES-GCM efêmera. Não persistir a chave é a única
 * forma de o armazenamento local manter confidencialidade sem pedir ao usuário
 * outro segredo. O custo deliberado é perder rascunhos após recarregar a aba.
 */
async function getSessionKey(): Promise<CryptoKey> {
  if (_sessionKey) return _sessionKey;
  _sessionKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return _sessionKey;
}

/** Compatibilidade de leitura com envelopes v1; toda leitura é regravada em v2. */
async function getLegacySessionKey(): Promise<CryptoKey | null> {
  const sessionSalt = readStorage(getSessionStorage(), SESSION_SALT_KEY);
  if (!sessionSalt) return null;
  let saltBytes: Uint8Array;
  try {
    saltBytes = unb64(sessionSalt);
  } catch {
    return null;
  }
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`neuroped-session-${sessionSalt.slice(0, 8)}`),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: LEGACY_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // não exportável
    ["encrypt", "decrypt"],
  );
}

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  // Espalhar buffers clínicos grandes como argumentos excede a pilha do V8.
  // Blocos mantêm a conversão estável sem depender de Buffer (indisponível no browser).
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_BYTES) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + BASE64_CHUNK_BYTES),
    );
  }
  return btoa(binary);
}

function unb64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function getSessionStorage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

function readStorage(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function removeStorage(storage: Storage | null, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Armazenamento bloqueado: não há ação segura adicional.
  }
}

function writeStorage(
  storage: Storage | null,
  key: string,
  value: string,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function parseEnvelope(raw: string): StoredEnvelope | null {
  try {
    const value = JSON.parse(raw) as Partial<StoredEnvelope>;
    if (
      (value.v !== undefined && value.v !== 2) ||
      typeof value.iv !== "string" ||
      typeof value.ct !== "string" ||
      typeof value.exp !== "number" ||
      !Number.isFinite(value.exp)
    ) {
      return null;
    }
    return value as StoredEnvelope;
  } catch {
    return null;
  }
}

async function decryptEnvelope<T>(
  key: string,
  envelope: StoredEnvelope,
): Promise<T> {
  const aesKey =
    envelope.v === 2 ? await getSessionKey() : await getLegacySessionKey();
  if (!aesKey) throw new Error("legacy secure-storage key unavailable");
  const iv = unb64(envelope.iv);
  const ct = unb64(envelope.ct);
  const additionalData = new TextEncoder().encode(NAMESPACE + key);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData },
    aesKey,
    ct,
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

// ---------- API pública ----------

/**
 * Armazena valor cifrado. Rascunhos clínicos ficam no sessionStorage da aba;
 * a workspace CAA usa IndexedDB cifrado porque precisa sobreviver a reload.
 */
export async function secureSet<T>(
  key: string,
  value: T,
  ttlMs = SESSION_TTL_MS,
): Promise<boolean> {
  if (isPersistentSecureKey(key)) {
    return persistentSecureSet(key, value);
  }

  try {
    const aesKey = await getSessionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    if (plaintext.byteLength > MAX_SECURE_PLAINTEXT_BYTES) {
      console.warn(
        "[secureStorage] conteúdo excede o limite seguro da sessão.",
      );
      return false;
    }
    const additionalData = new TextEncoder().encode(NAMESPACE + key);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData },
      aesKey,
      plaintext,
    );

    const envelope: StoredEnvelope = {
      v: 2,
      iv: b64(iv),
      ct: b64(ciphertext),
      exp: Date.now() + ttlMs,
    };

    const stored = writeStorage(
      getSessionStorage(),
      NAMESPACE + key,
      JSON.stringify(envelope),
    );
    if (!stored) {
      console.warn("[secureStorage] sessionStorage cheio ou indisponível.");
    }
    return stored;
  } catch {
    console.warn(
      "[secureStorage] não foi possível proteger o conteúdo da sessão.",
    );
    return false;
  }
}

/**
 * Recupera e decifra o valor. A CAA consulta primeiro o cofre persistente;
 * demais chaves mantêm exatamente a semântica efêmera histórica.
 */
export async function secureGet<T>(key: string): Promise<T | null> {
  if (isPersistentSecureKey(key)) {
    return persistentSecureGet<T>(key);
  }

  const storageKey = NAMESPACE + key;
  const scopedStorage = getSessionStorage();
  const scopedRaw = readStorage(scopedStorage, storageKey);

  if (scopedRaw) {
    const envelope = parseEnvelope(scopedRaw);
    if (!envelope || Date.now() > envelope.exp) {
      removeStorage(scopedStorage, storageKey);
    } else {
      try {
        const value = await decryptEnvelope<T>(key, envelope);
        if (envelope.v !== 2) {
          const remainingTtl = Math.max(1, envelope.exp - Date.now());
          await secureSet(key, value, remainingTtl);
        }
        return value;
      } catch {
        // Chave efêmera perdida por reload ou envelope corrompido: o conteúdo
        // não pode ser recuperado e é removido do escopo desta aba.
        removeStorage(scopedStorage, storageKey);
      }
    }
  }

  // Migração do formato anterior: ciphertext no localStorage e salt na aba que
  // o criou. Outra aba pode enxergá-lo, mas não consegue decriptá-lo.
  const legacyStorage = getLocalStorage();
  const legacyRaw = readStorage(legacyStorage, storageKey);
  if (!legacyRaw) return null;
  const legacyEnvelope = parseEnvelope(legacyRaw);
  if (!legacyEnvelope) return null;
  if (Date.now() > legacyEnvelope.exp) {
    // Expiração é verificável sem chave e vale para todas as abas.
    if (readStorage(legacyStorage, storageKey) === legacyRaw) {
      removeStorage(legacyStorage, storageKey);
    }
    return null;
  }

  try {
    const value = await decryptEnvelope<T>(key, legacyEnvelope);
    // Converte o envelope compartilhado para v2 com chave efêmera desta aba.
    const migrated = await secureSet(
      key,
      value,
      Math.max(1, legacyEnvelope.exp - Date.now()),
    );
    if (migrated && readStorage(legacyStorage, storageKey) === legacyRaw) {
      removeStorage(legacyStorage, storageKey);
    }
    return value;
  } catch {
    // Chave divergente não prova corrupção: provavelmente pertence a outra aba.
    return null;
  }
}

/**
 * Remove entrada cifrada específica.
 */
export async function secureClear(key: string): Promise<void> {
  if (isPersistentSecureKey(key)) {
    await persistentSecureClear(key);
  }

  const storageKey = NAMESPACE + key;
  removeStorage(getSessionStorage(), storageKey);

  // Limpa a entrada legada apenas quando esta aba comprova que possui a chave.
  // Assim, "começar do zero" não destrói um rascunho antigo de outra aba.
  const legacyStorage = getLocalStorage();
  const legacyRaw = readStorage(legacyStorage, storageKey);
  if (!legacyRaw) return;
  const envelope = parseEnvelope(legacyRaw);
  if (!envelope) return;
  if (Date.now() > envelope.exp) {
    if (readStorage(legacyStorage, storageKey) === legacyRaw) {
      removeStorage(legacyStorage, storageKey);
    }
    return;
  }
  try {
    await decryptEnvelope(key, envelope);
    if (readStorage(legacyStorage, storageKey) === legacyRaw) {
      removeStorage(legacyStorage, storageKey);
    }
  } catch {
    // Ciphertext de outra aba: preservar até a aba proprietária migrar ou expirar.
  }
}

/**
 * Remove todos os itens gerenciados pelo secureStorage.
 */
export async function secureClearAll(): Promise<void> {
  const local = getLocalStorage();
  const scoped = getSessionStorage();
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < (local?.length ?? 0); i++) {
      const k = local?.key(i);
      if (
        k &&
        (k.startsWith(NAMESPACE) ||
          LEGACY_SENSITIVE_PREFIXES.some((prefix) => k.startsWith(prefix)))
      ) {
        toRemove.push(k);
      }
    }
    toRemove.push(...LEGACY_SENSITIVE_KEYS);
    toRemove.forEach((k) => removeStorage(local, k));
  } catch {
    // A chave em memória ainda será invalidada abaixo.
  }
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < (scoped?.length ?? 0); i++) {
      const k = scoped?.key(i);
      if (
        k &&
        (k.startsWith(NAMESPACE) ||
          LEGACY_SENSITIVE_PREFIXES.some((prefix) => k.startsWith(prefix)))
      ) {
        toRemove.push(k);
      }
    }
    // Alguns fluxos efêmeros (por exemplo, o filtro em modo flash) usam
    // sessionStorage com as mesmas chaves legadas. A limpeza explícita deve
    // removê-las também deste escopo, sem preservar contexto clínico por aba.
    toRemove.push(...LEGACY_SENSITIVE_KEYS);
    toRemove.forEach((k) => removeStorage(scoped, k));
  } catch {
    // A chave em memória ainda será invalidada abaixo.
  }

  // A CAA pode conter histórico/frases sensíveis. Logout/troca de conta também
  // destrói o cofre persistente e sua chave não exportável.
  await persistentSecureClearAll();

  // Invalida chave de sessão em memória
  _sessionKey = null;
  removeStorage(scoped, SESSION_SALT_KEY);
}

/**
 * Remove todos os itens expirados do secureStorage (limpeza preventiva).
 * Chamar na inicialização do app para liberar espaço.
 */
export function securePurgeExpired(): void {
  const purge = (storage: Storage | null, removeMalformed: boolean) => {
    if (!storage) return;
    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k?.startsWith(NAMESPACE)) continue;
      const raw = readStorage(storage, k);
      const env = raw ? parseEnvelope(raw) : null;
      if ((env && Date.now() > env.exp) || (!env && removeMalformed)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => removeStorage(storage, k));
  };

  try {
    // No escopo da própria aba, formato inválido é corrupção local. No legado
    // compartilhado, mantenha formatos desconhecidos por compatibilidade.
    purge(getSessionStorage(), true);
    purge(getLocalStorage(), false);
  } catch {
    // Limpeza preventiva não deve interromper a inicialização do app.
  }
}
