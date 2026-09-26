const SNCR_API_URL = "https://sncr-api.apps.anvisa.gov.br";
const TOKEN_KEY = "neuroped:sncr:access-token";
const RETURN_HASH_KEY = "neuroped:sncr:return-hash";

function storage(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isSncrOriginEligible(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".br");
}

export function sncrOriginRequirement(): string | null {
  if (typeof window === "undefined") return "Origem indisponível.";
  if (isSncrOriginEligible()) return null;
  return "A integração Gov.br do SNCR exige frontend em domínio .br. Configure o domínio brasileiro oficial antes do go-live.";
}

export function getSncrAccessToken(): string | null {
  const token = storage()?.getItem(TOKEN_KEY)?.trim() ?? "";
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  if (exp !== null && exp * 1000 <= Date.now()) {
    storage()?.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

export function clearSncrSession(): void {
  storage()?.removeItem(TOKEN_KEY);
  storage()?.removeItem(RETURN_HASH_KEY);
}

export function beginSncrLogin(): void {
  if (!isSncrOriginEligible()) throw new Error(sncrOriginRequirement() ?? "Origem SNCR inválida.");
  const clientUrl = window.location.origin + window.location.pathname;
  storage()?.setItem(RETURN_HASH_KEY, window.location.hash || "#/receita-c1");
  const loginUrl = new URL("/api/v1/auth/login", SNCR_API_URL);
  loginUrl.searchParams.set("client_url", clientUrl);
  window.location.assign(loginUrl.toString());
}

export async function completeSncrCallbackIfPresent(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const current = new URL(window.location.href);
  const sessionId = current.searchParams.get("session_id")?.trim();
  if (!sessionId) return false;

  const tokenUrl = new URL("/api/v1/auth/token", SNCR_API_URL);
  tokenUrl.searchParams.set("session_id", sessionId);
  const response = await fetch(tokenUrl.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`SNCR recusou a troca de sessão (HTTP ${response.status}).`);
  }
  const payload = await response.json() as { access_token?: unknown };
  const token = typeof payload.access_token === "string" ? payload.access_token.trim() : "";
  if (!token) throw new Error("SNCR não retornou access_token.");

  storage()?.setItem(TOKEN_KEY, token);
  const returnHash = storage()?.getItem(RETURN_HASH_KEY) || "#/receita-c1";
  storage()?.removeItem(RETURN_HASH_KEY);
  current.searchParams.delete("session_id");
  current.hash = returnHash;
  window.history.replaceState({}, document.title, current.pathname + current.search + current.hash);
  window.dispatchEvent(new CustomEvent("neuroped:sncr-auth"));
  return true;
}

export async function sncrFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getSncrAccessToken();
  if (!token) throw new Error("Sessão SNCR ausente ou expirada.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(new URL(path, SNCR_API_URL).toString(), { ...init, headers, cache: "no-store" });
  if (response.status === 401) clearSncrSession();
  return response;
}

export interface SncrReceitaBrancaRequest {
  conselho: "CRM" | "CFMV" | "CFO";
  tipo: string;
  documento: string;
  uf: string;
  cnpj: string;
}

/**
 * Endpoint publicado pela Anvisa no guia oficial v1.0.
 * O chamador deve validar a resposta conforme o contrato vigente antes de
 * considerar qualquer numeração/receita como emitida.
 */
export async function requestSncrReceitaBranca(payload: SncrReceitaBrancaRequest): Promise<unknown> {
  const response = await sncrFetch("/api/v1/receita-branca/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`SNCR recusou a solicitação (HTTP ${response.status}).`);
  return body;
}
