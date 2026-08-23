import {
  canUseLocalClinicalPersistence,
  getClinicalStoragePolicyRule,
} from "@/lib/clinicalStoragePolicy";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";

export interface ClinicalSessionStorageConfig {
  secureKey: string;
  legacyLocalStorageKey: string;
}

function assertClassifiedClinicalKey(key: string): void {
  if (!getClinicalStoragePolicyRule(key)) {
    throw new Error(`[clinicalStorage] unclassified clinical key: ${key}`);
  }
}

/**
 * Carrega registros clínicos efêmeros apenas quando a política permite storage
 * no browser. Em LIVE autenticado, retorna vazio antes de tocar secureStorage,
 * localStorage, migração ou limpeza de legado.
 */
export async function loadClinicalSessionRecords<T>(
  config: ClinicalSessionStorageConfig,
): Promise<T[]> {
  assertClassifiedClinicalKey(config.secureKey);
  if (!canUseLocalClinicalPersistence(config.secureKey)) return [];

  const protectedRecords = await secureGet<T[]>(config.secureKey);
  if (Array.isArray(protectedRecords)) return protectedRecords;

  try {
    const raw = localStorage.getItem(config.legacyLocalStorageKey);
    const legacy = raw ? JSON.parse(raw) : [];
    if (Array.isArray(legacy) && legacy.length > 0) {
      const migrated = await secureSet(config.secureKey, legacy);
      if (
        migrated &&
        localStorage.getItem(config.legacyLocalStorageKey) === raw
      ) {
        localStorage.removeItem(config.legacyLocalStorageKey);
      }
      return legacy as T[];
    }
    if (raw !== null) localStorage.removeItem(config.legacyLocalStorageKey);
    return [];
  } catch {
    return [];
  }
}

/**
 * Grava apenas quando a política local permite. O retorno false em LIVE é
 * deliberado: o chamador deve manter o formulário somente em memória.
 */
export async function saveClinicalSessionRecords<T>(
  config: ClinicalSessionStorageConfig,
  items: T[],
): Promise<boolean> {
  assertClassifiedClinicalKey(config.secureKey);
  if (!canUseLocalClinicalPersistence(config.secureKey)) return false;

  let stored: boolean;
  try {
    stored = await secureSet(config.secureKey, items);
  } catch {
    return false;
  }
  if (!stored) return false;

  try {
    localStorage.removeItem(config.legacyLocalStorageKey);
  } catch {
    // A cópia cifrada já foi confirmada; limpeza legada é best-effort.
  }
  return true;
}

/**
 * Limpeza específica também respeita fail-closed em LIVE: dados locais antigos
 * são preservados e só podem ser removidos em modo local/offline ou no logout
 * global, que usa secureClearAll().
 */
export async function clearClinicalSessionRecords(
  config: ClinicalSessionStorageConfig,
): Promise<void> {
  assertClassifiedClinicalKey(config.secureKey);
  if (!canUseLocalClinicalPersistence(config.secureKey)) return;

  try {
    localStorage.removeItem(config.legacyLocalStorageKey);
  } catch {
    // A entrada protegida ainda será removida abaixo.
  }
  await secureClear(config.secureKey);
}
