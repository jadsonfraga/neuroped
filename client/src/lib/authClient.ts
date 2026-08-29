/**
 * Cliente HTTP para a API de autenticacao do NeuroPed EDJ.
 *
 * - Persiste tokens em sessionStorage (volatil ao fechar aba) por seguranca.
 *  Para PWA instalada/standalone, considere migrar para httpOnly cookies via /api/auth/login com secure cookie.
 * - Tenta refresh automatico em 401.
 * - Eventos: emite "auth:expired" quando refresh falhar.
 */

import {
  authCapabilityFromHealth,
  fallbackAuthCapability,
  localAuthCapability,
  resolveAuthMode,
  type AuthCapability,
  type AuthMode,
} from "./authCapabilityPolicy";

export type { AuthCapability } from "./authCapabilityPolicy";

const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

const ACCESS_KEY = "neuroped:access";
const REFRESH_KEY = "neuroped:refresh";
const USER_KEY = "neuroped:user";
const CAPABILITY_KEY = "neuroped:auth-capability";
/**
 * Resultado do refresh: `definitive` separa "o servidor rejeitou o token"
 * (401/403 — sessão realmente acabou) de falha transitória (rede, 5xx, 429).
 * Só a rejeição definitiva pode disparar a limpeza destrutiva de estado local.
 */
export interface RefreshOutcome {
  token: string | null;
  definitive: boolean;
}

interface RefreshFlight {
  epoch: number;
  refreshToken: string;
  promise: Promise<RefreshOutcome>;
}

let refreshInFlight: RefreshFlight | null = null;
let authEpoch = 0;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "professional" | "reader" | "operator";
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

function configuredAuthMode(): AuthMode {
  return resolveAuthMode(
    import.meta.env?.VITE_AUTH_MODE,
    import.meta.env?.PROD === true,
  );
}

function readToken(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToken(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
}

function replaceAuthSession(data: LoginResponse): void {
  authEpoch += 1;
  writeToken(ACCESS_KEY, data.accessToken);
  writeToken(REFRESH_KEY, data.refreshToken);
  writeToken(USER_KEY, JSON.stringify(data.user));
}

export function getAccessToken(): string | null {
  return readToken(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return readToken(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = readToken(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  authEpoch += 1;
  writeToken(ACCESS_KEY, null);
  writeToken(REFRESH_KEY, null);
  writeToken(USER_KEY, null);
}

function cachedAuthCapability(mode: AuthMode): AuthCapability {
  let cached: unknown = null;
  try {
    cached = JSON.parse(localStorage.getItem(CAPABILITY_KEY) || "null");
  } catch {
    // Instalação ainda não conhecida ou armazenamento indisponível.
  }
  return fallbackAuthCapability(mode, cached);
}

function rememberAuthCapability(capability: AuthCapability): void {
  try {
    localStorage.setItem(CAPABILITY_KEY, JSON.stringify({
      required: capability.required,
      configured: capability.configured,
    }));
  } catch {
    // A resposta atual continua valendo mesmo sem persistência.
  }
}

/**
 * Descobre se esta instalação possui backend clínico.
 *
 * - `remote`: produção canônica; qualquer falha de health mantém login obrigatório.
 * - `local`: mirror estático/offline declarado explicitamente; usa o PIN local.
 * - `auto`: apenas desenvolvimento, preservando descoberta dinâmica.
 */
export async function getAuthCapability(): Promise<AuthCapability> {
  const mode = configuredAuthMode();
  if (mode === "local") return localAuthCapability();

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return cachedAuthCapability(mode);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return cachedAuthCapability(mode);
    }
    const data: unknown = await response.json();
    const capability = authCapabilityFromHealth(mode, data);
    rememberAuthCapability(capability);
    return capability;
  } catch {
    return cachedAuthCapability(mode);
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const r = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `Login falhou (${r.status})`);
  }
  const data: LoginResponse = await r.json();
  replaceAuthSession(data);
  return data;
}

/**
 * Troca a senha no runtime Cloudflare e substitui atomicamente a família local
 * de tokens pela sessão nova emitida pelo servidor. A senha nunca é persistida.
 */
export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<LoginResponse> {
  const r = await authFetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `Troca de senha falhou (${r.status})`);
  }
  const data: LoginResponse = await r.json();
  replaceAuthSession(data);
  return data;
}

async function performRefresh(refreshToken: string, epochAtStart: number): Promise<RefreshOutcome> {
  try {
    const r = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!r.ok) {
      // 401/403 = o servidor rejeitou o token: sessão realmente inválida.
      // 5xx/429 = soluço de gateway: NÃO pode custar o vault local do usuário.
      return { token: null, definitive: r.status === 401 || r.status === 403 };
    }
    const data = await r.json();
    // Logout ou novo login ocorreu enquanto a chamada estava no ar: a resposta
    // antiga não pode ressuscitar credenciais descartadas.
    if (authEpoch !== epochAtStart) return { token: null, definitive: false };
    writeToken(ACCESS_KEY, data.accessToken);
    writeToken(REFRESH_KEY, data.refreshToken);
    return { token: data.accessToken, definitive: false };
  } catch {
    return { token: null, definitive: false };
  }
}

/**
 * Single-flight obrigatório com refresh rotativo: vários 401 simultâneos usam
 * a mesma promessa, evitando reutilizar o token anterior e revogar a família.
 */
export function refreshTokenRequest(): Promise<RefreshOutcome> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve({ token: null, definitive: true });

  const epochAtStart = authEpoch;
  if (
    refreshInFlight?.epoch === epochAtStart
    && refreshInFlight.refreshToken === refreshToken
  ) {
    return refreshInFlight.promise;
  }

  const promise = performRefresh(refreshToken, epochAtStart).finally(() => {
    // Um login pode iniciar outro refresh enquanto o anterior termina. A
    // conclusão velha jamais deve desmontar o single-flight da sessão nova.
    if (refreshInFlight?.promise === promise) refreshInFlight = null;
  });
  refreshInFlight = { epoch: epochAtStart, refreshToken, promise };
  return promise;
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken();
  // Fecha a sessão local antes de qualquer I/O. Isso também incrementa authEpoch
  // e impede que um refresh concorrente ressuscite tokens após o logout.
  clearAuth();
  if (!refreshToken) return;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3_000);
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
      keepalive: true,
    });
  } catch {
    // Logout local já foi concluído; revogação remota é best-effort quando offline.
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * fetch wrapper que insere Authorization header e tenta refresh em 401.
 */
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const requestEpoch = authEpoch;
  let token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const requestUrl = typeof input === "string" && input.startsWith("/") ? `${API_BASE}${input}` : input;

  let response = await fetch(requestUrl, { ...init, headers });

  // Um 401 numa chamada pública/anonimamente tentada não significa que uma
  // sessão expirou. Só inicia refresh e emite o evento quando havia credencial.
  if (
    response.status === 401
    && authEpoch === requestEpoch
    && (token || getRefreshToken())
  ) {
    const epochBeforeRefresh = authEpoch;
    const outcome = await refreshTokenRequest();
    // Bodies de stream (ReadableStream) já foram consumidos pelo primeiro fetch
    // e não podem ser reenviados; strings/FormData/Blob são reutilizáveis.
    const bodyReusable = !(typeof ReadableStream !== "undefined" && init.body instanceof ReadableStream);
    if (outcome.token && authEpoch === epochBeforeRefresh && bodyReusable) {
      headers.set("Authorization", `Bearer ${outcome.token}`);
      response = await fetch(requestUrl, { ...init, headers });
    } else if (!outcome.token && outcome.definitive && authEpoch === epochBeforeRefresh) {
      // Só a rejeição DEFINITIVA do refresh (401/403) encerra a sessão local —
      // um 502 transitório do gateway não pode disparar a limpeza destrutiva
      // do vault (auth:expired → secureClearAll → IndexedDB apagado).
      // Um login/logout mais novo em voo também não pode ser apagado (epoch).
      clearAuth();
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
  }

  return response;
}