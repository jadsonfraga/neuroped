import { z } from "zod";
import { AGE_BANDS } from "./protocol";
import { DIFFICULTY_OPTIONS, METRICS_SCHEMA, REPEAT_OPTIONS, UTILITY_OPTIONS, WORK_PHASES, type PilotMetrics, type WorkPhase } from "./pilot";

export const MAX_METRICS_FILES = 200;
export const MAX_METRICS_BYTES = 64 * 1024;
export const SMALL_GROUP = 5;
export const AGGREGATE_SCHEMA = "obs10-pilot-aggregate-1";
const count = (max: number) => z.number().int().min(0).max(max);
const seconds = count(7200);
/** Strict mirror of the export whitelist: any extra field, free text or unknown value is refused. */
export const metricsSchema = z.object({
  schema: z.literal(METRICS_SCHEMA),
  protocolVersion: z.string().regex(/^1\.\d\.0$/),
  ageBand: z.string().max(10).refine((id) => AGE_BANDS.some((band) => band.id === id)),
  collectionSeconds: count(600),
  workSecondsRecorded: z.object(Object.fromEntries(WORK_PHASES.map((phase) => [phase, seconds.nullable()])) as Record<WorkPhase, z.ZodNullable<typeof seconds>>).strict(),
  measurementScope: z.string().max(400),
  manualPausesOrInterruptions: count(100),
  observations: count(200), momentsLinked: count(200), observationsWithCurrentLink: count(200),
  commentsRecorded: count(300), commentsNeedingRecheck: count(300),
  usefulnessReported: z.enum(UTILITY_OPTIONS), repeatedTasksReported: z.enum(REPEAT_OPTIONS), difficultyReported: z.enum(DIFFICULTY_OPTIONS),
  reportSource: z.enum(["local-session", "imported-unverified"]),
  limitation: z.string().max(600),
}).strict();
export type MetricsParse = { ok: true; metrics: PilotMetrics } | { ok: false; error: string };
export function parseMetricsJSON(raw: string): MetricsParse {
  if (new TextEncoder().encode(raw).length > MAX_METRICS_BYTES) return { ok: false, error: "Arquivo maior que 64 KB; não é uma exportação de métricas." };
  try {
    const result = metricsSchema.safeParse(JSON.parse(raw.replace(/^\uFEFF/, "")));
    return result.success ? { ok: true, metrics: result.data as PilotMetrics } : { ok: false, error: "Não é uma exportação de métricas OBS-10 ou contém campos fora da lista permitida." };
  } catch { return { ok: false, error: "JSON inválido." }; }
}
export interface Spread { n: number; min: number; median: number; max: number }
function spread(values: number[]): Spread | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return { n: sorted.length, min: sorted[0], median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2, max: sorted[sorted.length - 1] };
}
const tally = <T extends string>(options: readonly T[], values: T[]): Record<T, number> => Object.fromEntries(options.map((option) => [option, values.filter((value) => value === option).length])) as Record<T, number>;
export function aggregateMetrics(files: PilotMetrics[]) {
  const seen = new Set<string>();
  const unique: PilotMetrics[] = [];
  for (const file of files) { const key = JSON.stringify(file); if (!seen.has(key)) { seen.add(key); unique.push(file); } }
  const byAgeBand = AGE_BANDS.map((band) => ({ id: band.id, label: band.label, n: unique.filter((m) => m.ageBand === band.id).length })).filter((row) => row.n > 0).map((row) => ({ ...row, smallGroup: row.n < SMALL_GROUP }));
  return {
    schema: AGGREGATE_SCHEMA,
    filesRead: files.length, duplicatesIgnored: files.length - unique.length, sessions: unique.length,
    importedUnverified: unique.filter((m) => m.reportSource === "imported-unverified").length,
    smallSample: unique.length < SMALL_GROUP,
    byVersion: Object.fromEntries([...new Set(unique.map((m) => m.protocolVersion))].sort().map((v) => [v, unique.filter((m) => m.protocolVersion === v).length])) as Record<string, number>,
    byAgeBand,
    collectionSeconds: spread(unique.map((m) => m.collectionSeconds)),
    reachedLimit: unique.filter((m) => m.collectionSeconds >= 600).length,
    workSeconds: Object.fromEntries(WORK_PHASES.map((phase) => [phase, spread(unique.map((m) => m.workSecondsRecorded[phase]).filter((v): v is number => v !== null))])) as Record<WorkPhase, Spread | null>,
    interruptions: unique.reduce((sum, m) => sum + m.manualPausesOrInterruptions, 0),
    observations: spread(unique.map((m) => m.observations)),
    momentsLinked: unique.reduce((sum, m) => sum + m.momentsLinked, 0),
    observationsWithCurrentLink: unique.reduce((sum, m) => sum + m.observationsWithCurrentLink, 0),
    commentsRecorded: unique.reduce((sum, m) => sum + m.commentsRecorded, 0),
    commentsNeedingRecheck: unique.reduce((sum, m) => sum + m.commentsNeedingRecheck, 0),
    usefulness: tally(UTILITY_OPTIONS, unique.map((m) => m.usefulnessReported)),
    repeatNeed: tally(REPEAT_OPTIONS, unique.map((m) => m.repeatedTasksReported)),
    difficulty: tally(DIFFICULTY_OPTIONS, unique.map((m) => m.difficultyReported)),
    limitation: "Consolidação local de indicadores de processo e opiniões declaradas. Não mede desempenho da criança, acurácia, validação clínica ou benefício. Contagens pequenas por faixa podem reidentificar; não publicar microdados. Arquivos idênticos foram contados uma vez; exportações repetidas com diferenças não são detectadas.",
  };
}
export type PilotAggregate = ReturnType<typeof aggregateMetrics>;
const clock = (s: number) => `${Math.floor(s / 60)}min${String(Math.round(s % 60)).padStart(2, "0")}s`;
const line = (label: string, s: Spread | null) => s ? `- ${label}: ${s.n} medida(s); mínimo ${clock(s.min)}, mediana ${clock(s.median)}, máximo ${clock(s.max)}.` : `- ${label}: não medido em nenhuma aplicação.`;
const tallyLines = <T extends string>(t: Record<T, number>) => (Object.entries(t) as [T, number][]).filter(([, n]) => n > 0).map(([k, n]) => `${k}: ${n}`).join("; ") || "sem registros";
export function aggregateText(a: PilotAggregate): string {
  return [
    "# Piloto OBS-10 · consolidação local de métricas operacionais",
    `${a.sessions} aplicação(ões) distintas em ${a.filesRead} arquivo(s) válido(s); ${a.duplicatesIgnored} duplicado(s) ignorado(s); ${a.importedUnverified} de origem importada, não verificada. Arquivos recusados não entram na contagem.`,
    a.smallSample ? `Amostra pequena (menos de ${SMALL_GROUP}): descreva, não conclua.` : "",
    "",
    "## Aplicações",
    `- Por versão do roteiro: ${Object.entries(a.byVersion).map(([v, n]) => `${v}: ${n}`).join("; ") || "nenhuma"}.`,
    `- Por faixa etária: ${a.byAgeBand.map((row) => `${row.label}: ${row.n}${row.smallGroup ? " (grupo pequeno)" : ""}`).join("; ") || "nenhuma"}.`,
    line("Duração da coleta", a.collectionSeconds),
    `- Coletas que atingiram os dez minutos: ${a.reachedLimit}.`,
    "",
    "## Trabalho cronometrado voluntariamente (fora dos dez minutos)",
    ...WORK_PHASES.map((phase) => line(phase, a.workSeconds[phase])),
    `- Medições interrompidas por aba oculta ou limite: ${a.interruptions}. Períodos não medidos não são zero.`,
    "",
    "## Documentação e evidência",
    a.observations ? `- Registros por aplicação: mediana ${a.observations.median} (mínimo ${a.observations.min}, máximo ${a.observations.max}).` : "- Registros por aplicação: nenhum.",
    `- Trechos de vídeo vinculados: ${a.momentsLinked}; registros com vínculo atual: ${a.observationsWithCurrentLink}.`,
    `- Comentários profissionais: ${a.commentsRecorded}; a reconferir ou importados: ${a.commentsNeedingRecheck}.`,
    "",
    "## Opiniões declaradas (não são medidas de acurácia)",
    `- Utilidade para a consulta: ${tallyLines(a.usefulness)}.`,
    `- Necessidade de repetir tarefas: ${tallyLines(a.repeatNeed)}.`,
    `- Dificuldade operacional: ${tallyLines(a.difficulty)}.`,
    "",
    "## Limites",
    a.limitation,
  ].filter((l, i, all) => l !== "" || all[i - 1] !== "").join("\n");
}
