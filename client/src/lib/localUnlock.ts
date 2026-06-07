const UNLOCK_HASH = "d48b2da02ca999eddf04ea7acc0f5673423f2cf618c014bf3863f4452a6ec207";
const SESSION_KEY = "neuroped:local-unlocked";
const REMEMBER_KEY = "neuroped:local-unlocked-persistent";
const LOCK_EVENT = "neuroped:local-lock-changed";

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyUnlockPassword(input: string): Promise<boolean> {
  if (!input || typeof crypto === "undefined" || !crypto.subtle) return false;
  const normalized = input.trim();
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
  window.dispatchEvent(new CustomEvent(LOCK_EVENT, { detail: { unlocked: true } }));
}

export function lockApp(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Falha de storage não deve quebrar o bloqueio visual local.
  }
  window.dispatchEvent(new CustomEvent(LOCK_EVENT, { detail: { unlocked: false } }));
}

export function isAppUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1" || localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

export const localUnlockEventName = LOCK_EVENT;

export const localUnlockSecurityNote =
  "Bloqueio local leve para app estático/frontend/local-first. Não substitui autenticação robusta com backend para dados médicos.";
