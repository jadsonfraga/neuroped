/**
 * Parser fail-closed de faixa etária em texto livre (registro mundial).
 *
 * Por que existe: o parser antigo do filtro só reconhecia "X–Y" com travessão
 * e, quando não reconhecia, FALHAVA ABERTO para {0, 216} — 77 das 112 linhas
 * do registro ("0 a 6 anos", "Nascimento a 68 meses", "16 dias a 42 meses")
 * viravam instrumentos aparentemente válidos de 0 a 18 anos. Um Bayley (até
 * 42 meses) aparecia elegível para adolescente.
 *
 * Regras:
 * - unidades reconhecidas: dias, semanas, meses, anos (padrão: anos quando o
 *   texto não declara unidade — convenção do registro);
 * - a unidade declarada à direita vale para o lado esquerdo sem unidade
 *   ("1 a 66 meses" ⇒ ambos em meses);
 * - "nascimento"/"recém-nascido" ⇒ 0;
 * - múltiplas faixas (";" ou variantes) ⇒ envelope (mín dos mín, máx dos máx);
 * - parênteses são detalhamento: só entram se o texto principal não parsear;
 * - texto irreconhecível ⇒ NULL (nunca uma faixa inventada) — quem consome
 *   exclui a entrada e o gate de release reprova o catálogo.
 */

export interface ParsedAgeRange {
  min: number; // meses
  max: number; // meses
}

type Unit = "dias" | "semanas" | "meses" | "anos";

const UNIT_TO_MONTHS: Record<Unit, number> = {
  dias: 1 / 30,
  semanas: 12 / 52,
  meses: 1,
  anos: 12,
};

function unitOf(text: string): Unit | null {
  if (/\bdias?\b/.test(text)) return "dias";
  if (/\bsemanas?\b/.test(text)) return "semanas";
  if (/\bm[eê]s(?:es)?\b/.test(text)) return "meses";
  if (/\banos?\b/.test(text)) return "anos";
  return null;
}

function toMonths(value: number, unit: Unit): number {
  return value * UNIT_TO_MONTHS[unit];
}

// "7 anos e 11 meses" / "4 anos e 2 meses" — idade composta.
const COMPOSITE = /(\d+(?:[.,]\d+)?)\s*anos?\s*e\s*(\d+(?:[.,]\d+)?)\s*m[eê]s(?:es)?/;
// lado de uma faixa: número + unidade opcional, ou "nascimento".
const SIDE = String.raw`(nascimento|rec[eé]m[- ]nascidos?|\d+(?:[.,]\d+)?(?:\s*(?:dias?|semanas?|m[eê]s(?:es)?|anos?))?)`;
const RANGE = new RegExp(`${SIDE}\\s*(?:a|até|[–—-])\\s*${SIDE}`, "gi");

function parseSide(raw: string, fallbackUnit: Unit): number | null {
  const text = raw.trim().toLowerCase().replace(",", ".");
  if (/nascimento|rec[eé]m/.test(text)) return 0;
  const composite = text.match(COMPOSITE);
  if (composite) {
    return toMonths(Number(composite[1]), "anos") + toMonths(Number(composite[2]), "meses");
  }
  const num = text.match(/\d+(?:\.\d+)?/);
  if (!num) return null;
  const unit = unitOf(text) ?? fallbackUnit;
  return toMonths(Number(num[0]), unit);
}

/**
 * Universo pediátrico do app: instrumento com teto adulto ("8–89 anos",
 * "2,5 a adultos", "≥ 4 anos") é válido aqui até os 18 anos — 216 meses é o
 * teto do catálogo, não uma faixa inventada: o limite INFERIOR continua o do
 * instrumento.
 */
const PEDIATRIC_CEILING = 216;

const OPEN_LOWER = new RegExp(
  String.raw`(?:≥|>=|a partir de|acima de)\s*(\d+(?:[.,]\d+)?)\s*(dias?|semanas?|m[eê]s(?:es)?|anos?)`,
  "gi",
);

function rangesIn(text: string): ParsedAgeRange[] {
  const out: ParsedAgeRange[] = [];
  const adultText = text.replace(/adultos?\b/g, `${PEDIATRIC_CEILING / 12} anos`);
  for (const m of adultText.matchAll(RANGE)) {
    // Unidade do lado direito governa um lado esquerdo sem unidade.
    const rightUnit = unitOf(m[2].toLowerCase()) ?? "anos";
    const max = parseSide(m[2], rightUnit);
    const min = parseSide(m[1], rightUnit);
    if (min === null || max === null) continue;
    if (min < 0 || max <= 0 || min > max) continue;
    out.push({ min: Math.round(min), max: Math.round(max) });
  }
  // Limite inferior aberto: "≥ 2 anos", "a partir de 18 meses".
  for (const m of text.matchAll(OPEN_LOWER)) {
    const unit = unitOf(m[2].toLowerCase()) ?? "anos";
    const min = toMonths(Number(m[1].replace(",", ".")), unit);
    if (min >= 0 && min <= PEDIATRIC_CEILING) {
      out.push({ min: Math.round(min), max: PEDIATRIC_CEILING });
    }
  }
  // Valor único com unidade explícita ("18 meses") — ponto etário conservador.
  if (out.length === 0) {
    const single = text.match(/(\d+(?:[.,]\d+)?)\s*(dias?|semanas?|m[eê]s(?:es)?|anos?)/);
    if (single) {
      const unit = unitOf(single[2].toLowerCase()) ?? "anos";
      const v = Math.round(toMonths(Number(single[1].replace(",", ".")), unit));
      if (v >= 0 && v <= PEDIATRIC_CEILING) out.push({ min: v, max: v });
    }
  }
  return out;
}

export function parseAgeRangeMonths(raw: string | null | undefined): ParsedAgeRange | null {
  if (!raw || !raw.trim()) return null;
  const text = raw.toLowerCase();
  const main = text.replace(/\([^)]*\)/g, " ");
  let ranges = rangesIn(main);
  if (ranges.length === 0) ranges = rangesIn(text);
  // Descrição populacional SEM número ("crianças e adolescentes", "todas as
  // idades") declara ausência de restrição etária: espectro pediátrico
  // completo — leitura fiel do texto, não fabricação.
  if (ranges.length === 0 && !/\d/.test(text) && /todas as idades|crian[cç]as/.test(text)) {
    ranges = [{ min: 0, max: PEDIATRIC_CEILING }];
  }
  if (ranges.length === 0) return null;
  const min = Math.min(...ranges.map((r) => r.min));
  const max = Math.max(...ranges.map((r) => r.max));
  if (min < 0 || min > max) return null;
  // Instrumento que se estende à vida adulta é recortado no teto pediátrico;
  // um mínimo acima do teto é população exclusivamente adulta ⇒ fora do app.
  if (min > PEDIATRIC_CEILING) return null;
  return { min, max: Math.min(max, PEDIATRIC_CEILING) };
}
