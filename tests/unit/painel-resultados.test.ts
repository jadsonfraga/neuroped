/**
 * Item 8 — regras puras do painel de resultados. Dados fictícios.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSUMPTION_DOC_TYPES,
  FEATURE_ACTION_LABELS,
  NOT_MEASURED,
  estimateTimeSaved,
  formatMinutes,
  parseOutcomeWindow,
  rate,
  validateMinutes,
} from "../../shared/outcomes";

test("janela: só 7/30/90, padrão 30", () => {
  assert.equal(parseOutcomeWindow(null), 30);
  assert.equal(parseOutcomeWindow("7"), 7);
  assert.equal(parseOutcomeWindow("90"), 90);
  for (const bad of ["0", "15", "-30", "abc", "30; DROP TABLE"]) assert.equal(parseOutcomeWindow(bad), null, bad);
});

test("tempo economizado: sem premissa não há estimativa; com premissa é documentos × minutos e sempre rotulado", () => {
  const none = estimateTimeSaved({ report: 4, clinical_note: 6 }, {});
  assert.equal(none.totalMinutes, null);
  assert.equal(none.isEstimate, true);
  assert.match(none.premise, /^Estimativa/);
  assert.match(none.premise, /Não é medição/);

  const some = estimateTimeSaved({ report: 4, clinical_note: 6 }, { report: 20 });
  assert.equal(some.totalMinutes, 80, "tipo sem premissa não entra na soma");
  assert.equal(some.perType.find((p) => p.docType === "clinical_note")?.minutes, null);

  const both = estimateTimeSaved({ report: 4, clinical_note: 6 }, { report: 20, clinical_note: 5 });
  assert.equal(both.totalMinutes, 110);
  assert.equal(estimateTimeSaved({}, { report: 20 }).totalMinutes, 0);
  assert.deepEqual([...ASSUMPTION_DOC_TYPES], ["report", "clinical_note"]);
});

test("validação da premissa", () => {
  assert.deepEqual(validateMinutes(15), { ok: true, minutes: 15 });
  assert.deepEqual(validateMinutes(0), { ok: true, minutes: 0 });
  for (const bad of [-1, 241, 1.5, "20", null, NaN]) assert.equal(validateMinutes(bad).ok, false, String(bad));
});

test("taxas e formatação", () => {
  assert.equal(rate(4, 5), 80);
  assert.equal(rate(2, 3), 66.7);
  assert.equal(rate(1, 0), null);
  assert.equal(formatMinutes(45), "45 min");
  assert.equal(formatMinutes(125), "2 h 05 min");
});

test("uso de funcionalidades: allowlist sem ações clínicas sensíveis e painel declara o que não mede", () => {
  for (const key of Object.keys(FEATURE_ACTION_LABELS)) assert.doesNotMatch(key, /audit|login|password|token/i);
  const text = [...Object.values(FEATURE_ACTION_LABELS), ...NOT_MEASURED].join(" ");
  assert.doesNotMatch(text, /risco (baixo|alto|moderado)|nível de|ponto de corte|classificação:/i);
  assert.match(NOT_MEASURED.join(" "), /nunca mostra resultado, corte, nível ou classificação/);
  assert.match(NOT_MEASURED.join(" "), /agenda legada não é separada por clínica/);
});
