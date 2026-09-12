import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { regula20ComputedRows } from "../../client/src/lib/regula20Report";

const row = (answers: unknown[], title: string) => regula20ComputedRows(answers).find((entry) => entry.question === title)!;

test("apuração final inclui médias e soma para os mesmos registros exportados/salvos", () => {
  const answers = Array(20).fill(2);
  const rows = regula20ComputedRows(answers);
  assert.equal(rows.length, 8);
  assert.equal(rows.filter((entry) => entry.question.includes("média descritiva")).length, 4);
  for (const entry of rows.filter((entry) => entry.question.includes("média descritiva"))) assert.match(entry.answer, /2,00\/4/);
  assert.match(row(answers, "Média global descritiva 0–4").answer, /2,00\/4.*20\/20/);
  assert.match(row(answers, "Soma aritmética auxiliar — somente com 20/20 observáveis").answer, /^40\/80/);
});

test("N/O e cobertura insuficiente continuam distintos de zero nos resultados entregues", () => {
  const no = Array(20).fill(5);
  assert.match(row(no, "Média global descritiva 0–4").answer, /Não calculável: 0\/20/);
  assert.match(row(no, "Soma aritmética auxiliar — somente com 20/20 observáveis").answer, /Não calculada/);
  assert.match(row(Array(20).fill(0), "Média global descritiva 0–4").answer, /0,00\/4/);
  assert.match(row([...Array(16).fill(4), ...Array(4).fill(5)], "Média global descritiva 0–4").answer, /4,00\/4.*16\/20/);
  assert.match(row([...Array(15).fill(4), ...Array(5).fill(5)], "Média global descritiva 0–4").answer, /Não calculável: 15\/20/);
  assert.throws(() => regula20ComputedRows([2]), /incompleto/);
});

test("snapshot único contém a apuração e alimenta os dois canais de entrega", () => {
  const ui = readFileSync("client/src/pages/regula20.tsx", "utf8");
  assert.match(ui, /\.\.\.regula20ComputedRows\(answers\)/);
  assert.match(ui, /<ClinicalReport[\s\S]*?items=\{snapshot.responses\}/);
  assert.match(ui, /<SaveToPatient[\s\S]*?responses=\{snapshot.responses\}/);
  assert.match(ui, /instrumentVersion=\{REGULA20_VERSION\}/);
});
