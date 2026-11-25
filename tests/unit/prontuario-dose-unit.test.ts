import assert from "node:assert/strict";
import { test } from "node:test";
import { calcProntuarioMgKg, formatProntuarioWeight, parseProntuarioDoseMg } from "../../client/src/lib/prontuarioDose";

test("massa em mg só é estruturada quando explícita e inequívoca", () => {
  for (const [raw, mg] of [["0,5 mg", 0.5], [" 2MG ", 2], ["0.125 mg", 0.125], ["10.25 mg", 10.25], ["2,125 mg", 2.125], ["0 mg", 0]] as const) {
    assert.equal(parseProntuarioDoseMg(raw), mg, raw);
  }
});
test("volume, faixa, concentração e números ambíguos permanecem apenas no texto original", () => {
  for (const raw of ["5 mL", "5 gotas", "5", "5 mg/mL", "5 mg + 2 mg", "5 mg (à noite)", "10–20 mg", "1/2", "2½ mg", "10 mg/kg", "1.000 mg", "1.000,5 mg", "-1 mg", "1e3 mg", "100001 mg", "1 mg/m²", "500 mcg", "0,5 g"]) {
    assert.equal(parseProntuarioDoseMg(raw), undefined, raw);
  }
});
test("mg/kg exige massa sem ambiguidade e peso positivo no campo kg", () => {
  assert.equal(calcProntuarioMgKg("0,5 mg", "20"), "0.025");
  assert.equal(calcProntuarioMgKg("0,5 mg", "20 kg"), "0.025");
  assert.equal(calcProntuarioMgKg("5 mL", "20"), "—");
  assert.equal(calcProntuarioMgKg("0,001 mg", "20"), "< 0,001");
  for (const weight of ["", "0", "0,0", "-20", "20 lb", "20–25", "1.000", "20 / 25", "20kg?"]) {
    assert.equal(calcProntuarioMgKg("0,5 mg", weight), "—", weight);
  }
});


test("relatório não acrescenta kg a uma unidade já escrita ou diferente", () => {
  assert.equal(formatProntuarioWeight("20"), "20 kg");
  assert.equal(formatProntuarioWeight("20 kg"), "20 kg");
  assert.equal(formatProntuarioWeight("20 lb"), "20 lb");
});
