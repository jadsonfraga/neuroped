import type { ScaleEntry } from "@/data/scaleFilter";

const RESPONDENT_LABELS: Record<string, string> = {
  pais: "Pais ou cuidadores",
  clinico: "Profissional clínico",
  professor: "Professor ou escola",
  autoaplicavel: "Autorrelato",
  crianca: "Criança ou adolescente",
  teste_direto_crianca: "Teste direto com a criança",
};

const PRIORITY_LABELS: Record<string, string> = {
  triagem: "Triagem",
  diagnostica: "Apoio diagnóstico",
  diagnostico: "Apoio diagnóstico",
  monitorizacao: "Monitorização",
  seguimento: "Seguimento",
  psicoeducacao: "Psicoeducação",
};

const LICENSE_LABELS: Record<string, string> = {
  livre: "Uso livre",
  autoral: "Instrumento autoral",
  comercial: "Licença comercial",
  restrita: "Uso restrito",
  contato_autor: "Uso mediante autorização",
};

/**
 * O catálogo usa limites como 47.99 para representar o último instante antes
 * dos 48 meses. A apresentação deve respeitar essa convenção; arredondar faria
 * 47.99 aparecer como 4 anos e ampliaria visualmente a faixa do instrumento.
 */
export function normalizeDisplayMonth(months: number): number {
  if (!Number.isFinite(months) || months < 0) return 0;
  return Math.floor((months + Number.EPSILON) * 100) / 100;
}

export function formatScaleAgePoint(months: number): string {
  const normalized = Math.floor(normalizeDisplayMonth(months));
  if (normalized === 0) return "nascimento";
  if (normalized < 24) {
    return `${normalized} ${normalized === 1 ? "mês" : "meses"}`;
  }

  const years = Math.floor(normalized / 12);
  const remainingMonths = normalized % 12;
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  }
  return `${years}a ${remainingMonths}m`;
}

export function formatScaleAgeRange(
  minMonths: number,
  maxMonths: number,
): string {
  const min = normalizeDisplayMonth(minMonths);
  const max = normalizeDisplayMonth(maxMonths);
  if (min === max) return formatScaleAgePoint(min);

  const minWhole = Math.floor(min);
  const maxWhole = Math.floor(max);
  if (maxWhole < 24) return `${minWhole}–${maxWhole} meses`;
  if (
    minWhole >= 24 &&
    minWhole % 12 === 0 &&
    maxWhole % 12 === 0 &&
    Number.isInteger(min) &&
    Number.isInteger(max)
  ) {
    return `${minWhole / 12}–${maxWhole / 12} anos`;
  }
  return `${formatScaleAgePoint(min)} – ${formatScaleAgePoint(max)}`;
}

export function scaleRespondentLabel(respondent: string): string {
  return RESPONDENT_LABELS[respondent] ?? prettifyScaleToken(respondent);
}

export function scaleRespondentsLabel(
  respondents: readonly string[] | undefined,
): string {
  if (!respondents?.length) return "Não informado";
  return respondents.map(scaleRespondentLabel).join(" · ");
}

export function scalePriorityLabel(priority: string | undefined): string {
  if (!priority) return "Não informada";
  return PRIORITY_LABELS[priority] ?? prettifyScaleToken(priority);
}

export function scaleLicenseLabel(license: string | undefined): string {
  if (!license) return "Licença não documentada";
  return LICENSE_LABELS[license] ?? prettifyScaleToken(license);
}

export function prettifyScaleToken(value: string): string {
  const text = value.replaceAll("_", " ").replaceAll("-", " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Não informado";
}

export function scaleRoute(scale: Pick<ScaleEntry, "id" | "appRoute">): string {
  return scale.appRoute || `/generic-scale/${scale.id}`;
}
