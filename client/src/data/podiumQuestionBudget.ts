import type { RefinedScaleMatch } from "./advancedFilterLogic";
import { interactiveScaleItems } from "./interactiveScaleItems";
import { interactiveScales } from "./interactiveScales";
import type { ScaleEntry } from "./scaleFilter";

export const MAX_PODIUM_QUESTIONS = 100;

// Contagens das páginas dedicadas que não vivem nos registros declarativos.
// Quando uma página filtra por idade, usamos a carga máxima conservadora exibida
// pelo fluxo. Instrumentos acima de 100 itens não podem ocupar o pódio porque,
// isoladamente, já violariam a regra operacional solicitada.
const DEDICATED_PAGE_QUESTION_COUNTS: Readonly<Record<string, number>> = {
  mchat: 20,
  cars: 15,
  snap: 26,
  denver: 125,
  sdq: 25,
  scared: 41,
  conners: 48,
  vineland: 297,
  cdi2: 28,
  phqa: 9,
  cssrs: 6,
  crafft: 6,
  cbcl: 113,
  vanderbilt: 55,
  brief2: 25,
  abc: 58,
  asq3: 30,
  pedsql: 23,
  gmfcs: 1,
  cshq: 33,
  ygtss: 10,
  psc17: 17,
  gad7: 7,
  aq10: 10,
  aq50: 50,
};

function countDeclarativeItems(scaleId: string): number | null {
  const generic = interactiveScaleItems[scaleId];
  if (generic) {
    return generic.domains.reduce((total, domain) => total + domain.items.length, 0);
  }
  const runner = interactiveScales[scaleId];
  if (runner) return runner.items.length;
  return null;
}

function countFromMetadata(scale: ScaleEntry): number | null {
  const text = `${scale.name} ${scale.fullName}`;
  const matches = [...text.matchAll(/\b(\d{1,3})\s*(?:itens?|items?|perguntas?)\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isInteger(value) && value > 0);
  return matches.length > 0 ? Math.max(...matches) : null;
}

/**
 * Carga de perguntas usada pelo motor do pódio.
 *
 * Prioridade: definição interativa real → página dedicada auditada → metadado
 * explícito → estimativa conservadora de 25 itens. A estimativa existe apenas
 * para ferramentas curtas sem contagem estruturada; a catraca de CI impede que
 * o total calculado ultrapasse 100.
 */
export function getScaleQuestionCount(scale: ScaleEntry): number {
  const exact = countDeclarativeItems(scale.id);
  if (exact !== null) return exact;
  const dedicated = DEDICATED_PAGE_QUESTION_COUNTS[scale.id];
  if (dedicated !== undefined) return dedicated;
  const metadata = countFromMetadata(scale);
  if (metadata !== null) return metadata;
  return 25;
}

export function podiumQuestionTotal(
  slots: Array<RefinedScaleMatch | undefined>,
): number {
  return slots.reduce(
    (total, slot) => total + (slot ? getScaleQuestionCount(slot.scale) : 0),
    0,
  );
}

interface QuestionBudgetInput {
  ouro?: RefinedScaleMatch;
  prata?: RefinedScaleMatch;
  bronze?: RefinedScaleMatch;
  candidates: RefinedScaleMatch[];
  ageMonths: number | null;
  selectedQueixas: string[];
}

interface QuestionBudgetResult {
  ouro?: RefinedScaleMatch;
  prata?: RefinedScaleMatch;
  bronze?: RefinedScaleMatch;
}

function uniqueByScaleId(matches: RefinedScaleMatch[]): RefinedScaleMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    if (seen.has(match.scale.id)) return false;
    seen.add(match.scale.id);
    return true;
  });
}

/**
 * Regra de ouro de carga: Ouro + Prata + Bronze nunca passam de 100 perguntas.
 *
 * O pós-passe procura a melhor combinação global, em vez de simplesmente apagar
 * o Bronze. Assim preserva três medalhas sempre que houver trio seguro dentro do
 * orçamento, priorizando cobertura das queixas, escolhas clínicas originais,
 * relevância e idade exata.
 */
export function enforcePodiumQuestionBudget({
  ouro,
  prata,
  bronze,
  candidates,
  ageMonths,
  selectedQueixas,
}: QuestionBudgetInput): QuestionBudgetResult {
  const original = [ouro, prata, bronze] as const;
  if (podiumQuestionTotal([...original]) <= MAX_PODIUM_QUESTIONS) {
    return { ouro, prata, bronze };
  }

  const containsAge = (match: RefinedScaleMatch) =>
    ageMonths === null ||
    (match.scale.ageMin <= ageMonths && match.scale.ageMax >= ageMonths);

  // Mantém o espaço combinatório pequeno e determinístico. Os candidatos já vêm
  // ordenados por relevância e passaram pelos bloqueios clínicos duros.
  const pool = uniqueByScaleId(
    [...original.filter((item): item is RefinedScaleMatch => Boolean(item)), ...candidates]
      .filter(containsAge)
      .filter((match) => getScaleQuestionCount(match.scale) <= MAX_PODIUM_QUESTIONS),
  ).slice(0, 48);

  const options: Array<RefinedScaleMatch | undefined> = [undefined, ...pool];
  let best: QuestionBudgetResult = {};
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const gold of options) {
    for (const silver of options) {
      if (gold && silver && gold.scale.id === silver.scale.id) continue;
      for (const bronzeCandidate of options) {
        const ids = [gold, silver, bronzeCandidate]
          .filter((item): item is RefinedScaleMatch => Boolean(item))
          .map((item) => item.scale.id);
        if (new Set(ids).size !== ids.length) continue;

        const trio = [gold, silver, bronzeCandidate];
        const total = podiumQuestionTotal(trio);
        if (total > MAX_PODIUM_QUESTIONS) continue;

        const slotCount = trio.filter(Boolean).length;
        const covered = new Set<string>();
        for (const match of trio) {
          if (!match) continue;
          for (const queixa of selectedQueixas) {
            if (match.scale.queixas.includes(queixa)) covered.add(queixa);
          }
        }

        const originalSlotBonus = trio.reduce(
          (sum, match, index) => sum + (match && match.scale.id === original[index]?.scale.id ? 450 : 0),
          0,
        );
        const relevance = trio.reduce(
          (sum, match) => sum + (match?.relevanceScore ?? 0),
          0,
        );
        const exactAgeBonus = trio.reduce(
          (sum, match) => sum + (match && containsAge(match) ? 40 : 0),
          0,
        );
        const score =
          slotCount * 100_000 +
          covered.size * 5_000 +
          originalSlotBonus +
          relevance * 4 +
          exactAgeBonus -
          total * 0.05;

        if (score > bestScore) {
          bestScore = score;
          best = { ouro: gold, prata: silver, bronze: bronzeCandidate };
        }
      }
    }
  }

  return best;
}
