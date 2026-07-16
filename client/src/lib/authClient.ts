/**
 * Cliente HTTP para a API de autenticacao do NeuroPed EDJ.
 *
 * - Persiste tokens em sessionStorage (volatil ao fechar aba) por seguranca.
 *  Para PWA instalada/standalone, considere migrar para httpOnly cookies via /api/auth/login com secure cookie.
 * - Tenta refresh automatico em 401.
 * - Eventos: emite "auth:expired" quando refresh falhar.
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const ACCESS_KEY = "neuroped:access";
const REFRESH_KEY = "neuroped:refresh";
const USER_KEY = "neuroped:user";
const CAPABILITY_KEY = "neuroped:auth-capability";

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

export interface AuthCapability {
  required: boolean;
  configured: boolean;
  reachable: boolean;
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
  writeToken(ACCESS_KEY, null);
  writeToken(REFRESH_KEY, null);
  writeToken(USER_KEY, null);
}

function cachedAuthCapability(): AuthCapability {
  try {
    const cached = JSON.parse(localStorage.getItem(CAPABILITY_KEY) || "null");
    if (cached?.required === true) {
      return {
        required: true,
        configured: cached.configured === true,
        reachable: false,
      };
    }
  } catch {
    // Instalação ainda não conhecida ou armazenamento indisponível.
  }
  return { required: false, configured: false, reachable: false };
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
 * Descobre se esta instalação possui backend clínico. Mirrors estáticos e uso
 * offline caem no modo PIN local; D1 ativo exige autenticação remota.
 */
export async function getAuthCapability(): Promise<AuthCapability> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return cachedAuthCapability();
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return cachedAuthCapability();
    }
    const data = await response.json();
    const capability = {
      required: data?.authentication?.required === true,
      configured: data?.authentication?.configured === true,
      reachable: true,
    };
    rememberAuthCapability(capability);
    return capability;
  } catch {
    return cachedAuthCapability();
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
  writeToken(ACCESS_KEY, data.accessToken);
  writeToken(REFRESH_KEY, data.refreshToken);
  writeToken(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function refreshTokenRequest(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const r = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    writeToken(ACCESS_KEY, data.accessToken);
    writeToken(REFRESH_KEY, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearAuth();
  }
}

/**
 * fetch wrapper que insere Authorization header e tenta refresh em 401.
 */
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const requestUrl = typeof input === "string" && input.startsWith("/") ? `${API_BASE}${input}` : input;

  let response = await fetch(requestUrl, { ...init, headers });

  if (response.status === 401) {
    const newToken = await refreshTokenRequest();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(requestUrl, { ...init, headers });
    } else {
      clearAuth();
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
  }

  return response;
}
