/**
 * Métricas institucionais exibidas no shell e na Home.
 *
 * Este módulo é deliberadamente leve: importar a Home não deve materializar o
 * catálogo clínico inteiro nem a base farmacológica. Os valores são atualizados
 * pelo inventário/guards de catálogo no release; não são usados para decisão
 * clínica, cálculo, triagem ou autorização.
 */
export const appMetrics = {
  scaleCount: 253,
  filterableInstrumentCount: 269,
  supplementalFilterableCount: 21,
  directTestCount: 269,
  medicationCount: 142,
  medicationCategoryCount: 27,
  pageCount: 95,
  parentEducationCount: 33,
} as const;

export function metricLabel(value: number, suffix = "") {
  return `${value}${suffix}`;
}
