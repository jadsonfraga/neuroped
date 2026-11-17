/** Modo Fases do OBS-10: a mesma ficha, os mesmos cartões e o mesmo registro, apresentados como uma
 * sequência de fases com um toque por cartão. Camada de apresentação e de marcação rápida: não cria
 * tarefa, norma, escore, acerto/erro nem achado clínico. A progressão conta cartões marcados (qualquer
 * categoria, inclusive "pular"), nunca desempenho da criança. */
import { PHASES, type AgeBand, type Outcome } from "../protocol";
import { MATERIALS, PRACTICAL_TASKS, taskOmission, type PracticalTask } from "../practical";
import { emptyObservation, type Observation } from "../session";

export interface FasesCard { task: PracticalTask; omission: string | null; phase: number; position: number }
export interface FasesPhase { index: number; title: string; icon: string; camera: string; cards: FasesCard[] }

/** Cartões da ficha em ordem, agrupados nos seis blocos do protocolo. Omissões vêm da regra única `taskOmission`. */
export function buildFasesPlan(band: AgeBand, months: number, proneAllowed: boolean): FasesPhase[] {
  const tasks = PRACTICAL_TASKS[band.id] ?? [];
  let position = 0;
  return PHASES.map((phase, index) => ({
    index, title: phase.title, icon: phase.icon, camera: phase.camera,
    cards: tasks.filter((task) => task.phase === index).map((task) => ({ task, omission: taskOmission(task, months, proneAllowed), phase: index, position: position++ })),
  }));
}
export const flattenPlan = (plan: readonly FasesPhase[]): FasesCard[] => plan.flatMap((phase) => phase.cards);
export const cardId = (task: PracticalTask) => `guided-${task.id}`;

/** Rótulos simples para o aplicador; o registro guarda as categorias canônicas de `OUTCOMES`. */
export const FASES_HELP = [
  { outcome: "V", label: "Repeti o pedido", icon: "🔁", assistance: "Comando repetido pela aplicadora (marcação rápida do modo Fases)." },
  { outcome: "M", label: "Mostrei como fazer", icon: "👀", assistance: "Gesto ou demonstração extra dados pela aplicadora (marcação rápida do modo Fases)." },
  { outcome: "A", label: "Com apoio habitual", icon: "🦾", assistance: "Apoio habitual utilizado (marcação rápida do modo Fases); detalhar qual apoio na revisão." },
] as const satisfies ReadonlyArray<{ outcome: Outcome; label: string; icon: string; assistance: string }>;
export const FASES_SKIP = [
  "Falta material seguro.",
  "Não era seguro aplicar.",
  "Criança cansada ou indisposta.",
  "Sem tempo.",
  "Outro motivo; detalhar na revisão.",
] as const;
export const FASES_LABEL: Record<Outcome, string> = {
  E: "Fez sem ajuda extra", V: "Fez com ajuda: repeti o pedido", M: "Fez com ajuda: mostrei como fazer", A: "Fez com ajuda: apoio habitual",
  ND: "Não fez agora", R: "Não quis", NA: "Pulado",
};
export const NOT_APPLIED_RESPONSE = "Tarefa não aplicada.";

export interface FasesMark { outcome: Outcome; assistance?: string; note?: string }
/** Uma marcação vira uma observação guiada com o mesmo id do Guia da assistente, para o JSON reabrir na revisão completa.
 * A nota é opcional e literal; nada é escrito pela aplicadora além do que ela escolheu ou digitou. */
export function markObservation(task: PracticalTask, mark: FasesMark, second: number, existing: Observation | undefined, afterEnd: boolean): Observation {
  const note = (mark.note ?? "").trim();
  const needsReason = mark.outcome === "V" || mark.outcome === "M" || mark.outcome === "A" || mark.outcome === "NA";
  const base = existing ?? { ...emptyObservation(cardId(task), task.phase, second), recordedAfterEnd: afterEnd };
  return {
    ...base,
    id: cardId(task), phase: task.phase, task: task.title, outcome: mark.outcome,
    response: mark.outcome === "NA" ? (note ? `${NOT_APPLIED_RESPONSE} Nota: ${note}` : NOT_APPLIED_RESPONSE) : note,
    assistance: needsReason ? (mark.assistance ?? "").trim() : "",
    modelInInstruction: Boolean(task.model),
    applicationSecond: base.applicationSecond,
    recordedAfterEnd: base.recordedAfterEnd,
    editedAfterEnd: afterEnd || base.editedAfterEnd,
  };
}
/** Nota livre exibida para edição: a frase automática de não aplicação não é texto da aplicadora. */
export function noteOf(entry: Observation | undefined): string {
  if (!entry) return "";
  if (entry.outcome !== "NA") return entry.response;
  return entry.response.startsWith(`${NOT_APPLIED_RESPONSE} Nota: `) ? entry.response.slice(NOT_APPLIED_RESPONSE.length + 7) : "";
}
export function isMarked(card: FasesCard, observations: readonly Observation[]): boolean {
  return observations.some((entry) => entry.id === cardId(card.task) && Boolean(entry.outcome));
}
export function phaseProgress(phase: FasesPhase, observations: readonly Observation[]) {
  const marked = phase.cards.filter((card) => isMarked(card, observations)).length;
  return { marked, total: phase.cards.length, done: phase.cards.length > 0 && marked === phase.cards.length };
}
/** Contagem de documentação, não de desempenho: nenhuma categoria vale mais que outra. */
export function fasesSummary(plan: readonly FasesPhase[], observations: readonly Observation[]) {
  const cards = flattenPlan(plan);
  const entries = cards.map((card) => observations.find((entry) => entry.id === cardId(card.task) && entry.outcome));
  return {
    total: cards.length,
    marked: entries.filter(Boolean).length,
    skipped: entries.filter((entry) => entry?.outcome === "NA").length,
    unmarked: entries.filter((entry) => !entry).length,
    withoutNote: entries.filter((entry) => entry && entry.outcome !== "NA" && !entry.response.trim()).length,
    phasesDone: plan.filter((phase) => phaseProgress(phase, observations).done).length,
  };
}
/** Primeiro cartão ainda sem marcação da fase; se todos marcados, o primeiro da fase. */
export function entryCardOf(phase: FasesPhase, observations: readonly Observation[]): number {
  return (phase.cards.find((card) => !isMarked(card, observations)) ?? phase.cards[0])?.position ?? 0;
}
/** Objetos a pegar para a próxima fase, sem repetir. Apenas organização do kit. */
export function materialsFor(phase: FasesPhase | undefined): string[] {
  if (!phase) return [];
  return [...new Set(phase.cards.filter((card) => !card.omission).flatMap((card) => card.task.materials.filter((id) => id !== "device").map((id) => MATERIALS[id].label)))];
}
export type FilmingChoice = "external" | "none";
export const FILMING_RECORDING: Record<FilmingChoice, string> = {
  external: "Filmagem externa declarada pela aplicadora (celular de apoio). O vídeo não está neste registro; conferir arquivo, áudio e enquadramento no aparelho de gravação.",
  none: "Sem filmagem, declarado pela aplicadora. Registro apenas pelas marcações e notas desta tela.",
};
export const FASES_END = {
  time: "Limite de 10 minutos atingido; tarefas restantes não aplicadas.",
  hidden: "Coleta encerrada ao sair da aba; não continuar tarefas fora do cronômetro.",
  early: "Encerramento antecipado pela aplicadora; conferir tarefas não realizadas.",
  done: "Todas as fases percorridas; encerrado pela aplicadora.",
  emergency: "Interrompido por segurança; chamar médico/equipe imediatamente.",
} as const;
