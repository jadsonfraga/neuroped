import { z } from "zod";
import type { SessionRecord } from "./session";
import { momentChanged, reviewChanged } from "./evidence";
export const WORK_PHASES = ["Preparação", "Revisão da assistente", "Revisão médica", "Entrega"] as const;
export type WorkPhase = typeof WORK_PHASES[number];
export const workLogSchema = z.object({
  phase: z.enum(WORK_PHASES), seconds: z.number().int().min(0).max(7200),
  endedBy: z.enum(["manual", "troca de etapa", "aba oculta", "início da coleta", "limite"]),
}).strict();
export const pilotSchema = z.object({
  schemaVersion: z.literal("1.0.0"), logs: z.array(workLogSchema).max(100),
  utility: z.enum(["não avaliada", "não acrescentou", "acrescentou parcialmente", "acrescentou informação útil"]),
  repeatNeed: z.enum(["não avaliada", "não foi necessário", "repetição parcial", "repetição ampla"]),
  difficulty: z.enum(["não informada", "nenhuma relatada", "áudio ou imagem", "interação com a tela", "material ou ambiente", "outra"]),
  source: z.enum(["local-session", "imported-unverified"]),
}).strict();
export type PilotRecord = z.infer<typeof pilotSchema>;
export const emptyPilot = (): PilotRecord => ({ schemaVersion: "1.0.0", logs: [], utility: "não avaliada", repeatNeed: "não avaliada", difficulty: "não informada", source: "local-session" });
export function elapsedWork(start: number, now: number): number { return Math.min(7200, Math.max(0, Math.floor((now - start) / 1000))); }
/** Whitelist export: no name, code, session ID, date, notes, filename, digest or free text. Not a claim of anonymisation. */
export function pilotMetrics(record: SessionRecord) {
  const p = record.pilot ?? emptyPilot(); const e = record.evidence;
  const sums = Object.fromEntries(WORK_PHASES.map((phase) => [phase, p.logs.some((l) => l.phase === phase) ? p.logs.filter((l) => l.phase === phase).reduce((sum, l) => sum + l.seconds, 0) : null]));
  return {
    schema: "obs10-operational-metrics-1", protocolVersion: record.version, ageBand: record.context.bandId,
    collectionSeconds: record.durationSeconds, workSecondsRecorded: sums,
    measurementScope: "Somente períodos explicitamente cronometrados; não representam tempo total nem economia de tempo. Preparação/revisão fora da interação de até 10 minutos.",
    manualPausesOrInterruptions: p.logs.filter((l) => l.endedBy !== "manual").length,
    observations: record.observations.length, momentsLinked: e?.moments.length ?? 0,
    observationsWithCurrentLink: new Set(e?.moments.filter((m) => !momentChanged(m, record.observations)).map((m) => m.observationId)).size,
    commentsRecorded: e?.reviews.length ?? 0,
    commentsNeedingRecheck: e?.reviews.filter((r) => reviewChanged(r, e, record.observations) || r.origin === "imported-unverified").length ?? 0,
    usefulnessReported: p.utility, repeatedTasksReported: p.repeatNeed, difficultyReported: p.difficulty, reportSource: p.source,
    limitation: "Indicadores do processo e opinião declarada, não desempenho da criança, acurácia, validação clínica ou benefício comprovado. Exportação sem campos livres não garante anonimato em grupos pequenos.",
  };
}
