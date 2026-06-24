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

  const refinedById = new Map(refinedMatches.map((m) => [m.scale.id, m]));
  const used = new Set<string>();
  const take = (pred: (m: RefinedScaleMatch) => boolean) => {
    const found = refinedMatches.find((m) => !used.has(m.scale.id) && pred(m));
    if (found) used.add(found.scale.id);
    return found;
  };
  const seed = (scaleId?: string) => {
    if (!scaleId) return undefined;
    const match = refinedById.get(scaleId);
    if (match && !used.has(match.scale.id)) {
      used.add(match.scale.id);
      return match;
    }
    return undefined;
  };

  const ouro = seed(curatedTiers?.ouro) ?? take(() => true);
  const ouroMode = ouro?.applicationMode ?? null;
  const ouroQueixas = new Set(ouro?.scale.queixas ?? []);
  const prata =
    seed(curatedTiers?.prata) ??
    take((m) => m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q))) ??
    take(() => true);
  const bronze = seed(curatedTiers?.bronze) ?? take(() => true);

  return {
    ouro,
    prata,
    bronze,
    direct: refinedMatches.find((m) => getApplicationMode(m.scale) === "teste_direto_crianca"),
    school: refinedMatches.find((m) => getApplicationMode(m.scale) === "questionario_professor"),
  };
}
