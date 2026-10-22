import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  isMarcoAnswer,
  nextMarcoAnswer,
  summarizeMarcos,
  type MarcosAnswers,
} from "../../client/src/lib/marcosStatus";

const IDS = ["m1", "m2", "m3", "m4"];

test("ausência de resposta nunca conta como atingido", () => {
  const summary = summarizeMarcos(IDS, {});
  assert.equal(summary.sim, 0);
  assert.equal(summary.semResposta, IDS.length);
});

test("contagens separam sim, ainda não, não sei e sem resposta", () => {
  const answers: MarcosAnswers = { m1: "sim", m2: "ainda-nao", m3: "nao-sei" };
  assert.deepEqual(summarizeMarcos(IDS, answers), {
    total: 4,
    sim: 1,
    aindaNao: 1,
    naoSei: 1,
    semResposta: 1,
  });
});

test("respostas de marcos fora da lista não entram na contagem", () => {
  const summary = summarizeMarcos(["m1"], { m1: "sim", outro: "sim" });
  assert.equal(summary.total, 1);
  assert.equal(summary.sim, 1);
});

test("tocar na opção já escolhida desfaz a resposta; outra opção troca", () => {
  assert.equal(nextMarcoAnswer(undefined, "sim"), "sim");
  assert.equal(nextMarcoAnswer("sim", "sim"), undefined);
  assert.equal(nextMarcoAnswer("sim", "ainda-nao"), "ainda-nao");
});

test("valores fora do conjunto fechado são rejeitados", () => {
  assert.equal(isMarcoAnswer("sim"), true);
  assert.equal(isMarcoAnswer("ainda-nao"), true);
  assert.equal(isMarcoAnswer("nao-sei"), true);
  assert.equal(isMarcoAnswer("atingido"), false);
  assert.equal(isMarcoAnswer(""), false);
  assert.equal(isMarcoAnswer(undefined), false);
});

test("página de marcos não volta a marcar tudo como atingido nem a usar limiar de alerta", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/marcos-desenvolvimento.tsx"), "utf8");
  assert.doesNotMatch(source, /start all checked|Por padrão todos os marcos/i);
  assert.doesNotMatch(source, /missed\s*>=\s*4|maxDomainMissed\s*>=\s*2|2 ou mais marcos/);
  assert.doesNotMatch(source, /encaminhar para avaliação especializada/i);
  assert.doesNotMatch(source, /summary\.aindaNao\s*(>=?|<=?|!==?|===?)/, "nenhum alerta condicional por contagem de 'ainda não'");
});
