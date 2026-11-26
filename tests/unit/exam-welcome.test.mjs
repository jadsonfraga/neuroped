import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../client/src/", import.meta.url);
const source = path => readFileSync(new URL(path, root), "utf8");

test("cada faixa existente tem acolhimento apropriado; faixa inválida nunca exibe cartão à criança", async () => {
  let module;
  try { module = await import("../../client/src/lib/examWelcome.ts"); }
  catch (error) { if (error.code !== "ERR_MODULE_NOT_FOUND") throw error; }
  assert.ok(module, "falta a política da abertura por idade");
  const { examBands } = await import("../../client/src/data/exame-por-idade.ts");
  const { bands } = await import("../../client/src/data/observacaoSocial.ts");
  const expected = ["presencial", "infantil", "escolar", "adolescente"];
  for (const label of [...examBands.map(x => x.age), ...bands.map(x => x[0])]) {
    assert.ok(expected.includes(module.welcomeProfile(label)), label);
  }
  for (const [label, profile] of [
    ["Nascimento a 27 dias", "presencial"], ["18–23 meses", "presencial"], ["24–29 meses", "infantil"],
    ["5 anos", "infantil"], ["6 a 8 anos", "escolar"], ["11 anos", "escolar"],
    ["12 a 14 anos", "adolescente"], ["19 anos", "adolescente"], ["desconhecida", "presencial"],
    ["24–999 meses", "presencial"], ["30 anos", "presencial"],
  ]) assert.equal(module.welcomeProfile(label), profile, label);
});

test("a mesma apresentação opcional está nas três superfícies sem aceitar dados de resposta", () => {
  for (const path of ["pages/exame-por-idade.tsx", "pages/exame-via-assistente.tsx", "components/observacao-social/ObservacaoSocial.tsx"]) {
    assert.match(source(path), /<ExamWelcome ageLabel=\{[^}]+\}\s*\/>/, path);
  }
  const view = source("components/ExamWelcome.tsx");
  assert.doesNotMatch(view, /fetch\(|localStorage|sessionStorage|setTimeout|setInterval|<(?:input|textarea|audio|video)\b/);
});
