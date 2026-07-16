/**
 * NeuroPed Cognitive Lab — tipos do motor de tarefas cognitivas computadorizadas.
 *
 * HONESTIDADE CLÍNICA: este módulo implementa TAREFAS COGNITIVAS CRONOMETRADAS
 * com relatório DESCRITIVO (tempos, erros, variabilidade). Não é teste
 * neuropsicológico normatizado/validado e nunca deve ser apresentado como tal.
 */

/** Um estímulo apresentado na tela. */
export interface StimulusSpec {
  /** Texto/emoji principal exibido (ex.: "🐶", "AZUL", "→→←→→"). */
  display: string;
  /** Classe utilitária de cor do texto (ex.: "text-red-500") — Stroop e afins. */
  colorClass?: string;
  /** Posição horizontal do estímulo (Simon): "left" | "center" | "right". */
  position?: "left" | "center" | "right";
  /** Rótulo falado/descrito para acessibilidade. */
  ariaLabel?: string;
}

/** Especificação de um ensaio (trial) gerada pelo config da tarefa. */
export interface TrialSpec {
  stimulus: StimulusSpec;
  /**
   * id da resposta correta (casa com TaskResponse.id) ou null quando a
   * resposta correta é INIBIR (não responder) — Go/No-Go, CPT não-alvo, N-back
   * sem correspondência.
   */
  correctResponse: string | null;
  /** Marcadores analíticos (ex.: "congruente", "incongruente", "alvo", "nogo"). */
  tags: string[];
}

/** Botão/tecla de resposta disponível na tarefa. */
export interface TaskResponse {
  id: string;
  /** Tecla física equivalente (ex.: "d", "k", " ", "ArrowLeft"). */
  key: string;
  label: string;
  emoji?: string;
}

/** Passo do tutorial animado (demonstração antes do treino). */
export interface TutorialStep {
  text: string;
  stimulus?: StimulusSpec;
  /** id da resposta demonstrada neste passo (null = mostrar que se segura). */
  demoResponse?: string | null;
}

/** Critérios automáticos de validade da execução. */
export interface ValidityCriteria {
  /** Proporção mínima de ensaios com resposta esperada respondidos (0–1). */
  minResponseRate: number;
  /** Proporção máxima de antecipações (<RT mínimo plausível) tolerada (0–1). */
  maxAnticipationRate: number;
  /** Acurácia mínima no TREINO para liberar a aplicação (0–1). */
  minPracticeAccuracy: number;
}

export interface CognitiveTaskConfig {
  id: string;
  name: string;
  fullName: string;
  emoji: string;
  /** Domínio avaliado (rótulo descritivo). */
  domain: string;
  ageLabel: string;
  durationLabel: string;
  description: string;
  /** Instrução principal ao participante (linguagem infantil-amigável). */
  instructions: string;
  tutorial: TutorialStep[];
  responses: TaskResponse[];
  /** Duração da cruz de fixação (ms). */
  fixationMs: number;
  /** Tempo máximo de exposição do estímulo (ms); 0 = até responder. */
  stimulusMs: number;
  /** Intervalo entre ensaios [mín, máx] ms (jitter). */
  isiMs: [number, number];
  /** Janela-limite de resposta a partir do onset (ms). */
  deadlineMs: number;
  /** Nº de ensaios de treino (com feedback). */
  practiceTrials: number;
  /** Nº de blocos da aplicação. */
  blocks: number;
  trialsPerBlock: number;
  validity: ValidityCriteria;
  /** Gera a sequência de ensaios (determinística dado o rng). */
  makeTrials(count: number, rng: () => number): TrialSpec[];
}

/** Registro bruto de um ensaio executado. */
export interface TrialRecord {
  index: number;
  block: number;
  /** Fase: "practice" | "test". */
  phase: "practice" | "test";
  tags: string[];
  expected: string | null;
  responded: string | null;
  /** Tempo de reação em ms (null = omissão/inibição correta). */
  rtMs: number | null;
  correct: boolean;
  /** Resposta antecipada (RT < limiar plausível). */
  anticipated: boolean;
  /** Timestamp do onset do estímulo (performance.now, ms). */
  onsetMs: number;
}

/** Métricas descritivas calculadas pelo motor estatístico. */
export interface CognitiveStats {
  nTrials: number;
  nResponded: number;
  accuracy: number;
  meanRt: number | null;
  medianRt: number | null;
  sdRt: number | null;
  /** Coeficiente de variação (DP/média) — variabilidade intraindividual. */
  cvRt: number | null;
  minRt: number | null;
  maxRt: number | null;
  omissionRate: number;
  commissionRate: number;
  anticipationRate: number;
  /** Média de RT por bloco (curva de aprendizagem/fadiga). */
  blockMeans: Array<{ block: number; meanRt: number | null; accuracy: number }>;
  /** Diferença de RT médio entre último e primeiro bloco (fadiga >0 = lentificou). */
  fatigueDeltaMs: number | null;
  /** Métricas por tag (ex.: congruente × incongruente → interferência). */
  byTag: Record<string, { n: number; meanRt: number | null; accuracy: number }>;
  /** Distribuição dos RTs em faixas de 100ms (rótulo → contagem). */
  rtDistribution: Array<{ bucket: string; count: number }>;
}

/** Resultado de validade da execução. */
export interface ValidityResult {
  valid: boolean;
  issues: string[];
}

/** Sessão temporária persistida no armazenamento cifrado da sessão clínica. */
export interface CognitiveSession {
  id: string;
  taskId: string;
  taskName: string;
  startedAtIso: string;
  seed: number;
  kidMode: boolean;
  participantLabel?: string;
  trials: TrialRecord[];
  stats: CognitiveStats;
  validity: ValidityResult;
  appVersion?: string;
  /**
   * Métricas específicas de tarefas com runner próprio (ex.: span de dígitos,
   * span de Corsi, tempos do Trail Making, excesso de movimentos da Torre) —
   * exibidas com destaque no ResultsPanel e incluídas nas exportações.
   */
  customSummary?: Array<{ label: string; value: string; hint?: string }>;
}
