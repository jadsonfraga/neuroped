/** Tipos e helpers puros do Modo Fácil (sem React): testáveis em Node. */
export type EasyOutcome = "acertou" | "nao" | "pulou";
export const EASY_OUTCOME_LABEL: Record<EasyOutcome, string> = {
  acertou: "Acertou",
  nao: "Não acertou",
  pulou: "Pulou",
};
export const OBJECTIVE_OUTCOME_LABEL: Record<EasyOutcome, string> = {
  acertou: "Certo",
  nao: "Errado",
  pulou: "Pulou",
};
export interface EasyRecord {
  id: string;
  group: string;
  title: string;
  outcome: EasyOutcome;
  /** true quando a tela da criança decidiu sozinha (toque na figura). */
  auto: boolean;
  /** Modo objetivo: o que a criança tocou e a resposta certa. */
  chosen?: string;
  correct?: string;
}
export function easyCounts(records: EasyRecord[]) {
  return {
    total: records.length,
    acertou: records.filter((r) => r.outcome === "acertou").length,
    nao: records.filter((r) => r.outcome === "nao").length,
    pulou: records.filter((r) => r.outcome === "pulou").length,
  };
}

export function buildEasyReport(input: {
  title: string;
  ageLabel: string;
  nature: string;
  records: EasyRecord[];
  totalSteps: number;
  footer?: string;
  date?: string;
  /** Modo objetivo: certo/errado julgado pelo aplicativo a partir do toque. */
  objective?: boolean;
}): string {
  const counts = easyCounts(input.records);
  const label = input.objective ? OBJECTIVE_OUTCOME_LABEL : EASY_OUTCOME_LABEL;
  const lines = [
    `${input.title} · Modo Fácil (joguinho)`,
    `Idade: ${input.ageLabel} · Data: ${input.date ?? new Date().toISOString().slice(0, 10)}`,
    "REGISTRO OBSERVACIONAL DESCRITIVO — NÃO É ESCORE, PERCENTIL NEM DIAGNÓSTICO",
    input.objective
      ? "\"Certo\" e \"Errado\" são o toque da criança na tela comparado à resposta única de cada item; \"Pulou\" é item sem resposta. Leitura e conclusão pertencem ao médico."
      : "\"Acertou\" e \"Não acertou\" são o que o adulto marcou ter visto nesta interação; \"Pulou\" é passo não aplicado. Leitura e conclusão pertencem ao médico.",
    `Itens previstos: ${input.totalSteps} · Registrados: ${counts.total} · ${label.acertou}: ${counts.acertou} · ${label.nao}: ${counts.nao} · ${label.pulou}: ${counts.pulou}`,
    "",
    "Por item:",
    ...input.records.map((r, i) => `${i + 1}. [${r.group}] ${r.title} — ${label[r.outcome]}${r.chosen !== undefined ? ` (tocou: ${r.chosen}${r.outcome === "nao" && r.correct !== undefined ? `; certo: ${r.correct}` : ""})` : r.auto ? " (toque da criança na tela)" : ""}`),
    "",
    input.nature,
    ...(input.footer ? [input.footer] : []),
  ];
  return lines.join("\n");
}

