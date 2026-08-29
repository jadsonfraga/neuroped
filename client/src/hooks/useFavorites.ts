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

function useSyncedList(key: string, eventName: string): [string[], (compute: (prev: string[]) => string[]) => void] {
  const [list, setList] = useState<string[]>(() => readList(key));

  useEffect(() => {
    const refresh = () => setList(readList(key));
    const onStorage = (e: StorageEvent) => {
      // e.key === null significa localStorage.clear() em outra aba (wipe de
      // segurança) — a lista desta aba também precisa refletir isso.
      if (e.key === key || e.key === null) refresh();
    };
    window.addEventListener(eventName, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(eventName, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, eventName]);

  // Forma funcional lendo o storage no momento da escrita: dois toggles no
  // mesmo tick (double-tap, loop de "favoritar seleção") partiam do mesmo
  // snapshot e o último sobrescrevia o primeiro.
  const update = useCallback(
    (compute: (prev: string[]) => string[]) => {
      const next = compute(readList(key));
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
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [setFavorites],
  );

  const getFavorites = useCallback(() => favorites, [favorites]);

  return { favorites, isFavorite, toggle, getFavorites };
}

export function useRecents() {
  const [recents, setRecents] = useSyncedList(RECENTS_KEY, RECENTS_EVENT);

  const pushRecent = useCallback(
    (id: string) => {
      setRecents((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, RECENTS_MAX));
    },
    [setRecents],
  );

  const getRecents = useCallback(() => recents, [recents]);

  return { recents, pushRecent, getRecents };
}
