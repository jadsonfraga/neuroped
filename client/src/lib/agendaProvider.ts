/**
 * agendaProvider.ts — a recepção escolhe de qual profissional opera a agenda
 * (issue #1064, etapa C). Funções puras, testáveis sem navegador.
 *
 * O servidor é a autoridade: `?provider=<id>` é só um ALVO SOLICITADO e é validado
 * contra o vínculo ativo persistido (functions/api/operations/_context.ts). Nada
 * aqui concede acesso; é conveniência de interface.
 */

export interface ProviderChoice {
  id: string;
  name: string;
}

export const DASHBOARD_BASE_KEY = "/api/operations?resource=dashboard";
export const OPERATIONS_ENDPOINT = "/api/operations";
const STORAGE_PREFIX = "neuroped:agenda:provider:v1";
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/;

/** Id de profissional seguro para ir à URL; qualquer outra coisa é descartada. */
function safeProviderId(value: unknown): string | null {
  return typeof value === "string" && SAFE_ID.test(value) ? value : null;
}

/** Chave da consulta do painel. Inclui o profissional: caches nunca se misturam. */
export function dashboardKeyFor(providerId: string | null): string {
  const id = safeProviderId(providerId);
  return id ? `${DASHBOARD_BASE_KEY}&provider=${encodeURIComponent(id)}` : DASHBOARD_BASE_KEY;
}

/** URL do POST de ações. A query é a única via de escolha; o corpo não conta. */
export function operationsUrlFor(providerId: string | null): string {
  const id = safeProviderId(providerId);
  return id ? `${OPERATIONS_ENDPOINT}?provider=${encodeURIComponent(id)}` : OPERATIONS_ENDPOINT;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "";
}

/**
 * Lista de profissionais de um `409 PROVIDER_SELECTION_REQUIRED`. `apiRequest` e
 * o fetcher padrão lançam `Error("<status>: <corpo>")`; o corpo é o JSON do servidor.
 */
export function parseSelectionRequired(error: unknown): ProviderChoice[] | null {
  const text = errorText(error);
  if (!text.includes("PROVIDER_SELECTION_REQUIRED")) return null;
  const start = text.indexOf("{");
  if (start < 0) return null;
  try {
    const parsed = JSON.parse(text.slice(start)) as { code?: unknown; providers?: unknown };
    if (parsed.code !== "PROVIDER_SELECTION_REQUIRED" || !Array.isArray(parsed.providers)) return null;
    const choices: ProviderChoice[] = [];
    for (const item of parsed.providers) {
      const id = safeProviderId((item as { id?: unknown })?.id);
      const name = (item as { name?: unknown })?.name;
      if (id && typeof name === "string" && name.trim()) choices.push({ id, name: name.trim() });
    }
    return choices.length > 1 ? choices : null;
  } catch {
    return null;
  }
}

/** `403 PROVIDER_NOT_AVAILABLE`: a escolha salva não vale mais (vínculo suspenso etc.). */
export function isProviderUnavailable(error: unknown): boolean {
  return errorText(error).includes("PROVIDER_NOT_AVAILABLE");
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // acesso ao próprio localStorage pode lançar (modo privado, bloqueio)
  }
}

/** Uma chave por conta: num dispositivo compartilhado uma recepção não herda a escolha da outra. */
export function storageKeyFor(actorUserId: string | null | undefined): string | null {
  const id = safeProviderId(actorUserId ?? null);
  return id ? `${STORAGE_PREFIX}:${id}` : null;
}

/** Só conveniência de interface: leitura falha em silêncio e nunca lança. */
export function readStoredProvider(
  actorUserId: string | null | undefined,
  storage: StorageLike | null = defaultStorage(),
): string | null {
  const key = storageKeyFor(actorUserId);
  if (!key || !storage) return null;
  try {
    return safeProviderId(storage.getItem(key));
  } catch {
    return null;
  }
}

/** `null` esquece a escolha. Nunca lança; sem armazenamento, só não lembra. */
export function storeProvider(
  actorUserId: string | null | undefined,
  providerId: string | null,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = storageKeyFor(actorUserId);
  if (!key || !storage) return;
  try {
    const id = safeProviderId(providerId);
    if (id) storage.setItem(key, id);
    else storage.removeItem(key);
  } catch {
    // sem armazenamento a escolha só não é lembrada
  }
}

/** Sufixo das mensagens de ação da recepção: deixa claro em qual agenda ela agiu. */
export function agendaOfSuffix(delegated: boolean, providerName: string): string {
  return delegated ? ` — agenda de ${providerName}` : "";
}
