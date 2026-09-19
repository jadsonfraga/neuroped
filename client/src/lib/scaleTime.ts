/**
 * Leitura honesta do campo `tempo` do catálogo ("5–10 min", "~2 min",
 * "90–150 min", "variável"). O antigo motor de "bateria" do BLOCO 3 assumia
 * 10 minutos por padrão quando não conseguia ler o tempo — um orçamento
 * inventado. Aqui a regra é falhar aberto e visível: tempo ilegível vira
 * `null`, e quem soma orçamento declara a incerteza em vez de escondê-la.
 */
export interface ScaleMinutesRange {
  min: number;
  max: number;
}

export function parseScaleMinutes(
  tempo: string | undefined | null,
): ScaleMinutesRange | null {
  if (!tempo) return null;
  const numbers = [...tempo.matchAll(/\d+/g)].map((m) => Number(m[0]));
  if (numbers.length === 0) return null;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  if (!Number.isFinite(min) || min <= 0) return null;
  return { min, max };
}

/**
 * Soma orçamentos de tempo de um conjunto de escalas. `complete` é false
 * quando alguma escala tem tempo ilegível — o rótulo deve então dizer
 * "pelo menos", nunca fingir precisão.
 */
export function sumScaleMinutes(tempos: Array<string | undefined | null>): {
  min: number;
  max: number;
  complete: boolean;
} {
  let min = 0;
  let max = 0;
  let complete = true;
  for (const tempo of tempos) {
    const range = parseScaleMinutes(tempo);
    if (!range) {
      complete = false;
      continue;
    }
    min += range.min;
    max += range.max;
  }
  return { min, max, complete };
}

export function formatMinutesBudget(budget: {
  min: number;
  max: number;
  complete: boolean;
}): string {
  if (budget.min === 0 && budget.max === 0) return "tempo variável";
  const core =
    budget.min === budget.max
      ? `${budget.min} min`
      : `${budget.min}–${budget.max} min`;
  return budget.complete ? `≈ ${core}` : `pelo menos ${core} (+ etapas de tempo variável)`;
}
