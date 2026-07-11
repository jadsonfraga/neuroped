/**
 * Persistência offline-first do Cognitive Lab (localStorage, LGPD-friendly:
 * os dados ficam SÓ no dispositivo; identificação do participante é um rótulo
 * livre opcional — recomendamos iniciais, nunca nome completo).
 */
import type { CognitiveSession } from "./types";

const KEY = "neuroped:cognitive-lab:sessions";
const MAX_SESSIONS = 200;

export function listSessions(): CognitiveSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CognitiveSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(session: CognitiveSession): void {
  try {
    const all = [session, ...listSessions()].slice(0, MAX_SESSIONS);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* armazenamento cheio/indisponível — sessão segue exportável na tela */
  }
}

export function deleteSession(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(listSessions().filter((s) => s.id !== id)));
  } catch {
    /* noop */
  }
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
