import test from "node:test";
import assert from "node:assert/strict";
import {
  buildVisualSearchBoard,
  visualSearchProfile,
  type ExplorerVariant,
} from "../../client/src/features/super-neuropad/visualSearch";
import { bandItemCount, recordTouch, type TouchItem } from "../../client/src/features/super-neuropad/model";
import { disponiveisDaIdade } from "../../client/src/features/super-neuropad/extensao";

const ages = Array.from({ length: 16 }, (_, i) => i + 2);
const expectedCells = [6, 8, 9, 12, 12, 16, 20, 24, 24, 30, 30, 36, 36, 42, 42, 48];
const expectedSeconds = [70, 70, 65, 65, 60, 60, 60, 60, 60, 65, 65, 70, 70, 75, 75, 80];
const expectedTier = [0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];

test("busca visual: 16 idades com carga progressiva sem cronômetro punitivo para adolescentes", () => {
  let previousCells = 0;
  let previousTier = 0;
  for (const [index, years] of ages.entries()) {
    const profile = visualSearchProfile(years);
    assert.equal(profile.cells, expectedCells[index], years + " anos: quantidade");
    assert.equal(profile.seconds, expectedSeconds[index], years + " anos: tempo");
    assert.equal(profile.tier, expectedTier[index], years + " anos: semelhança");
    assert.ok(profile.cells >= previousCells);
    assert.ok(profile.tier >= previousTier);
    assert.ok(profile.cells >= profile.columns);
    assert.ok(profile.minTileHeight >= 54);
    if (years <= 3) {
      assert.ok(profile.minTileHeight >= 80);
      assert.equal(profile.nearDistractors, 0);
    }
    if (years >= 10) {
      assert.ok(profile.nearDistractors >= 3);
      assert.ok(profile.seconds >= 60, "mais distratores não implica tempo excessivamente curto");
    }
    previousCells = profile.cells;
    previousTier = profile.tier;

    // A missão permanece COMPLEMENTAR e não interfere nos 50 desafios.
    assert.equal(disponiveisDaIdade(years).total, 50);
    assert.equal(bandItemCount(String(years)), years === 2 ? 18 : years <= 5 ? 24 : years <= 7 ? 30 : 36);
  }
});

test("busca visual: um só alvo, distratores etários e tabuleiro determinístico sem padrão repetitivo", () => {
  for (const years of ages) {
    const profile = visualSearchProfile(years);
    const positions = new Set<number>();
    for (let seed = 0; seed < 40; seed++) {
      const board = buildVisualSearchBoard(profile, seed);
      assert.equal(board.length, profile.cells);
      assert.equal(board.filter((v) => v === 0).length, 1);
      assert.deepEqual(buildVisualSearchBoard(profile, seed), board);
      assert.ok(board.every((v): v is ExplorerVariant => Number.isInteger(v) && v >= 0 && v <= 6));
      const nearCount = board.filter((v) => v >= 4).length;
      assert.equal(nearCount, profile.nearDistractors, years + " anos: distratores quase iguais");
      if (profile.tier < 3) assert.equal(nearCount, 0, "pré-escolares não devem ter quase iguais");
      if (profile.tier === 3) assert.equal(board.includes(6), false);
      positions.add(board.indexOf(0));
    }
    assert.ok(positions.size >= Math.min(profile.cells, 4), years + " anos: alvo muda de posição");
  }
});

test("busca visual: registros são fatos da tentativa, não um escore normativo", () => {
  const profile = visualSearchProfile(12);
  const item: TouchItem = {
    id: "bonus-busca-12",
    kind: "toque",
    origin: "visual",
    ref: "atividade autoral não padronizada",
    prompt: "Encontre a estrela preenchida no centro",
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
  assert.equal(recordTouch(item, "olhos", item.options[1], 10).status, "erro");
  assert.equal(recordTouch(item, "olhos", null, profile.seconds).status, "sem_resposta");
});

test("busca visual: rejeita idades inválidas e semente não finita tem resultado reprodutível", () => {
  for (const age of [1, 18, 2.5, NaN, Infinity, -1]) {
    assert.throws(() => visualSearchProfile(age), RangeError);
  }
  const profile = visualSearchProfile(17);
  assert.deepEqual(buildVisualSearchBoard(profile, NaN), buildVisualSearchBoard(profile, NaN));
});
