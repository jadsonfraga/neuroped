import type { RefinedScaleMatch } from "./advancedFilterLogic";

export const MAX_PODIUM_QUESTIONS = 100;

interface HardCapInput {
  ouro?: RefinedScaleMatch;
  prata?: RefinedScaleMatch;
  bronze?: RefinedScaleMatch;
  candidates: RefinedScaleMatch[];
  selectedQueixas: string[];
  ageMonths: number | null;
  countQuestions: (match: RefinedScaleMatch) => number;
}

export interface HardCapResult {
  ouro?: RefinedScaleMatch;
  prata?: RefinedScaleMatch;
  bronze?: RefinedScaleMatch;
  totalQuestions: number;
}

function uniqueById(items: RefinedScaleMatch[]): RefinedScaleMatch[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.scale.id)) return false;
    seen.add(item.scale.id);
    return true;
  });
}

/**
 * Regra absoluta: a soma de Ouro + Prata + Bronze nunca excede 100 perguntas.
 * Procura a melhor combinação possível; quando não existe trio seguro dentro do
 * teto, reduz a quantidade de medalhas em vez de publicar uma bateria excessiva.
 */
export function enforcePodiumHardCap({
  ouro,
  prata,
  bronze,
  candidates,
  selectedQueixas,
  ageMonths,
  countQuestions,
}: HardCapInput): HardCapResult {
  const original = [ouro, prata, bronze] as const;
  const originalTotal = original.reduce(
    (sum, item) => sum + (item ? countQuestions(item) : 0),
    0,
  );
  if (originalTotal <= MAX_PODIUM_QUESTIONS) {
    return { ouro, prata, bronze, totalQuestions: originalTotal };
  }

  const containsAge = (item: RefinedScaleMatch) =>
    ageMonths === null ||
    (item.scale.ageMin <= ageMonths && item.scale.ageMax >= ageMonths);
  const eligible = candidates
    .filter(containsAge)
    .filter((item) => {
      const count = countQuestions(item);
      return Number.isFinite(count) && count > 0 && count <= MAX_PODIUM_QUESTIONS;
    });

  // Inclui alta relevância e baixa carga. A busca só roda nos casos que já
  // excederam o teto, mantendo a auditoria exaustiva rápida e determinística.
  const originalItems = original.filter(
    (item): item is RefinedScaleMatch => Boolean(item),
  );
  const highRelevance = eligible.slice(0, 8);
  const lowBurden = [...eligible]
    .sort((a, b) => {
      const burden = countQuestions(a) - countQuestions(b);
      return burden || b.relevanceScore - a.relevanceScore;
    })
    .slice(0, 8);
  const pool = uniqueById([
    ...originalItems,
    ...highRelevance,
    ...lowBurden,
  ]).slice(0, 18);
  const options: Array<RefinedScaleMatch | undefined> = [undefined, ...pool];

  let best: HardCapResult = { totalQuestions: 0 };
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const gold of options) {
    for (const silver of options) {
      if (gold && silver && gold.scale.id === silver.scale.id) continue;
      for (const bronzeCandidate of options) {
        const trio = [gold, silver, bronzeCandidate] as const;
        const ids = trio
          .filter((item): item is RefinedScaleMatch => Boolean(item))
          .map((item) => item.scale.id);
        if (new Set(ids).size !== ids.length) continue;

        const total = trio.reduce(
          (sum, item) => sum + (item ? countQuestions(item) : 0),
          0,
        );
        if (total > MAX_PODIUM_QUESTIONS) continue;

        const slotCount = trio.filter(Boolean).length;
        const covered = new Set<string>();
        for (const item of trio) {
          if (!item) continue;
          for (const queixa of selectedQueixas) {
            if (item.scale.queixas.includes(queixa)) covered.add(queixa);
          }
        }
        const originalSlotBonus = trio.reduce(
          (sum, item, index) =>
            sum +
            (item && item.scale.id === original[index]?.scale.id ? 500 : 0),
          0,
        );
        const relevance = trio.reduce(
          (sum, item) => sum + (item?.relevanceScore ?? 0),
          0,
        );
        const score =
          slotCount * 1_000_000 +
          covered.size * 25_000 +
          originalSlotBonus +
          relevance * 5 -
          total * 0.1;

        if (score > bestScore) {
          bestScore = score;
          best = {
            ouro: gold,
            prata: silver,
            bronze: bronzeCandidate,
            totalQuestions: total,
          };
        }
      }
    }
  }

  return best;
}
