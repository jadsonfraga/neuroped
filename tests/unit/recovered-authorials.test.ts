import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { allScales } from "../../client/src/data/scaleFilter";
import { mergeFilterableCatalog, EXPLICIT_AUTHORIAL_FILTER_IDS } from "../../client/src/data/filterableCatalog";
import { mergeFilterableCatalog as legacy } from "../../client/src/data/filterableCatalogBase";
import { recoveredAuthorialMonitors as defs, unresolvedAuthorialSources, type RecoveredMonitor } from "../../client/src/data/recoveredAuthorialMonitors";
import { pendingAuthorialScaleIntakes } from "../../client/src/data/pendingAuthorialScaleIntake";
import { monitorWithClinicalDetails } from "../../client/src/data/recoveredMonitorDetails";
import { calculateRecoveredMonitor, monitorComputedRows, monitorEligibility, monitorItemCount, monitorSafetyState, planRecoveredMonitors, type MonitorSelectionInput } from "../../client/src/lib/recoveredAuthorialLogic";
import { recommendPreConsultaScales } from "../../client/src/lib/preConsultaCore";
import { previsitUpperMinutes } from "../../client/src/lib/preConsultaSafeRanking";
import { getApplicationMode, isPsychosisInstrument, isSuicideInstrument } from "../../client/src/data/advancedFilterLogic";

const get = (id: string) => defs.find((d) => d.id === id)!;
const defaults: MonitorSelectionInput = { ageMonths: 96, respondent: "pais", contexts: ["casa"], purpose: "basal", focuses: ["autonomia"], itemBudget: 20, observed: true, urgent: "nao" };
const expected: Record<string, { count: number; hash: string }> = {
  "adapta-18-sdg": { count: 18, hash: "sha256:f7e60132b7282fca9371bed5d1993b2f67140f60e315bf6e43a4d96b11696c30" },
  "porta-20-sdg": { count: 20, hash: "sha256:bec60508e402dadd1e8882c2805fac90610aaea8f6222a7e3a233c748401dfa0" },
  "ticar-18-sdg": { count: 18, hash: "sha256:87b60cea6743744f044b9958c59ce8766bcae918c530881f16acfa3a2242a3b1" },
  "ponte-16-sdg": { count: 16, hash: "sha256:91077e285d4fab6ae205dd5a1af50fdd46c27ea0a0b3cce3f318de3274e6840c" },
  "rota-aut-18-sdg": { count: 18, hash: "sha256:a8ddfaabe2c0ebf08d39a2634d0f14ddfb7b0e273102a0f880c5e2cb97526ea8" },
  "ritmo-sono-20-sdg": { count: 20, hash: "sha256:84ba209c3311613742ddfe7b78933cf3ad4343a4a13832c24b9226b66ead6387" },
};
for (const d of defs) {
  test(`${d.id}: enunciados íntegros e contrato da fonte explícito`, () => {
    const items = d.domains.flatMap((v) => v.items);
    assert.equal(items.length, expected[d.id].count);
    assert.equal(`sha256:${createHash("sha256").update(JSON.stringify(items)).digest("hex")}`, expected[d.id].hash);
    assert.ok(d.source && d.sourceNote && d.version);
    assert.equal(d.labels.length, d.maxPoint + 2);
    assert.equal(allScales.filter((s) => s.id === d.id).length, 1);
    assert.ok(allScales.find((s) => s.id === d.id)!.appRoute!.startsWith("/filtro?autoral=acervo&instrumento="));
  });
  test(`${d.id}: zero, máximo, N/O, lacunas e entradas inválidas`, () => {
    const n = monitorItemCount(d);
    assert.equal(calculateRecoveredMonitor(d, Array(n).fill(0)).total, 0);
    assert.equal(calculateRecoveredMonitor(d, Array(n).fill(d.maxPoint)).total, d.metric === "mean" ? d.maxPoint : 100);
    const no = calculateRecoveredMonitor(d, Array(n).fill(d.maxPoint + 1));
    assert.equal(no.complete, true); assert.equal(no.valid, 0); assert.equal(no.total, null); assert.equal(no.rawTotal, null);
    no.domains.forEach((v) => assert.equal(v.value, null));
    const partial = Array(n); partial[n - 1] = 0;
    assert.equal(calculateRecoveredMonitor(d, partial).complete, false);
    assert.equal(calculateRecoveredMonitor(d, partial).total, null);
    assert.throws(() => monitorComputedRows(d, partial), /incompleto/);
    for (const bad of [NaN, -1, d.maxPoint + 2, 1.5, null, true, "0"]) assert.throws(() => calculateRecoveredMonitor(d, [bad]), /inválidas/);
    assert.throws(() => calculateRecoveredMonitor(d, Array(n + 1).fill(0)), /inválidas/);
    const rows = monitorComputedRows(d, Array(n).fill(d.maxPoint));
    assert.ok(rows.some((v) => v.question === "Direção e limites"));
    assert.match(rows.at(-1)!.answer, /Não usar para classificar/);
  });
}

test("cada requisito clínico bloqueia isoladamente a seleção", () => {
  const d = get("rota-aut-18-sdg");
  assert.equal(monitorEligibility(d, defaults), null);
  for (const ageMonths of [-1, 0, 47, 216, NaN, Infinity, 96.5]) assert.notEqual(monitorEligibility(d, { ...defaults, ageMonths }), null);
  for (const ageMonths of [48, 215]) assert.equal(monitorEligibility(d, { ...defaults, ageMonths }), null);
  for (const change of [{ purpose: "diagnostico" }, { purpose: "" }, { respondent: "adolescente" }, { respondent: "secretaria" }, { observed: false }, { urgent: "sim" }, { urgent: "incerto" }, { contexts: [] }, { contexts: ["casa", "escola"] }, { focuses: ["sono"] }]) assert.notEqual(monitorEligibility(d, { ...defaults, ...change }), null);
});

test("não trocar escola por pais nem noites por relato do professor", () => {
  const school = get("porta-20-sdg");
  assert.equal(monitorEligibility(school, { ...defaults, respondent: "professor", contexts: ["escola"], focuses: ["participacao-escolar"], ageMonths: 131 }), null);
  assert.notEqual(monitorEligibility(school, { ...defaults, focuses: ["participacao-escolar"] }), null);
  assert.notEqual(monitorEligibility(school, { ...defaults, respondent: "professor", contexts: ["escola"], focuses: ["participacao-escolar"], ageMonths: 132 }), null);
  assert.notEqual(monitorEligibility(get("ritmo-sono-20-sdg"), { ...defaults, respondent: "professor", contexts: ["escola"], focuses: ["sono"] }), null);
  assert.equal(monitorEligibility(get("ponte-16-sdg"), { ...defaults, contexts: ["casa", "escola"], focuses: ["generalizacao"] }), null);
  assert.notEqual(monitorEligibility(get("ponte-16-sdg"), { ...defaults, contexts: ["casa", "casa"], focuses: ["generalizacao"] }), null);
});

test("cobertura mínima e direção respeitam cada versão, não um escore genérico", () => {
  const d = get("porta-20-sdg");
  assert.equal(calculateRecoveredMonitor(d, [...Array(16).fill(3), ...Array(4).fill(4)]).total, 3);
  assert.equal(calculateRecoveredMonitor(d, [...Array(15).fill(3), ...Array(5).fill(4)]).total, null);
  const rota = get("rota-aut-18-sdg");
  const a = [...Array(2).fill(4), ...Array(16).fill(5)];
  assert.equal(calculateRecoveredMonitor(rota, a).domains[0].value, null);
  a[2] = 4;
  assert.equal(calculateRecoveredMonitor(rota, a).domains[0].value, 100);
  assert.equal(rota.direction, "higher_better");
  assert.equal(get("ponte-16-sdg").direction, "higher_better");
  assert.equal(get("ritmo-sono-20-sdg").direction, "higher_worse");
});

test("alerta persiste independentemente da pontuação, incluindo incerteza", () => {
  for (const raw of defs) {
    const d = monitorWithClinicalDetails(raw);
    assert.equal(monitorSafetyState(d, Array(d.redFlags.length).fill("nao")).needsReview, false);
    for (const flag of ["sim", "incerto"]) assert.equal(monitorSafetyState(d, [flag, ...Array(d.redFlags.length - 1).fill("nao")]).needsReview, true);
    assert.equal(monitorSafetyState(d, Array(d.redFlags.length)).complete, false);
  }
  assert.equal(monitorWithClinicalDetails(get("rota-aut-18-sdg")).redFlags.length, 7);
});

test("planejamento segue prioridades, teto de itens e não repete aplicações", () => {
  const p = planRecoveredMonitors({ ...defaults, focuses: ["autonomia", "sono", "tiques"], itemBudget: 40 });
  assert.deepEqual(p.map((v) => v.definition.id), ["rota-aut-18-sdg", "ritmo-sono-20-sdg"]);
  assert.ok(p.reduce((n, v) => n + v.itemCount, 0) <= 40);
  assert.equal(planRecoveredMonitors({ ...defaults, focuses: ["autonomia", "sono"], itemBudget: 20 }).length, 1);
  assert.equal(planRecoveredMonitors({ ...defaults, alreadySelected: ["rota-aut-18-sdg"] }).length, 0);
  assert.equal(planRecoveredMonitors({ ...defaults, focuses: ["transicoes"], alreadySelected: ["regula-20-sdg"] }).length, 0);
  for (const change of [{ itemBudget: 19 }, { focuses: [] }, { focuses: ["inexistente"] }, { urgent: "sim" }]) assert.equal(planRecoveredMonitors({ ...defaults, ...change }).length, 0);
});

test("registro único e fonte ausente bloqueada; o catálogo anterior não é recriado", () => {
  assert.equal(defs.length, 6);
  assert.equal(new Set(allScales.map((s) => s.id)).size, allScales.length);
  assert.equal(allScales.filter((s) => s.id === "regula-20-sdg").length, 1);
  const missing = [...pendingAuthorialScaleIntakes, ...unresolvedAuthorialSources];
  assert.equal(new Set(missing.map((d) => d.id)).size, 5);
  for (const pending of missing) assert.equal(allScales.some((s) => s.id === pending.id), false);
  assert.deepEqual(mergeFilterableCatalog(allScales), legacy(allScales.filter((s) => !EXPLICIT_AUTHORIAL_FILTER_IDS.has(s.id))));
});

test("pré-consulta aplica idade/observador/rota completos antes de qualquer ranking", () => {
  for (const idadeMeses of [12, 36, 60, 96, 156, 215]) for (const queixa of ["tea", "tdah", "sono", "comportamento", "linguagem"]) {
    const rows = recommendPreConsultaScales({ idadeMeses, queixa, respondente: "pais", contexto: "primeira-consulta" });
    const primary = rows.filter((r) => r.label !== "Questionário escolar" && r.scale);
    assert.ok(primary.length <= 1);
    for (const row of primary) {
      const s = row.scale!;
      assert.ok(idadeMeses >= s.ageMin && idadeMeses <= s.ageMax);
      assert.ok(s.respondente.includes("pais"));
      assert.equal(getApplicationMode(s), "questionario_pais");
      assert.equal(isSuicideInstrument(s) || isPsychosisInstrument(s), false);
      assert.ok(s.queixas.includes(queixa));
      assert.ok(previsitUpperMinutes(s)! <= 15);
    }
  }
  const sourceInput = { idadeMeses: 96, queixa: "sono-funcional", respondente: "pais" as const, contexto: "retorno" as const };
  assert.equal(recommendPreConsultaScales(sourceInput)[0].scale?.id, "ritmo-sono-20-sdg");
  assert.equal(recommendPreConsultaScales({ ...sourceInput, respondente: "professor" })[0].scale, undefined);
  assert.equal(recommendPreConsultaScales({ ...sourceInput, idadeMeses: 12 })[0].scale, undefined);
});
