import assert from "node:assert/strict";
import {
  applyUploadedInstrumentOverrides,
  getUploadedInstrumentDetail,
  uploadedFilterInstruments,
} from "../../client/src/data/uploadedInstrumentCatalog.ts";
import { buildUploadedReferenceCatalogForApp } from "../../client/src/data/uploadedInstrumentFilterBridge.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { allScales, scales } from "../../client/src/data/scaleFilter.ts";

const importedIds = new Set(uploadedFilterInstruments.map((scale) => scale.id));
for (const id of [
  "cars2-st",
  "cars2-hf",
  "cars2-qpc",
  "ica-abc-autismo",
  "qiiahsd-r-ei",
  "apraxia-tea-referencia",
]) {
  assert(importedIds.has(id), `instrumento importado ausente: ${id}`);
  assert(getUploadedInstrumentDetail(id), `ficha detalhada ausente: ${id}`);
}

assert(getUploadedInstrumentDetail("scq-asq"), "alias ASQ/SCQ sem ficha detalhada");

const cars = scales.find((scale) => scale.id === "cars");
const scq = scales.find((scale) => scale.id === "scq");
assert(cars, "CARS legado ausente");
assert(scq, "SCQ legado ausente");

const patchedCars = applyUploadedInstrumentOverrides(cars);
assert.equal(patchedCars.name, "CARS — registro clínico");
assert(!patchedCars.fullName.includes("Second Edition"), "registro interno continua rotulado como CARS-2 oficial");

const patchedScq = applyUploadedInstrumentOverrides(scq);
assert.equal(patchedScq.implementationStatus, "external_only");
assert.equal(patchedScq.appRoute, "/instrumentos-importados/scq-asq");
assert.equal(patchedScq.pendente_validacao_clinica, true);

const recommendableIds = new Set(mergeFilterableCatalog(allScales).map((scale) => scale.id));
for (const id of importedIds) {
  assert(!recommendableIds.has(id), `referência externa vazou para recomendação: ${id}`);
}

const allModeCatalog = buildUploadedReferenceCatalogForApp(scales);
const allModeIds = new Set(allModeCatalog.map((scale) => scale.id));
for (const id of importedIds) {
  assert(allModeIds.has(id), `referência ausente no modo Todas: ${id}`);
}
assert.equal(allModeCatalog.filter((scale) => scale.id === "scq").length, 1, "SCQ/ASQ duplicado no modo Todas");
assert(recommendableIds.has("abc"), "ABC de Comportamento Aberrante foi removido indevidamente");
assert(allModeIds.has("ica-abc-autismo"), "ICA/ABC-Autismo não foi separado do ABC de Comportamento Aberrante");
assert.notEqual("abc", "ica-abc-autismo");

for (const scale of uploadedFilterInstruments) {
  assert(scale.appRoute?.startsWith("/instrumentos-importados/"), `rota específica ausente: ${scale.id}`);
  assert.notEqual(scale.implementationStatus, "complete", `instrumento protegido não pode ser marcado como completo: ${scale.id}`);
}

console.log("✓ catálogo importado, filtros e colisões validados");
