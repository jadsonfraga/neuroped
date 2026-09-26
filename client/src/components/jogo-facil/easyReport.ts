/** Tipos e helpers puros do Modo Fácil (sem React): testáveis em Node. */
export type EasyOutcome = "acertou" | "nao" | "pulou";
export interface EasyAnswerDetail { chosen: string; correct: string }
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
export interface EasyRecord extends Partial<EasyAnswerDetail> {
  id: string;
  group: string;
  title: string;
  outcome: EasyOutcome;
  /** true quando a tela da criança decidiu sozinha (toque na figura). */
  auto: boolean;
}
/**
 * Intervalo mínimo entre dois toques aceitos pelo motor (Acertou, Não acertou,
 * Pular, Próximo, Mostrar, Voltar e o primeiro toque na tela da criança). Um
 * toque duplo, comum em tablet, chega em ~100–250 ms; um toque deliberado
 * seguinte exige ler a tela nova. Compara o carimbo do próprio evento
 * (event.timeStamp), não relógio JS, para conviver com o relógio falso dos e2e.
 */
export const MANUAL_TAP_MIN_GAP_MS = 300;
export function acceptManualTap(lastAt: number, at: number, minGap = MANUAL_TAP_MIN_GAP_MS): boolean {
  if (!Number.isFinite(at)) return true;
  return !(at - lastAt < minGap);
}
/** Data local (AAAA-MM-DD): o registro nasce no fuso da consulta, não em UTC. */
export function localIsoDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
    `Idade: ${input.ageLabel} · Data: ${input.date ?? localIsoDate()}`,
    "REGISTRO OBSERVACIONAL DESCRITIVO — NÃO É ESCORE, PERCENTIL NEM DIAGNÓSTICO",
    input.objective
      ? "\"Certo\" e \"Errado\" são o toque da criança na tela comparado à resposta única de cada item; \"Pulou\" é item sem resposta. Leitura e conclusão pertencem ao médico."
      : "\"Acertou\" e \"Não acertou\" podem ser registrados pelo adulto ou, quando o item permite, calculados pela interação da criança na tela; \"Pulou\" é item sem resposta. Leitura e conclusão pertencem ao médico.",
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

