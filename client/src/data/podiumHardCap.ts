import type { RefinedScaleMatch } from "./advancedFilterLogic";
import { fitsSelectedAge, scaleAgeFit } from "./scaleAgeFit";

export const MAX_PODIUM_QUESTIONS = 100;

interface HardCapInput {
  ouro?: RefinedScaleMatch;
  prata?: RefinedScaleMatch;
  bronze?: RefinedScaleMatch;
  candidates: RefinedScaleMatch[];
  selectedQueixas: string[];
  selectedSignals?: string[];
  coversSignal?: (match: RefinedScaleMatch, signal: string) => boolean;
  /** Idade exata em meses (ignorada quando há faixa). */
  ageMonths: number | null;
  /** Faixa selecionada: o teto aceita sobreposição parcial, nunca fora da faixa. */
  ageBand?: { min: number; max: number } | null;
  countQuestions: (match: RefinedScaleMatch) => number;
}

export interface HardCapResult {
  ouro?: RefinedScaleMatch;
  prata?: RefinedScaleMatch;
  bronze?: RefinedScaleMatch;
  totalQuestions: number;
}

interface BudgetState {
  slotMask: number;
  coverageMask: bigint;
  signalMask: bigint;
  fullAgeCount: number;
  totalQuestions: number;
  qualityScore: number;
  picks: Array<RefinedScaleMatch | undefined>;
}

function uniqueById(items: RefinedScaleMatch[]): RefinedScaleMatch[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.scale.id)) return false;
    seen.add(item.scale.id);
    return true;
  });
}

function bitCount(mask: bigint): number {
  let value = mask;
  let count = 0;
  while (value > 0n) {
    count += Number(value & 1n);
    value >>= 1n;
  }
  return count;
}

/**
 * Regra absoluta: a soma de Ouro + Prata + Bronze nunca excede 100 perguntas.
 *
 * A busca usa programação dinâmica em vez de combinações cúbicas. Cada escala é
 * processada uma única vez e pode ocupar no máximo um slot, portanto não há
 * duplicação. O estado mantém orçamento, slots preenchidos e cobertura das
 * queixas, permitindo auditar milhares de contextos sem degradar o filtro.
 */
export function enforcePodiumHardCap({
  ouro,
  prata,
  bronze,
  candidates,
  selectedQueixas,
  selectedSignals = [],
  coversSignal = () => false,
  ageMonths,
  ageBand = null,
  countQuestions,
}: HardCapInput): HardCapResult {
  const original = [ouro, prata, bronze] as const;
  const originalTotal = original.reduce(
    (sum, item) => sum + (item ? countQuestions(item) : 0),
    0,
  );
  const containsAge = (item: RefinedScaleMatch) =>
    fitsSelectedAge(scaleAgeFit(item.scale, { exactAge: ageMonths, ageBand }));

  const eligible = uniqueById([
    ...original.filter((item): item is RefinedScaleMatch => Boolean(item)),
    ...candidates,
  ])
    .filter(containsAge)
    .filter((item) => {
      const count = countQuestions(item);
      return Number.isFinite(count) && count > 0 && count <= MAX_PODIUM_QUESTIONS;
    });

  const queixaIndex = new Map(
    selectedQueixas.slice(0, 20).map((queixa, index) => [queixa, index]),
  );
  const coverageOf = (item: RefinedScaleMatch): bigint => {
    let mask = 0n;
    for (const queixa of item.scale.queixas) {
      const index = queixaIndex.get(queixa);
      if (index !== undefined) mask |= 1n << BigInt(index);
    }
    return mask;
  };
  const signalIndex = new Map(
    selectedSignals.slice(0, 20).map((signal, index) => [signal, index]),
  );
  const signalCoverageOf = (item: RefinedScaleMatch): bigint => {
    let mask = 0n;
    for (const [signal, index] of signalIndex) {
      if (coversSignal(item, signal)) mask |= 1n << BigInt(index);
    }
    return mask;
  };
  const coverableSignalMask = eligible.reduce(
    (mask, item) => mask | signalCoverageOf(item),
    0n,
  );
  const originalSignalMask = original.reduce(
    (mask, item) => mask | (item ? signalCoverageOf(item) : 0n),
    0n,
  );
  const originalCountsKnown = original.every((item) => {
    if (!item) return true;
    const count = countQuestions(item);
    return Number.isFinite(count) && count > 0;
  });
  const originalCoversEveryCoverableSignal =
    (originalSignalMask & coverableSignalMask) === coverableSignalMask;
  const fullAgeEligible = ageBand ? eligible.some((item) => scaleAgeFit(item.scale, { exactAge: null, ageBand }) === "full") : false;
  const originalHasPartialAge = ageBand && original.some((item) => item && scaleAgeFit(item.scale, { exactAge: null, ageBand }) === "partial");
  if (
    originalCountsKnown &&
    originalTotal <= MAX_PODIUM_QUESTIONS &&
    originalCoversEveryCoverableSignal &&
    !(fullAgeEligible && originalHasPartialAge)
  ) {
    return { ouro, prata, bronze, totalQuestions: originalTotal };
  }

  const initial: BudgetState = {
    slotMask: 0,
    coverageMask: 0n,
    signalMask: 0n,
    fullAgeCount: 0,
    totalQuestions: 0,
    qualityScore: 0,
    picks: [undefined, undefined, undefined],
  };
  let states = new Map<string, BudgetState>([["0|0|0|0", initial]]);

  for (const item of eligible) {
    const burden = countQuestions(item);
    const coverage = coverageOf(item);
    const signalCoverage = signalCoverageOf(item);
    const next = new Map(states);

    for (const state of states.values()) {
      for (let slot = 0; slot < 3; slot += 1) {
        if ((state.slotMask & (1 << slot)) !== 0) continue;
        const totalQuestions = state.totalQuestions + burden;
        if (totalQuestions > MAX_PODIUM_QUESTIONS) continue;

        const slotMask = state.slotMask | (1 << slot);
        const coverageMask = state.coverageMask | coverage;
        const signalMask = state.signalMask | signalCoverage;
        const fullAgeCount = state.fullAgeCount + (ageBand && scaleAgeFit(item.scale, { exactAge: null, ageBand }) === "full" ? 1 : 0);
        const originalBonus =
          item.scale.id === original[slot]?.scale.id ? 600 : 0;
        const qualityScore =
          state.qualityScore +
          item.relevanceScore * 5 +
          originalBonus -
          burden * 0.1;
        const picks = [...state.picks];
        picks[slot] = item;
        const candidate: BudgetState = {
          slotMask,
          coverageMask,
          signalMask,
          fullAgeCount,
          totalQuestions,
          qualityScore,
          picks,
        };
        const key = `${slotMask}|${coverageMask.toString()}|${signalMask.toString()}|${totalQuestions}`;
        const previous = next.get(key);
        if (!previous || candidate.qualityScore > previous.qualityScore) {
          next.set(key, candidate);
        }
      }
    }

    states = next;
  }

  let best = initial;
  let bestRank = Number.NEGATIVE_INFINITY;
  for (const state of states.values()) {
    const slotCount = bitCount(BigInt(state.slotMask));
    const coverageCount = bitCount(state.coverageMask);
    const signalCount = bitCount(state.signalMask & coverableSignalMask);
    const coversEveryCoverableSignal =
      (state.signalMask & coverableSignalMask) === coverableSignalMask;
    const rank =
      coverageCount * 25_000_000 +
      (coversEveryCoverableSignal && coverableSignalMask !== 0n ? 8_000_000 : 0) +
      signalCount * 3_000_000 +
      slotCount * 1_000_000 +
      state.fullAgeCount * 100_000 +
      state.qualityScore;
    if (rank > bestRank) {
      bestRank = rank;
      best = state;
    }
  }

  // Nunca retornar Prata/Bronze sem Ouro: quando o orçamento comporta menos de
  // três instrumentos, compacta os escolhidos para a esquerda preservando a
  // ordem relativa definida pela otimização.
  const compactPicks = best.picks.filter(
    (item): item is RefinedScaleMatch => Boolean(item),
  );

  return {
    ouro: compactPicks[0],
    prata: compactPicks[1],
    bronze: compactPicks[2],
    totalQuestions: best.totalQuestions,
  };
}
