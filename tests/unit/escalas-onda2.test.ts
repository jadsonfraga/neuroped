// Onda 2 do plano de escalas (15/10/2026): PHQ-2, PSC-35, CES-DC, HAM-D, CGAS e FMS.
import assert from "node:assert/strict";
import { test } from "node:test";
import { allScales } from "../../client/src/data/scaleFilter";
import { getImplementationStatus, isSuicideInstrument } from "../../client/src/data/advancedFilterLogic";
import { interactiveScaleItems, makeInteractiveConfig } from "../../client/src/data/interactiveScaleItems";
import { itemOptions, itemReversed, type ScaleItem } from "../../client/src/components/GenericScale";

const IDS = { phq2: 2, psc35: 35, "ces-dc": 20, hamd: 17, cgas: 1, fms: 3 } as const;

/** Monta respostas que somam `total` pontos, respeitando opções e itens invertidos. */
function answersFor(id: string, total: number): Record<string, number> {
  const def = interactiveScaleItems[id];
  const answers: Record<string, number> = {};
  let left = total;
  def.domains.forEach((d, di) => d.items.forEach((item: ScaleItem, ii) => {
    const n = itemOptions(item, def.labels).length;
    const own = typeof item !== "string" && item.responseType !== "text" && item.options?.length;
    const pts = own ? (item.optionPoints ?? Array.from({ length: n }, (_, i) => i)) : (def.optionPoints ?? Array.from({ length: n }, (_, i) => i));
    const points = itemReversed(item) ? [...pts].reverse() : pts;
    const max = Math.max(...points);
    const want = Math.min(max, left);
    const idx = points.indexOf(want);
    answers[`${di}-${ii}`] = idx;
    left -= points[idx];
  }));
  assert.equal(left, 0, `${id}: total ${total} alcançável`);
  return answers;
}
const classify = (id: string, total: number) =>
  makeInteractiveConfig(allScales.find((s) => s.id === id)!, interactiveScaleItems[id]).onCalculate(answersFor(id, total) as never).classification;

test("as 6 escalas da onda 2 abrem completas, com a contagem de itens da fonte", () => {
  for (const [id, count] of Object.entries(IDS)) {
    const scale = allScales.find((s) => s.id === id);
    assert.ok(scale, id);
    assert.equal(getImplementationStatus(scale!), "complete", id);
    assert.equal(scale!.licencaUso, "livre", id);
    assert.equal(interactiveScaleItems[id].domains.reduce((n, d) => n + d.items.length, 0), count, id);
  }
});

test("cortes nas fronteiras exatas", () => {
  assert.deepEqual([2, 3].map((t) => classify("phq2", t)), ["Rastreio negativo (0–2)", "Rastreio positivo (≥ 3)"]);
  assert.deepEqual([23, 24, 27, 28].map((t) => classify("psc35", t)), ["Abaixo do corte (0–23)", "24–27: positivo só aos 4–5 anos", "24–27: positivo só aos 4–5 anos", "Positivo (≥ 28)"]);
  assert.deepEqual([14, 15].map((t) => classify("ces-dc", t)), ["Abaixo do corte (0–14)", "Sintomas relevantes (≥ 15)"]);
  assert.deepEqual([7, 8, 13, 14, 18, 19, 22, 23, 52].map((t) => classify("hamd", t).split(" (")[0]), [
    "Sem depressão", "Depressão leve", "Depressão leve", "Depressão moderada", "Depressão moderada", "Depressão grave", "Depressão grave", "Depressão muito grave", "Depressão muito grave",
  ]);
});

test("CES-DC: itens positivos (4, 8, 12, 16) pontuam ao contrário; HAM-D tem máximo 52 com itens 0–2", () => {
  const ces = interactiveScaleItems["ces-dc"].domains[0].items;
  assert.deepEqual(ces.map((item, i) => (itemReversed(item) ? i + 1 : 0)).filter(Boolean), [4, 8, 12, 16]);
  const ham = interactiveScaleItems.hamd.domains[0].items;
  const max = ham.reduce((m, item) => m + itemOptions(item, interactiveScaleItems.hamd.labels).length - 1, 0);
  assert.equal(max, 52);
});

test("HAM-D: item 3 é sentinela e o instrumento fica marcado como de risco", () => {
  const three = interactiveScaleItems.hamd.domains[0].items[2];
  assert.ok(typeof three === "object" && "sentinel" in three && three.sentinel?.positiveOptionIndexes.join() === "1,2,3,4");
  assert.equal(isSuicideInstrument(allScales.find((s) => s.id === "hamd")!), true);
});

test("CGAS e FMS: escolha de faixa e trio de notas, descritivos", () => {
  assert.equal(itemOptions(interactiveScaleItems.cgas.domains[0].items[0], interactiveScaleItems.cgas.labels).length, 10);
  for (const item of interactiveScaleItems.fms.domains[0].items) assert.equal(itemOptions(item, interactiveScaleItems.fms.labels).length, 8);
  for (const id of ["cgas", "fms"]) assert.equal(interactiveScaleItems[id].descriptiveDomainSummary, true);
});
