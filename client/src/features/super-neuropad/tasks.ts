/**
 * Tarefas complementares cronometradas do Super NeuroPad Game (v2026-10-16) — módulo OPCIONAL, fora da contagem
 * principal de itens, fora da classificação por mundo e fora do teto de tempo da partida.
 *
 * Duas tarefas de tela, 4 a 17 anos (2 e 3 anos não fazem: tarefa cronometrada em tablet não é adequada a essa
 * faixa; esses anos seguem só com a bateria dedicada):
 *   • Span espacial (tipo blocos de Corsi; Corsi, 1972; Kessels et al., 2000): memória visuoespacial de curto prazo,
 *     ordem direta, até 2 tentativas por extensão (um acerto basta para subir) e a tarefa para após 2 falhas na mesma extensão.
 *     Layout das 9 posições e tempos de exibição são AUTORAIS (não reproduzem o tabuleiro padronizado).
 *   • Go/no-go: inibição de resposta motora e variabilidade do tempo de reação. Estímulo-alvo (go) mais frequente que o
 *     estímulo de não-resposta (no-go); contagem de omissões, comissões, toques muito rápidos, mediana, desvio-padrão e
 *     coeficiente de variação dos tempos dos acertos. Número de tentativas e tempos são decisões AUTORAIS.
 *
 * Contrato clínico: resultado descritivo. Não há norma, percentil, ponto de corte, idade equivalente nem diagnóstico para
 * estas tarefas neste aplicativo. O tempo medido inclui a latência do toque do dispositivo (não calibrada); serve para
 * comparar a criança com ela mesma ao longo da tarefa, não com outras crianças. Nada é persistido nem enviado por rede.
 */
import { latencyStats, shuffle, type LatencyStats } from "./stats";

export const TASKS_MIN_AGE = 4;
export const TASKS_VERSION = "2026-10-16.1";

export type TaskId = "corsi" | "gonogo";

export const TASK_LABELS: Record<TaskId, string> = {
  corsi: "Span espacial (blocos)",
  gonogo: "Go/no-go (tocar e segurar)",
};

export const TASK_CONSTRUCTS: Record<TaskId, string> = {
  corsi: "Memória visuoespacial de curto prazo (ordem direta)",
  gonogo: "Inibição de resposta motora e variabilidade do tempo de reação",
};

export function tasksAvailable(years: number): boolean {
  return Number.isInteger(years) && years >= TASKS_MIN_AGE;
}

// ─────────────────────────────── Span espacial ───────────────────────────────
export const CORSI_BLOCKS = 9;
export const CORSI_START_LENGTH = 2;
export const CORSI_TRIALS_PER_LENGTH = 2;
/** Cada bloco acende por este tempo, com este intervalo entre blocos (milissegundos). */
export const CORSI_FLASH_MS = 800;
export const CORSI_GAP_MS = 400;
/** Layout autoral dos 9 blocos (percentual da área). */
export const CORSI_LAYOUT: ReadonlyArray<{ x: number; y: number }> = [
  { x: 14, y: 20 }, { x: 46, y: 10 }, { x: 80, y: 24 },
  { x: 24, y: 50 }, { x: 58, y: 44 }, { x: 86, y: 62 },
  { x: 10, y: 80 }, { x: 44, y: 78 }, { x: 70, y: 88 },
];

export type CorsiError = "nenhum" | "ordem" | "intrusao" | "omissao";

export const CORSI_ERROR_LABELS: Record<CorsiError, string> = {
  nenhum: "sem erro",
  ordem: "ordem trocada (blocos certos, ordem errada)",
  intrusao: "bloco que não estava na sequência",
  omissao: "parou antes de completar a sequência",
};

export interface CorsiTrial {
  length: number;
  sequence: number[];
  response: number[];
  correct: boolean;
  error: CorsiError;
  /** Do fim da exibição ao último toque (ou ao encerramento), em segundos. */
  seconds: number;
}

export interface CorsiResult {
  task: "corsi";
  version: string;
  practiceDone: boolean;
  trials: CorsiTrial[];
  /** Maior extensão reproduzida corretamente em ao menos uma tentativa (0 se nenhuma). */
  span: number;
  /** Encerrada pela regra de parada (2 falhas na mesma extensão), por chegar ao máximo ou pela aplicadora. */
  stop: "regra" | "maximo" | "aplicadora";
}

/** Classifica o erro de uma tentativa de span: nenhum, intrusão, ordem ou omissão. */
export function classifyCorsi(sequence: readonly number[], response: readonly number[]): CorsiError {
  if (response.length === sequence.length && response.every((block, index) => block === sequence[index])) return "nenhum";
  if (response.some((block) => !sequence.includes(block))) return "intrusao";
  if (response.length < sequence.length) return "omissao";
  return "ordem";
}

/** Sequência determinística sem blocos repetidos (cada bloco aparece no máximo uma vez), semente por extensão e tentativa. */
export function corsiSequence(length: number, seed: number, attempt: number): number[] {
  const n = Math.min(Math.max(Math.trunc(length), 1), CORSI_BLOCKS);
  return shuffle(Array.from({ length: CORSI_BLOCKS }, (_, index) => index), seed + length * 977 + attempt * 31).slice(0, n);
}

/** Próximo passo do span: qual extensão/tentativa apresentar, ou parar. */
export function nextCorsiStep(trials: readonly CorsiTrial[]): { length: number; attempt: number } | { stop: "regra" | "maximo" } {
  if (trials.length === 0) return { length: CORSI_START_LENGTH, attempt: 0 };
  const last = trials[trials.length - 1];
  // Um acerto basta para subir a extensão; erro dá a segunda tentativa; dois erros na mesma extensão encerram.
  if (last.correct) return last.length >= CORSI_BLOCKS ? { stop: "maximo" } : { length: last.length + 1, attempt: 0 };
  const atLength = trials.filter((trial) => trial.length === last.length);
  if (atLength.length >= CORSI_TRIALS_PER_LENGTH) return { stop: "regra" };
  return { length: last.length, attempt: atLength.length };
}

export function summarizeCorsi(trials: readonly CorsiTrial[], practiceDone: boolean, stop: CorsiResult["stop"]): CorsiResult {
  const span = trials.filter((trial) => trial.correct).reduce((max, trial) => Math.max(max, trial.length), 0);
  return { task: "corsi", version: TASKS_VERSION, practiceDone, trials: [...trials], span, stop };
}

// ─────────────────────────────── Go/no-go ───────────────────────────────
export interface GoNoGoConfig {
  trials: number;
  nogo: number;
  /** Tempo do estímulo na tela e intervalo (variável entre min e max) até o próximo, em milissegundos. */
  stimulusMs: number;
  isiMinMs: number;
  isiMaxMs: number;
  practiceTrials: number;
}

/** Quantidade de tentativas por idade: decisão autoral (menos tentativas nas idades menores), não validada. */
export function goNoGoConfig(years: number): GoNoGoConfig {
  if (years <= 5) return { trials: 20, nogo: 5, stimulusMs: 1200, isiMinMs: 1200, isiMaxMs: 1800, practiceTrials: 4 };
  if (years <= 9) return { trials: 40, nogo: 10, stimulusMs: 1000, isiMinMs: 1000, isiMaxMs: 1600, practiceTrials: 4 };
  return { trials: 60, nogo: 15, stimulusMs: 900, isiMinMs: 800, isiMaxMs: 1400, practiceTrials: 4 };
}

/** Toque mais rápido que isto (ms) é registrado como "muito rápido" e não entra no tempo dos acertos. Limiar operacional autoral. */
export const FAST_RT_MS = 150;

export type GoNoGoKind = "go" | "nogo";

export interface GoNoGoTrial {
  kind: GoNoGoKind;
  /** Primeiro toque na janela da tentativa; null se não tocou. */
  rtMs: number | null;
  /** Toques além do primeiro na mesma tentativa. */
  extraTaps: number;
  isiMs: number;
}

export interface GoNoGoResult {
  task: "gonogo";
  version: string;
  practiceDone: boolean;
  config: GoNoGoConfig;
  trials: GoNoGoTrial[];
  stop: "completa" | "aplicadora";
}

/**
 * Sequência determinística de tentativas: exatamente `nogo` tentativas no-go, nenhuma nas 2 primeiras e nunca mais de 2
 * no-go seguidas (evita ritmo previsível). Tenta sementes sucessivas até satisfazer as regras.
 */
export function goNoGoSequence(config: Pick<GoNoGoConfig, "trials" | "nogo">, seed: number): GoNoGoKind[] {
  const base: GoNoGoKind[] = [...Array(config.trials - config.nogo).fill("go"), ...Array(config.nogo).fill("nogo")];
  for (let attempt = 0; attempt < 500; attempt++) {
    const order = shuffle(base, seed + attempt * 15485863);
    let ok = order[0] === "go" && order[1] === "go";
    for (let index = 2; ok && index < order.length; index++) if (order[index] === "nogo" && order[index - 1] === "nogo" && order[index - 2] === "nogo") ok = false;
    if (ok) return order;
  }
  return base;
}

/** Intervalos entre tentativas determinísticos dentro de [min, max]. */
export function goNoGoIntervals(config: Pick<GoNoGoConfig, "trials" | "isiMinMs" | "isiMaxMs">, seed: number): number[] {
  const steps = Array.from({ length: config.trials }, (_, index) => index);
  const order = shuffle(steps, seed + 7);
  const span = config.isiMaxMs - config.isiMinMs;
  return order.map((value) => Math.round(config.isiMinMs + (config.trials > 1 ? (value / (config.trials - 1)) * span : 0)));
}

export interface GoNoGoSummary {
  goTrials: number;
  nogoTrials: number;
  hits: number;
  /** go sem toque */
  omissions: number;
  /** no-go com toque */
  commissions: number;
  /** go com toque abaixo de FAST_RT_MS (fora do tempo dos acertos) */
  fast: number;
  omissionRate: number | null;
  commissionRate: number | null;
  rt: LatencyStats;
  /** Tempos em milissegundos. Mediana dos tempos na primeira e na segunda metade dos acertos válidos (queda de vigilância é só descrição). */
  halves: { first: number | null; second: number | null };
  extraTaps: number;
  /** Tentativas realizadas (a tarefa pode ser encerrada antes). */
  done: number;
}

export function summarizeGoNoGo(result: Pick<GoNoGoResult, "trials">): GoNoGoSummary {
  const go = result.trials.filter((trial) => trial.kind === "go");
  const nogo = result.trials.filter((trial) => trial.kind === "nogo");
  const hitsAll = go.filter((trial) => trial.rtMs !== null);
  const valid = hitsAll.filter((trial) => (trial.rtMs as number) >= FAST_RT_MS);
  const rts = valid.map((trial) => trial.rtMs as number);
  const mid = Math.floor(rts.length / 2);
  const med = (values: number[]) => (values.length >= 3 ? latencyStats(values, 0).median : null);
  const commissions = nogo.filter((trial) => trial.rtMs !== null).length;
  const omissions = go.length - hitsAll.length;
  const stats = latencyStats(rts, 0);
  return {
    goTrials: go.length,
    nogoTrials: nogo.length,
    hits: valid.length,
    omissions,
    commissions,
    fast: hitsAll.length - valid.length,
    omissionRate: go.length ? Math.round((omissions / go.length) * 1000) / 1000 : null,
    commissionRate: nogo.length ? Math.round((commissions / nogo.length) * 1000) / 1000 : null,
    // Tempos em milissegundos.
    rt: stats,
    halves: { first: med(rts.slice(0, mid)), second: med(rts.slice(mid)) },
    extraTaps: result.trials.reduce((sum, trial) => sum + trial.extraTaps, 0),
    done: result.trials.length,
  };
}

// ─────────────────────────────── registro e relatório ───────────────────────────────
export type TaskRecord = CorsiResult | GoNoGoResult;

const ms = (value: number) => Math.round(value);

export function taskReportLines(tasks: readonly TaskRecord[] | undefined): string[] {
  const list = tasks ?? [];
  if (list.length === 0) return [];
  const lines: string[] = [
    `Tarefas complementares cronometradas (versão ${TASKS_VERSION}): opcionais, fora da contagem principal e da classificação por mundo.`,
  ];
  for (const task of list) {
    if (task.task === "corsi") {
      const errors = task.trials.filter((trial) => !trial.correct);
      lines.push(`${TASK_LABELS.corsi} · ${TASK_CONSTRUCTS.corsi}: span ${task.span} (maior extensão reproduzida na ordem direta), ${task.trials.filter((trial) => trial.correct).length} de ${task.trials.length} tentativas corretas, treino ${task.practiceDone ? "feito" : "não feito"}, encerramento por ${task.stop === "regra" ? "regra de parada (2 falhas na mesma extensão)" : task.stop === "maximo" ? "extensão máxima" : "decisão da aplicadora"}.`);
      if (errors.length > 0) lines.push(`  Tipos de erro: ${(Object.keys(CORSI_ERROR_LABELS) as CorsiError[]).filter((kind) => kind !== "nenhum").map((kind) => `${CORSI_ERROR_LABELS[kind]} ${errors.filter((trial) => trial.error === kind).length}`).join(" · ")}.`);
      lines.push(`  Tentativas: ${task.trials.map((trial) => `${trial.length}${trial.correct ? "✓" : "✗"}`).join(" ")}`.replace(/✓/g, "+").replace(/✗/g, "-"));
    } else {
      const summary = summarizeGoNoGo(task);
      lines.push(`${TASK_LABELS.gonogo} · ${TASK_CONSTRUCTS.gonogo}: ${summary.done} de ${task.config.trials} tentativas (${summary.goTrials} go, ${summary.nogoTrials} no-go), treino ${task.practiceDone ? "feito" : "não feito"}${task.stop === "aplicadora" ? ", encerrada pela aplicadora" : ""}.`);
      lines.push(`  Acertos válidos ${summary.hits}; omissões ${summary.omissions}${summary.omissionRate !== null ? ` (${Math.round(summary.omissionRate * 100)}% das go)` : ""}; comissões ${summary.commissions}${summary.commissionRate !== null ? ` (${Math.round(summary.commissionRate * 100)}% das no-go)` : ""}; toques abaixo de ${FAST_RT_MS} ms (limiar operacional autoral) ${summary.fast}; toques extras ${summary.extraTaps}.`);
      lines.push(summary.rt.n > 0
        ? `  Tempo dos acertos válidos: mediana ${ms(summary.rt.median)} ms, intervalo interquartil ${ms(summary.rt.q1)}–${ms(summary.rt.q3)} ms, desvio-padrão ${ms(summary.rt.sd)} ms${summary.rt.cv !== null ? `, coeficiente de variação ${summary.rt.cv}` : " (coeficiente de variação só com 5 ou mais acertos válidos)"}${summary.halves.first !== null && summary.halves.second !== null ? `; mediana na primeira metade ${ms(summary.halves.first)} ms e na segunda ${ms(summary.halves.second)} ms` : ""}.`
        : "  Sem acertos válidos para descrever o tempo.");
    }
  }
  lines.push("Descritivo, sem norma, percentil, ponto de corte, idade equivalente ou diagnóstico. O tempo inclui a latência do toque do aparelho (não calibrada): compara a criança com ela mesma, não com outras crianças. Leitura e conclusão pertencem ao médico.");
  return lines;
}

export function taskStructuredLines(tasks: readonly TaskRecord[] | undefined): string[] {
  return (tasks ?? []).map((task) => task.task === "corsi"
    ? `TAREFA ${JSON.stringify({ tarefa: "span_espacial", versao: task.version, treino: task.practiceDone, span: task.span, encerramento: task.stop, tentativas: task.trials.map((trial) => ({ extensao: trial.length, correta: trial.correct, erro: trial.error, tempo_s: trial.seconds })) })}`
    : `TAREFA ${JSON.stringify({ tarefa: "go_nogo", versao: task.version, treino: task.practiceDone, encerramento: task.stop, resumo: summarizeGoNoGo(task), configuracao: task.config, limiar_toque_rapido_ms: FAST_RT_MS })}`);
}
