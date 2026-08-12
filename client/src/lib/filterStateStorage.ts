import { secureGet, secureSet } from "@/lib/secureStorage";

const SECURE_FILTER_STATE_KEY = "filter-state:v2";
const LEGACY_FILTER_STATE_KEY = "np_filtro_state_v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Estado clínico do filtro pertence apenas à sessão clínica corrente.
 * Se existir uma cópia antiga em localStorage, ela é migrada uma única vez e
 * só removida depois que a gravação AES-GCM for confirmada.
 */
export async function loadProtectedFilterState<T extends object>(): Promise<T | null> {
  const protectedState = await secureGet<T>(SECURE_FILTER_STATE_KEY);
  if (isObject(protectedState)) return protectedState as T;

  try {
    const raw = localStorage.getItem(LEGACY_FILTER_STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return null;
    const stored = await secureSet(SECURE_FILTER_STATE_KEY, parsed);
    if (stored && localStorage.getItem(LEGACY_FILTER_STATE_KEY) === raw) {
      localStorage.removeItem(LEGACY_FILTER_STATE_KEY);
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export async function saveProtectedFilterState(value: object): Promise<boolean> {
  const stored = await secureSet(SECURE_FILTER_STATE_KEY, value);
  if (stored) {
    try {
      localStorage.removeItem(LEGACY_FILTER_STATE_KEY);
    } catch {
      // A cópia cifrada da sessão já foi confirmada.
    }
  }
  return stored;
}
