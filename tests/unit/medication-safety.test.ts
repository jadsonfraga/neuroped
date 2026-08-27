import assert from "node:assert/strict";
import { calculateMedicationSafety } from "../../shared/medicationSafety";

const base = {
  weightKg: 20,
  doseMgPerKgDay: 10,
  maxMgDay: 150,
  frequencyPerDay: 2,
  concentrationMgPerMl: 50,
  activeIngredient: "substância-a",
  source: "fixture sintética: protocolo configurável de teste",
};

const normal = calculateMedicationSafety(base);
assert.equal(normal.ok, true);
assert.equal(normal.dailyMg, 200);
assert.equal(normal.cappedDailyMg, 150);
assert.equal(normal.doseMg, 75);
assert.equal(normal.volumeMl, 1.5);
assert.match(normal.formula, /mg\/kg\/dia/);

const capped = calculateMedicationSafety({ ...base, weightKg: 20, doseMgPerKgDay: 20 });
assert.equal(capped.cappedDailyMg, 150);
assert.ok(capped.warnings.includes("limite_configuravel_aplicado"));

const missing = calculateMedicationSafety({ ...base, frequencyPerDay: 0 });
assert.equal(missing.ok, false);
assert.ok(missing.missingData.includes("frequencia_diaria_valida"));
assert.equal(missing.dailyMg, null);

const duplicate = calculateMedicationSafety({ ...base, currentActiveIngredients: ["Substância-A"] });
assert.equal(duplicate.ok, false);
assert.equal(duplicate.duplicateActiveIngredient, true);

const allergy = calculateMedicationSafety({ ...base, recordedAllergies: ["substância-a"] });
assert.equal(allergy.ok, false);
assert.equal(allergy.allergyMatch, true);

const extreme = calculateMedicationSafety({ ...base, weightKg: 301 });
assert.equal(extreme.ok, false);
assert.ok(extreme.missingData.includes("peso_kilogramas_valido"));

const noConcentration = calculateMedicationSafety({ ...base, concentrationMgPerMl: undefined });
assert.equal(noConcentration.volumeMl, null);
assert.ok(noConcentration.missingData.includes("concentracao_para_volume"));

console.log("medication safety: fórmulas, limites, unidades, duplicidade e alertas determinísticos aprovados");
