import { getImplementationStatus, scaleCoversSelectedSignalExactly, type RefinedScaleMatch } from "./advancedFilterLogic";

/**
 * Âncoras funcionais existentes: EAF-NEXUS (preferida ≥2a) e EFDI-V/NV (alternativa precoce).
 * Seu conteúdo contempla atividades realizadas sem ajuda E solicitação espontânea
 * de ajuda por fala, gestos ou comunicação alternativa. Não equivale a diagnóstico.
 */
export const FUNCTIONAL_AUTONOMY_ANCHOR_ID = "efdi";
export const FUNCTIONAL_AUTONOMY_ANCHOR_IDS = ["eaf", "efdi"] as const;
const functionalAnchorIds = new Set<string>(FUNCTIONAL_AUTONOMY_ANCHOR_IDS);
const isFunctionalAnchor = (id: string) => functionalAnchorIds.has(id);

type Medal = RefinedScaleMatch | undefined;
export type MedalTrio = { ouro: Medal; prata: Medal; bronze: Medal };

interface ComplementaryPodiumInput extends MedalTrio {
  candidates: RefinedScaleMatch[];
  selectedQueixas: string[];
  selectedSignals: string[];
  ageMonths: number | null;
  questionCap: number;
  countQuestions: (match: RefinedScaleMatch) => number;
}

function deduplicate(matches: RefinedScaleMatch[]): RefinedScaleMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    if (seen.has(match.scale.id)) return false;
    seen.add(match.scale.id);
    return true;
  });
}

/** Grupo explicitamente curado prevalece; domínio + tags exigem corroborar afinidade. */
export function sameClinicalConstruct(a: RefinedScaleMatch, b: RefinedScaleMatch): boolean {
  if (a.scale.id === b.scale.id) return true;
  if (isFunctionalAnchor(a.scale.id) && isFunctionalAnchor(b.scale.id)) return true;
  if (a.scale.overlapGroup && a.scale.overlapGroup === b.scale.overlapGroup) return true;
  if (!a.scale.primaryDomain || a.scale.primaryDomain !== b.scale.primaryDomain) return false;
  if (a.applicationMode !== b.applicationMode) return false;
  const tagsA = new Set((a.scale.signalTags ?? []).map((tag) => tag.trim().toLocaleLowerCase("pt-BR")));
  const tagsB = new Set((b.scale.signalTags ?? []).map((tag) => tag.trim().toLocaleLowerCase("pt-BR")));
  if (tagsA.size < 2 || tagsB.size < 2) return false;
  let common = 0;
  for (const tag of tagsA) if (tagsB.has(tag)) common++;
  return common >= 2 && common / Math.min(tagsA.size, tagsB.size) >= 0.6;
}

function repeatPairs(items: RefinedScaleMatch[]): number {
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (sameClinicalConstruct(items[i], items[j])) count++;
    }
  }
  return count;
}

export function refineFunctionalComplementarity({
  ouro, prata, bronze, candidates, selectedQueixas, selectedSignals,
  ageMonths, questionCap, countQuestions,
}: ComplementaryPodiumInput): MedalTrio {
  const original = [ouro, prata, bronze].filter((m): m is RefinedScaleMatch => Boolean(m));
  if (original.length === 0) return { ouro, prata, bronze };
  const valid = (match: RefinedScaleMatch) => {
    const n = countQuestions(match);
    return getImplementationStatus(match.scale) === "complete" &&
      (ageMonths === null || (match.scale.ageMin <= ageMonths && match.scale.ageMax >= ageMonths)) &&
      Number.isFinite(n) && n > 0 && n <= questionCap;
  };
  // A âncora jamais é criada do nada, nem contorna um filtro clínico: deve
  // constar dos candidatos já aprovados pelo motor de idade/risco/respondente.
  const anchor = FUNCTIONAL_AUTONOMY_ANCHOR_IDS
    .map((id) => candidates.find((m) => m.scale.id === id && valid(m)))
    .find((m): m is RefinedScaleMatch => Boolean(m));
  const currentIds = new Set(original.map((m) => m.scale.id));
  const currentlyHasAnchor = original.some((m) => isFunctionalAnchor(m.scale.id));

  const signalCtx = { queixas: selectedQueixas, selectedSignals };
  const signalHit = (m: RefinedScaleMatch) =>
    selectedSignals.length > 0 && scaleCoversSelectedSignalExactly(m.scale, signalCtx);
  const coverage = (arr: RefinedScaleMatch[]) =>
    selectedQueixas.filter((q) => arr.some((m) => m.scale.queixas.includes(q))).length;
  const signalCovered = (arr: RefinedScaleMatch[]) => arr.some(signalHit);
  const burden = (arr: RefinedScaleMatch[]) => arr.reduce((n, m) => n + countQuestions(m), 0);

  // Composição por ganho clínico marginal: preserva o primeiro instrumento e as
  // queixas/sinais sempre que uma combinação elegível permite. Nunca duplica ID
  // nem ultrapassa o teto absoluto de itens.
  const pool = deduplicate([
    ...original,
    ...candidates.filter(valid).slice(0, 24),
    ...selectedQueixas.flatMap((q) => candidates.filter((m) => valid(m) && m.scale.queixas.includes(q)).slice(0, 5)),
    ...candidates.filter((m) => valid(m) && signalHit(m)).slice(0, 6),
  ]).filter(valid);
  const rank = (arr: RefinedScaleMatch[]) => {
    const currentRetained = arr.filter((m) => currentIds.has(m.scale.id)).length;
    const keepOuro = ouro && arr.some((m) => m.scale.id === ouro.scale.id) ? 1 : 0;
    return (selectedSignals.length && signalCovered(arr) ? 120_000 : 0) +
      coverage(arr) * 70_000 +
      arr.length * 16_000 +
      keepOuro * 5_000 +
      currentRetained * 2_000 -
      repeatPairs(arr) * 12_000 +
      arr.reduce((sum, m) => sum + m.relevanceScore, 0);
  };

  let chosen = [...original];
  let bestRank = rank(chosen);
  if (anchor && !currentlyHasAnchor) {
    // O desfecho funcional é transversal às queixas, e não apenas um fallback
    // usado quando sobra vaga. Incluí-lo pode exigir substituir uma medalha.
    chosen = [anchor];
    bestRank = rank(chosen);
    const others = pool.filter((m) => !isFunctionalAnchor(m.scale.id));
    const consider = (arr: RefinedScaleMatch[]) => {
      if (burden(arr) > questionCap) return;
      const score = rank(arr);
      if (score > bestRank) {
        chosen = arr;
        bestRank = score;
      }
    };
    for (let i = 0; i < others.length; i++) {
      consider([others[i], anchor]);
      for (let j = i + 1; j < others.length; j++) {
        consider([others[i], others[j], anchor]);
      }
    }
  } else if (!anchor && !currentlyHasAnchor) {
    // Caso não haja instrumento funcional compatível, não falsificar uma escala
    // nem relaxar restrições; ainda assim procurar evitar repetições.
    chosen = [...original];
  }

  // Se ainda houver construtos repetidos, procurar troca útil e segura
  // preservando todos os domínios de queixa e sinais presentes no trio.
  for (let pass = 0; pass < 2 && repeatPairs(chosen) > 0; pass++) {
    let improved: RefinedScaleMatch[] | null = null;
    let improvedRank = rank(chosen);
    for (let index = chosen.length - 1; index >= 0; index--) {
      const current = chosen[index];
      if (isFunctionalAnchor(current.scale.id)) continue;
      for (const candidate of pool) {
        if (chosen.some((m) => m.scale.id === candidate.scale.id)) continue;
        if (candidate.relevanceScore < current.relevanceScore - 20) continue;
        const attempt = [...chosen];
        attempt[index] = candidate;
        if (burden(attempt) > questionCap) continue;
        if (coverage(attempt) < coverage(chosen)) continue;
        if (signalCovered(chosen) && !signalCovered(attempt)) continue;
        if (repeatPairs(attempt) >= repeatPairs(chosen)) continue;
        const score = rank(attempt);
        if (score > improvedRank) {
          improvedRank = score;
          improved = attempt;
        }
      }
    }
    if (!improved) break;
    chosen = improved;
  }

  if (burden(chosen) > questionCap) return { ouro, prata, bronze };
  // A âncora complementa as escalas específicas; quando possível mantém Ouro.
  chosen.sort((a, b) => {
    if (ouro && a.scale.id === ouro.scale.id) return -1;
    if (ouro && b.scale.id === ouro.scale.id) return 1;
    if (prata && a.scale.id === prata.scale.id) return -1;
    if (prata && b.scale.id === prata.scale.id) return 1;
    return b.relevanceScore - a.relevanceScore;
  });
  return { ouro: chosen[0], prata: chosen[1], bronze: chosen[2] };
}
