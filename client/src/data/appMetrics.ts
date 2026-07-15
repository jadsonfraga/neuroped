/**
 * Snapshot leve das metricas exibidas no shell e na Home.
 *
 * Importar os catalogos aqui fazia componentes globais baixarem todo o acervo
 * clinico antes de qualquer busca. O teste `app-metrics.test.mjs` recalcula
 * estes valores a partir das fontes reais e falha no CI se o snapshot ficar
 * desatualizado.
 */
export const appMetrics = {
  scaleCount: 247,
  filterableInstrumentCount: 268,
  supplementalFilterableCount: 21,
  directTestCount: 268,
  medicationCount: 142,
  medicationCategoryCount: 27,
  pageCount: 83,
  parentEducationCount: 33,
} as const;

export function metricLabel(value: number, suffix = "") {
  return `${value}${suffix}`;
}
