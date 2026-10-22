/**
 * Ordem clínica dos diários: data do evento (e hora, quando houver). A hora de
 * cadastro só desempata — um registro retroativo entra no lugar da data em
 * que o evento aconteceu, não no topo da lista.
 */
interface DatedEntry {
  date?: unknown;
  datetime?: unknown;
  time?: unknown;
  createdAt?: unknown;
}

/** Chave comparável do instante do evento: `date` + `time`, ou `datetime` quando já traz a hora. */
function eventKey(entry: DatedEntry): string {
  if (typeof entry.date === "string" && entry.date) {
    const time = typeof entry.time === "string" ? entry.time : "";
    return `${entry.date}T${time}`;
  }
  return typeof entry.datetime === "string" ? entry.datetime : "";
}

export function compareClinicalDesc(a: DatedEntry, b: DatedEntry): number {
  const ka = eventKey(a);
  const kb = eventKey(b);
  if (ka !== kb) return ka < kb ? 1 : -1;
  return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
}

export function sortClinicalDesc<T extends DatedEntry>(entries: readonly T[]): T[] {
  return [...entries].sort(compareClinicalDesc);
}

export function sortClinicalAsc<T extends DatedEntry>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => compareClinicalDesc(b, a));
}
