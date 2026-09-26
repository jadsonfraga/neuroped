/**
 * Instrumentos abertos recentemente a partir do Filtro Clínico (padrão
 * MDCalc "Recent"). Guarda apenas id, nome e rota do instrumento — nunca
 * idade, queixa, paciente ou qualquer dado clínico. Preferência de UI, em
 * localStorage, fora dos namespaces clínicos da política de persistência.
 * O modo efêmero (/filtro-escalas) não grava nem lê.
 */
export const FILTER_RECENTS_KEY = "np_filtro_recentes_v1";
export const FILTER_RECENTS_MAX = 8;

export interface FilterRecentItem {
  id: string;
  name: string;
  route: string;
  /** Epoch ms da última abertura. */
  at: number;
}

export interface FilterRecentsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): FilterRecentsStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

const SAFE_ID = /^[a-z0-9][a-z0-9_-]{0,80}$/i;

export function parseFilterRecents(raw: string | null): FilterRecentItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: FilterRecentItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const { id, name, route, at } = item as Record<string, unknown>;
      if (typeof id !== "string" || !SAFE_ID.test(id) || seen.has(id)) continue;
      if (typeof name !== "string" || !name.trim() || name.length > 120) continue;
      if (typeof route !== "string" || !route.startsWith("/") || route.includes("?") || route.length > 120) continue;
      const when = typeof at === "number" && Number.isFinite(at) && at > 0 ? at : 0;
      seen.add(id);
      out.push({ id, name: name.trim(), route, at: when });
      if (out.length >= FILTER_RECENTS_MAX) break;
    }
    return out;
  } catch {
    return [];
  }
}

export function loadFilterRecents(storage: FilterRecentsStorage | undefined = browserStorage()): FilterRecentItem[] {
  if (!storage) return [];
  try {
    return parseFilterRecents(storage.getItem(FILTER_RECENTS_KEY));
  } catch {
    return [];
  }
}

/** Devolve a lista nova (mais recente primeiro) e a persiste. */
export function recordFilterRecent(
  item: Omit<FilterRecentItem, "at">,
  storage: FilterRecentsStorage | undefined = browserStorage(),
  now: number = Date.now(),
): FilterRecentItem[] {
  const current = loadFilterRecents(storage);
  const next = [{ ...item, name: item.name.trim(), at: now }, ...current.filter((r) => r.id !== item.id)].slice(0, FILTER_RECENTS_MAX);
  if (storage) {
    try {
      storage.setItem(FILTER_RECENTS_KEY, JSON.stringify(next));
    } catch {
      /* storage cheio/indisponível — recentes são conveniência, nunca bloqueiam */
    }
  }
  return next;
}

export function clearFilterRecents(storage: FilterRecentsStorage | undefined = browserStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(FILTER_RECENTS_KEY);
  } catch {
    /* idem */
  }
}
