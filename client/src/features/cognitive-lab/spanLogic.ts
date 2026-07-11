/**
 * Lógica pura das tarefas de SPAN (dígitos e Corsi) — testável sem UI.
 *
 * Regra adaptativa clássica: 2 tentativas por comprimento; acertando pelo
 * menos 1, sobe um item; errando as 2, encerra. Span = maior comprimento com
 * ao menos uma reprodução correta.
 */

export interface SpanState {
  length: number;
  attempt: 1 | 2;
  firstOfLengthCorrect: boolean;
  bestSpan: number;
  done: boolean;
}

export const SPAN_MIN = 2;
export const SPAN_MAX = 9;

export function initialSpanState(): SpanState {
  return { length: SPAN_MIN, attempt: 1, firstOfLengthCorrect: false, bestSpan: 0, done: false };
}

export function nextSpanState(state: SpanState, correct: boolean): SpanState {
  if (state.done) return state;
  const bestSpan = correct ? Math.max(state.bestSpan, state.length) : state.bestSpan;
  if (state.attempt === 1) {
    if (correct) {
      // Acertou de primeira: sobe direto (encurta a aplicação para crianças).
      const length = state.length + 1;
      return length > SPAN_MAX
        ? { ...state, bestSpan, done: true }
        : { length, attempt: 1, firstOfLengthCorrect: false, bestSpan, done: false };
    }
    return { ...state, attempt: 2, firstOfLengthCorrect: false, bestSpan };
  }
  // Segunda tentativa do mesmo comprimento.
  if (correct) {
    const length = state.length + 1;
    return length > SPAN_MAX
      ? { ...state, bestSpan, done: true }
      : { length, attempt: 1, firstOfLengthCorrect: false, bestSpan, done: false };
  }
  return { ...state, bestSpan, done: true }; // errou as duas → encerra
}

/** Sequência de dígitos sem repetição adjacente (mais fácil de vocalizar). */
export function makeDigitSequence(length: number, rng: () => number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let d = Math.floor(rng() * 10);
    while (i > 0 && d === seq[i - 1]) d = (d + 1 + Math.floor(rng() * 8)) % 10;
    seq.push(d);
  }
  return seq;
}

/** Sequência de blocos de Corsi (0..8) sem repetição adjacente. */
export function makeCorsiSequence(length: number, rng: () => number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let b = Math.floor(rng() * 9);
    while (i > 0 && b === seq[i - 1]) b = (b + 1 + Math.floor(rng() * 7)) % 9;
    seq.push(b);
  }
  return seq;
}

/** Compara a reprodução com o alvo, na direção pedida. */
export function isReproductionCorrect(target: number[], entered: number[], backward: boolean): boolean {
  const expected = backward ? [...target].reverse() : target;
  return expected.length === entered.length && expected.every((v, i) => v === entered[i]);
}

/**
 * Posições fixas dos 9 blocos de Corsi (viewBox 0–100), dispersão assimétrica
 * clássica — as MESMAS posições em toda aplicação (comparabilidade).
 */
export const CORSI_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 12, y: 12 }, { x: 58, y: 8 },  { x: 86, y: 20 },
  { x: 30, y: 34 }, { x: 66, y: 42 }, { x: 8,  y: 56 },
  { x: 44, y: 64 }, { x: 84, y: 68 }, { x: 24, y: 84 },
];
