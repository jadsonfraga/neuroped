/** Resultado do modo Fases montado só a partir do registro da aplicadora (sem vídeo).
 * Síntese descritiva por fase para revisão médica: agrupa as categorias declaradas, sem peso, soma total,
 * ponto de corte, norma ou conclusão. Nenhum texto é criado no lugar da aplicadora. */
import { PHASES, type Outcome } from "../protocol";
import { PRACTICAL_TASKS } from "../practical";
import type { SessionRecord } from "../session";

export const RESULT_GROUPS = [
  { id: "free", label: "sem ajuda extra", outcomes: ["E"] },
  { id: "helped", label: "com ajuda", outcomes: ["V", "M", "A"] },
  { id: "notNow", label: "não fez agora", outcomes: ["ND"] },
  { id: "refused", label: "não quis", outcomes: ["R"] },
  { id: "skipped", label: "pulado", outcomes: ["NA"] },
] as const satisfies ReadonlyArray<{ id: string; label: string; outcomes: readonly Outcome[] }>;
export type ResultGroup = typeof RESULT_GROUPS[number]["id"];
const HELP: Partial<Record<Outcome, string>> = { V: "pedido repetido", M: "gesto ou demonstração extra", A: "apoio habitual" };

export interface ResultCard { phase: number; title: string; outcome: Outcome | ""; group: ResultGroup | null; note: string; reason: string }
export interface ResultPhase { index: number; title: string; icon: string; counts: Record<ResultGroup, number>; unmarked: number; cards: ResultCard[] }

export function applicatorResult(record: Pick<SessionRecord, "context" | "observations">) {
  const tasks = PRACTICAL_TASKS[record.context.bandId] ?? [];
  const phases: ResultPhase[] = PHASES.map((phase, index) => {
    const cards: ResultCard[] = tasks.filter((task) => task.phase === index).map((task) => {
      const entry = record.observations.find((item) => item.id === `guided-${task.id}` && item.outcome);
      const outcome = entry?.outcome ?? "";
      const group = outcome ? RESULT_GROUPS.find((item) => (item.outcomes as readonly string[]).includes(outcome))?.id ?? null : null;
      return {
        phase: index, title: task.title, outcome, group,
        note: entry && outcome !== "NA" ? entry.response.trim() : "",
        reason: entry && (outcome === "NA" || HELP[outcome as Outcome]) ? entry.assistance.trim() : "",
      };
    });
    const counts = Object.fromEntries(RESULT_GROUPS.map((item) => [item.id, cards.filter((card) => card.group === item.id).length])) as Record<ResultGroup, number>;
    return { index, title: phase.title, icon: phase.icon, counts, unmarked: cards.filter((card) => !card.group).length, cards };
  });
  return {
    phases,
    toReview: phases.flatMap((phase) => phase.cards.filter((card) => card.group === "helped" || card.group === "notNow" || card.group === "refused")),
    skipped: phases.flatMap((phase) => phase.cards.filter((card) => card.group === "skipped")),
  };
}
/** Contagens da fase em linguagem simples, só as que existem. */
export function phaseLine(phase: ResultPhase): string {
  const parts = RESULT_GROUPS.filter((item) => phase.counts[item.id] > 0).map((item) => `${phase.counts[item.id]} ${item.label}`);
  if (phase.unmarked) parts.push(`${phase.unmarked} sem marca`);
  return parts.length ? parts.join(" · ") : "sem cartões";
}
export function cardLine(card: ResultCard): string {
  const label = RESULT_GROUPS.find((item) => item.id === card.group)?.label ?? "sem marca";
  const help = HELP[card.outcome as Outcome];
  return `Fase ${card.phase + 1} · ${card.title}: ${label}${help ? ` (${help})` : ""}.${card.note ? ` Nota: “${card.note}”.` : ""}`;
}
export function applicatorResultText(record: Pick<SessionRecord, "context" | "observations">): string {
  const { phases, toReview, skipped } = applicatorResult(record);
  return [
    "RESULTADO PELO REGISTRO DA APLICADORA — SEM VÍDEO",
    "Base: categorias marcadas e notas digitadas pela aplicadora durante a coleta. Síntese descritiva para revisão médica; não é escore, norma, percentil nem diagnóstico. “Não fez agora” e “não quis” não indicam incapacidade; cartão sem marca não indica habilidade ausente nem presente.",
    "Por fase:",
    ...phases.map((phase) => `${phase.index + 1}. ${phase.title}: ${phaseLine(phase)}.`),
    "Para o médico conferir na consulta (com ajuda, não fez agora ou não quis):",
    ...(toReview.length ? toReview.map((card) => `- ${cardLine(card)}`) : ["- Nenhum cartão marcado com ajuda, não fez agora ou não quis."]),
    ...(skipped.length ? ["Não aplicados e motivo informado:", ...skipped.map((card) => `- Fase ${card.phase + 1} · ${card.title}: ${card.reason || "motivo não informado"}`)] : []),
  ].join("\n");
}
