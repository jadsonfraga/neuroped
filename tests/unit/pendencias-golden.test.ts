// Congelamento do comportamento clínico (cortes, escores, sinais, estimativas) dos dois módulos.
// Se falhar, a mudança alterou resultado clínico: exija justificativa do médico e regere o fixture com
// `node --import tsx tests/tools/gen-golden-pendencias.ts`, revisando o diff do JSON no PR.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gameFingerprint, icedFingerprint, superFingerprint } from "../tools/golden-pendencias";

const golden = JSON.parse(readFileSync(new URL("../fixtures/golden-pendencias.json", import.meta.url), "utf8"));

test("golden Super NeuroPad: cortes, níveis por mundo/total e tempo estimado, idade por idade", () => {
  const now = superFingerprint();
  assert.deepEqual(now.cuts, golden.super.cuts);
  assert.deepEqual(now.levels, golden.super.levels);
  assert.deepEqual(now.minutes, golden.super.minutes);
});

test("golden Super NeuroPad: níveis por domínio (2–3 anos)", () => {
  assert.deepEqual(superFingerprint().domains, golden.super.domains);
});

test("golden ICED-8: 4000 combinações determinísticas dão o mesmo escore, faixa e núcleo", () => {
  const now = icedFingerprint();
  assert.equal(now.count, golden.iced.count);
  assert.deepEqual(now.sample, golden.iced.sample);
  assert.equal(now.hash, golden.iced.hash);
});

test("golden Jogo de dislexia: resumo roteirizado e estimativa de sessão por faixa", () => {
  assert.deepEqual(gameFingerprint(), golden.game);
});
