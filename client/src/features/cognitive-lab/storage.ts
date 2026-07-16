/**
 * Persistência temporária do Cognitive Lab em sessão cifrada. Resultados
 * cognitivos são dados clínicos e não devem permanecer em texto puro no
 * localStorage. A identificação continua opcional e deve usar apenas iniciais.
 */
import type { CognitiveSession } from "./types";
import { MAX_SECURE_PLAINTEXT_BYTES, secureGet, secureSet } from "@/lib/secureStorage";

const LEGACY_KEY = "neuroped:cognitive-lab:sessions";
const SECURE_KEY = "cognitive-lab:sessions:v2";
const MAX_SESSIONS = 50;
const MAX_SERIALIZED_SESSION_BYTES = 400_000;
const MAX_SERIALIZED_TOTAL_BYTES = Math.min(1_500_000, MAX_SECURE_PLAINTEXT_BYTES);
let storageQueue: Promise<unknown> = Promise.resolve();

function serializedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function sanitizeSessions(value: unknown): CognitiveSession[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_SESSIONS).flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const session = candidate as Partial<CognitiveSession>;
    if (
      typeof session.id !== "string" ||
      typeof session.taskId !== "string" ||
      typeof session.taskName !== "string" ||
      typeof session.startedAtIso !== "string" ||
      !Array.isArray(session.trials) ||
      !session.stats || typeof session.stats !== "object" ||
      !session.validity || typeof session.validity !== "object"
    ) return [];
    try {
      if (serializedBytes(session) > MAX_SERIALIZED_SESSION_BYTES) return [];
    } catch {
      return [];
    }
    return [session as CognitiveSession];
  });
}

function fitStorageBudget(value: unknown): CognitiveSession[] {
  const sessions = sanitizeSessions(value);
  const selected: CognitiveSession[] = [];
  let totalBytes = 2;
  for (const session of sessions) {
    const sessionBytes = serializedBytes(session);
    if (totalBytes + sessionBytes + 1 > MAX_SERIALIZED_TOTAL_BYTES) continue;
    selected.push(session);
    totalBytes += sessionBytes + 1;
  }
  return selected;
}

export async function listSessions(): Promise<CognitiveSession[]> {
  const protectedSessions = await secureGet<CognitiveSession[]>(SECURE_KEY);
  if (protectedSessions !== null) {
    try { localStorage.removeItem(LEGACY_KEY); } catch { /* legado indisponível */ }
    return fitStorageBudget(protectedSessions);
  }

  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const legacy = fitStorageBudget(raw ? JSON.parse(raw) : []);
    if (legacy.length > 0) {
      const migrated = await secureSet(SECURE_KEY, legacy);
      if (migrated && localStorage.getItem(LEGACY_KEY) === raw) {
        localStorage.removeItem(LEGACY_KEY);
      }
      return legacy;
    }
    if (raw !== null && legacy.length === 0) localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Sem armazenamento, o resultado atual continua exportável na tela.
  }
  return [];
}

export function saveSession(session: CognitiveSession): Promise<boolean> {
  const operation = storageQueue
    .catch(() => undefined)
    .then(async () => {
      const normalized = sanitizeSessions([session]);
      if (normalized.length === 0) return false;
      const all = fitStorageBudget([
        normalized[0],
        ...(await listSessions()).filter((item) => item.id !== normalized[0].id),
      ]);
      if (!all.some((item) => item.id === normalized[0].id)) return false;
      return secureSet(SECURE_KEY, all);
    });
  storageQueue = operation.then(() => undefined, () => undefined);
  return operation.catch(() => false);
}

export function deleteSession(id: string): Promise<boolean> {
  const operation = storageQueue
    .catch(() => undefined)
    .then(async () => {
      const remaining = (await listSessions()).filter((session) => session.id !== id);
      return secureSet(SECURE_KEY, remaining);
    });
  storageQueue = operation.then(() => undefined, () => undefined);
  return operation.catch(() => false);
}

function download(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSessionJson(session: CognitiveSession): void {
  download(
    `cognitive-lab_${session.taskId}_${session.startedAtIso.slice(0, 10)}.json`,
    "application/json",
    JSON.stringify(session, null, 2)
  );
}

export function exportSessionCsv(session: CognitiveSession): void {
  const header = "indice;bloco;fase;tags;esperado;respondido;rt_ms;correto;antecipado";
  const rows = session.trials.map((t) =>
    [
      t.index,
      t.block,
      t.phase,
      t.tags.join("|"),
      t.expected ?? "inibir",
      t.responded ?? "",
      t.rtMs ?? "",
      t.correct ? 1 : 0,
      t.anticipated ? 1 : 0,
    ].join(";")
  );
  download(
    `cognitive-lab_${session.taskId}_${session.startedAtIso.slice(0, 10)}.csv`,
    "text/csv;charset=utf-8",
    [header, ...rows].join("\n")
  );
}
