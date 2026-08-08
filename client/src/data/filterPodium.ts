import { getApplicationMode, getImplementationStatus, type RefinedScaleMatch } from "./advancedFilterLogic";
import { getClinicalTiers, type ClinicalTierRule } from "./clinicalRanking";
import { getDeliveredInteractiveItemCount, type Respondente } from "./scaleFilter";
import { enforcePodiumHardCap } from "./podiumHardCap";

// Limite total do pódio: a soma ESTIMADA de perguntas de Ouro + Prata + Bronze
// nunca deve ultrapassar este teto (não sobrecarregar a família/o clínico).
export const PODIUM_QUESTION_CAP = 100;

// Estimativa do número de perguntas de uma escala. Aplicações interativas têm a
// contagem REAL de itens; para as demais (páginas dedicadas/fichas) extraímos
// "N perguntas/itens/questões/afirmações" da descrição e, na ausência, usamos
// uma estimativa conservadora.
export function estimatedQuestionCount(scale: RefinedScaleMatch["scale"]): number {
  const interactive = getDeliveredInteractiveItemCount(scale.id);
  if (interactive > 0) return interactive;
  const txt = `${scale.description ?? ""} ${scale.scoringCutoff ?? ""}`;
  const m = txt.match(/(\d{1,3})\s*(perguntas|itens|quest|quesitos|afirma|sim\/n)/i);
  if (m) return Math.min(Number(m[1]), 120);
  return 20;
}

export type PodiumSlot = "ouro" | "prata" | "bronze" | "direct" | "school";
export type PodiumSelection = Record<PodiumSlot, RefinedScaleMatch | undefined>;
export interface PodiumSelectionContext {
  selectedQueixas?: string[];
  // Idade EXATA do paciente (meses). O motor de relevância pontua sobreposição
  // de faixa; aqui garantimos que o pódio prefira escalas cujo intervalo
  // [ageMin, ageMax] CONTÉM a idade — uma escala "quase na faixa" só medalha
  // quando não existe alternativa que cubra a idade de fato.
  ageMonths?: number | null;
  // Sinais/sintomas que o usuário marcou no filtro. O pódio deve conter ao
  // menos uma escala que fale a esses sinais quando o catálogo permite.
  selectedSignals?: string[];
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
  const exactAge = context.ageMonths ?? null;
  const selectedSignals = context.selectedSignals ?? [];
  const containsAge = (match: RefinedScaleMatch) =>
    exactAge === null || (match.scale.ageMin <= exactAge && match.scale.ageMax >= exactAge);
  const signalHit = (match: RefinedScaleMatch) =>
    selectedSignals.length > 0 && (match.scale.signalTags ?? []).some((tag) => selectedSignals.includes(tag));
  // REGRA DE OURO (obrigatória): o pódio deve indicar escala que o clínico
  // consegue ABRIR E APLICAR no app (itens + escore). Ficha técnica ou
  // instrumento licenciado só medalha quando NÃO existe candidata aplicável
  // que preserve idade e cobertura — nunca por conveniência de score.
  const isApplicable = (match: RefinedScaleMatch) => getImplementationStatus(match.scale) === "complete";
  const anyApplicableInAge = () =>
    sorted.some((m) => !used.has(m.scale.id) && containsAge(m) && isApplicable(m));
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
  // Modalidades já usadas pelos selos anteriores. Serve APENAS como desempate:
  // quando dois candidatos têm mérito clínico equivalente, prefere o que traz
  // uma perspectiva (modalidade) ainda não representada no pódio. Peso baixo (3)
  // para não destronar relevância nem cobertura — só desempata (Goodhart-safe:
  // em idades onde só existe uma modalidade, nada muda).
  const usedModes = new Set<string>();
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
    const diversityPenalty = usedModes.has(match.applicationMode ?? "") ? 3 : 0;
    // Uma escala cuja faixa NÃO contém a idade exata só deve medalhar na falta
    // de alternativa; idem para recomendações sem nada aplicável no app.
    const ageFitBonus = containsAge(match) ? 14 : 0;
    const signalHitBonus = signalHit(match) ? 6 : 0;
    // Regra de ouro: aplicável no app vale bônus real no desempate.
    const applicableBonus = isApplicable(match) ? 12 : 0;
    // Penalidade forte: um card "recomendação" (sem NADA aplicável no app) não
    // deve vencer o MESMO construto com aplicação completa (ex.: world-bears
    // rel=100 vs bears rel=84 — o clínico quer a versão que abre e pontua).
    const notImplementedPenalty = getImplementationStatus(match.scale) === "not_implemented" ? 20 : 0;
    return (
      match.relevanceScore +
      explicitPreference +
      curatedBonus +
      signalBonus +
      signalHitBonus +
      ageFitBonus +
      applicableBonus +
      confidenceBonus +
      coverageGain(match, coveredQueixas) * coverageWeight +
      coverageTotal(match) * 5 -
      diversityPenalty -
      notImplementedPenalty
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
      /** Cobertura ANTES da catraca de qualidade: quando há queixa marcada ainda
       *  descoberta, um candidato SEGURO que a cubra pode medalhar mesmo com
       *  relevância < QUALITY_THRESHOLD — do contrário um candidato de alta
       *  relevância que NÃO cobre monopoliza o slot e a 2ª queixa fica órfã. */
      coverageFirst?: boolean;
    } = {},
  ) => {
    const preferred = [...preferredIds, ...curatedIds].filter((id, index, arr) => arr.indexOf(id) === index);
    const coveredQueixas = options.coveredQueixas ?? new Set<string>();
    const coverageWeight = options.coverageWeight ?? 0;
    // Preferência curada NÃO atropela a idade: se existe candidato elegível que
    // contém a idade exata, um id preferido fora da idade sai da lista (mesma
    // regra do pickCurated — idade real vence banda de curadoria).
    const anyEligibleContainsAge = sorted.some((m) => !used.has(m.scale.id) && pred(m) && containsAge(m));
    const preferredMatches = preferred
      .map((id) => byId.get(id))
      .filter((match): match is RefinedScaleMatch => Boolean(match))
      .filter((match) => containsAge(match) || !anyEligibleContainsAge);
    const eligible = sorted.filter((m) => !used.has(m.scale.id) && pred(m));
    const highQuality = eligible.filter((m) => m.relevanceScore >= QUALITY_THRESHOLD);
    // Camada de idade exata: dentro de cada faixa de qualidade, quem CONTÉM a
    // idade do paciente vem antes de quem só encosta na banda. A regra de ouro
    // de aplicabilidade NÃO vira camada aqui — agiria por cima da cobertura de
    // queixas; ela atua pelo applicableBonus e pelo pós-passe applFixSlot, que
    // preservam cobertura por construção.
    const highQualityExact = highQuality.filter(containsAge);
    const eligibleExact = eligible.filter(containsAge);
    const preferredHighQuality = preferredMatches.filter(
      (m) => !used.has(m.scale.id) && m.relevanceScore >= QUALITY_THRESHOLD && pred(m)
    );
    const preferredSafe = preferredMatches.filter((m) => !used.has(m.scale.id) && pred(m));
    // Passe de COBERTURA (opt-in): antes das camadas de qualidade, se sobra
    // queixa marcada sem cobrir, escolhe o melhor candidato que a cubra entre
    // TODOS os elegíveis (idade exata primeiro). Corrige o vazamento em que um
    // candidato ≥threshold que não cobre bloqueava um candidato <threshold que
    // era a única escala aplicável para a 2ª queixa selecionada.
    const covers = (m: RefinedScaleMatch) => coverageGain(m, coveredQueixas) > 0;
    const coveragePick =
      options.coverageFirst && coverageWeight > 0
        ? pickByClinicalFit(eligibleExact.filter(covers), coveredQueixas, preferredIds, coverageWeight) ??
          pickByClinicalFit(eligible.filter(covers), coveredQueixas, preferredIds, coverageWeight)
        : undefined;
    const found = coveragePick ?? (options.preferCuratedFirst
      ? pickByClinicalFit(preferredHighQuality, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(preferredSafe, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(highQualityExact, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(highQuality, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(eligibleExact, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(eligible, coveredQueixas, preferredIds, coverageWeight)
      : pickByClinicalFit(highQualityExact, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(highQuality, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(eligibleExact, coveredQueixas, preferredIds, coverageWeight) ??
        pickByClinicalFit(eligible, coveredQueixas, preferredIds, coverageWeight));
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
  // Curadoria vale quando a escala indicada CONTÉM a idade exata do paciente:
  // as regras de ranking são por banda etária larga, e uma escala curada para a
  // banda pode não cobrir a idade específica (ex.: regra 12-19a apontando
  // instrumento 15-19a para um paciente de 13a). Fora da idade, cai para a
  // heurística — que já prioriza idade exata.
  const pickCurated = (id: string | undefined) => {
    if (!id || used.has(id)) return undefined;
    const match = byId.get(id);
    if (!match || !containsAge(match)) return undefined;
    // Regra de ouro: curadoria que aponta ficha/licenciado só vale quando não
    // há candidata APLICÁVEL na idade — o clínico precisa poder abrir e aplicar.
    if (!isApplicable(match) && anyApplicableInAge()) return undefined;
    return match;
  };

  // ── OURO ──────────────────────────────────────────────────────────────────
  let ouro = pickCurated(curatedTiers?.ouro);
  if (ouro) {
    used.add(ouro.scale.id);
  } else {
    // Sem OURO curado utilizável: mantém a prioridade autoral qualificada
    // (protocolo autoral não-broadband e com qualidade de pódio) e, na falta,
    // a melhor escala clínica disponível.
    const autoralQualifies = (m: RefinedScaleMatch) =>
      m.scale.licencaUso === "autoral" &&
      !m.isBroadbandFallback &&
      m.relevanceScore >= QUALITY_THRESHOLD &&
      !used.has(m.scale.id);
    // Autoral só assume o Ouro se contém a idade exata; fora dela, a
    // heurística (que prioriza idade) decide — um protocolo 12-19a não deve
    // ser Ouro para um bebê só por ser autoral.
    const someoneContainsAge = sorted.some((m) => !used.has(m.scale.id) && containsAge(m));
    const autoralOuro =
      sorted.find((m) => autoralQualifies(m) && containsAge(m)) ??
      (someoneContainsAge ? undefined : sorted.find(autoralQualifies));
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
  if (ouroMode) usedModes.add(ouroMode);

  // ── PRATA ─────────────────────────────────────────────────────────────────
  // Prata curada (complemento intencional do autor) é autoritativa, EXCETO
  // quando o perfil é multi-queixa, a prata curada NÃO cobre nenhuma queixa
  // ainda descoberta e existe candidato que cubra — aí a cobertura vence, para
  // que Prata e Bronze juntos falem a TODAS as queixas marcadas (antes só o
  // Bronze tinha essa chance, deixando pares/trios sem cobrir a 2ª/3ª queixa).
  const uncoveredAfterOuro = selectedQueixas.filter((q) => !coveredQueixas.has(q));
  const curatedPrata = pickCurated(curatedTiers?.prata);
  const curatedPrataCovers = curatedPrata
    ? curatedPrata.scale.queixas.some((q) => uncoveredAfterOuro.includes(q))
    : false;
  const prataCoverageCandidateExists =
    uncoveredAfterOuro.length > 0 &&
    sorted.some((m) => !used.has(m.scale.id) && coverageGain(m, coveredQueixas) > 0);
  let prata: RefinedScaleMatch | undefined;
  if (curatedPrata && (curatedPrataCovers || !prataCoverageCandidateExists)) {
    used.add(curatedPrata.scale.id);
    prata = curatedPrata;
  } else {
    prata =
      takeBestAvailable(
        (m) => m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q)),
        curatedTiers?.prata ? [curatedTiers.prata] : [],
        { coveredQueixas, coverageWeight: 40, coverageFirst: true },
      ) ?? takeBestAvailable(() => true, curatedTiers?.prata ? [curatedTiers.prata] : [], {
        coveredQueixas,
        coverageWeight: 30,
        coverageFirst: true,
      });
  }
  markCovered(prata, coveredQueixas);
  const prataMode = prata?.applicationMode ?? null;
  const prataQueixas = new Set(prata?.scale.queixas ?? []);
  if (prataMode) usedModes.add(prataMode);

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
        { coveredQueixas, coverageWeight: 30, coverageFirst: true },
      ) ?? takeBestAvailable(() => true, curatedTiers?.bronze ? [curatedTiers.bronze] : [], {
        coveredQueixas,
        coverageWeight: 24,
        coverageFirst: true,
      });
  }
  markCovered(bronze, coveredQueixas);

  // ── PÓS-PASSE DE QUALIDADE ────────────────────────────────────────────────
  // Queixas marcadas que só ESTA medalha cobre (trocá-la não pode descobrir).
  const uniqueQueixasOf = (slot: RefinedScaleMatch | undefined, others: (RefinedScaleMatch | undefined)[]) =>
    slot
      ? selectedQueixas.filter(
          (q) => slot.scale.queixas.includes(q) && !others.some((o) => o?.scale.queixas.includes(q)),
        )
      : [];

  // Guarda de desperdício: um selo HEURÍSTICO (não curado) muito abaixo do
  // melhor candidato disponível (Δ≥25) cede o lugar, desde que o substituto
  // contenha a idade, fale às queixas marcadas e preserve a cobertura única.
  const upgradeSlot = (
    current: RefinedScaleMatch | undefined,
    isCurated: boolean,
    others: (RefinedScaleMatch | undefined)[],
  ): RefinedScaleMatch | undefined => {
    if (!current || isCurated) return current;
    const mustKeep = uniqueQueixasOf(current, others);
    const better = sorted.find(
      (m) =>
        !used.has(m.scale.id) &&
        containsAge(m) &&
        // Regra de ouro: um upgrade de relevância nunca rebaixa aplicabilidade.
        (isApplicable(m) || !isApplicable(current)) &&
        (selectedQueixaSet.size === 0 || m.scale.queixas.some((q) => selectedQueixaSet.has(q))) &&
        mustKeep.every((q) => m.scale.queixas.includes(q)) &&
        m.relevanceScore >= current.relevanceScore + 25,
    );
    if (!better) return current;
    used.delete(current.scale.id);
    used.add(better.scale.id);
    return better;
  };
  // Correção de idade: selo heurístico cuja faixa NÃO contém a idade exata
  // cede para candidato que contém (aceitando até 15 pontos a menos de
  // relevância — cobrir a idade de fato vale mais que essa margem), sem
  // perder cobertura única de queixa.
  const ageFixSlot = (
    current: RefinedScaleMatch | undefined,
    isCurated: boolean,
    others: (RefinedScaleMatch | undefined)[],
  ): RefinedScaleMatch | undefined => {
    if (!current || isCurated || containsAge(current)) return current;
    const mustKeep = uniqueQueixasOf(current, others);
    const better = sorted.find(
      (m) =>
        !used.has(m.scale.id) &&
        containsAge(m) &&
        (selectedQueixaSet.size === 0 || m.scale.queixas.some((q) => selectedQueixaSet.has(q))) &&
        mustKeep.every((q) => m.scale.queixas.includes(q)) &&
        m.relevanceScore >= current.relevanceScore - 15,
    );
    if (!better) return current;
    used.delete(current.scale.id);
    used.add(better.scale.id);
    return better;
  };
  // Correção de implementação: card "recomendação" (nada aplicável no app) só
  // medalha se não houver candidato aplicável equivalente — troca por quem tem
  // aplicação/ficha real, contém a idade, preserva cobertura única e fica a até
  // 20 pontos de relevância.
  const implFixSlot = (
    current: RefinedScaleMatch | undefined,
    others: (RefinedScaleMatch | undefined)[],
  ): RefinedScaleMatch | undefined => {
    if (!current || getImplementationStatus(current.scale) !== "not_implemented") return current;
    const mustKeep = uniqueQueixasOf(current, others);
    const better = sorted.find(
      (m) =>
        !used.has(m.scale.id) &&
        containsAge(m) &&
        getImplementationStatus(m.scale) !== "not_implemented" &&
        (selectedQueixaSet.size === 0 || m.scale.queixas.some((q) => selectedQueixaSet.has(q))) &&
        mustKeep.every((q) => m.scale.queixas.includes(q)) &&
        m.relevanceScore >= current.relevanceScore - 20,
    );
    if (!better) return current;
    used.delete(current.scale.id);
    used.add(better.scale.id);
    return better;
  };
  // REGRA DE OURO (obrigatória): medalha que o clínico não consegue aplicar no
  // app (ficha/licenciada/recomendação) cede para candidata com aplicação
  // completa que contém a idade e preserva a cobertura única — tolerância de
  // até 25 pontos de relevância, porque "abre e aplica" vale mais que isso.
  const applFixSlot = (
    current: RefinedScaleMatch | undefined,
    others: (RefinedScaleMatch | undefined)[],
  ): RefinedScaleMatch | undefined => {
    if (!current || isApplicable(current)) return current;
    const mustKeep = uniqueQueixasOf(current, others);
    const better = sorted.find(
      (m) =>
        !used.has(m.scale.id) &&
        isApplicable(m) &&
        containsAge(m) &&
        (selectedQueixaSet.size === 0 || m.scale.queixas.some((q) => selectedQueixaSet.has(q))) &&
        mustKeep.every((q) => m.scale.queixas.includes(q)) &&
        m.relevanceScore >= current.relevanceScore - 40,
    );
    if (!better) return current;
    used.delete(current.scale.id);
    used.add(better.scale.id);
    return better;
  };
  prata = ageFixSlot(prata, prata !== undefined && prata === curatedPrata, [ouro, bronze]);
  bronze = ageFixSlot(bronze, bronze !== undefined && bronze === curatedBronze, [ouro, prata]);
  ouro = applFixSlot(ouro, [prata, bronze]);
  prata = applFixSlot(prata, [ouro, bronze]);
  bronze = applFixSlot(bronze, [ouro, prata]);
  prata = implFixSlot(prata, [ouro, bronze]);
  bronze = implFixSlot(bronze, [ouro, prata]);
  prata = upgradeSlot(prata, prata !== undefined && prata === curatedPrata, [ouro, bronze]);
  bronze = upgradeSlot(bronze, bronze !== undefined && bronze === curatedBronze, [ouro, prata]);

  // Resgate por sinal: o usuário marcou sinais, nenhuma medalha fala neles e
  // existe candidata segura que fala — o BRONZE cede o lugar (Ouro e Prata
  // preservam curadoria e cobertura), sem perder cobertura única de queixa.
  if (selectedSignals.length > 0 && ![ouro, prata, bronze].some((s) => s && signalHit(s))) {
    // Alvo do resgate: o selo NÃO-aplicável (prata ou bronze) sai primeiro; se
    // todos aplicáveis, o bronze é o candidato natural. Ouro nunca sai aqui.
    const targetSlot: "prata" | "bronze" =
      bronze && !isApplicable(bronze) ? "bronze" : prata && !isApplicable(prata) ? "prata" : "bronze";
    const target = targetSlot === "prata" ? prata : bronze;
    // Orçamento do trio pós-troca: a candidata precisa caber no teto de 100 ao
    // lado das medalhas que ficam; sem isso o hard cap desfaz o resgate logo em
    // seguida e o sinal volta a ser ignorado. Só se NENHUMA candidata couber é
    // que aceitamos uma acima do teto (o cap decide o resíduo).
    const keptTotal = (targetSlot === "prata" ? [ouro, bronze] : [ouro, prata])
      .filter((slot): slot is RefinedScaleMatch => Boolean(slot))
      .reduce((sum, slot) => sum + estimatedQuestionCount(slot.scale), 0);
    const fitsCap = (m: RefinedScaleMatch) => {
      const count = estimatedQuestionCount(m.scale);
      return Number.isFinite(count) && count > 0 && keptTotal + count <= PODIUM_QUESTION_CAP;
    };
    const rescueCandidate = (requireApplicable: boolean) => {
      const eligible = (m: RefinedScaleMatch) =>
        !used.has(m.scale.id) &&
        signalHit(m) &&
        containsAge(m) &&
        (!requireApplicable || isApplicable(m)) &&
        m.relevanceScore >= 45 &&
        (selectedQueixaSet.size === 0 || m.scale.queixas.some((q) => selectedQueixaSet.has(q)));
      return sorted.find((m) => eligible(m) && fitsCap(m)) ?? sorted.find(eligible);
    };
    // Regra de ouro: resgate por sinal prefere candidata aplicável; só cai para
    // ficha se o selo substituído também não for aplicável.
    const rescue =
      rescueCandidate(true) ?? (target && isApplicable(target) ? undefined : rescueCandidate(false));
    if (rescue) {
      const others = targetSlot === "prata" ? [ouro, bronze] : [ouro, prata];
      const targetUnique = uniqueQueixasOf(target, others);
      if (!target || targetUnique.every((q) => rescue.scale.queixas.includes(q))) {
        if (target) used.delete(target.scale.id);
        used.add(rescue.scale.id);
        if (targetSlot === "prata") prata = rescue;
        else bronze = rescue;
      }
    }
  }

  // ── REGRA DE OURO ABSOLUTA: PÓDIO ≤ 100 PERGUNTAS ────────────────
  // Diferentemente do passe flexível anterior, esta catraca nunca admite resíduo.
  // Se não existir trio seguro dentro do teto, reduz medalhas em vez de entregar
  // uma bateria excessiva. A combinação preserva cobertura, relevância e curadoria.
  const cappedPodium = enforcePodiumHardCap({
    ouro,
    prata,
    bronze,
    candidates: sorted,
    selectedQueixas,
    ageMonths: exactAge,
    countQuestions: (match) => estimatedQuestionCount(match.scale),
  });
  ouro = cappedPodium.ouro;
  prata = cappedPodium.prata;
  bronze = cappedPodium.bronze;
  used.clear();
  usedModes.clear();
  for (const medal of [ouro, prata, bronze]) {
    if (!medal) continue;
    used.add(medal.scale.id);
    usedModes.add(medal.applicationMode ?? "");
  }

  // Resgate por sinal PÓS-TETO: o hard cap é cego a sinais e pode remover o
  // único selo que falava neles (ou desfazer o resgate pré-teto). Repetimos a
  // troca sobre o pódio final, aceitando apenas candidata que CABE no teto ao
  // lado das medalhas que ficam — assim o resultado é estável.
  if (selectedSignals.length > 0 && ![ouro, prata, bronze].some((s) => s && signalHit(s))) {
    const targetSlot: "prata" | "bronze" =
      bronze && !isApplicable(bronze) ? "bronze" : prata && !isApplicable(prata) ? "prata" : "bronze";
    const target = targetSlot === "prata" ? prata : bronze;
    const kept = (targetSlot === "prata" ? [ouro, bronze] : [ouro, prata]).filter(
      (slot): slot is RefinedScaleMatch => Boolean(slot),
    );
    const keptTotal = kept.reduce((sum, slot) => sum + estimatedQuestionCount(slot.scale), 0);
    const eligible = (requireApplicable: boolean) => (m: RefinedScaleMatch) => {
      const count = estimatedQuestionCount(m.scale);
      return (
        !used.has(m.scale.id) &&
        signalHit(m) &&
        containsAge(m) &&
        (!requireApplicable || isApplicable(m)) &&
        m.relevanceScore >= 45 &&
        (selectedQueixaSet.size === 0 || m.scale.queixas.some((q) => selectedQueixaSet.has(q))) &&
        Number.isFinite(count) &&
        count > 0 &&
        keptTotal + count <= PODIUM_QUESTION_CAP
      );
    };
    const rescue =
      sorted.find(eligible(true)) ??
      (target && isApplicable(target) ? undefined : sorted.find(eligible(false)));
    if (rescue) {
      const others = targetSlot === "prata" ? [ouro, bronze] : [ouro, prata];
      const targetUnique = uniqueQueixasOf(target, others);
      if (!target || targetUnique.every((q) => rescue.scale.queixas.includes(q))) {
        if (target) used.delete(target.scale.id);
        used.add(rescue.scale.id);
        usedModes.add(rescue.applicationMode ?? "");
        if (targetSlot === "prata") prata = rescue;
        else bronze = rescue;
      }
    }
  }

  // Aproveitamento de curadoria PÓS-TETO: quando o teto de 100 estreitou o
  // pódio e nenhuma medalha é curada, mas uma escala curada disponível CABE no
  // orçamento ao lado das demais, ela assume prata/bronze — a curadoria clínica
  // por faixa etária vale mais que uma heurística de relevância marginalmente
  // maior. Guards: preserva cobertura única, respondente compatível, acerto de
  // sinal e nunca degrada relevância além de 15 pontos.
  const curatedIdSet = new Set(
    [curatedTiers?.ouro, curatedTiers?.prata, curatedTiers?.bronze].filter(
      (id): id is string => Boolean(id),
    ),
  );
  if (curatedIdSet.size > 0 && ![ouro, prata, bronze].some((s) => s && curatedIdSet.has(s.scale.id))) {
    const tryUptake = (cand: RefinedScaleMatch): boolean => {
      const candCount = estimatedQuestionCount(cand.scale);
      if (!Number.isFinite(candCount) || candCount <= 0) return false;
      const attempt = (slotName: "prata" | "bronze"): boolean => {
        const current = slotName === "prata" ? prata : bronze;
        const others = slotName === "prata" ? [ouro, bronze] : [ouro, prata];
        const keptTotal = others
          .filter((slot): slot is RefinedScaleMatch => Boolean(slot))
          .reduce((sum, slot) => sum + estimatedQuestionCount(slot.scale), 0);
        if (keptTotal + candCount > PODIUM_QUESTION_CAP) return false;
        if (current) {
          if (cand.relevanceScore < current.relevanceScore - 15) return false;
          if (!uniqueQueixasOf(current, others).every((q) => cand.scale.queixas.includes(q))) return false;
          if (!current.scale.respondente.some((r) => cand.scale.respondente.includes(r))) return false;
          if (selectedSignals.length > 0 && signalHit(current) && !signalHit(cand)) return false;
          used.delete(current.scale.id);
        }
        used.add(cand.scale.id);
        usedModes.add(cand.applicationMode ?? "");
        if (slotName === "prata") prata = cand;
        else bronze = cand;
        return true;
      };
      // Slot vazio primeiro (ganha uma medalha), depois troca de menor custo.
      if (!bronze && attempt("bronze")) return true;
      if (!prata && attempt("prata")) return true;
      return attempt("bronze") || attempt("prata");
    };
    for (const source of ["ouro", "prata", "bronze"] as const) {
      const id = curatedTiers?.[source];
      if (!id || used.has(id)) continue;
      const cand = sorted.find((m) => m.scale.id === id);
      if (!cand || !containsAge(cand) || !isApplicable(cand) || cand.relevanceScore < 45) continue;
      if (tryUptake(cand)) break;
    }
  }

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
