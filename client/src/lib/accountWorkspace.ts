/**
 * API do workspace da conta autenticada. O servidor é a fonte de verdade
 * quando o app roda em modo remoto; não há fallback para dados clínicos locais.
 */
import { authFetch, getAccessToken } from "@/lib/authClient";

export interface AccountWorkspaceItem<T> {
  data: T;
  expiresAt: string | null;
  updatedAt: string;
}

export function isAccountWorkspaceRemoteMode(): boolean {
  const mode = import.meta.env?.VITE_AUTH_MODE;
  return mode === "remote" || (mode !== "local" && import.meta.env?.PROD === true);
}

export function hasAccountWorkspaceSession(): boolean {
  return isAccountWorkspaceRemoteMode() && Boolean(getAccessToken());
}

function errorFor(response: Response, action: string): Error {
  return new Error(`Workspace ${action} falhou (HTTP ${response.status}).`);
}

export async function getAccountWorkspaceItem<T>(key: string): Promise<AccountWorkspaceItem<T> | null> {
  if (!getAccessToken()) return null;
  const response = await authFetch(`/api/me/workspace?key=${encodeURIComponent(key)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw errorFor(response, "leitura");
  return await response.json() as AccountWorkspaceItem<T>;
}

export async function putAccountWorkspaceItem<T>(
  key: string,
  data: T,
  expiresAt: string | null,
): Promise<void> {
  if (!getAccessToken()) throw new Error("Sessão autenticada necessária para persistir o workspace.");
  const response = await authFetch("/api/me/workspace", {
    method: "PUT",
    body: JSON.stringify({ key, data, expiresAt }),
  });
  if (!response.ok) throw errorFor(response, "gravação");
}

export async function deleteAccountWorkspaceItem(key: string): Promise<void> {
  if (!getAccessToken()) return;
  const response = await authFetch(`/api/me/workspace?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw errorFor(response, "remoção");
}
