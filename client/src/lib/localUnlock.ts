// PIN master das rotas clínicas sensíveis — SHA-256 de "260756".
const UNLOCK_HASH = "7469fe7380c5adaf6764369b74bd5c4e70dc358761136458c436da2787a1e6b7";
const SESSION_KEY = "neuroped:local-unlocked";
const REMEMBER_KEY = "neuroped:local-unlocked-persistent";
const LOCK_EVENT = "neuroped:local-lock-changed";

function sanitizeUnlockInput(value: string): string {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function emitUnlockState(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOCK_EVENT, { detail: { unlocked: hasClinicalUnlock() } }));
}

export async function verifyUnlockPassword(input: string): Promise<boolean> {
  if (!input || typeof crypto === "undefined" || !crypto.subtle) return false;
  const normalized = sanitizeUnlockInput(input);
  const candidateHash = await sha256Hex(normalized);
  return candidateHash === UNLOCK_HASH;
}

export function unlockApp(rememberDevice = false): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    if (rememberDevice) localStorage.setItem(REMEMBER_KEY, "1");
  } catch {
    // Storage pode estar indisponível em modo privado; o estado em memória cobre a sessão atual.
  }
  emitUnlockState();
}

export function lockApp(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Falha de storage não deve quebrar o bloqueio visual local.
  }
  emitUnlockState();
}

export function hasClinicalUnlock(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1" || localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

export function isAppUnlocked(): boolean {
  // O app público deve abrir para todos. O PIN master fica reservado
  // exclusivamente às rotas sensíveis via RouteGuard + hasClinicalUnlock().
  return true;
}

export const localUnlockEventName = LOCK_EVENT;

export const localUnlockSecurityNote =
  "Bloqueio local leve para rotas clínicas sensíveis em app estático/frontend/local-first. Não substitui autenticação robusta com backend para dados médicos sensíveis.";
