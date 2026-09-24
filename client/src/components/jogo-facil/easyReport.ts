/** Tipos e helpers puros do Modo Fácil (sem React): testáveis em Node. */
export type EasyOutcome = "acertou" | "nao" | "pulou";
export const EASY_OUTCOME_LABEL: Record<EasyOutcome, string> = {
  acertou: "Acertou",
  nao: "Não acertou",
  pulou: "Pulou",
};
export interface EasyRecord {
  id: string;
  group: string;
  title: string;
  outcome: EasyOutcome;
  /** true quando a tela da criança decidiu sozinha (toque na figura). */
  auto: boolean;
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
}): string {
  const counts = easyCounts(input.records);
  const lines = [
    `${input.title} · Modo Fácil (joguinho)`,
    `Idade: ${input.ageLabel} · Data: ${input.date ?? new Date().toISOString().slice(0, 10)}`,
    "REGISTRO OBSERVACIONAL DESCRITIVO — NÃO É ESCORE, PERCENTIL NEM DIAGNÓSTICO",
    "\"Acertou\" e \"Não acertou\" são o que o adulto marcou ter visto nesta interação; \"Pulou\" é passo não aplicado. Leitura e conclusão pertencem ao médico.",
    `Passos previstos: ${input.totalSteps} · Registrados: ${counts.total} · Acertou: ${counts.acertou} · Não acertou: ${counts.nao} · Pulou: ${counts.pulou}`,
    "",
    "Por passo:",
    ...input.records.map((r, i) => `${i + 1}. [${r.group}] ${r.title} — ${EASY_OUTCOME_LABEL[r.outcome]}${r.auto ? " (toque da criança na tela)" : ""}`),
    "",
    input.nature,
    ...(input.footer ? [input.footer] : []),
  ];
  return lines.join("\n");
}

