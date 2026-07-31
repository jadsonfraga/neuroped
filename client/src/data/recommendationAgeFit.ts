export interface RecommendationAgeBand {
  min: number;
  max: number;
}

export interface AgeBoundedRecommendation {
  id: string;
  name: string;
  ageMin: number;
  ageMax: number;
  queixas: string[];
}

export type RecommendationAgeFit = "full" | "partial";
export type RecommendationAgeFitResult = RecommendationAgeFit | "none";

export interface RecommendationAgeMatch<
  T extends AgeBoundedRecommendation = AgeBoundedRecommendation,
> {
  recommendation: T;
  ageFit: RecommendationAgeFit;
  overlapMonths: number;
  coverageRatio: number;
  complaintMatches: number;
}

function isValidMonth(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function isValidRecommendationAgeBand(
  band: RecommendationAgeBand,
): boolean {
  return (
    isValidMonth(band.min) &&
    isValidMonth(band.max) &&
    band.max >= band.min
  );
}

export function classifyRecommendationAgeFit(
  recommendationMin: number,
  recommendationMax: number,
  selectedBand: RecommendationAgeBand,
): RecommendationAgeFitResult {
  if (
    !isValidMonth(recommendationMin) ||
    !isValidMonth(recommendationMax) ||
    recommendationMax < recommendationMin ||
    !isValidRecommendationAgeBand(selectedBand)
  ) {
    return "none";
  }

  if (
    recommendationMin <= selectedBand.min &&
    recommendationMax >= selectedBand.max
  ) {
    return "full";
  }

  return recommendationMax >= selectedBand.min &&
    recommendationMin <= selectedBand.max
    ? "partial"
    : "none";
}

function overlapMonths(
  recommendationMin: number,
  recommendationMax: number,
  selectedBand: RecommendationAgeBand,
): number {
  const start = Math.max(recommendationMin, selectedBand.min);
  const end = Math.min(recommendationMax, selectedBand.max);
  return Math.max(0, end - start + 1);
}

/**
 * Filtra recomendações pela faixa etária inteira, sem reduzi-la a um ponto médio.
 *
 * Dentro da mesma prioridade clínica, aplicações compatíveis com toda a faixa
 * aparecem antes das que cobrem apenas parte dela. As parciais continuam
 * disponíveis, mas devem ser apresentadas com aviso para confirmação da idade
 * exata — nunca como equivalentes silenciosas às compatíveis por completo.
 */
export function rankRecommendationsForAgeBand<
  T extends AgeBoundedRecommendation,
>(
  recommendations: readonly T[],
  selectedQueixas: readonly string[],
  selectedBand: RecommendationAgeBand,
  priorityOf: (recommendation: T) => number,
): RecommendationAgeMatch<T>[] {
  if (
    selectedQueixas.length === 0 ||
    !isValidRecommendationAgeBand(selectedBand)
  ) {
    return [];
  }

  const selected = new Set(selectedQueixas);
  const bandSpan = selectedBand.max - selectedBand.min + 1;

  return recommendations
    .map((recommendation): RecommendationAgeMatch<T> | null => {
      const complaintMatches = recommendation.queixas.filter((queixa) =>
        selected.has(queixa),
      ).length;
      if (complaintMatches === 0) return null;

      const ageFit = classifyRecommendationAgeFit(
        recommendation.ageMin,
        recommendation.ageMax,
        selectedBand,
      );
      if (ageFit === "none") return null;

      const overlap = overlapMonths(
        recommendation.ageMin,
        recommendation.ageMax,
        selectedBand,
      );
      return {
        recommendation,
        ageFit,
        overlapMonths: overlap,
        coverageRatio: overlap / bandSpan,
        complaintMatches,
      };
    })
    .filter(
      (match): match is RecommendationAgeMatch<T> => Boolean(match),
    )
    .sort((a, b) => {
      const priorityDifference =
        priorityOf(a.recommendation) - priorityOf(b.recommendation);
      if (priorityDifference !== 0) return priorityDifference;

      const ageFitDifference =
        (a.ageFit === "full" ? 0 : 1) - (b.ageFit === "full" ? 0 : 1);
      if (ageFitDifference !== 0) return ageFitDifference;

      const complaintDifference = b.complaintMatches - a.complaintMatches;
      if (complaintDifference !== 0) return complaintDifference;

      const coverageDifference = b.coverageRatio - a.coverageRatio;
      if (coverageDifference !== 0) return coverageDifference;

      return a.recommendation.name.localeCompare(
        b.recommendation.name,
        "pt-BR",
      );
    });
}

function formatAgePoint(months: number): string {
  if (months < 24) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  }
  return `${years}a ${remainingMonths}m`;
}

export function formatRecommendationAgeRange(
  minMonths: number,
  maxMonths: number,
): string {
  if (minMonths === maxMonths) return formatAgePoint(minMonths);
  if (maxMonths < 24) return `${minMonths}–${maxMonths} meses`;
  if (
    minMonths >= 24 &&
    minMonths % 12 === 0 &&
    maxMonths % 12 === 0
  ) {
    return `${minMonths / 12}–${maxMonths / 12} anos`;
  }
  return `${formatAgePoint(minMonths)}–${formatAgePoint(maxMonths)}`;
}

export function getRecommendationAgeFitLabel(
  ageFit: RecommendationAgeFit,
): string {
  return ageFit === "full"
    ? "Compatível com toda a faixa"
    : "Compatível em parte · confirme a idade";
}
