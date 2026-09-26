import { OUTCOMES, type Outcome } from "./protocol";
import type { SessionRecord } from "./session";
import type { TabletRecord } from "./tablet/engine";

/** Reliability of the CODING, never of the child. Two applicators code the same session independently and
 * this compares the categories they declared. It does not validate the script, the child or the diagnosis. */
export const AGREEMENT_SCHEMA = "obs10-observer-agreement-1";
export const AGREEMENT_LIMITATION = "Mede a concordância entre duas codificações da mesma sessão, não o desempenho da criança, a acurácia do roteiro ou validade clínica. Concordância alta pode refletir categorias fáceis ou um único padrão dominante; concordância baixa pode refletir instrução ambígua, ângulo de câmera ou momentos diferentes observados. Nenhum resultado aqui autoriza diagnóstico.";
export const KAPPA_SMALL_SAMPLE = 10;

export type Modality = "in-person" | "tablet-exploratory";
export interface CodedTask { taskId: string; outcome: Outcome | null }
export interface Coding {
  modality: Modality;
  bandId: string;
  months: number;
  /** Institutional code, used only to refuse mismatched pairs. Never exported in the metrics. */
  code: string;
  tasks: CodedTask[];
  /** Free-text observations have no stable identity between observers, so they cannot be paired. */
  unpairable: number;
}
export interface Divergence { taskId: string; first: Outcome | null; second: Outcome | null }
export interface AgreementReport {
  schema: typeof AGREEMENT_SCHEMA;
  modality: Modality;
  bandId: string;
  months: number;
  pairLabel: string;
  tasksInSheet: number;
  comparable: number;
  codedOnlyByFirst: number;
  codedOnlyBySecond: number;
  codedByNeither: number;
  unpairableObservations: number;
  exactMatches: number;
  percentAgreement: number | null;
  kappa: number | null;
  kappaNote: string;
  divergences: Divergence[];
  limitation: typeof AGREEMENT_LIMITATION;
}

export function tabletCoding(record: TabletRecord): Coding {
  return {
    modality: "tablet-exploratory", bandId: record.bandId, months: record.context.months, code: record.context.code,
    tasks: record.observations.map((o) => ({ taskId: o.taskId, outcome: o.outcome })), unpairable: 0,
  };
}
export function classicCoding(record: SessionRecord): Coding {
  // Only guided cards carry an identity both observers can reach; manual entries are counted, never paired.
  const guided = record.observations.filter((o) => o.id.startsWith("guided-"));
  return {
    modality: "in-person", bandId: record.context.bandId, months: record.context.correctedMonths ?? record.context.chronologicalMonths,
    code: record.context.code,
    tasks: guided.map((o) => ({ taskId: o.id.slice("guided-".length), outcome: o.outcome || null })),
    unpairable: record.observations.length - guided.length,
  };
}
export class AgreementRefused extends Error {}
/** Fails closed: comparing codings of different sheets, ages or modalities would manufacture a number. */
export function compareCodings(first: Coding, second: Coding, pairLabel: string, taskIds: readonly string[]): AgreementReport {
  if (first.modality !== second.modality) throw new AgreementRefused("Modalidades diferentes. Uma coleta presencial não se compara a uma coleta em tablet.");
  if (first.bandId !== second.bandId || first.months !== second.months) throw new AgreementRefused("Ficha etária ou idade diferentes entre os dois registros.");
  if (!first.code || first.code !== second.code) throw new AgreementRefused("Código institucional ausente ou diferente. Confirme que os dois registros são da mesma sessão.");
  if (new Set(first.tasks.map((t) => t.taskId)).size !== first.tasks.length || new Set(second.tasks.map((t) => t.taskId)).size !== second.tasks.length) {
    throw new AgreementRefused("Um dos registros repete a mesma tarefa; não é possível parear.");
  }
  const outcomeOf = (coding: Coding, taskId: string) => coding.tasks.find((t) => t.taskId === taskId)?.outcome ?? null;
  const divergences: Divergence[] = [];
  let comparable = 0, exactMatches = 0, codedOnlyByFirst = 0, codedOnlyBySecond = 0, codedByNeither = 0;
  const firstCounts = new Map<Outcome, number>(); const secondCounts = new Map<Outcome, number>();
  for (const taskId of taskIds) {
    const a = outcomeOf(first, taskId); const b = outcomeOf(second, taskId);
    if (a && b) {
      comparable += 1;
      firstCounts.set(a, (firstCounts.get(a) ?? 0) + 1);
      secondCounts.set(b, (secondCounts.get(b) ?? 0) + 1);
      if (a === b) exactMatches += 1; else divergences.push({ taskId, first: a, second: b });
    } else if (a) { codedOnlyByFirst += 1; divergences.push({ taskId, first: a, second: null }); }
    else if (b) { codedOnlyBySecond += 1; divergences.push({ taskId, first: null, second: b }); }
    else codedByNeither += 1;
  }
  const percentAgreement = comparable ? round(exactMatches / comparable) : null;
  let kappa: number | null = null;
  let kappaNote = "Kappa não calculado: nenhuma tarefa foi categorizada pelos dois observadores.";
  if (comparable > 0) {
    const expected = OUTCOMES.reduce((sum, option) => sum + ((firstCounts.get(option.id) ?? 0) / comparable) * ((secondCounts.get(option.id) ?? 0) / comparable), 0);
    if (expected >= 1) kappaNote = "Kappa indefinido: os dois observadores usaram uma única categoria em todas as tarefas, então o acaso já explicaria a concordância.";
    else {
      kappa = round((exactMatches / comparable - expected) / (1 - expected));
      kappaNote = comparable < KAPPA_SMALL_SAMPLE
        ? `Kappa calculado sobre ${comparable} tarefa(s): amostra pequena demais para estabilidade. Leia como indício, não como medida.`
        : `Kappa corrigido pelo acaso sobre ${comparable} tarefas. Não é validação clínica nem norma.`;
    }
  }
  return {
    schema: AGREEMENT_SCHEMA, modality: first.modality, bandId: first.bandId, months: first.months,
    pairLabel: pairLabel.trim().slice(0, 40), tasksInSheet: taskIds.length, comparable,
    codedOnlyByFirst, codedOnlyBySecond, codedByNeither,
    unpairableObservations: first.unpairable + second.unpairable,
    exactMatches, percentAgreement, kappa, kappaNote, divergences, limitation: AGREEMENT_LIMITATION,
  };
}
function round(value: number): number { return Math.round(value * 1000) / 1000; }
export function agreementText(report: AgreementReport): string {
  const label = (outcome: Outcome | null) => outcome ? OUTCOMES.find((o) => o.id === outcome)?.label ?? outcome : "não categorizada";
  return [
    "NEUROPED · OBS-10 · CONCORDÂNCIA ENTRE OBSERVADORES",
    AGREEMENT_LIMITATION, "",
    `Par: ${report.pairLabel || "não identificado"} | Modalidade: ${report.modality} | Ficha: ${report.bandId} | Idade utilizada: ${report.months} meses`,
    `Tarefas da ficha: ${report.tasksInSheet} | Categorizadas pelos dois: ${report.comparable}`,
    `Somente pelo primeiro: ${report.codedOnlyByFirst} | Somente pelo segundo: ${report.codedOnlyBySecond} | Por nenhum: ${report.codedByNeither}`,
    report.unpairableObservations ? `Registros livres não pareáveis: ${report.unpairableObservations}. Não entram no cálculo.` : "Nenhum registro livre não pareável.",
    `Concordância exata: ${report.exactMatches}/${report.comparable}${report.percentAgreement === null ? "" : ` (${(report.percentAgreement * 100).toFixed(1)}%)`}`,
    `Kappa: ${report.kappa === null ? "não calculado" : report.kappa.toFixed(3)}. ${report.kappaNote}`,
    "",
    "DIVERGÊNCIAS, PARA CONFERÊNCIA HUMANA",
    ...(report.divergences.length ? report.divergences.map((d) => `${d.taskId}: primeiro ${label(d.first)} | segundo ${label(d.second)}`) : ["Nenhuma divergência registrada entre as tarefas categorizadas."]),
    "",
    "Divergência não indica erro de um observador: pode revelar instrução ambígua, enquadramento ou momento diferente. Revisar com o médico antes de mudar o roteiro.",
  ].join("\n");
}
