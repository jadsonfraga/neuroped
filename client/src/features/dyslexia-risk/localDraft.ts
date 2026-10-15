/**
 * Rascunho local das aplicações de dislexia (jogo JLN-1 e ICED-8).
 *
 * Os registros têm dados de criança (nome, idade, escola), então não podem
 * ficar no navegador indefinidamente: cada gravação leva um carimbo e o
 * rascunho expira em 72 h. A leitura de um rascunho antigo (formato anterior,
 * sem carimbo) não perde a sessão em andamento: ele é aceito e passa a ter
 * carimbo na próxima gravação. Toda chamada é protegida — armazenamento
 * bloqueado (modo privado, cota) nunca derruba a tela.
 */

/** Validade do rascunho local: 72 horas. */
export const DRAFT_TTL_MS = 72 * 60 * 60 * 1000;

interface DraftEnvelope<T> {
  v: 1;
  savedAt: number;
  data: T;
}

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): DraftStorage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function isEnvelope(value: unknown): value is DraftEnvelope<unknown> {
  return Boolean(value) && typeof value === "object" && (value as DraftEnvelope<unknown>).v === 1
    && typeof (value as DraftEnvelope<unknown>).savedAt === "number" && "data" in (value as object);
}

/** Lê o rascunho; expirado é apagado e devolve null. Formato antigo (sem carimbo) é aceito uma vez. */
export function readDraft<T>(key: string, now = Date.now(), storage: DraftStorage | null = defaultStorage()): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isEnvelope(parsed)) return parsed as T;
    if (!(now - parsed.savedAt < DRAFT_TTL_MS) || parsed.savedAt > now + 60_000) {
      storage.removeItem(key);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

/** Grava o rascunho com carimbo; falha de armazenamento é silenciosa (o registro segue em memória). */
export function writeDraft<T>(key: string, data: T, now = Date.now(), storage: DraftStorage | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    const envelope: DraftEnvelope<T> = { v: 1, savedAt: now, data };
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/** Apaga o rascunho (nova aplicação, apagar dados). */
export function clearDraft(key: string, storage: DraftStorage | null = defaultStorage()): void {
  try {
    storage?.removeItem(key);
  } catch {
    /* armazenamento indisponível: nada a apagar */
  }
}
