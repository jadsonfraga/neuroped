import { isClinicalBrowserPersistenceDenied } from "@/lib/clinicalBrowserPersistencePolicy";

export type FilterAvailabilityPreference = "complete" | "all";

export interface FilterPreferences {
  availability: FilterAvailabilityPreference;
}

export interface FilterPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const FILTER_PREFERENCES_KEY = "np_filtro_preferences_v1";
export const LEGACY_FILTER_STATE_KEY = "np_filtro_state_v1";

const DEFAULT_FILTER_PREFERENCES: FilterPreferences = {
  availability: "complete",
};

function browserLocalStorage(): FilterPreferenceStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function mayReadLegacyFilterState(): boolean {
  return !isClinicalBrowserPersistenceDenied(LEGACY_FILTER_STATE_KEY, "read");
}

function mayRemoveLegacyFilterState(): boolean {
  return !isClinicalBrowserPersistenceDenied(LEGACY_FILTER_STATE_KEY, "remove");
}

export function parseFilterPreferences(raw: string | null): FilterPreferences {
  if (!raw) return { ...DEFAULT_FILTER_PREFERENCES };

  try {
    const parsed = JSON.parse(raw) as { availability?: unknown } | null;
    return {
      availability: parsed?.availability === "all" ? "all" : "complete",
    };
  } catch {
    return { ...DEFAULT_FILTER_PREFERENCES };
  }
}

export function serializeFilterPreferences(
  availability: FilterAvailabilityPreference,
): string {
  return JSON.stringify({ availability });
}

export function loadFilterPreferences(
  storage: FilterPreferenceStorage | undefined = browserLocalStorage(),
): FilterPreferences {
  if (!storage) return { ...DEFAULT_FILTER_PREFERENCES };

  try {
    const currentRaw = storage.getItem(FILTER_PREFERENCES_KEY);
    // O legado continha busca, idade, queixas e outros dados potencialmente
    // identificáveis. Em LIVE remoto autenticado não consultar sequer a chave.
    const legacyRaw = mayReadLegacyFilterState()
      ? storage.getItem(LEGACY_FILTER_STATE_KEY)
      : null;
    const preferences = parseFilterPreferences(currentRaw ?? legacyRaw);

    // Migração/limpeza continua disponível nos modos local/offline/demo. LIVE
    // ignora bytes legados sem lê-los ou removê-los.
    if (legacyRaw !== null && mayRemoveLegacyFilterState()) {
      storage.removeItem(LEGACY_FILTER_STATE_KEY);
    }
    if (currentRaw !== null || legacyRaw !== null) {
      storage.setItem(
        FILTER_PREFERENCES_KEY,
        serializeFilterPreferences(preferences.availability),
      );
    }

    return preferences;
  } catch {
    return { ...DEFAULT_FILTER_PREFERENCES };
  }
}

export function saveFilterPreferences(
  availability: FilterAvailabilityPreference,
  storage: FilterPreferenceStorage | undefined = browserLocalStorage(),
): void {
  if (!storage) return;

  try {
    if (mayRemoveLegacyFilterState()) storage.removeItem(LEGACY_FILTER_STATE_KEY);
    storage.setItem(
      FILTER_PREFERENCES_KEY,
      serializeFilterPreferences(availability),
    );
  } catch {
    // Preferências visuais são best-effort; o filtro continua funcional em memória.
  }
}
