import type { ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog as composeBaseCatalog } from "./filterableCatalogBase";
export { supplementalFilterableInstruments, FILTER_EXCLUDED_IDS } from "./filterableCatalogBase";

/**
 * Aplicações autorais com filtro dedicado não entram em baterias automáticas.
 * A composição e todas as exclusões legadas permanecem intactas no módulo base.
 * REGULA-20 segue no catálogo e na aba autoral, com idade/observador/finalidade
 * obrigatórios. Não implica excluir, aposentar ou converter seus predecessores.
 */
export const EXPLICIT_AUTHORIAL_FILTER_IDS: ReadonlySet<string> = new Set(["regula-20-sdg"]);

export function mergeFilterableCatalog(primary: ScaleEntry[]): ScaleEntry[] {
  return composeBaseCatalog(primary).filter((scale) => !EXPLICIT_AUTHORIAL_FILTER_IDS.has(scale.id));
}
