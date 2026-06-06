import { useCallback, useEffect, useState } from "react";

/**
 * useFavorites / useRecents — Bloco D3.
 *
 * Favoritos e "usados recentemente" de escalas, persistidos em localStorage.
 * Sincroniza entre componentes da mesma aba (CustomEvent) e entre abas
 * (storage event), para a estrela e as listas do Dashboard ficarem coerentes.
 */

const FAV_KEY = "neuroped:favorites";
const RECENTS_KEY = "neuroped:recents";
const RECENTS_MAX = 10;

// storage events não disparam na própria aba; usamos um event interno.
const FAV_EVENT = "neuroped:favorites-changed";
const RECENTS_EVENT = "neuroped:recents-changed";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[], eventName: string) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* quota/privacidade — ignora silenciosamente */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(eventName));
  }
}

function useSyncedList(key: string, eventName: string): [string[], (next: string[]) => void] {
  const [list, setList] = useState<string[]>(() => readList(key));

  useEffect(() => {
    const refresh = () => setList(readList(key));
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) refresh();
    };
    window.addEventListener(eventName, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(eventName, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, eventName]);

  const update = useCallback(
    (next: string[]) => {
      writeList(key, next, eventName);
      setList(next);
    },
    [key, eventName],
  );

  return [list, update];
}

export function useFavorites() {
  const [favorites, setFavorites] = useSyncedList(FAV_KEY, FAV_EVENT);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggle = useCallback(
    (id: string) => {
      setFavorites(
        favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id],
      );
    },
    [favorites, setFavorites],
  );

  const getFavorites = useCallback(() => favorites, [favorites]);

  return { favorites, isFavorite, toggle, getFavorites };
}

export function useRecents() {
  const [recents, setRecents] = useSyncedList(RECENTS_KEY, RECENTS_EVENT);

  const pushRecent = useCallback(
    (id: string) => {
      setRecents([id, ...recents.filter((x) => x !== id)].slice(0, RECENTS_MAX));
    },
    [recents, setRecents],
  );

  const getRecents = useCallback(() => recents, [recents]);

  return { recents, pushRecent, getRecents };
}
