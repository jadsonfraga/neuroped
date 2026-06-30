import { getApplicationMode, type RefinedScaleMatch } from "./advancedFilterLogic";
import { getClinicalTiers, type ClinicalTierRule } from "./clinicalRanking";
import type { Respondente } from "./scaleFilter";

export type PodiumSlot = "ouro" | "prata" | "bronze" | "direct" | "school";
export type PodiumSelection = Record<PodiumSlot, RefinedScaleMatch | undefined>;

export function selectCuratedTiers(
  selectedQueixas: string[],
  ageMonths: number | null,
  refinedById: Map<string, RefinedScaleMatch>,
  selectedRespondente: Respondente | null,
): ClinicalTierRule | null {
  if (selectedQueixas.length === 0) return null;
  const rules = selectedQueixas
    .map((q) => getClinicalTiers(q, ageMonths))
    .filter((rule): rule is ClinicalTierRule => Boolean(rule));
  if (rules.length === 0) return null;

  let best = rules[0];
  let bestScore = -1;
  for (const [idx, rule] of rules.entries()) {
    const ids = [rule.ouro, rule.prata, rule.bronze].filter(Boolean) as string[];
    const score = ids.reduce((sum, id, slotIdx) => {
      const match = refinedById.get(id);
      if (!match) return sum;
      const respondentFit =
        !selectedRespondente ||
        match.scale.respondente.includes(selectedRespondente) ||
        (selectedRespondente === "teste_direto_crianca" && match.applicationMode === "teste_direto_crianca");
      return sum + 100 - slotIdx * 8 + match.relevanceScore + (respondentFit ? 20 : 0);
    }, idx === 0 ? 4 : 0);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }
  return best;
}

export function selectPodium(
  refinedMatches: RefinedScaleMatch[],
  curatedTiers: ClinicalTierRule | null,
): PodiumSelection {
  const empty: PodiumSelection = {
    ouro: undefined,
    prata: undefined,
    bronze: undefined,
    direct: undefined,
    school: undefined,
  };
  if (refinedMatches.length === 0) return empty;

  // Minimum score to earn a medal. Below this threshold the slot stays empty.
  const QUALITY_THRESHOLD = 60;

  // Curated tiers act as a soft tiebreaker: when two matches are within 2 pts
  // of each other, the one mentioned in the curated table wins. Scores always
  // have priority — the curated table never overrides a clear score difference.
  const curatedPriority = new Map<string, number>();
  if (curatedTiers) {
    if (curatedTiers.ouro) curatedPriority.set(curatedTiers.ouro, 3);
    if (curatedTiers.prata) curatedPriority.set(curatedTiers.prata, 2);
    if (curatedTiers.bronze) curatedPriority.set(curatedTiers.bronze, 1);
  }

  const sorted = [...refinedMatches].sort((a, b) => {
    const diff = b.relevanceScore - a.relevanceScore;
    if (Math.abs(diff) > 2) return diff;
    return (curatedPriority.get(b.scale.id) ?? 0) - (curatedPriority.get(a.scale.id) ?? 0);
  });

  const used = new Set<string>();

  // Returns the first unused match that passes the quality threshold AND the predicate.
  const takeQualified = (pred: (m: RefinedScaleMatch) => boolean) => {
    const found = sorted.find(
      (m) => !used.has(m.scale.id) && m.relevanceScore >= QUALITY_THRESHOLD && pred(m)
    );
    if (found) used.add(found.scale.id);
    return found;
  };

  const ouro = takeQualified(() => true);
  const ouroMode = ouro?.applicationMode ?? null;
  const ouroQueixas = new Set(ouro?.scale.queixas ?? []);

  // Prata must be complementary to Ouro (different mode OR different queixa domain).
  const prata = takeQualified(
    (m) => m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q))
  );
  const prataMode = prata?.applicationMode ?? null;
  const prataQueixas = new Set(prata?.scale.queixas ?? []);

  // Bronze must add value relative to at least one of Ouro or Prata.
  const bronze = takeQualified((m) => {
    const diffFromOuro = m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q));
    const diffFromPrata = !prata || m.applicationMode !== prataMode || !m.scale.queixas.some((q) => prataQueixas.has(q));
    return diffFromOuro || diffFromPrata;
  });

  // Direct and school also join the used set to prevent deduplication with medals.
  const direct = (() => {
    const found = sorted.find(
      (m) => !used.has(m.scale.id) && getApplicationMode(m.scale) === "teste_direto_crianca"
    );
    if (found) used.add(found.scale.id);
    return found;
  })();

  const school = (() => {
    const found = sorted.find(
      (m) => !used.has(m.scale.id) && getApplicationMode(m.scale) === "questionario_professor"
    );
    if (found) used.add(found.scale.id);
    return found;
  })();

  return { ouro, prata, bronze, direct, school };
}
