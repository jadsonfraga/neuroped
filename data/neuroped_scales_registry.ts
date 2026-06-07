// NeuroPed — Registro de escalas neuropsiquiátricas infantis
// Versão: 2026.06.07
// Utilitário para converter o JSON compacto em objetos tipados.
// Não embutir itens protegidos por copyright sem permissão formal.

export type ClinicalTier = "Ouro" | "Prata" | "Bronze";
export type EmbedPolicy = "embed" | "permission" | "link";

export interface NeuroPedScale {
  id: string;
  number: number;
  acronym: string;
  fullName: string;
  category: string;
  ageRange: string;
  respondent: string;
  clinicalTier: ClinicalTier;
  embedPolicy: EmbedPolicy;
}

export const POLICY_LABELS: Record<EmbedPolicy, string> = {
  embed: "Candidato a incorporação com atribuição e conferência oficial",
  permission: "Exige permissão/licença antes de embutir itens ou escores",
  link: "Preferir ficha clínica e fonte oficial"
};

export const CLINICAL_TIER_LABELS: Record<ClinicalTier, string> = {
  Ouro: "Prioridade alta para fluxo principal",
  Prata: "Boa utilidade clínica complementar",
  Bronze: "Uso complementar/especializado"
};

export const COMMON_WARNING =
  "Instrumento de triagem/monitoramento. Não estabelece diagnóstico isolado; interpretar com história clínica, exame e contexto escolar/familiar.";

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function parseAgeRange(range: string): { min: number; max: number } | null {
  const normalized = range.replace(",", ".");
  const match = normalized.match(/([0-9.]+)[–-]([0-9.]+)/);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

export function fromCompactRow(row: unknown[]): NeuroPedScale {
  const [number, acronym, fullName, category, ageRange, respondent, clinicalTier, embedPolicy] = row;
  return {
    id: `scale_${String(number).padStart(3, "0")}`,
    number: Number(number),
    acronym: String(acronym),
    fullName: String(fullName),
    category: String(category),
    ageRange: String(ageRange),
    respondent: String(respondent),
    clinicalTier: clinicalTier as ClinicalTier,
    embedPolicy: embedPolicy as EmbedPolicy
  };
}

export function filterScalesByText(scales: NeuroPedScale[], query: string): NeuroPedScale[] {
  const q = normalizeText(query);
  if (!q) return scales;
  return scales.filter((scale) =>
    normalizeText([
      scale.acronym,
      scale.fullName,
      scale.category,
      scale.respondent,
      scale.clinicalTier,
      scale.embedPolicy
    ].join(" ")).includes(q)
  );
}

export function filterScalesByAge(scales: NeuroPedScale[], ageYears: number): NeuroPedScale[] {
  return scales.filter((scale) => {
    const range = parseAgeRange(scale.ageRange);
    if (!range) return true;
    return ageYears >= range.min && ageYears <= range.max;
  });
}

export function sortScalesByTier(scales: NeuroPedScale[]): NeuroPedScale[] {
  const weight: Record<ClinicalTier, number> = { Ouro: 0, Prata: 1, Bronze: 2 };
  return [...scales].sort((a, b) => weight[a.clinicalTier] - weight[b.clinicalTier] || a.number - b.number);
}

export function assertRegistry(scales: NeuroPedScale[]): void {
  if (scales.length !== 100) {
    throw new Error(`Registro NeuroPed deve conter 100 escalas. Encontradas: ${scales.length}`);
  }
  const ids = new Set(scales.map((scale) => scale.id));
  if (ids.size !== scales.length) {
    throw new Error("Registro NeuroPed contém IDs duplicados.");
  }
}
