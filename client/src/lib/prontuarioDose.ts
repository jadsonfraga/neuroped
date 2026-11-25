// Apenas valores documentados: não converter volumes, concentrações ou unidades.
function parseUnambiguousDecimal(input: string): number | undefined {
  const parts = /^(0|[1-9]\d*)(?:([,.])(\d+))?$/.exec(input);
  if (!parts) return undefined;
  const [, integer, separator, fraction] = parts;
  // Em pt-BR, "1.000" também pode significar mil: não adivinhar o separador.
  if (integer !== "0" && separator === "." && fraction?.length === 3) return undefined;
  const number = Number(input.replace(",", "."));
  return Number.isFinite(number) ? number : undefined;
}

/** Valor opcional do evento clínico; a dose literal continua no prontuário. */
export function parseProntuarioDoseMg(raw: string): number | undefined {
  const match = /^(\S+)\s*mg$/i.exec(raw.trim());
  if (!match) return undefined;
  const number = parseUnambiguousDecimal(match[1]);
  // Limite estrutural do campo doseMg do Clinical Core, não limite prescritivo.
  return number !== undefined && number <= 100_000 ? number : undefined;
}

/** Exibe a razão matemática apenas quando ambas as entradas são inequívocas. */
export function calcProntuarioMgKg(dose: string, weight: string): string {
  const mg = parseProntuarioDoseMg(dose);
  const kg = parseUnambiguousDecimal(weight.trim().replace(/\s*kg$/i, ""));
  if (mg === undefined || kg === undefined || kg <= 0) return "—";
  const ratio = mg / kg;
  if (!Number.isFinite(ratio)) return "—";
  // Uma razão positiva não deve aparecer como zero ao arredondar a exibição.
  return ratio > 0 && ratio.toFixed(3) === "0.000" ? "< 0,001" : ratio.toFixed(3);
}

/** O campo rotulado já informa kg quando só há um número explícito. */
export function formatProntuarioWeight(raw: string): string {
  const weight = raw.trim();
  return parseUnambiguousDecimal(weight) === undefined ? weight : weight + " kg";
}
