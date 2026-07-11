/**
 * Motor estatístico do Cognitive Lab — métricas DESCRITIVAS sobre os ensaios.
 * Funções puras (testadas em tests/unit/cognitive-lab.test.ts).
 *
 * Convenções:
 *  - RT só entra nas médias quando o ensaio foi RESPONDIDO e não-antecipado.
 *  - Omissão = tinha resposta esperada e não respondeu no prazo.
 *  - Comissão = respondeu quando deveria inibir (expected=null) OU respondeu
 *    a tecla errada.
 *  - Antecipação = respondeu abaixo do limiar plausível (impulsividade).
 */
import type { CognitiveStats, TrialRecord, ValidityCriteria, ValidityResult } from "./types";

/** Limiar de RT plausível: abaixo disso a resposta é antecipatória. */
export const ANTICIPATION_MS = 150;

export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Desvio padrão amostral (n-1); com n<2 retorna null. */
export function stdDev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = mean(xs) as number;
  const variance = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const round3 = (x: number) => Math.round(x * 1000) / 1000;

function rtsOf(trials: TrialRecord[]): number[] {
  return trials
    .filter((t) => t.responded !== null && !t.anticipated && t.rtMs !== null && t.correct)
    .map((t) => t.rtMs as number);
}

export function computeStats(trials: TrialRecord[]): CognitiveStats {
  const test = trials.filter((t) => t.phase === "test");
  const rts = rtsOf(test);

  const expectedResponse = test.filter((t) => t.expected !== null);
  const inhibition = test.filter((t) => t.expected === null);
  const omissions = expectedResponse.filter((t) => t.responded === null);
  const commissions =
    inhibition.filter((t) => t.responded !== null).length +
    expectedResponse.filter((t) => t.responded !== null && !t.correct && !t.anticipated).length;
  const anticipations = test.filter((t) => t.anticipated);

  const m = mean(rts);
  const sd = stdDev(rts);

  const blockIdxs = [...new Set(test.map((t) => t.block))].sort((a, b) => a - b);
  const blockMeans = blockIdxs.map((block) => {
    const bt = test.filter((t) => t.block === block);
    const brts = rtsOf(bt);
    return {
      block,
      meanRt: brts.length ? round1(mean(brts) as number) : null,
      accuracy: bt.length ? round3(bt.filter((t) => t.correct).length / bt.length) : 0,
    };
  });
  const firstBlock = blockMeans[0]?.meanRt ?? null;
  const lastBlock = blockMeans[blockMeans.length - 1]?.meanRt ?? null;

  const tags = [...new Set(test.flatMap((t) => t.tags))].sort();
  const byTag: CognitiveStats["byTag"] = {};
  for (const tag of tags) {
    const tt = test.filter((t) => t.tags.includes(tag));
    const trts = rtsOf(tt);
    byTag[tag] = {
      n: tt.length,
      meanRt: trts.length ? round1(mean(trts) as number) : null,
      accuracy: tt.length ? round3(tt.filter((t) => t.correct).length / tt.length) : 0,
    };
  }

  const rtDistribution: CognitiveStats["rtDistribution"] = [];
  if (rts.length) {
    const buckets = new Map<number, number>();
    for (const rt of rts) {
      const b = Math.floor(rt / 100) * 100;
      buckets.set(b, (buckets.get(b) ?? 0) + 1);
    }
    for (const b of [...buckets.keys()].sort((a, c) => a - c)) {
      rtDistribution.push({ bucket: `${b}–${b + 99}ms`, count: buckets.get(b) as number });
    }
  }

  return {
    nTrials: test.length,
    nResponded: test.filter((t) => t.responded !== null).length,
    accuracy: test.length ? round3(test.filter((t) => t.correct).length / test.length) : 0,
    meanRt: m !== null ? round1(m) : null,
    medianRt: rts.length ? round1(median(rts) as number) : null,
    sdRt: sd !== null ? round1(sd) : null,
    cvRt: sd !== null && m ? round3(sd / m) : null,
    minRt: rts.length ? Math.min(...rts) : null,
    maxRt: rts.length ? Math.max(...rts) : null,
    omissionRate: expectedResponse.length ? round3(omissions.length / expectedResponse.length) : 0,
    commissionRate: test.length ? round3(commissions / test.length) : 0,
    anticipationRate: test.length ? round3(anticipations.length / test.length) : 0,
    blockMeans,
    fatigueDeltaMs:
      firstBlock !== null && lastBlock !== null ? round1(lastBlock - firstBlock) : null,
    byTag,
    rtDistribution,
  };
}

/** Avalia os critérios automáticos de validade da execução. */
export function evaluateValidity(
  trials: TrialRecord[],
  criteria: ValidityCriteria
): ValidityResult {
  const test = trials.filter((t) => t.phase === "test");
  const issues: string[] = [];
  const expected = test.filter((t) => t.expected !== null);
  const responseRate = expected.length
    ? expected.filter((t) => t.responded !== null).length / expected.length
    : 1;
  if (responseRate < criteria.minResponseRate) {
    issues.push(
      `Taxa de resposta ${(responseRate * 100).toFixed(0)}% abaixo do mínimo (${(criteria.minResponseRate * 100).toFixed(0)}%) — engajamento insuficiente ou instrução não compreendida.`
    );
  }
  const anticipationRate = test.length
    ? test.filter((t) => t.anticipated).length / test.length
    : 0;
  if (anticipationRate > criteria.maxAnticipationRate) {
    issues.push(
      `Antecipações em ${(anticipationRate * 100).toFixed(0)}% dos ensaios (máx. ${(criteria.maxAnticipationRate * 100).toFixed(0)}%) — padrão de resposta impulsiva/aleatória.`
    );
  }
  return { valid: issues.length === 0, issues };
}

/** RNG determinístico (mulberry32) — sequências reproduzíveis por seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Embaralhamento Fisher–Yates com rng injetado. */
export function shuffleWith<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
