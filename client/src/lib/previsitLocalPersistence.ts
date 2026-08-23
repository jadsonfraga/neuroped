import { getAccessToken } from "@/lib/authClient";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";

export const PREVISIT_SECURE_KEYS = {
  preConsulta: "pre-consultas",
  preRetorno: "pre-retornos",
} as const;

export type PrevisitSecureKey = typeof PREVISIT_SECURE_KEYS[keyof typeof PREVISIT_SECURE_KEYS];

/**
 * Regra canônica: dados operacionais de pré-consulta/pré-retorno nunca podem
 * virar um prontuário paralelo no navegador durante uma sessão LIVE remota.
 *
 * A presença do token é deliberadamente exigida para preservar o modo local
 * e telas públicas/sem sessão. Em LIVE autenticado, leitura, migração, escrita
 * e exclusão local falham fechadas. Dados locais preexistentes são preservados.
 */
export function isRemotePrevisitPersistenceBlocked(): boolean {
  return (
    import.meta.env?.VITE_AUTH_MODE === "remote" &&
    Boolean(getAccessToken())
  );
}

export async function previsitSecureGet<T>(key: PrevisitSecureKey): Promise<T | null> {
  if (isRemotePrevisitPersistenceBlocked()) return null;
  return secureGet<T>(key);
}

export async function previsitSecureSet<T>(key: PrevisitSecureKey, value: T): Promise<boolean> {
  if (isRemotePrevisitPersistenceBlocked()) return false;
  return secureSet(key, value);
}

export async function previsitSecureClear(key: PrevisitSecureKey): Promise<void> {
  if (isRemotePrevisitPersistenceBlocked()) return;
  await secureClear(key);
}

export function previsitLegacyGet(key: string): string | null {
  if (isRemotePrevisitPersistenceBlocked()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function previsitLegacyRemove(key: string): void {
  if (isRemotePrevisitPersistenceBlocked()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Armazenamento indisponível: preservar o fluxo em memória.
  }
}
