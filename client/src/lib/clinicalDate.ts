// Fonte única de data/hora para documentos clínicos exportados pelo app.
export const CLINICAL_TIME_ZONE = "America/Bahia";

function validDate(date: Date): Date {
  return Number.isFinite(date.getTime()) ? date : new Date();
}

export function formatClinicalDate(date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINICAL_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(validDate(date));
}

export function formatClinicalLongDate(date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINICAL_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(validDate(date));
}

export function formatClinicalDateTime(date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINICAL_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(validDate(date));
}

/**
 * Data de calendário local do dispositivo (AAAA-MM-DD), no mesmo referencial
 * de `<input type="date">` e de `toTimeString()`. Não usar
 * `toISOString().slice(0, 10)` como "hoje": isso é a data em UTC e, no Brasil
 * (UTC-3), a partir das 21h já devolve o dia seguinte.
 */
export function localIsoDate(date = new Date()): string {
  const d = validDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Data `dd/mm/aaaa` para exibir um valor ISO. Data pura (`AAAA-MM-DD`, campo de
 * data) é mostrada como está; timestamp (`appliedAt`, `createdAt`) usa o dia do
 * calendário LOCAL. Antes, `toISOString().slice(0, 10)` mostrava o dia UTC: uma
 * escala aplicada às 22h em Brasília aparecia com a data de amanhã.
 * Devolve `null` quando o valor não é uma data.
 */
export function formatIsoDateBr(value: string): string | null {
  const pure = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (pure) {
    const valid = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(valid.getTime()) || valid.toISOString().slice(0, 10) !== value
      ? null
      : `${pure[3]}/${pure[2]}/${pure[1]}`;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : localIsoDate(d).split("-").reverse().join("/");
}
