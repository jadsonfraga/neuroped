import type { ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog as composeBaseCatalog } from "./filterableCatalogBase";
import { RECOVERED_MONITOR_IDS } from "./recoveredAuthorialMonitors";
export { supplementalFilterableInstruments, FILTER_EXCLUDED_IDS } from "./filterableCatalogBase";

/**
 * Aplicações autorais com filtro dedicado não entram em baterias genéricas.
 * Permanecem no catálogo e são selecionadas na aba autoral por finalidade,
 * observador, idade e contexto. Nenhum predecessor é convertido ou apagado.
 */
export const EXPLICIT_AUTHORIAL_FILTER_IDS: ReadonlySet<string> = new Set([
  "regula-20-sdg",
  ...RECOVERED_MONITOR_IDS,
]);

export function mergeFilterableCatalog(primary: ScaleEntry[]): ScaleEntry[] {
  return composeBaseCatalog(primary).filter((scale) => !EXPLICIT_AUTHORIAL_FILTER_IDS.has(scale.id));
}
