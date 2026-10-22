/**
 * Lapidação de Medicamentos, Calculadora, Farmacologia e diários.
 *
 * Trava os defeitos encontrados na auditoria de 17/10/2026:
 *  - Clonazepam em gotas saía em mL (25 vezes maior);
 *  - doses abaixo de 0,05 mg saíam "0,0";
 *  - "1x/dia ou 12/12h" dividia por 2 sem dizer;
 *  - peso fora da faixa calculava e mandava "usar dose máxima";
 *  - campo vazio entrava como 0 na tendência e a ordem seguia o cadastro;
 *  - "142 fármacos" contava entradas por indicação, não fármacos.
 *
 * Nenhum valor de referência clínico muda aqui.
 *
 * Rodar: node --import tsx tests/unit/medicamentos-lapidacao.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  calcResult,
  formatDose,
  intakeSchedules,
  liquidUnitLabel,
  medications,
  parseWeight,
} from "../../client/src/lib/calculadoraDose";
import { sortClinicalAsc, sortClinicalDesc } from "../../client/src/lib/diaryOrder";
import { pharmCategories } from "../../client/src/data/farmacologia";
import { appMetrics } from "../../client/src/data/appMetrics";

const med = (name: string) => {
  const found = medications.find((m) => m.name === name);
  assert.ok(found, name);
  return found;
};

// ── Peso ────────────────────────────────────────────────────────────────────
assert.deepEqual(parseWeight("25"), { ok: true, kg: 25 });
assert.deepEqual(parseWeight(" 25,5 "), { ok: true, kg: 25.5 }, "vírgula decimal");
assert.deepEqual(parseWeight(""), { ok: false, reason: "vazio" });
assert.deepEqual(parseWeight("0"), { ok: false, reason: "invalido" });
assert.deepEqual(parseWeight("-3"), { ok: false, reason: "invalido" });
assert.deepEqual(parseWeight("abc"), { ok: false, reason: "invalido" });
assert.deepEqual(parseWeight("1500"), { ok: false, reason: "fora_da_faixa" }, "peso digitado errado não calcula");
assert.deepEqual(parseWeight("150"), { ok: true, kg: 150 });

// ── Formatação ──────────────────────────────────────────────────────────────
assert.equal(formatDose(0.08), "0,08");
assert.equal(formatDose(0.08 / 3), "0,027", "tomada de clonidina aos 20 kg não some");
assert.equal(formatDose(0.05), "0,05");
assert.equal(formatDose(3.3333), "3,33");
assert.equal(formatDose(36), "36");
assert.equal(formatDose(57.6), "57,6");
assert.equal(formatDose(45000), "45.000");
assert.equal(formatDose(0), "0");
assert.equal(formatDose(Number.NaN), "—");

// ── Frequência → tomadas ────────────────────────────────────────────────────
const times = (frequency: string) => intakeSchedules(frequency).map((s) => s.timesPerDay);
assert.deepEqual(times("8/8h ou 12/12h"), [3, 2]);
assert.deepEqual(times("12/12h ou 8/8h"), [2, 3]);
assert.deepEqual(times("1x/dia ou 12/12h"), [1, 2], "a primeira opção não é mais ignorada");
assert.deepEqual(times("1x/dia (noite) ou 12/12h"), [1, 2]);
assert.deepEqual(times("12/12h"), [2]);
assert.deepEqual(times("8/8h"), [3]);
assert.deepEqual(times("1x/dia"), [1]);
assert.deepEqual(times("dose única (emergência)"), [1]);
assert.deepEqual(times("30 min antes de dormir"), [1]);
for (const m of medications) {
  for (const s of intakeSchedules(m.frequency)) {
    assert.ok(Number.isInteger(s.timesPerDay) && s.timesPerDay >= 1 && s.timesPerDay <= 4, `${m.name}: ${s.label}`);
  }
}

// ── Cálculo ─────────────────────────────────────────────────────────────────
{
  const r = calcResult(20, med("Clonazepam"));
  assert.ok(r);
  assert.equal(r.dailyDose, 1);
  const tid = r.intakes[0];
  assert.equal(tid.timesPerDay, 3);
  assert.ok(Math.abs((tid.volumePerIntake ?? 0) - 3.333) < 0.01, "volume em gotas, não 3,3 mL de 0,1 mg/mL");
  assert.equal(med("Clonazepam").liquid?.unit, "gota");
  assert.equal(liquidUnitLabel("gota", 3.33), "gotas");
  assert.equal(liquidUnitLabel("gota", 1), "gota");
}
{
  const r = calcResult(30, med("Atomoxetina"));
  assert.ok(r);
  assert.equal(r.cappedDailyDose, 36);
  assert.deepEqual(r.intakes.map((i) => [i.label, i.dosePerIntake]), [["1x/dia", 36], ["12/12h", 18]]);
}
{
  const r = calcResult(5, med("Haloperidol"));
  assert.ok(r);
  assert.equal(formatDose(r.cappedDailyDose), "0,1");
  assert.equal(formatDose(r.intakes[0].dosePerIntake), "0,05", "a tomada não aparece igual à dose diária");
}
{
  const r = calcResult(150, med("Levetiracetam"));
  assert.ok(r);
  assert.equal(r.exceedsMax, true);
  assert.equal(r.cappedDailyDose, 3000);
}
assert.equal(calcResult(20, med("Melatonina")), null, "dose fixa não calcula por peso");
// Tetos alinhados à Farmacologia por decisão do responsável clínico (22/10/2026).
assert.equal(med("Aripiprazol").maxDose, 15);
assert.equal(med("Amitriptilina").maxDose, 50);
{
  const r = calcResult(200, med("Aripiprazol"));
  assert.ok(r && r.exceedsMax && r.cappedDailyDose === 15);
  const a = calcResult(120, med("Amitriptilina"));
  assert.ok(a && a.exceedsMax && a.cappedDailyDose === 50);
}
for (const m of medications) {
  if (!m.liquid) continue;
  assert.ok(m.liquid.mgPer > 0, m.name);
  if (m.liquid.unit === "gota") assert.match(m.form, /gotas/, `${m.name}: unidade gota exige apresentação em gotas`);
}

// ── Diários: ordem do evento, não do cadastro ───────────────────────────────
{
  const entries = [
    { id: "a", date: "2026-10-10", createdAt: 300 },
    { id: "b", date: "2026-10-01", createdAt: 400 }, // retroativo, cadastrado por último
    { id: "c", date: "2026-10-10", createdAt: 100 },
    { id: "d", date: "2026-10-12", time: "08:00", createdAt: 50 },
    { id: "e", date: "2026-10-12", time: "21:30", createdAt: 10 },
  ];
  assert.deepEqual(sortClinicalDesc(entries).map((e) => e.id), ["e", "d", "a", "c", "b"]);
  assert.deepEqual(sortClinicalAsc(entries).map((e) => e.id), ["b", "c", "a", "d", "e"]);
}

// ── Contagem da Farmacologia ────────────────────────────────────────────────
{
  const entries = pharmCategories.reduce((sum, c) => sum + c.drugs.length, 0);
  const norm = (n: string) => n.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const distinct = new Set(pharmCategories.flatMap((c) => c.drugs.map((d) => norm(d.name)))).size;
  assert.equal(appMetrics.medicationCount, entries, "entradas por indicação");
  assert.equal(appMetrics.medicationDistinctCount, distinct, "fármacos distintos");
  assert.equal(appMetrics.medicationCategoryCount, pharmCategories.length);
  assert.ok(distinct < entries);
}

// ── Contratos das páginas ───────────────────────────────────────────────────
{
  const page = readFileSync("client/src/pages/calculadora-dose.tsx", "utf8");
  assert.doesNotMatch(page, /toFixed\(/, "a calculadora formata com formatDose (pt-BR, precisão proporcional)");
  assert.match(page, /parseWeight\(/);
  assert.match(page, /data-testid="dose-near-max"/, "acima de 85% do máximo tem texto, não só cor");
  assert.match(page, /role="listbox"/);

  const diario = readFileSync("client/src/components/DiarioClinico.tsx", "utf8");
  assert.match(diario, /String\(e\[trendField\.key\]\)\.trim\(\) !== ""/, "campo vazio fica fora da tendência");
  assert.match(diario, /sortClinicalDesc\(entries\)/);

  for (const file of ["client/src/pages/epilepsy-diary.tsx", "client/src/pages/headache-calendar.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /"Triggers"|Triggers:/, `${file}: rótulo em português`);
    assert.match(source, /"Desencadeantes"/);
    assert.match(source, /sortClinicalDesc\(\[current, \.\.\.previous\]\)/);
    assert.match(source, /Observações: \{e\.notes\}/, `${file}: observações aparecem na lista`);
  }
  const cefaleia = readFileSync("client/src/pages/headache-calendar.tsx", "utf8");
  assert.match(cefaleia, /<Checkbox id="headache-aura"/);
  assert.match(cefaleia, /<Label htmlFor="headache-aura"/);
  assert.match(cefaleia, /aria-labelledby="headache-intensity-label"/);
  assert.doesNotMatch(cefaleia, /\{e\.medication\} — \{e\.relief\}/, "sem travessão solto quando não há alívio");

  const farmaco = readFileSync("client/src/pages/farmacologia.tsx", "utf8");
  assert.match(farmaco, /aria-label="Limpar busca"/);
}

console.log("✓ medicamentos: gotas, precisão, tomadas por esquema, peso validado, diários em ordem clínica e contagem real de fármacos");
