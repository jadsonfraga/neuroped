import test from "node:test";
import assert from "node:assert/strict";
import { buildVisualSearchBoard, visualSearchProfile } from "../../client/src/features/super-neuropad/visualSearch";
import { bandItemCount, recordTouch, type TouchItem } from "../../client/src/features/super-neuropad/model";
import { disponiveisDaIdade } from "../../client/src/features/super-neuropad/extensao";

test("busca visual: densidade progressiva e tempo por idade, um alvo por cena", () => {
  let previousSeconds = Infinity;
  let previousCells = 0;
  for (let years = 2; years <= 17; years++) {
    const profile = visualSearchProfile(years);
    assert.ok(profile.seconds <= previousSeconds);
    assert.ok(profile.cells >= previousCells);
    assert.ok(profile.cells >= profile.columns);
    previousSeconds = profile.seconds;
    previousCells = profile.cells;
    for (const seed of [0, 1, 42, 1234567]) {
      const board = buildVisualSearchBoard(profile, seed);
      assert.equal(board.length, profile.cells);
      assert.equal(board.filter((entry) => entry === 0).length, 1);
      assert.deepEqual(buildVisualSearchBoard(profile, seed), board);
    }
    const available = disponiveisDaIdade(years);
    assert.equal(available.total, 50, "o catálogo de 50 desafios deve permanecer intacto");
    assert.equal(bandItemCount(String(years)), years === 2 ? 18 : years <= 5 ? 24 : years <= 7 ? 30 : 36);
  }
});

test("busca visual: registro correto, incorreto e timeout sem pontuação diagnóstica", () => {
  const profile = visualSearchProfile(9);
  const item: TouchItem = {
    id: "bonus-busca-9",
    kind: "toque",
    origin: "visual",
    ref: "atividade autoral não padronizada",
    prompt: "Encontre o explorador",
    answer: "Explorador com estrela dourada",
    seconds: profile.seconds,
    options: [
      { label: "Explorador com estrela dourada", art: "★" },
      { label: "Outro explorador", art: "●" },
    ],
  };
  const hit = recordTouch(item, "olhos", item.options[0], 2.3);
  assert.equal(hit.status, "acerto");
  assert.equal(hit.seconds, 2.3);
  assert.equal(recordTouch(item, "olhos", item.options[1], 2.3).status, "erro");
  assert.equal(recordTouch(item, "olhos", null, profile.seconds).status, "sem_resposta");
});

test("busca visual: rejeita idades fora de 2–17 anos", () => {
  for (const age of [1, 18, 2.5, NaN, Infinity, -1]) {
    assert.throws(() => visualSearchProfile(age), RangeError);
  }
});
