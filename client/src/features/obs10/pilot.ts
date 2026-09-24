import { z } from "zod";
import type { SessionRecord } from "./session";
import { momentChanged, reviewChanged } from "./evidence";
export const WORK_PHASES = ["Preparação", "Revisão da assistente", "Revisão médica", "Entrega"] as const;
export type WorkPhase = typeof WORK_PHASES[number];
export const UTILITY_OPTIONS = ["não avaliada", "não acrescentou", "acrescentou parcialmente", "acrescentou informação útil"] as const;
export const REPEAT_OPTIONS = ["não avaliada", "não foi necessário", "repetição parcial", "repetição ampla"] as const;
export const DIFFICULTY_OPTIONS = ["não informada", "nenhuma relatada", "áudio ou imagem", "interação com a tela", "material ou ambiente", "outra"] as const;
export const SEGMENT_ENDINGS = ["manual", "troca de etapa", "aba oculta", "início da coleta", "limite"] as const;
/** Only endings the operator did not choose count as interruptions; switching phase or starting the collection is deliberate. */
export const INTERRUPTION_ENDINGS: readonly (typeof SEGMENT_ENDINGS)[number][] = ["aba oculta", "limite"];
export const workLogSchema = z.object({
  phase: z.enum(WORK_PHASES), seconds: z.number().int().min(0).max(7200),
  endedBy: z.enum(SEGMENT_ENDINGS),
}).strict();
export const pilotSchema = z.object({
  schemaVersion: z.literal("1.0.0"), logs: z.array(workLogSchema).max(100),
  utility: z.enum(UTILITY_OPTIONS),
  repeatNeed: z.enum(REPEAT_OPTIONS),
  difficulty: z.enum(DIFFICULTY_OPTIONS),
  source: z.enum(["local-session", "imported-unverified"]),
}).strict();
export type PilotRecord = z.infer<typeof pilotSchema>;
export const emptyPilot = (): PilotRecord => ({ schemaVersion: "1.0.0", logs: [], utility: "não avaliada", repeatNeed: "não avaliada", difficulty: "não informada", source: "local-session" });
export function elapsedWork(start: number, now: number): number { return Math.min(7200, Math.max(0, Math.floor((now - start) / 1000))); }
export const METRICS_SCHEMA = "obs10-operational-metrics-1";
export const METRICS_SCOPE = "Somente períodos explicitamente cronometrados; não representam tempo total nem economia de tempo. Preparação/revisão fora da interação de até 10 minutos.";
export const METRICS_LIMITATION = "Indicadores do processo e opinião declarada, não desempenho da criança, acurácia, validação clínica ou benefício comprovado. Exportação sem campos livres não garante anonimato em grupos pequenos.";
/** Whitelist export: no name, code, session ID, date, notes, filename, digest or free text. Not a claim of anonymisation. */
export function pilotMetrics(record: SessionRecord) {
  const p = record.pilot ?? emptyPilot(); const e = record.evidence;
  const sums = Object.fromEntries(WORK_PHASES.map((phase) => [phase, p.logs.some((l) => l.phase === phase) ? p.logs.filter((l) => l.phase === phase).reduce((sum, l) => sum + l.seconds, 0) : null])) as Record<WorkPhase, number | null>;
  return {
    schema: METRICS_SCHEMA, protocolVersion: record.version, ageBand: record.context.bandId,
    collectionSeconds: record.durationSeconds, workSecondsRecorded: sums,
    measurementScope: METRICS_SCOPE,
    manualPausesOrInterruptions: p.logs.filter((l) => INTERRUPTION_ENDINGS.includes(l.endedBy)).length,
    observations: record.observations.length, momentsLinked: e?.moments.length ?? 0,
    observationsWithCurrentLink: new Set(e?.moments.filter((m) => !momentChanged(m, record.observations)).map((m) => m.observationId)).size,
    commentsRecorded: e?.reviews.length ?? 0,
    commentsNeedingRecheck: e?.reviews.filter((r) => reviewChanged(r, e, record.observations) || r.origin === "imported-unverified").length ?? 0,
    usefulnessReported: p.utility, repeatedTasksReported: p.repeatNeed, difficultyReported: p.difficulty, reportSource: p.source,
    limitation: METRICS_LIMITATION,
  };
}
export type PilotMetrics = ReturnType<typeof pilotMetrics>;
