const MAX_FILTER_AGE_MONTHS = 251;

type DailyInventorySearchRecord = {
  title: string;
  shortTitle: string;
  topic: string;
  category: string;
  subcategory: string;
  purpose: string;
  tags: string[];
  domains: Array<{ label: string; description: string }>;
  items: Array<{ text: string }>;
};

function normalizeAgeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, " ")
    .trim();
}

function clampAge(months: number): number {
  return Math.min(MAX_FILTER_AGE_MONTHS, Math.max(0, months));
}

function numericAge(
  value: string,
  unit: "years" | "months" | "weeks" | "days",
) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  if (unit === "years") return amount * 12;
  if (unit === "weeks") return (amount * 7) / 30.4375;
  if (unit === "days") return amount / 30.4375;
  return amount;
}

function collectExplicitAges(text: string): number[] {
  const ages: number[] = [];
  const occupied = new Set<number>();

  for (const match of text.matchAll(/(\d+)\s*a\s*(\d+)\s*m\b/g)) {
    ages.push(Number(match[1]) * 12 + Number(match[2]));
    for (
      let index = match.index!;
      index < match.index! + match[0].length;
      index++
    )
      occupied.add(index);
  }

  const units: Array<[RegExp, "years" | "months" | "weeks" | "days"]> = [
    [/(\d+(?:\.\d+)?)\s*\+?\s*(?:anos?|a\b)/g, "years"],
    [/(\d+(?:\.\d+)?)\s*\+?\s*(?:mes(?:es)?|m\b)/g, "months"],
    [/(\d+(?:\.\d+)?)\s*semanas?\b/g, "weeks"],
    [/(\d+(?:\.\d+)?)\s*dias?\b/g, "days"],
  ];

  for (const [pattern, unit] of units) {
    for (const match of text.matchAll(pattern)) {
      if (occupied.has(match.index!)) continue;
      const months = numericAge(match[1], unit);
      if (months !== null) ages.push(months);
    }
  }

  return ages;
}

function collectInheritedRangeStarts(text: string): number[] {
  const ages: number[] = [];
  const patterns: Array<[RegExp, "years" | "months" | "weeks" | "days"]> = [
    [/(\d+(?:\.\d+)?)\s*-\s*\d+\s*a\s*\d+\s*m\b/g, "years"],
    [/(\d+(?:\.\d+)?)\s*-\s*\d+(?:\.\d+)?\s*\+?\s*(?:anos?|a\b)/g, "years"],
    [
      /(\d+(?:\.\d+)?)\s*-\s*\d+(?:\.\d+)?\s*\+?\s*(?:mes(?:es)?|m\b)/g,
      "months",
    ],
    [/(\d+(?:\.\d+)?)\s*-\s*\d+(?:\.\d+)?\s*semanas?\b/g, "weeks"],
    [/(\d+(?:\.\d+)?)\s*-\s*\d+(?:\.\d+)?\s*dias?\b/g, "days"],
    [
      /(\d+(?:\.\d+)?)\s*-\s*\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\s*anos?\b/g,
      "years",
    ],
  ];

  for (const [pattern, unit] of patterns) {
    for (const match of text.matchAll(pattern)) {
      const months = numericAge(match[1], unit);
      if (months !== null) ages.push(months);
    }
  }

  for (const match of text.matchAll(
    /(\d+(?:\.\d+)?)\s*\/\s*\d+(?:\.\d+)?\s*anos?\b/g,
  )) {
    const months = numericAge(match[1], "years");
    if (months !== null) ages.push(months);
  }

  return ages;
}

function textualAgeBounds(text: string): number[] {
  const ages: number[] = [];
  if (/nascimento|periodo fetal/.test(text)) ages.push(0);
  if (/recem-nascido|neonatal/.test(text)) ages.push(0, 1);
  if (/lactente/.test(text)) ages.push(0, 24);
  if (/primeira infancia/.test(text)) ages.push(0, 72);
  if (/pre-escolar|educacao infantil/.test(text)) ages.push(36, 71);
  if (/idade escolar|(?<!pre-)\bescolar(?:es)?\b/.test(text))
    ages.push(72, 215);
  if (/ensino fundamental/.test(text))
    ages.push(72, /medio/.test(text) ? 215 : 179);
  if (/\bcrianca/.test(text)) ages.push(0, 215);
  if (/adolescente/.test(text)) ages.push(120, 215);
  if (/adulto/.test(text)) ages.push(216, MAX_FILTER_AGE_MONTHS);
  if (/todas? as idades|sem limite/.test(text))
    ages.push(MAX_FILTER_AGE_MONTHS);
  if (/todas? as idades|sem limite/.test(text)) ages.push(0);
  return ages;
}

/**
 * Converts the heterogeneous age labels in the reference catalog to months.
 * Each numeric bound keeps its own unit, and open-ended/textual ranges receive
 * explicit bounds so an adult-only instrument is not shown for a young child.
 */
export function parseReferenceAgeRange(
  ageRange: string,
): [number, number] | null {
  const text = normalizeAgeText(ageRange);
  if (!text || /variavel por idade/.test(text)) return null;

  const ages = [
    ...collectExplicitAges(text),
    ...collectInheritedRangeStarts(text),
    ...textualAgeBounds(text),
  ];

  if (!ages.length) return null;

  let min = Math.min(...ages);
  let max = Math.max(...ages);
  const openEnded =
    /(?:\+|ou mais|a partir de|acima de|maior(?:es)? de|>=|≥)/.test(text) ||
    /adulto|todas? as idades|sem limite/.test(text);
  if (openEnded) max = MAX_FILTER_AGE_MONTHS;

  if (/semanas? pos-concepcional|periodo fetal/.test(text)) min = 0;

  return [clampAge(min), clampAge(Math.max(min, max))];
}

export function dailyInventorySearchText(
  record: DailyInventorySearchRecord,
): string {
  const domainText = record.domains
    .map((domain) => `${domain.label} ${domain.description}`)
    .join(" ");
  return `${record.title} ${record.shortTitle} ${record.topic} ${record.category} ${record.subcategory} ${record.purpose} ${record.tags.join(" ")} ${domainText} ${record.items.map((item) => item.text).join(" ")}`;
}
