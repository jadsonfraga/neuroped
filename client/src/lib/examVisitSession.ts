import { examBands } from "../data/exame-por-idade";

export const examStatuses = {
  direct: "Observado diretamente",
  assisted: "Observado com apoio",
  reported: "Relato, não observado diretamente",
  noOpportunity: "Sem oportunidade de avaliar",
  stopped: "Preferiu parar",
} as const;

export type ExamStatus = keyof typeof examStatuses;
type ExamRecord = { status: ExamStatus | ""; note: string };
type ExamVisit = { band: number | null; records: Partial<Record<number, ExamRecord>> };
type ExamAction =
  | { type: "select"; band: number | null }
  | { type: "record"; step: number; status?: ExamStatus | ""; note?: string }
  | { type: "finish" };

export const initialExam: ExamVisit = { band: null, records: {} };

export function examVisit(state: ExamVisit, action: ExamAction): ExamVisit {
  if (action.type === "finish") return initialExam;
  if (action.type === "select") {
    if (Object.keys(state.records).length || (action.band !== null && (!Number.isInteger(action.band) || !examBands[action.band]))) return state;
    return { band: action.band, records: {} };
  }
  if (state.band === null || !Number.isInteger(action.step) || !examBands[state.band]?.steps[action.step]) return state;
  const entry: ExamRecord = {
    status: action.status ?? state.records[action.step]?.status ?? "",
    note: action.note ?? state.records[action.step]?.note ?? "",
  };
  const records = { ...state.records };
  if (entry.status || entry.note.trim()) records[action.step] = entry;
  else delete records[action.step];
  return { ...state, records };
}

export function summarizeExam(state: ExamVisit): Array<{ step: string; status: string; note: string }> {
  if (state.band === null) return [];
  return examBands[state.band].steps.flatMap(({ title }, index) => {
    const entry = state.records[index];
    if (!entry) return [];
    return [{ step: title, status: entry.status ? examStatuses[entry.status] : "Registro sem classificação", note: entry.note.trim() }];
  });
}
