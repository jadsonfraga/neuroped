/**
 * Sincronização do workspace da conta com concorrência otimista.
 *
 * O servidor guarda uma versão por item. Esta camada lembra, SOMENTE EM
 * MEMÓRIA, a versão e o valor lidos de cada chave e os apresenta a cada
 * gravação. Quando outra aba ou aparelho gravou antes (409), busca o valor atual
 * e aplica a mesclagem em três vias de workspaceMerge antes de tentar de novo.
 *
 * Garantias:
 * - leitura que falha não vira "vazio": a base é esquecida e a gravação seguinte
 *   só cria o item; se ele existir, o servidor recusa e a mesclagem decide;
 * - nenhuma gravação sobrescreve dados que esta aba não viu;
 * - operações da mesma chave são serializadas dentro da aba.
 *
 * As dependências de rede são injetadas para permitir teste determinístico.
 */
import { MERGE_REFUSED, mergeWorkspaceValues } from "@/lib/workspaceMerge";

export interface WorkspaceRemoteItem<T> {
  data: T;
  version: string;
}

export interface WorkspaceSyncTransport {
  getItem<T>(key: string): Promise<WorkspaceRemoteItem<T> | null>;
  putItem<T>(key: string, data: T, expiresAt: string | null, baseVersion: string | null): Promise<{ version: string }>;
  deleteItem(key: string): Promise<void>;
  /** Reconhece o erro de versão do transporte (HTTP 409). */
  isConflict(error: unknown): boolean;
}

export interface WorkspaceWriteOptions {
  expiresAt: string | null;
  /** Rascunho de aba: a edição mais recente desta aba vence. */
  ephemeral: boolean;
  maxBytes: number;
}

interface Snapshot {
  version: string | null; // null = item comprovadamente ausente
  data: unknown;
}

const MAX_WRITE_ATTEMPTS = 3;

function byteLength(value: unknown): number | null {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? new TextEncoder().encode(serialized).byteLength : null;
  } catch {
    return null;
  }
}

export function createWorkspaceSync(transport: WorkspaceSyncTransport) {
  const snapshots = new Map<string, Snapshot>();
  const queues = new Map<string, Promise<unknown>>();

  function withKey<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = queues.get(key) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(task);
    const tail = run.catch(() => undefined);
    queues.set(key, tail);
    void tail.then(() => {
      if (queues.get(key) === tail) queues.delete(key);
    });
    return run;
  }

  async function get<T>(key: string): Promise<T | null> {
    return withKey(key, async () => {
      try {
        const item = await transport.getItem<T>(key);
        snapshots.set(key, item ? { version: item.version, data: item.data } : { version: null, data: null });
        return item ? item.data : null;
      } catch {
        snapshots.delete(key);
        return null;
      }
    });
  }

  async function set<T>(key: string, value: T, options: WorkspaceWriteOptions): Promise<boolean> {
    const initialBytes = byteLength(value);
    if (initialBytes === null || initialBytes > options.maxBytes) return false;

    return withKey(key, async () => {
      const snapshot = snapshots.get(key);
      let baseVersion = snapshot ? snapshot.version : null;
      let baseData: unknown = snapshot ? snapshot.data : undefined;
      let candidate: unknown = value;

      for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
        try {
          const saved = await transport.putItem(key, candidate, options.expiresAt, baseVersion);
          snapshots.set(key, { version: saved.version, data: candidate });
          return true;
        } catch (error) {
          if (!transport.isConflict(error)) return false;
        }

        let current: WorkspaceRemoteItem<unknown> | null;
        try {
          current = await transport.getItem<unknown>(key);
        } catch {
          snapshots.delete(key);
          return false;
        }
        if (!current) {
          snapshots.set(key, { version: null, data: null });
          baseVersion = null;
          continue;
        }
        const merged = mergeWorkspaceValues(baseData, candidate, current.data, options.ephemeral);
        snapshots.set(key, { version: current.version, data: current.data });
        if (merged === MERGE_REFUSED) {
          console.warn("[workspace] gravação recusada para preservar alteração feita em outra aba ou aparelho.");
          return false;
        }
        const mergedBytes = byteLength(merged);
        if (mergedBytes === null || mergedBytes > options.maxBytes) return false;
        candidate = merged;
        baseVersion = current.version;
        baseData = current.data;
      }
      return false;
    });
  }

  async function clear(key: string): Promise<boolean> {
    return withKey(key, async () => {
      try {
        await transport.deleteItem(key);
        snapshots.set(key, { version: null, data: null });
        return true;
      } catch {
        snapshots.delete(key);
        return false;
      }
    });
  }

  function reset(): void {
    snapshots.clear();
    queues.clear();
  }

  return { get, set, clear, reset };
}
