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

  // Preferred minimum score for a medal. If every safe candidate is below this
  // threshold, the podium still shows the best safe option instead of going empty.
  const QUALITY_THRESHOLD = 60;

  // Curated tiers are clinical priority hints once the scale has already passed
  // mandatory filters and hard safety blocks.
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
  const byId = new Map(sorted.map((match) => [match.scale.id, match]));
  const curatedIds = curatedTiers
    ? [curatedTiers.ouro, curatedTiers.prata, curatedTiers.bronze].filter((id): id is string => Boolean(id))
    : [];

  // Prefer high-quality matches, but never leave the medal empty when the
  // engine already produced safe candidates or broadband fallbacks.
  const takeBestAvailable = (
    pred: (m: RefinedScaleMatch) => boolean,
    preferredIds: string[] = [],
  ) => {
    const preferred = [...preferredIds, ...curatedIds].filter((id, index, arr) => arr.indexOf(id) === index);
    const preferredMatches = preferred
      .map((id) => byId.get(id))
      .filter((match): match is RefinedScaleMatch => Boolean(match));
    const curatedHighQuality = preferredMatches.find(
      (m) => !used.has(m.scale.id) && m.relevanceScore >= QUALITY_THRESHOLD && pred(m)
    );
    const curatedSafe = preferredMatches.find((m) => !used.has(m.scale.id) && pred(m));
    const highQuality = sorted.find(
      (m) => !used.has(m.scale.id) && m.relevanceScore >= QUALITY_THRESHOLD && pred(m)
    );
    const found = curatedHighQuality ?? curatedSafe ?? highQuality ?? sorted.find((m) => !used.has(m.scale.id) && pred(m));
    if (found) used.add(found.scale.id);
    return found;
  };

  // Prioridade autoral (pedido do autor, 2026-07): quando um protocolo autoral
  // (família NEXUS / Dr. Jadson) é ADEQUADO ao perfil — já passou pelos filtros
  // obrigatórios e bloqueios clínicos duros do motor e tem qualidade de pódio —
  // ele assume o OURO; os instrumentos internacionais curados seguem no pódio
  // como Prata/Bronze. Sem candidato autoral qualificado, vale o fluxo curado.
  const autoralOuro = sorted.find(
    (m) =>
      m.scale.licencaUso === "autoral" &&
      !m.isBroadbandFallback &&
      m.relevanceScore >= QUALITY_THRESHOLD
  );
  let ouro: RefinedScaleMatch | undefined;
  if (autoralOuro) {
    used.add(autoralOuro.scale.id);
    ouro = autoralOuro;
  } else {
    ouro = takeBestAvailable(() => true, curatedTiers?.ouro ? [curatedTiers.ouro] : []);
  }
  const ouroMode = ouro?.applicationMode ?? null;
  const ouroQueixas = new Set(ouro?.scale.queixas ?? []);

  // Prata must be complementary to Ouro (different mode OR different queixa domain).
  const prata =
    takeBestAvailable(
      (m) => m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q)),
      curatedTiers?.prata ? [curatedTiers.prata] : [],
    ) ?? takeBestAvailable(() => true, curatedTiers?.prata ? [curatedTiers.prata] : []);
  const prataMode = prata?.applicationMode ?? null;
  const prataQueixas = new Set(prata?.scale.queixas ?? []);

  // Bronze must add value relative to at least one of Ouro or Prata.
  const bronze =
    takeBestAvailable(
      (m) => {
        const diffFromOuro = m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q));
        const diffFromPrata = !prata || m.applicationMode !== prataMode || !m.scale.queixas.some((q) => prataQueixas.has(q));
        return diffFromOuro || diffFromPrata;
      },
      curatedTiers?.bronze ? [curatedTiers.bronze] : [],
    ) ?? takeBestAvailable(() => true, curatedTiers?.bronze ? [curatedTiers.bronze] : []);

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
