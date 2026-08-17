import assert from "node:assert/strict";
import { calcDoseResult, getTimesPerDay, type MedDose } from "../../client/src/lib/doseCalculator.ts";

// getTimesPerDay — frequências simples.
assert.equal(getTimesPerDay("8/8h"), 3, "8/8h isolado = 3x/dia");
assert.equal(getTimesPerDay("12/12h"), 2, "12/12h isolado = 2x/dia");
assert.equal(getTimesPerDay("1x/dia"), 1, "1x/dia = 1x/dia");
assert.equal(getTimesPerDay("dose única (emergência)"), 1, "dose única cai no padrão 1x/dia");

// Frequências ambíguas ("X ou Y") devem seguir a opção citada primeiro no
// rótulo, para que "Por tomada" bata com o que a badge da UI exibe.
// Regressão: o cálculo antigo sempre priorizava 8/8h, ignorando a ordem do
// texto — isso fazia Carbamazepina, Valproato, Quetiapina, Periciazina, NAC,
// Pregabalina e Nitrazepam (todos "12/12h ou 8/8h") exibirem "Por tomada"
// calculado para 3x/dia mesmo com a badge lendo "12/12h" primeiro.
assert.equal(getTimesPerDay("12/12h ou 8/8h"), 2, "12/12h citado primeiro => 2x/dia");
assert.equal(getTimesPerDay("8/8h ou 12/12h"), 3, "8/8h citado primeiro => 3x/dia");
assert.equal(getTimesPerDay("1x/dia ou 12/12h"), 2, "1x/dia ou 12/12h => 2x/dia (só 12/12h reconhecido)");
assert.equal(getTimesPerDay("1x/dia (noite) ou 12/12h"), 2, "variante com sufixo (noite)");

// calcDoseResult — dose fixa não é calculada por peso.
const fixedDoseMed: MedDose = {
  name: "Melatonina",
  indication: "Sono",
  dosePerKg: 0,
  maxDose: 5,
  frequency: "30 min antes de dormir",
  form: "comprimido",
  notes: "",
  fixedDose: "0,5-5mg fixo (não por peso)",
};
assert.equal(calcDoseResult(20, fixedDoseMed), null, "medicação de dose fixa não calcula por peso");

// calcDoseResult — dose por peso, sem exceder o teto.
const metilfenidato: MedDose = {
  name: "Metilfenidato",
  indication: "TDAH",
  dosePerKg: 1,
  maxDose: 60,
  frequency: "8/8h ou 12/12h",
  form: "comprimido",
  notes: "",
};
const r1 = calcDoseResult(20, metilfenidato)!;
assert.equal(r1.dailyDose, 20, "20kg x 1mg/kg = 20mg/dia");
assert.equal(r1.cappedDailyDose, 20, "abaixo do teto, sem corte");
assert.equal(r1.timesPerDay, 3, "8/8h citado primeiro => 3x/dia");
assert.equal(r1.dosePerIntake, 20 / 3, "20mg / 3 tomadas");
assert.equal(r1.exceedsMax, false, "não excede o teto de 60mg/dia");
assert.equal(r1.nearMax, false, "20mg está longe do teto");

// calcDoseResult — dose que excede o teto é limitada (cap) e sinalizada.
const carbamazepina: MedDose = {
  name: "Carbamazepina",
  indication: "Epilepsia",
  dosePerKg: 15,
  maxDose: 1200,
  frequency: "12/12h ou 8/8h",
  liquidConc: 20,
  form: "comprimido",
  notes: "",
};
const r2 = calcDoseResult(100, carbamazepina)!; // 100kg x 15mg/kg = 1500mg/dia > teto 1200mg
assert.equal(r2.dailyDose, 1500, "dose bruta calculada sem corte");
assert.equal(r2.cappedDailyDose, 1200, "dose a usar é limitada ao teto");
assert.equal(r2.exceedsMax, true, "sinaliza que a dose calculada excede o teto");
assert.equal(r2.timesPerDay, 2, "12/12h citado primeiro => 2x/dia (não 3x)");
assert.equal(r2.dosePerIntake, 600, "por tomada usa a dose JÁ limitada ao teto (1200/2), nunca a bruta");
assert.ok(r2.dosePerIntake * r2.timesPerDay <= r2.cappedDailyDose + 1e-9, "soma das tomadas nunca excede o teto diário");

// calcDoseResult — volume líquido é derivado da dose por tomada já limitada.
const r3 = calcDoseResult(100, carbamazepina)!;
assert.equal(r3.volumePerIntake, 600 / 20, "volume = dose por tomada / concentração");

// calcDoseResult — peso zero/negativo não deve ser chamado pela UI, mas a
// função em si não deve devolver valores negativos "válidos" silenciosamente.
const r4 = calcDoseResult(0, metilfenidato)!;
assert.equal(r4.dailyDose, 0, "peso 0 = dose 0 (a UI barra esse caso antes de calcular)");

console.log("[dose-calculator] ✓ getTimesPerDay/calcDoseResult — todos os casos passaram.");
