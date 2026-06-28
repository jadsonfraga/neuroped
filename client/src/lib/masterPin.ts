const SESSION_KEY = "neuroped:private-gate:ok";
const SESSION_EXPIRES_KEY = "neuroped:private-gate:expires";
const PERSIST_KEY = "neuroped:private-gate:persist";
const PERSIST_EXPIRES_KEY = "neuroped:private-gate:persist-expires";
const DEVICE_HASH_KEY = "neuroped:private-gate:device-hash";
const ATTEMPTS_KEY = "neuroped:private-gate:attempts";
const LOCK_UNTIL_KEY = "neuroped:private-gate:lock-until";

const PBKDF2_ITERATIONS = 310000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PERSIST_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type PinVerifier =
  | { kind: "sha256"; hash: string }
  | { kind: "pbkdf2"; iterations: number; salt: string; hash: string };

function now(): number {
  return Date.now();
}

function randomHex(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseVerifier(raw: string | null | undefined): PinVerifier | null {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if (/^[0-9a-f]{64}$/.test(value)) return { kind: "sha256", hash: value };
  const parts = value.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return null;
  const iterations = Number(parts[1]);
  const salt = parts[2];
  const hash = parts[3];
  if (!Number.isFinite(iterations) || iterations < 100000) return null;
  if (!/^[0-9a-f]{16,128}$/.test(salt) || !/^[0-9a-f]{64}$/.test(hash)) return null;
  return { kind: "pbkdf2", iterations, salt, hash };
}

function envVerifier(): PinVerifier | null {
  return parseVerifier(import.meta.env.VITE_PIN_HASH as string | undefined);
}

function deviceVerifier(): PinVerifier | null {
  try {
    return parseVerifier(localStorage.getItem(DEVICE_HASH_KEY));
  } catch {
    return null;
  }
}

export function hasConfiguredMasterPin(): boolean {
  return !!envVerifier() || !!deviceVerifier();
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2Hex(pin: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function getMasterPinLockSeconds(): number {
  try {
    const until = Number(localStorage.getItem(LOCK_UNTIL_KEY) || 0);
    return Math.max(0, Math.ceil((until - now()) / 1000));
  } catch {
    return 0;
  }
}

function registerFailure(): void {
  try {
    const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
      const lockMs = Math.min(15 * 60 * 1000, 60 * 1000 * 2 ** (attempts - MAX_ATTEMPTS));
      localStorage.setItem(LOCK_UNTIL_KEY, String(now() + lockMs));
    }
  } catch {
    // Se o storage falhar, a validação ainda falha sem vazar detalhe.
  }
}

function clearFailures(): void {
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCK_UNTIL_KEY);
  } catch {
    // sem ação
  }
}

export async function createMasterPinVerifier(pin: string): Promise<string> {
  const salt = randomHex(16);
  const hash = await pbkdf2Hex(pin, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export async function storeDeviceMasterPin(pin: string): Promise<void> {
  const verifier = await createMasterPinVerifier(pin);
  localStorage.setItem(DEVICE_HASH_KEY, verifier);
}

export async function verifyMasterPin(pin: string): Promise<boolean> {
  if (getMasterPinLockSeconds() > 0) return false;
  const verifier = envVerifier() ?? deviceVerifier();
  if (!verifier) return false;
  const candidate =
    verifier.kind === "sha256"
      ? await sha256Hex(pin)
      : await pbkdf2Hex(pin, verifier.salt, verifier.iterations);
  const ok = constantTimeEqual(candidate, verifier.hash);
  if (ok) clearFailures();
  else registerFailure();
  return ok;
}

export function markMasterPinUnlocked(rememberDevice: boolean): void {
  const sessionExpires = now() + SESSION_TTL_MS;
  sessionStorage.setItem(SESSION_KEY, "1");
  sessionStorage.setItem(SESSION_EXPIRES_KEY, String(sessionExpires));
  if (rememberDevice) {
    localStorage.setItem(PERSIST_KEY, "1");
    localStorage.setItem(PERSIST_EXPIRES_KEY, String(now() + PERSIST_TTL_MS));
  } else {
    localStorage.removeItem(PERSIST_KEY);
    localStorage.removeItem(PERSIST_EXPIRES_KEY);
  }
}

export function isMasterPinUnlocked(): boolean {
  try {
    const sessionOk = sessionStorage.getItem(SESSION_KEY) === "1";
    const sessionExpires = Number(sessionStorage.getItem(SESSION_EXPIRES_KEY) || 0);
    if (sessionOk && sessionExpires > now()) return true;
    const persistOk = localStorage.getItem(PERSIST_KEY) === "1";
    const persistExpires = Number(localStorage.getItem(PERSIST_EXPIRES_KEY) || 0);
    return persistOk && persistExpires > now();
  } catch {
    return false;
  }
}

export function clearMasterPinUnlock(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_KEY);
    localStorage.removeItem(PERSIST_KEY);
    localStorage.removeItem(PERSIST_EXPIRES_KEY);
  } catch {
    // sem ação
  }
}
