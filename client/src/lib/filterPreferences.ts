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
    const legacyRaw = storage.getItem(LEGACY_FILTER_STATE_KEY);
    const preferences = parseFilterPreferences(currentRaw ?? legacyRaw);

    // O estado legado continha busca, idade, queixas e outros dados clínicos em
    // texto puro. Migra somente a preferência não clínica e elimina o payload.
    if (legacyRaw !== null) storage.removeItem(LEGACY_FILTER_STATE_KEY);
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
    storage.removeItem(LEGACY_FILTER_STATE_KEY);
    storage.setItem(
      FILTER_PREFERENCES_KEY,
      serializeFilterPreferences(availability),
    );
  } catch {
    // Preferências visuais são best-effort; o filtro continua funcional em memória.
  }
}
