/**
 * financialPeriod.ts — períodos prontos do relatório financeiro da agenda.
 * Funções puras sobre datas AAAA-MM-DD (calendário, sem fuso), testáveis sem
 * navegador. O servidor revalida tudo (functions/api/operations/_financialReport.ts).
 */
import {
  FINANCIAL_REPORT_MAX_DAYS,
  addDaysToLocalDate,
  inclusiveDaySpan,
  isValidLocalDate,
} from "@shared/operations";

export type FinancialPreset = "this_month" | "last_month" | "last_30" | "custom";

export interface FinancialPeriod {
  from: string;
  to: string;
}

export const FINANCIAL_PRESET_LABELS: Record<FinancialPreset, string> = {
  this_month: "Este mês",
  last_month: "Mês passado",
  last_30: "Últimos 30 dias",
  custom: "Personalizado",
};

function lastDayOfMonth(year: number, month: number): string {
  // Dia 0 do mês seguinte = último dia deste mês.
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

/** Período de um atalho, a partir da data de hoje (AAAA-MM-DD). */
export function presetPeriod(preset: Exclude<FinancialPreset, "custom">, today: string): FinancialPeriod {
  const [year, month] = today.split("-").map(Number);
  if (preset === "this_month") {
    return { from: `${today.slice(0, 7)}-01`, to: lastDayOfMonth(year, month) };
  }
  if (preset === "last_month") {
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
    return { from: `${prefix}-01`, to: lastDayOfMonth(prevYear, prevMonth) };
  }
  return { from: addDaysToLocalDate(today, -29), to: today };
}

/** Mensagem de erro do período, ou `null` quando ele pode ir ao servidor. */
export function periodError(period: FinancialPeriod): string | null {
  if (!isValidLocalDate(period.from) || !isValidLocalDate(period.to)) return "Informe as datas inicial e final.";
  if (period.from > period.to) return "A data inicial precisa ser anterior ou igual à final.";
  if (inclusiveDaySpan(period.from, period.to) > FINANCIAL_REPORT_MAX_DAYS) {
    return `O período pode ter no máximo ${FINANCIAL_REPORT_MAX_DAYS} dias.`;
  }
  return null;
}

/** Chave/URL do relatório. `format=csv` só no download. */
export function financialReportUrl(period: FinancialPeriod, format: "json" | "csv" = "json"): string {
  const params = new URLSearchParams({ resource: "financial_report", from: period.from, to: period.to });
  if (format === "csv") params.set("format", "csv");
  return `/api/operations?${params.toString()}`;
}

/**
 * Valor digitado em reais → centavos. Aceita "150", "150,50", "1.500,00" e
 * "150.50" (com vírgula, pontos são milhar; sem vírgula, o ponto é decimal).
 * Vazio = `null` (mantém o valor atual). Inválido = `undefined`.
 */
export function parseMoneyInput(value: string): number | null | undefined {
  const text = value.trim().replace(/^R\$\s*/i, "");
  if (!text) return null;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
  return Math.round(Number(normalized) * 100);
}
