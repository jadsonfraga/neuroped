import assert from "node:assert/strict";
import { allScales, faixasEtarias } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { filterScalesWithClinicalRescue, type FilterContext } from "../../client/src/data/advancedFilterLogic.ts";
import { computeFilterFacetCounts, diagnoseEmptyResult, withinTimeBudget, TIME_BUCKETS } from "../../client/src/lib/filterDiagnostics.ts";

const catalog = mergeFilterableCatalog(allScales);
const respondentes = ["teste_direto_crianca", "pais", "professor", "clinico"] as const;
const base: FilterContext = { queixas: ["tdah"], ageMonths: 84, ageBand: null, respondente: null, isVerbal: null, isLiterate: null, assessmentUse: null, selectedSignals: [] };
const realCount = (ctx: FilterContext) => filterScalesWithClinicalRescue([...catalog], ctx).filter((m) => !m.isBroadbandFallback).length;

// Contagens por faceta = exatamente o que o motor devolveria ao escolher a opção.
const counts = computeFilterFacetCounts(catalog, base, { respondentes, faixas: faixasEtarias });
for (const r of respondentes) {
  assert.equal(counts.respondente[r], realCount({ ...base, respondente: r }), `contagem respondente ${r}`);
}
for (const band of faixasEtarias) {
  const expected = realCount({ ...base, ageMonths: Math.round((band.min + band.max) / 2), ageBand: { min: band.min, max: band.max } });
  assert.equal(counts.faixa[band.id], expected, `contagem faixa ${band.id}`);
}
assert.equal(counts.finalidade.monitoring, realCount({ ...base, assessmentUse: "monitorizacao" }));
assert.equal(counts.comunicacao.nonverbal, realCount({ ...base, isVerbal: false }));
assert.equal(counts.alfabetizacao.preliterate, realCount({ ...base, isLiterate: false }));
assert.ok(counts.tempo["5"] <= counts.tempo["10"] && counts.tempo["10"] <= counts.tempo["45"], "orçamento maior nunca reduz a contagem");
assert.ok(counts.respondente.professor > 0, "TDAH 7 anos tem escala de professor");

// Orçamento de tempo: tempo ilegível permanece (fail-open visível), tempo lido acima do limite sai.
assert.equal(withinTimeBudget({ tempo: "Não aferido" }, 5), true);
assert.equal(withinTimeBudget({ tempo: "10–15 min" }, 5), false);
assert.equal(withinTimeBudget({ tempo: "5 min" }, 5), true);
assert.equal(withinTimeBudget({ tempo: "20 min" }, null), true);
assert.deepEqual(TIME_BUCKETS.map((b) => b.minutes), [5, 10, 20, 45]);

// Diagnóstico do vazio: cada dica reflete o motor e nunca sugere relaxar segurança.
const emptyCtx: FilterContext = { ...base, queixas: ["sono"], respondente: "professor" };
assert.equal(realCount(emptyCtx), 0, "cenário-base: sono + professor é vazio (contrato do teste de segurança)");
const diag = diagnoseEmptyResult(catalog, emptyCtx, { respondentLabel: (id) => id });
assert.equal(diag.acuteRisk, false);
const respHint = diag.hints.find((h) => h.dimension === "respondente");
assert.ok(respHint, "sugere revisar o respondente");
assert.equal(respHint!.countIfRelaxed, realCount({ ...emptyCtx, respondente: null }));
assert.ok(diag.hints.every((h) => h.countIfRelaxed > 0), "só dicas que trazem resultado");
assert.ok(diag.hints.every((h, i, arr) => i === 0 || arr[i - 1].countIfRelaxed >= h.countIfRelaxed), "ordenado por ganho");

// Risco agudo: sem dicas de relaxamento (saída clínica válida).
const acute = diagnoseEmptyResult(catalog, { ...base, queixas: ["suicidio"], ageMonths: 3 });
assert.equal(acute.acuteRisk, true);
assert.deepEqual(acute.hints, []);

// Idade inválida: nada a relaxar.
const invalid = diagnoseEmptyResult(catalog, { ...base, ageInputInvalid: true });
assert.equal(invalid.invalidAge, true);
assert.deepEqual(invalid.hints, []);

// Bloqueio de segurança aparece nomeado e não vira dica clicável.
const selfReport = diagnoseEmptyResult(catalog, { ...base, queixas: ["depressao"], ageMonths: 84, respondente: "autoaplicavel" });
assert.ok(selfReport.safetyBlocked.some((b) => b.reason.startsWith("Autoaplicável requer")), JSON.stringify(selfReport.safetyBlocked));
assert.ok(!selfReport.hints.some((h) => /≥/.test(h.label)), "bloqueio por idade mínima nunca vira dica");

// Múltiplas queixas: dica "só a queixa X" com contagem real.
const multi = diagnoseEmptyResult(catalog, { ...base, queixas: ["enurese", "tiques"], ageMonths: 30, respondente: "professor" });
for (const hint of multi.hints.filter((h) => h.dimension === "queixa")) {
  assert.equal(hint.countIfRelaxed, realCount({ ...base, queixas: [hint.keepQueixa!], ageMonths: 30, respondente: "professor" }));
}
console.log("✓ diagnóstico do filtro: contagens por faceta e dicas de vazio fiéis ao motor, segurança não relaxável");
