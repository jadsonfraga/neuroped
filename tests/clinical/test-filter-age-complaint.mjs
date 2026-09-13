import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveFilterAge, parseExactFilterAge, parseFilterSearchAge, inferComplaintIds,
  filterComplaintOptions, formatFilterAge } from "../../client/src/lib/filterClinicalInput.ts";
import { faixasEtarias, queixas, allScales } from "../../client/src/data/scaleFilter.ts";
import { clinicalHardBlock, filterScalesIntelligently, filterScalesWithClinicalRescue,
  getBroadbandFallback } from "../../client/src/data/advancedFilterLogic.ts";
import { parseFilterSessionState, saveFilterSessionState, loadFilterSessionState,
  applyFilterSessionNavigationPrefill, clearFilterSessionState } from "../../client/src/lib/filterSessionState.ts";
import { rankRecommendationsForAgeBand } from "../../client/src/data/recommendationAgeFit.ts";
import { testesDiretosRecommendations } from "../../client/src/data/testesDiretosRecommendations.ts";
import { testesPaisRecommendations } from "../../client/src/data/testesPaisRecommendations.ts";

const blank = { years: "", months: "" };
const resolve = (fields = blank, band = null, query = "") => resolveFilterAge(fields, band, query, faixasEtarias);
let checks = 0;
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
equal(resolve().status, "unspecified", "ausência não vira zero");
equal(parseExactFilterAge({ years: "0", months: "" }).ageMonths, 0, "recém-nascido explícito");
equal(parseExactFilterAge({ years: "", months: "6" }).ageMonths, 6, "lactente em meses");
for (let month = 0; month <= 216; month++) {
  const input = { years: String(Math.floor(month / 12)), months: String(month % 12) };
  equal(resolve(input).ageMonths, month, `idade exata ${month} meses`);
}
for (const input of [{ years: "-1", months: "0" }, { years: "5", months: "12" },
  { years: "18", months: "1" }, { years: "1,5", months: "0" }, { years: "NaN", months: "0" },
  { years: "Infinity", months: "0" }, { years: "1e1", months: "0" }, { years: "", months: "-1" }]) {
  equal(resolve(input, "6-12a", "7 anos").status, "invalid", "entrada inválida não usa faixa/texto como substituto");
}
for (const [query, months] of [["5 anos e 6 meses",66], ["5a6m",66], ["5a 6m",66],
  ["aos 12 meses",12], ["aos 6 anos",72], ["aos 5 anos e 6 meses",66],
  ["1 ano e 1 mês",13], ["24 meses, fala pouco",24], ["216 meses",216], ["7 anos",84],
  ["1,5 anos",18], ["12.5 anos",150], ["0 meses",0], ["cefaleia aos 17 anos e 11 meses",215]]) {
  equal(parseFilterSearchAge(query).ageMonths, months, query);
}
for (const query of ["5-6 anos", "5–6 anos", "5 a 6 anos", "5 ou 6 anos", "entre 5 e 6 anos",
  "dos 5 aos 12 meses", "5 aos 12 meses", "dos 0 aos 11 meses", "dos 5 aos 6 anos",
  "5 aos 12m", "1,5 aos 6 meses", "dos 5 aos 6a", "5 aos12meses",
  "5 a 6 meses", "de 5 a 6 meses", "0 a 11 meses", "12 a 18 meses", "5 a6m", "5 a 6m", "3 a 4 m", "1,5 a 6 meses",
  "6 meses; irmão 5 anos", "5 anos e 12 meses", "-5 anos", "5.5 meses", "19 anos", "999 meses"]) {
  equal(parseFilterSearchAge(query).status, "invalid", query);
}
equal(parseFilterSearchAge("medicação 10 mg, consulta 12/09/2026").status, "unspecified", "doses/datas não são idade");
equal(resolve(blank, "2-4a", "24 meses").ageMonths, 24, "idade pontual refina faixa sem midpoint conflitante");
equal(resolve(blank, "2-4a", "24 meses").ageBand, null, "busca exata não preserva filtro de sobreposição");
equal(resolve(blank, "2-4a", "7 anos").status, "invalid", "conflito pede correção");
for (const band of faixasEtarias) equal(resolve(blank, band.id, "5 a 6 meses, sono").status, "invalid", `intervalo em meses não pode ser resgatado pela faixa ${band.id}`);
for (const band of faixasEtarias) for (const range of ["dos 5 aos 12 meses", "dos 5 aos 6 anos"]) equal(resolve(blank, band.id, range).status, "invalid", `${range}: faixa não transforma intervalo em idade pontual`);
equal(resolve({ years: "5", months: "6" }, "2-4a", "7 anos").ageMonths, 66, "campo próprio prevalece");
for (const band of faixasEtarias) equal(resolve(blank, band.id).ageBand, {min:band.min,max:band.max}, `faixa ${band.id} preservada`);
equal(formatFilterAge(66), "5 anos e 6 meses");
for (const text of ["cuidador", "protocolo", "medicamentos", "capacidade", "risco"]) equal(inferComplaintIds(text, queixas), [], `sem queixa por substring: ${text}`);
equal(inferComplaintIds("TOC", queixas), ["toc"]);
equal(inferComplaintIds("cefaleia", queixas), ["dor"]);
equal(inferComplaintIds("desregulação", queixas), ["comportamento"]);
equal(inferComplaintIds("social", queixas), ["social"], "não transforma social em TEA");
equal(inferComplaintIds("sono e cefaleia", queixas), ["sono", "dor"]);
equal(filterComplaintOptions(queixas, "cefal", []).map(q => q.id), ["dor"]);
equal(filterComplaintOptions(queixas, "inexistente", []).length, 0);
equal(filterComplaintOptions(queixas, "cefal", ["sono"]).map(q => q.id), ["sono", "dor"], "seleção visível sem auto selecionar");
const base = { queixas: ["tea"], ageMonths: 24, respondente: "pais" };
const mchat = allScales.find(s => s.id === "mchat");
assert.ok(mchat);
equal(clinicalHardBlock(mchat, base), null);
for (const age of [15,31,66]) assert.ok(clinicalHardBlock(mchat,{...base,ageMonths:age}));
const denver = allScales.find(s => s.id === "denver");
assert.ok(denver);
for (const extra of [{ageInputInvalid:true}, {ageMonths:NaN}, {ageMonths:Infinity}, {ageMonths:-1},
  {ageBand:{min:48,max:24}}, {ageBand:{min:NaN,max:48}}, {ageBand:{min:0,max:Infinity}}]) {
  const ctx = {...base, respondente:null, ...extra};
  equal(filterScalesIntelligently([mchat,denver],ctx),[]);
  equal(filterScalesWithClinicalRescue([mchat,denver],ctx),[]);
  equal(getBroadbandFallback([mchat,denver],ctx),[], "fallback não contorna idade inválida");
}
for (const ageMeta of [{ageMin:NaN}, {ageMin:-1}, {ageMin:50,ageMax:20}]) assert.ok(clinicalHardBlock({...mchat,...ageMeta},base));
for (const months of [0,15,16,23,24,30,31,47,48,59,60,66,71,72,95,96,143,144,204,215,216]) {
  const results = filterScalesWithClinicalRescue(allScales,{queixas:["tea","sono"],ageMonths:months,respondente:"pais"});
  for (const result of results) {
    assert.ok(result.scale.ageMin <= months && months <= result.scale.ageMax, `${result.scale.id}: vazamento etário em ${months}`);
    checks++;
  }
  for (const catalog of [testesDiretosRecommendations,testesPaisRecommendations]) {
    const results = rankRecommendationsForAgeBand(catalog,["linguagem","tdah"],{min:months,max:months},()=>0);
    for (const result of results) equal(result.ageFit,"full",`complemento pontual ${result.recommendation.id}`);
  }
}
const storeMap = new Map();
const storage = { getItem:k=>storeMap.get(k)??null, setItem:(k,v)=>storeMap.set(k,v), removeItem:k=>storeMap.delete(k) };
const state = {...parseFilterSessionState(null),exactAge:{years:"5",months:"6"},search:"7 anos",selectedQueixas:["sono"]};
saveFilterSessionState(state,storage);
equal(loadFilterSessionState(storage),state,"retorno mantém idade na sessão");
const prefill = applyFilterSessionNavigationPrefill({selectedAge:"2-4a",selectedQueixas:["tea"]},storage);
equal(prefill.exactAge,undefined,"novo perfil limpa idade anterior");
equal(prefill.search,"","novo perfil limpa idade textual anterior");
for (const exactAge of [{years:"abc",months:"0"}, {years:5,months:6}, 25, null, []]) {
  const restored = parseFilterSessionState(JSON.stringify({exactAge}));
  equal(parseExactFilterAge(restored.exactAge).status,"invalid","payload malformado não libera resultado");
}
clearFilterSessionState(storage);
equal(loadFilterSessionState(storage).exactAge,undefined);
const ui = readFileSync("client/src/pages/filtro-engine.tsx","utf8");
assert.doesNotMatch(ui,/inferAgeMonthsFromSearch|ageMonthsFromBand/);
assert.match(ui,/const curatedAgeMonths = filterContext.ageMonths/);
assert.match(ui,/age: resolvedAge.label/);
assert.match(ui,/ageLabel: resolvedAge.label/);
assert.equal((ui.match(/faixasEtarias=\{effectiveAgeOptions\}/g)??[]).length,2);
assert.match(ui,/ageInputInvalid: resolvedAge.status === "invalid"/);
console.log(`[filter-age-complaint] ${checks} verificações: idade exata, busca, catálogo real, fallbacks, complementos e sessão.`);
