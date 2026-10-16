/** Utilitários numéricos puros do Super NeuroPad Game (sem dependências do banco). */

export function shuffle<T>(values: readonly T[], seed: number): T[] {
  const out = [...values];
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}


function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Number.isFinite(value) && value >= 0 ? Math.round(value * factor) / factor : 0;
}

/** Estatística descritiva do tempo por item (segundos). Sem referência normativa: compara a criança consigo mesma. */
export interface LatencyStats {
  n: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  sd: number;
  /** Coeficiente de variação (desvio-padrão amostral ÷ média); null com menos de 5 tempos ou média 0. */
  cv: number | null;
}

export const LATENCY_MIN_N = 5;

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/** `digits` = casas decimais dos valores devolvidos (1 para segundos por item; 0 para milissegundos). */
export function latencyStats(values: readonly number[], digits = 1): LatencyStats {
  const clean = values.filter((value) => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
  const n = clean.length;
  if (n === 0) return { n: 0, median: 0, q1: 0, q3: 0, iqr: 0, sd: 0, cv: null };
  const mean = clean.reduce((sum, value) => sum + value, 0) / n;
  const variance = n > 1 ? clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const q1 = quantile(clean, 0.25);
  const q3 = quantile(clean, 0.75);
  return { n, median: roundTo(quantile(clean, 0.5), digits), q1: roundTo(q1, digits), q3: roundTo(q3, digits), iqr: roundTo(q3 - q1, digits), sd: roundTo(sd, digits), cv: n >= LATENCY_MIN_N && mean > 0 ? Math.round((sd / mean) * 100) / 100 : null };
}

