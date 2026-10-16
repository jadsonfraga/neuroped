/**
 * Painel de resultados (item 8): regras puras — sem I/O.
 *
 * Princípios:
 *  - só agregados de dados que existem de fato no banco da própria clínica;
 *  - nenhum identificador de paciente/usuário sai do servidor;
 *  - "tempo economizado" é ESTIMATIVA = documentos emitidos × minutos de premissa configurada pela clínica
 *    (sem premissa configurada, não há estimativa);
 *  - nenhum corte, nível ou classificação de teste: o painel só conta aplicações, nunca resultados.
 */

export const OUTCOME_WINDOWS = [7, 30, 90] as const;
export type OutcomeWindow = (typeof OUTCOME_WINDOWS)[number];
export const DEFAULT_OUTCOME_WINDOW: OutcomeWindow = 30;

export function parseOutcomeWindow(raw: string | null): OutcomeWindow | null {
  if (raw === null || raw === "") return DEFAULT_OUTCOME_WINDOW;
  const n = Number(raw);
  return (OUTCOME_WINDOWS as readonly number[]).includes(n) ? (n as OutcomeWindow) : null;
}

/** Tipos de documento que a premissa de tempo cobre: laudos e resumos/notas clínicas. */
export const ASSUMPTION_DOC_TYPES = ["report", "clinical_note"] as const;
export type AssumptionDocType = (typeof ASSUMPTION_DOC_TYPES)[number];
export const ASSUMPTION_LABELS: Record<AssumptionDocType, string> = {
  report: "Laudo / relatório",
  clinical_note: "Resumo / nota clínica",
};
export const MAX_MINUTES_PER_DOC = 240;

export type Assumptions = Partial<Record<AssumptionDocType, number>>;

export function isAssumptionDocType(v: unknown): v is AssumptionDocType {
  return typeof v === "string" && (ASSUMPTION_DOC_TYPES as readonly string[]).includes(v);
}

export function validateMinutes(v: unknown): { ok: true; minutes: number } | { ok: false; message: string } {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > MAX_MINUTES_PER_DOC) {
    return { ok: false, message: `Informe minutos inteiros entre 0 e ${MAX_MINUTES_PER_DOC}.` };
  }
  return { ok: true, minutes: v };
}

export interface TimeSavedEstimate {
  /** Sempre verdadeiro: nunca é medição. */
  isEstimate: true;
  /** null = sem premissa configurada → nada é estimado. */
  totalMinutes: number | null;
  perType: Array<{ docType: AssumptionDocType; documents: number; assumedMinutes: number | null; minutes: number | null }>;
  premise: string;
}

export function estimateTimeSaved(issued: Partial<Record<AssumptionDocType, number>>, assumptions: Assumptions): TimeSavedEstimate {
  let total = 0;
  let any = false;
  const perType = ASSUMPTION_DOC_TYPES.map((docType) => {
    const documents = issued[docType] ?? 0;
    const assumedMinutes = assumptions[docType] ?? null;
    if (assumedMinutes === null) return { docType, documents, assumedMinutes, minutes: null };
    any = true;
    const minutes = documents * assumedMinutes;
    total += minutes;
    return { docType, documents, assumedMinutes, minutes };
  });
  return {
    isEstimate: true,
    totalMinutes: any ? total : null,
    perType,
    premise: "Estimativa: documentos emitidos no período × minutos que a clínica considera economizados por documento. Não é medição de tempo.",
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}

/** Ações auditadas que viram "uso de funcionalidades". Allowlist: ação fora dela não aparece no painel. */
export const FEATURE_ACTION_LABELS: Record<string, string> = {
  live_patient_create: "Pacientes cadastrados",
  live_clinical_event_create: "Registros clínicos criados",
  live_assessment_create: "Avaliações registradas",
  family_portal_share_create: "Links do portal da família criados",
  remote_intake_invite_create: "Convites de anamnese remota",
  remote_scale_invite_create: "Convites de escala remota",
  remote_scale_response_review: "Respostas de escala revisadas",
  ai_use_recorded: "Usos de IA registrados",
  live_export_request_create: "Pedidos de exportação",
};

/** Funcionalidades usadas no navegador, sem registro no servidor: o painel declara que NÃO mede. */
export const NOT_MEASURED = [
  "Laudo em um clique, resumo pré-consulta, evolução de escalas e checagem de dose rodam no navegador e não deixam registro no servidor.",
  "Testes próprios do NeuroPad (Super NeuroPad Game, Dyslexia Risk): o painel nunca mostra resultado, corte, nível ou classificação.",
  "Consultas da agenda não entram: a agenda legada não é separada por clínica.",
] as const;

export function rate(part: number, whole: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}
