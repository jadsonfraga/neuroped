/**
 * Lógica PURA do filtro de pré-consulta — extraída de filtro.tsx para ser
 * testável (sem React). Fonte única de verdade da exclusão e do dedup.
 */
import type { ScaleEntry } from "@/data/scaleFilter";

// Instrumentos de ACOMPANHAMENTO e psicoeducação não entram na pré-consulta.
export const PSICOEDUCACAO_ROUTES = new Set<string>(["/orientacao-parental", "/portal-familia"]);
export const QUEIXAS_POS_CONSULTA = new Set<string>(["efeitos", "evolucao"]);

/** Verdadeiro se o instrumento é aplicável ANTES da consulta. */
export function isPreConsulta(s: ScaleEntry): boolean {
  if (s.prioridade === "monitorizacao") return false;
  if (s.appRoute && PSICOEDUCACAO_ROUTES.has(s.appRoute)) return false;
  return true;
}

/**
 * Dedup por id E por fullName: colapsa duplicatas reais (bears/bears-new,
 * psq/psq-new…) preservando instrumentos distintos de mesma sigla
 * (as duas AIMS têm fullName diferente, então sobrevivem).
 */
export function dedupeScales(scales: ScaleEntry[]): ScaleEntry[] {
  const seenId = new Set<string>();
  const seenName = new Set<string>();
  return scales.filter((s) => {
    const key = (s.fullName || s.name || "").toLowerCase().trim();
    if (seenId.has(s.id) || (key && seenName.has(key))) return false;
    seenId.add(s.id);
    if (key) seenName.add(key);
    return true;
  });
}
