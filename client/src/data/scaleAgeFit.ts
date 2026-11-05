/**
 * Encaixe etário ÚNICO do Filtro Clínico: idade exata × faixa etária.
 *
 * Regra: uma faixa selecionada NUNCA é reduzida ao ponto médio para validar um
 * instrumento. Com idade exata, o instrumento precisa conter a idade. Com faixa,
 * a cobertura total da faixa é a preferência ("full"); cobertura parcial
 * ("partial") é permitida como fallback, mas deve ser sinalizada para confirmação
 * da idade exata. Sem sobreposição, o instrumento não encaixa ("none").
 *
 * Os limites das faixas do catálogo são fracionários (ex.: 0–5,99 meses), por
 * isso as comparações são diretas, como no restante do motor.
 */

export interface AgeSelection {
  /** Idade EXATA em meses; ignorada quando há faixa. */
  exactAge?: number | null;
  /** Faixa selecionada em meses; quando presente, governa o encaixe. */
  ageBand?: { min: number; max: number } | null;
}

export type ScaleAgeFit = "exact" | "full" | "partial" | "none" | "unknown";

export function scaleAgeFit(
  scale: { ageMin: number; ageMax: number },
  selection: AgeSelection,
): ScaleAgeFit {
  const band = selection.ageBand;
  if (band) {
    if (scale.ageMin <= band.min && scale.ageMax >= band.max) return "full";
    if (scale.ageMax >= band.min && scale.ageMin <= band.max) return "partial";
    return "none";
  }
  const age = selection.exactAge;
  if (age === null || age === undefined) return "unknown";
  return scale.ageMin <= age && scale.ageMax >= age ? "exact" : "none";
}

/** Encaixe aceitável como BLOQUEIO (não exclusão por preferência): sobreposição ou idade contida. */
export function fitsSelectedAge(fit: ScaleAgeFit): boolean {
  return fit !== "none";
}

/** Rótulo de encaixe para a UI e a exportação. Não define aplicabilidade nem diagnóstico. */
export function scaleAgeFitLabel(fit: ScaleAgeFit): string {
  switch (fit) {
    case "exact":
      return "Idade exata dentro da faixa do instrumento";
    case "full":
      return "Compatível com toda a faixa selecionada";
    case "partial":
      return "Compatível em parte da faixa · confirme a idade exata";
    case "none":
      return "Fora da idade selecionada";
    case "unknown":
      return "Idade não informada";
  }
}
