import { getApplicationMode, type RefinedScaleMatch } from "./advancedFilterLogic";
import { getClinicalTiers, type ClinicalTierRule } from "./clinicalRanking";
import type { Respondente } from "./scaleFilter";

export type PodiumSlot = "ouro" | "prata" | "bronze" | "direct" | "school";
export type PodiumSelection = Record<PodiumSlot, RefinedScaleMatch | undefined>;
export interface PodiumSelectionContext {
  selectedQueixas?: string[];
}

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
  context: PodiumSelectionContext = {},
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
  const selectedQueixas = [...new Set(context.selectedQueixas ?? [])];
  const selectedQueixaSet = new Set(selectedQueixas);
  const matchedSelectedQueixas = (match: RefinedScaleMatch) =>
    selectedQueixas.filter((queixa) => match.scale.queixas.includes(queixa));
  const coverageGain = (match: RefinedScaleMatch, coveredQueixas: Set<string>) =>
    matchedSelectedQueixas(match).filter((queixa) => !coveredQueixas.has(queixa)).length;
  const coverageTotal = (match: RefinedScaleMatch) => matchedSelectedQueixas(match).length;
  const markCovered = (match: RefinedScaleMatch | undefined, coveredQueixas: Set<string>) => {
    if (!match || selectedQueixaSet.size === 0) return;
    for (const queixa of match.scale.queixas) {
      if (selectedQueixaSet.has(queixa)) coveredQueixas.add(queixa);
    }
  };
  const clinicalChoiceScore = (
    match: RefinedScaleMatch,
    coveredQueixas: Set<string>,
    preferredIds: string[],
    coverageWeight: number,
  ) => {
    const explicitPreference = preferredIds.includes(match.scale.id) ? 18 : 0;
    const curatedBonus = (curatedPriority.get(match.scale.id) ?? 0) * 6;
    const signalBonus = (match.signalSpecificityScore ?? 0) * 2.5;
    const confidenceBonus = Math.round((match.confidenceLevel ?? 0) / 12);
    return (
      match.relevanceScore +
      explicitPreference +
      curatedBonus +
      signalBonus +
      confidenceBonus +
      coverageGain(match, coveredQueixas) * coverageWeight +
      coverageTotal(match) * 5
    );
  };
  const pickByClinicalFit = (
    candidates: RefinedScaleMatch[],
    coveredQueixas: Set<string>,
    preferredIds: string[],
    coverageWeight: number,
  ) =>
    [...candidates].sort((a, b) => {
      const scoreDiff =
        clinicalChoiceScore(b, coveredQueixas, preferredIds, coverageWeight) -
        clinicalChoiceScore(a, coveredQueixas, preferredIds, coverageWeight);
      if (Math.abs(scoreDiff) > 2) return scoreDiff;
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (Math.abs(relevanceDiff) > 2) return relevanceDiff;
      const signalDiff = (b.signalSpecificityScore ?? 0) - (a.signalSpecificityScore ?? 0);
      if (signalDiff !== 0) return signalDiff;
      return a.scale.name.localeCompare(b.scale.name);
    })[0];

  // Prefer high-quality matches, but never leave the medal empty when the
  // engine already produced safe candidates or broadband fallbacks.
  const takeBestAvailable = (
    pred: (m: RefinedScaleMatch) => boolean,
    preferredIds: string[] = [],
    options: {
      coveredQueixas?: Set<string>;
      coverageWeight?: number;
      preferCuratedFirst?: boolean;
    } = {},
  ) => {
    const preferred = [...preferredIds, ...curatedIds].filter((id, index, arr) => arr.indexOf(id) === index);
    const coveredQueixas = options.coveredQueixas ?? new Set<string>();
    const coverageWeight = options.coverageWeight ?? 0;
    const preferredMatches = preferred
      .map((id) => byId.get(id))
      .filter((match): match is RefinedScaleMatch => Boolean(match));
    const eligible = sorted.filter((m) => !used.has(m.scale.id) && pred(m));
    const highQuality = eligible.filter((m) => m.relevanceScore >= QUALITY_THRESHOLD);
    const preferredHighQuality = preferredMatches.filter(
      (m) => !used.has(m.scale.id) && m.relevanceScore >= QUALITY_THRESHOLD && pred(m)
    );
    const preferredSafe = preferredMatches.filter((m) => !used.has(m.scale.id) && pred(m));
    const found = options.preferCuratedFirst
      ? pickByClinicalFit(preferredHighQuality, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(preferredSafe, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(highQuality, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(eligible, coveredQueixas, preferredIds, coverageWeight)
      : pickByClinicalFit(highQuality, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(eligible, coveredQueixas, preferredIds, coverageWeight);
    if (found) used.add(found.scale.id);
    return found;
  };

  const coveredQueixas = new Set<string>();
  // Curadoria por sinal (fluxograma → ranking) é a FONTE DE VERDADE do pódio e
  // agora é AUTORITATIVA: o trio OURO/PRATA/BRONZE curado — que já integra os
  // protocolos AUTORAIS (família NEXUS / Dr. Jadson) exatamente onde o autor os
  // colocou como primeira linha — assume o pódio sempre que cada id está entre
  // os candidatos SEGUROS e VÁLIDOS para a idade (todo `byId` já passou pelos
  // filtros obrigatórios e bloqueios clínicos duros do motor). Antes, a
  // relevância genérica destronava a primeira linha clínica (um checklist
  // genérico com score marginalmente maior tomava o Ouro do protocolo curado, e
  // o override "qualquer autoral por relevância" coroava checklists autorais
  // genéricos em vez do protocolo curado). A heurística de relevância/cobertura
  // só decide quando não há id curado utilizável para aquele slot.
  const pickCurated = (id: string | undefined) =>
    id && !used.has(id) ? byId.get(id) : undefined;

  // ── OURO ──────────────────────────────────────────────────────────────────
  let ouro = pickCurated(curatedTiers?.ouro);
  if (ouro) {
    used.add(ouro.scale.id);
  } else {
    // Sem OURO curado utilizável: mantém a prioridade autoral qualificada
    // (protocolo autoral não-broadband e com qualidade de pódio) e, na falta,
    // a melhor escala clínica disponível.
    const autoralOuro = sorted.find(
      (m) =>
        m.scale.licencaUso === "autoral" &&
        !m.isBroadbandFallback &&
        m.relevanceScore >= QUALITY_THRESHOLD &&
        !used.has(m.scale.id),
    );
    if (autoralOuro) {
      used.add(autoralOuro.scale.id);
      ouro = autoralOuro;
    } else {
      ouro = takeBestAvailable(() => true, [], {
        coveredQueixas,
        coverageWeight: 8,
        preferCuratedFirst: true,
      });
    }
  }
  markCovered(ouro, coveredQueixas);
  const ouroMode = ouro?.applicationMode ?? null;
  const ouroQueixas = new Set(ouro?.scale.queixas ?? []);

  // ── PRATA ─────────────────────────────────────────────────────────────────
  // Prata curada (complemento intencional do autor) é autoritativa; na falta,
  // busca o melhor complemento (modalidade OU domínio distinto do ouro).
  let prata = pickCurated(curatedTiers?.prata);
  if (prata) {
    used.add(prata.scale.id);
  } else {
    prata =
      takeBestAvailable(
        (m) => m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q)),
        [],
        { coveredQueixas, coverageWeight: 30 },
      ) ?? takeBestAvailable(() => true, [], { coveredQueixas, coverageWeight: 24 });
  }
  markCovered(prata, coveredQueixas);
  const prataMode = prata?.applicationMode ?? null;
  const prataQueixas = new Set(prata?.scale.queixas ?? []);

  // ── BRONZE ────────────────────────────────────────────────────────────────
  // Bronze curado é autoritativo, EXCETO quando ainda há queixa marcada sem
  // cobertura e existe candidato que a cubra — aí a cobertura de múltiplas
  // queixas vence, para o pódio falar a TODAS as queixas marcadas.
  const uncoveredSelected = selectedQueixas.filter((q) => !coveredQueixas.has(q));
  const curatedBronze = pickCurated(curatedTiers?.bronze);
  const curatedBronzeCovers = curatedBronze
    ? curatedBronze.scale.queixas.some((q) => uncoveredSelected.includes(q))
    : false;
  const coverageCandidateExists =
    uncoveredSelected.length > 0 &&
    sorted.some((m) => !used.has(m.scale.id) && coverageGain(m, coveredQueixas) > 0);
  let bronze: RefinedScaleMatch | undefined;
  if (curatedBronze && (curatedBronzeCovers || !coverageCandidateExists)) {
    used.add(curatedBronze.scale.id);
    bronze = curatedBronze;
  } else {
    bronze =
      takeBestAvailable(
        (m) => {
          const diffFromOuro = m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q));
          const diffFromPrata = !prata || m.applicationMode !== prataMode || !m.scale.queixas.some((q) => prataQueixas.has(q));
          return diffFromOuro || diffFromPrata;
        },
        curatedTiers?.bronze ? [curatedTiers.bronze] : [],
        { coveredQueixas, coverageWeight: 30 },
      ) ?? takeBestAvailable(() => true, curatedTiers?.bronze ? [curatedTiers.bronze] : [], {
        coveredQueixas,
        coverageWeight: 24,
      });
  }
  markCovered(bronze, coveredQueixas);

  // Direct and school also join the used set to prevent deduplication with medals.
  const direct = (() => {
    const candidates = sorted.filter((m) => !used.has(m.scale.id) && getApplicationMode(m.scale) === "teste_direto_crianca");
    const found = pickByClinicalFit(candidates, coveredQueixas, [], 18);
    if (found) used.add(found.scale.id);
    return found;
  })();

  const school = (() => {
    const candidates = sorted.filter((m) => !used.has(m.scale.id) && getApplicationMode(m.scale) === "questionario_professor");
    const found = pickByClinicalFit(candidates, coveredQueixas, [], 18);
    if (found) used.add(found.scale.id);
    return found;
  })();

  return { ouro, prata, bronze, direct, school };
}
