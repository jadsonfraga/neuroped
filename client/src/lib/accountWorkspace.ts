/**
 * API do workspace da conta autenticada. O servidor é a fonte de verdade
 * quando o app roda em modo remoto; não há fallback para dados clínicos locais
 * (regra LIVE: sessão remota autenticada não grava PHI no navegador).
 *
 * Contrato com /api/me/workspace:
 * - ausência é `found: false` (HTTP 200); qualquer falha lança erro, para que
 *   "não consegui ler" nunca seja tratado como "está vazio";
 * - toda gravação declara a versão lida (`baseVersion`). O servidor responde
 *   409 se outra aba/aparelho gravou antes, e o chamador decide como mesclar.
 */
import { authFetch, getAccessToken } from "@/lib/authClient";

/** Teto do servidor antes de cifrar (limite de linha do D1). */
export const MAX_ACCOUNT_WORKSPACE_BYTES = 1_400_000;

export interface AccountWorkspaceItem<T> {
  data: T;
  version: string;
  expiresAt: string | null;
  updatedAt: string;
}

export interface AccountWorkspaceWriteResult {
  version: string;
  updatedAt: string;
}

/** Outra aba/aparelho gravou antes; `currentVersion` null = item não existe mais. */
export class AccountWorkspaceConflictError extends Error {
  constructor(readonly currentVersion: string | null) {
    super("WORKSPACE_VERSION_CONFLICT");
    this.name = "AccountWorkspaceConflictError";
  }
}

/** Falha de leitura/gravação que NÃO significa ausência do item. */
export class AccountWorkspaceUnavailableError extends Error {
  constructor(readonly action: string, readonly status: number | null) {
    super(`Workspace ${action} falhou${status ? ` (HTTP ${status})` : ""}.`);
    this.name = "AccountWorkspaceUnavailableError";
  }
}

export function isAccountWorkspaceRemoteMode(): boolean {
  const mode = import.meta.env?.VITE_AUTH_MODE;
  return mode === "remote" || (mode !== "local" && import.meta.env?.PROD === true);
}

export function hasAccountWorkspaceSession(): boolean {
  return isAccountWorkspaceRemoteMode() && Boolean(getAccessToken());
}

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 350;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Leitura idempotente com uma nova tentativa para falhas transitórias (rede,
 * 5xx, 429). Gravações não são repetidas aqui: a repetição segura delas passa
 * pela verificação de versão do chamador.
 */
async function readWithRetry(path: string): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await authFetch(path, { method: "GET", cache: "no-store" });
      if (!TRANSIENT_STATUS.has(response.status) || attempt === 1) return response;
    } catch (error) {
      lastError = error;
      if (attempt === 1) break;
    }
    await wait(RETRY_DELAY_MS);
  }
  throw lastError instanceof Error ? lastError : new AccountWorkspaceUnavailableError("leitura", null);
}

export async function getAccountWorkspaceItem<T>(key: string): Promise<AccountWorkspaceItem<T> | null> {
  if (!getAccessToken()) return null;
  let response: Response;
  try {
    response = await readWithRetry(`/api/me/workspace?key=${encodeURIComponent(key)}`);
  } catch {
    throw new AccountWorkspaceUnavailableError("leitura", null);
  }
  if (!response.ok) throw new AccountWorkspaceUnavailableError("leitura", response.status);
  const body = await response.json() as Partial<AccountWorkspaceItem<T>> & { found?: boolean };
  if (body.found === false) return null;
  if (body.found !== true || typeof body.version !== "string") {
    throw new AccountWorkspaceUnavailableError("leitura", response.status);
  }
  return {
    data: body.data as T,
    version: body.version,
    expiresAt: body.expiresAt ?? null,
    updatedAt: body.updatedAt ?? "",
  };
}

export async function putAccountWorkspaceItem<T>(
  key: string,
  data: T,
  expiresAt: string | null,
  baseVersion: string | null,
): Promise<AccountWorkspaceWriteResult> {
  if (!getAccessToken()) throw new Error("Sessão autenticada necessária para persistir o workspace.");
  let response: Response;
  try {
    response = await authFetch("/api/me/workspace", {
      method: "PUT",
      body: JSON.stringify({ key, data, expiresAt, baseVersion }),
    });
  } catch {
    throw new AccountWorkspaceUnavailableError("gravação", null);
  }
  if (response.status === 409) {
    let current: string | null;
    try {
      const body = await response.json() as { currentVersion?: unknown };
      current = typeof body.currentVersion === "string" ? body.currentVersion : null;
    } catch {
      current = null;
    }
    throw new AccountWorkspaceConflictError(current);
  }
  if (!response.ok) throw new AccountWorkspaceUnavailableError("gravação", response.status);
  const body = await response.json() as Partial<AccountWorkspaceWriteResult>;
  if (typeof body.version !== "string") throw new AccountWorkspaceUnavailableError("gravação", response.status);
  return { version: body.version, updatedAt: body.updatedAt ?? "" };
}

export async function deleteAccountWorkspaceItem(key: string): Promise<void> {
  if (!getAccessToken()) return;
  const response = await authFetch(`/api/me/workspace?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new AccountWorkspaceUnavailableError("remoção", response.status);
}
