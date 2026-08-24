import { isClinicalBrowserPersistenceDenied } from "@/lib/clinicalBrowserPersistencePolicy";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";

export const PREVISIT_SECURE_KEYS = {
  preConsulta: "pre-consultas",
  preRetorno: "pre-retornos",
} as const;

export type PrevisitSecureKey = typeof PREVISIT_SECURE_KEYS[keyof typeof PREVISIT_SECURE_KEYS];

/**
 * Regra canônica: dados operacionais de pré-consulta/pré-retorno nunca podem
 * virar um prontuário paralelo no navegador durante uma sessão LIVE remota.
 * A decisão é delegada à política central para que o contrato não divirja das
 * demais superfícies clínicas.
 */
export function isRemotePrevisitPersistenceBlocked(
  key: PrevisitSecureKey = PREVISIT_SECURE_KEYS.preConsulta,
): boolean {
  return isClinicalBrowserPersistenceDenied(key, "read");
}

export async function previsitSecureGet<T>(key: PrevisitSecureKey): Promise<T | null> {
  if (isClinicalBrowserPersistenceDenied(key, "read")) return null;
  return secureGet<T>(key);
}

export async function previsitSecureSet<T>(key: PrevisitSecureKey, value: T): Promise<boolean> {
  if (isClinicalBrowserPersistenceDenied(key, "write")) return false;
  return secureSet(key, value);
}

export async function previsitSecureClear(key: PrevisitSecureKey): Promise<void> {
  if (isClinicalBrowserPersistenceDenied(key, "remove")) return;
  await secureClear(key);
}

export function previsitLegacyGet(key: string): string | null {
  if (isClinicalBrowserPersistenceDenied(key, "read")) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function previsitLegacyRemove(key: string): void {
  if (isClinicalBrowserPersistenceDenied(key, "remove")) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Armazenamento indisponível: preservar o fluxo em memória.
  }
}
