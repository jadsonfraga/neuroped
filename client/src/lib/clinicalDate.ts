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
