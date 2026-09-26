/**
 * Favoritos do Filtro Clínico (padrão MDCalc "Favorites"): instrumentos que o
 * clínico marca com estrela para reencontrar. Só ids de instrumento — nunca
 * paciente, idade ou queixa. Preferência de UI em localStorage, fora dos
 * namespaces clínicos. Modo efêmero não lê nem grava.
 */
export const FILTER_FAVORITES_KEY = "np_filtro_favoritos_v1";
export const FILTER_FAVORITES_MAX = 24;

export interface FilterFavoritesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): FilterFavoritesStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

const SAFE_ID = /^[a-z0-9][a-z0-9_-]{0,80}$/i;

export function parseFilterFavorites(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string" || !SAFE_ID.test(item) || out.includes(item)) continue;
      out.push(item);
      if (out.length >= FILTER_FAVORITES_MAX) break;
    }
    return out;
  } catch {
    return [];
  }
}

export function loadFilterFavorites(storage: FilterFavoritesStorage | undefined = browserStorage()): string[] {
  if (!storage) return [];
  try {
    return parseFilterFavorites(storage.getItem(FILTER_FAVORITES_KEY));
  } catch {
    return [];
  }
}

function persist(ids: string[], storage: FilterFavoritesStorage | undefined): void {
  if (!storage) return;
  try {
    if (ids.length) storage.setItem(FILTER_FAVORITES_KEY, JSON.stringify(ids));
    else storage.removeItem(FILTER_FAVORITES_KEY);
  } catch {
    /* favoritos são conveniência; nunca bloqueiam o filtro */
  }
}

/** Alterna o favorito e devolve a lista nova (mais recente primeiro). */
export function toggleFilterFavorite(id: string, storage: FilterFavoritesStorage | undefined = browserStorage()): string[] {
  const current = loadFilterFavorites(storage);
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current].slice(0, FILTER_FAVORITES_MAX);
  persist(next, storage);
  return next;
}

export function clearFilterFavorites(storage: FilterFavoritesStorage | undefined = browserStorage()): void {
  persist([], storage);
}
