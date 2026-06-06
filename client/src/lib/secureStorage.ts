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
 *  - Chave AES derivada de um salt de sessão via PBKDF2 (não hardcoded)
 *  - IV gerado aleatoriamente por escrita
 *  - Dados expiram automaticamente após SESSION_TTL_MS (padrão 8h)
 *  - Nenhuma chave de criptografia é persistida — a chave é re-derivada em memória
 *
 * LGPD / LIMITAÇÕES:
 *  - localStorage cifrado NÃO substitui armazenamento server-side para dados de pacientes
 *  - Deve ser usado apenas para rascunhos/contexto de sessão clínica
 *  - Use exclusivamente para dados SEM identificação direta quando possível
 *
 * AUDITORIA DE localStorage (sessão 2 — 2026-05-08):
 *  Todos os usos mapeados são NÃO SENSÍVEIS:
 *    neuroped:onboarding-seen → flag de UI (sem dados pessoais)
 *    neuroped:sound-enabled   → preferência de UI
 *    neuroped:haptic-enabled  → preferência de UI
 *  Tokens de auth estão em sessionStorage (volátil) — correto.
 *  Nenhum dado de paciente encontrado em localStorage.
 */

const NAMESPACE = "neuroped:secure:";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas de sessão clínica
const PBKDF2_ITERATIONS = 100_000;

interface StoredEnvelope {
  iv: string;         // Base64 — 12 bytes aleatórios
  ct: string;         // Base64 — ciphertext AES-GCM
  exp: number;        // Timestamp de expiração (ms desde epoch)
}

// ---------- Chave de sessão em memória ----------
let _sessionKey: CryptoKey | null = null;
let _sessionSalt: string | null = null;

/**
 * Retorna ou cria a chave AES-GCM da sessão.
 * O salt é guardado em sessionStorage (volátil) para permitir re-derivação
 * na mesma aba sem exposição permanente.
 */
async function getSessionKey(): Promise<CryptoKey> {
  if (_sessionKey) return _sessionKey;

  // Recupera ou gera salt da sessão
  _sessionSalt = sessionStorage.getItem("neuroped:secure-salt") ?? null;
  if (!_sessionSalt) {
    const rawSalt = crypto.getRandomValues(new Uint8Array(16));
    _sessionSalt = btoa(String.fromCharCode(...rawSalt));
    sessionStorage.setItem("neuroped:secure-salt", _sessionSalt);
  }

  const saltBytes = Uint8Array.from(atob(_sessionSalt), (c) => c.charCodeAt(0));

  // Material base: fingerprint leve da sessão (não secreto, apenas evita reutilização entre sessões)
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`neuroped-session-${_sessionSalt.slice(0, 8)}`),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  _sessionKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // não exportável
    ["encrypt", "decrypt"],
  );

  return _sessionKey;
}

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function unb64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// ---------- API pública ----------

/**
 * Armazena valor cifrado no localStorage com expiração de sessão.
 */
export async function secureSet<T>(key: string, value: T, ttlMs = SESSION_TTL_MS): Promise<void> {
  const aesKey = await getSessionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plaintext);

  const envelope: StoredEnvelope = {
    iv: b64(iv),
    ct: b64(ciphertext),
    exp: Date.now() + ttlMs,
  };

  try {
    localStorage.setItem(NAMESPACE + key, JSON.stringify(envelope));
  } catch (e) {
    console.warn("[secureStorage] localStorage cheio ou indisponível.", e);
  }
}

/**
 * Recupera e decifra valor do localStorage. Retorna null se expirado, ausente ou corrompido.
 */
export async function secureGet<T>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(NAMESPACE + key);
  if (!raw) return null;

  let envelope: StoredEnvelope;
  try {
    envelope = JSON.parse(raw) as StoredEnvelope;
  } catch {
    localStorage.removeItem(NAMESPACE + key);
    return null;
  }

  // Verificar expiração
  if (Date.now() > envelope.exp) {
    localStorage.removeItem(NAMESPACE + key);
    return null;
  }

  try {
    const aesKey = await getSessionKey();
    const iv = unb64(envelope.iv);
    const ct = unb64(envelope.ct);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    // Dados corrompidos ou chave diferente (nova sessão) → remove
    localStorage.removeItem(NAMESPACE + key);
    return null;
  }
}

/**
 * Remove entrada cifrada específica.
 */
export async function secureClear(key: string): Promise<void> {
  localStorage.removeItem(NAMESPACE + key);
}

/**
 * Remove todos os itens gerenciados pelo secureStorage.
 */
export async function secureClearAll(): Promise<void> {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(NAMESPACE)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  // Invalida chave de sessão em memória
  _sessionKey = null;
  _sessionSalt = null;
  sessionStorage.removeItem("neuroped:secure-salt");
}

/**
 * Remove todos os itens expirados do secureStorage (limpeza preventiva).
 * Chamar na inicialização do app para liberar espaço.
 */
export function securePurgeExpired(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(NAMESPACE)) continue;
    try {
      const env = JSON.parse(localStorage.getItem(k)!) as StoredEnvelope;
      if (Date.now() > env.exp) toRemove.push(k);
    } catch {
      toRemove.push(k!);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}
