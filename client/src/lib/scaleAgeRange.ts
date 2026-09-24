/**
 * Formatação de faixa etária de instrumentos com precisão em meses.
 *
 * Promovida da antiga ScaleFichaPage ao remover as fichas nominais: a ficha
 * canônica (/generic-scale/:id) usava um arredondamento (`Math.round(m/12)`)
 * que exibia "3 a 6 meses–4 anos" como "0 a – 4 a" ou "42 meses" como "4 a".
 * Em instrumento clínico, meses importam (Bayley, Denver, triagens neonatais):
 * nunca arredonde a faixa — mostre anos+meses exatos.
 */
export function formatAgePoint(months: number): string {
  if (months === 0) return "nascimento";
  if (months < 24) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years}a ${remainingMonths}m`;
}

export function formatScaleAgeRange(
  minMonths: number,
  maxMonths: number,
): string {
  if (minMonths === maxMonths) return formatAgePoint(minMonths);
  if (maxMonths < 24) return `${minMonths}–${maxMonths} meses`;
  if (minMonths >= 24 && minMonths % 12 === 0 && maxMonths % 12 === 0) {
    return `${minMonths / 12}–${maxMonths / 12} anos`;
  }
  return `${formatAgePoint(minMonths)} – ${formatAgePoint(maxMonths)}`;
}
