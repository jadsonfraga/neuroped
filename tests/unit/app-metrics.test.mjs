// @ts-check
/**
 * Garante que o snapshot leve exibido pelo app continue igual aos catalogos.
 * Assim, a UI nao precisa importar todo o acervo clinico no carregamento
 * inicial e os numeros ainda permanecem derivados e auditaveis.
 */
import assert from "node:assert/strict";

import { appMetrics } from "../../client/src/data/appMetrics.ts";
import { pharmCategories } from "../../client/src/data/farmacologia.ts";
import { mergeFilterableCatalog, supplementalFilterableInstruments } from "../../client/src/data/filterableCatalog.ts";
import { navigablePages } from "../../client/src/data/navigation.ts";
import { novidadesConteudoStats } from "../../client/src/data/novidadesConteudoAmpliado.ts";
import { allScales } from "../../client/src/data/scaleFilter.ts";

const allFilterable = mergeFilterableCatalog(allScales);
const calculatedMetrics = {
  scaleCount: allScales.length,
  filterableInstrumentCount: allFilterable.length,
  supplementalFilterableCount: supplementalFilterableInstruments.length,
  directTestCount: allFilterable.filter((item) => Boolean(item.appRoute)).length,
  medicationCount: pharmCategories.reduce((total, category) => total + category.drugs.length, 0),
  medicationCategoryCount: pharmCategories.length,
  pageCount: new Set(navigablePages.map((page) => page.href)).size,
  parentEducationCount: novidadesConteudoStats.artigosTotal,
};

assert.deepEqual(
  appMetrics,
  calculatedMetrics,
  "appMetrics ficou desatualizado: atualize o snapshot somente apos revisar os catalogos",
);

console.log(`✅ METRICAS DO APP OK — ${Object.keys(calculatedMetrics).length} valores conferidos.`);
