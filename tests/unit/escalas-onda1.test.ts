// Onda 1 do plano de escalas (15/10/2026): aplicação completa, contagem de itens,
// cortes nas fronteiras exatas e alerta de segurança do PHQ-9 do cuidador.
import assert from "node:assert/strict";
import { test } from "node:test";
import { allScales } from "../../client/src/data/scaleFilter";
import { getImplementationStatus, isSuicideInstrument } from "../../client/src/data/advancedFilterLogic";
import { interactiveScaleItems, makeInteractiveConfig } from "../../client/src/data/interactiveScaleItems";
import { recommendPreConsultaScales } from "../../client/src/lib/preConsultaCore";

const IDS = { "phq9-cuidador": 9, "gad7-cuidador": 7, "aims-efeitos": 12, sas: 10, "cgi-s": 1, "cgi-i": 1, puts: 10, "p-ymrs": 11, swan: 18 } as const;

function scoreWith(id: string, optionIndexPerItem: number[]) {
  const scale = allScales.find((s) => s.id === id)!;
  const def = interactiveScaleItems[id];
  const answers: Record<string, number> = {};
  let k = 0;
  def.domains.forEach((d, di) => d.items.forEach((_item, ii) => { answers[`${di}-${ii}`] = optionIndexPerItem[k++] ?? 0; }));
  return makeInteractiveConfig(scale, def).onCalculate(answers as never);
}
/** Distribui um total em itens de 0..max (para testar fronteiras). */
const spread = (total: number, n: number, max: number) => Array.from({ length: n }, (_, i) => Math.max(0, Math.min(max, total - i * max)));

test("as 9 escalas da onda 1 abrem completas, com a contagem de itens da fonte e licença livre", () => {
  for (const [id, count] of Object.entries(IDS)) {
    const scale = allScales.find((s) => s.id === id);
    assert.ok(scale, id);
    assert.equal(getImplementationStatus(scale!), "complete", id);
    assert.equal(scale!.licencaUso, "livre", id);
    const delivered = interactiveScaleItems[id].domains.reduce((n, d) => n + d.items.length, 0);
    assert.equal(delivered, count, `${id}: itens`);
  }
});

test("PHQ-9 e GAD-7 do cuidador: cortes nas fronteiras exatas", () => {
  const phq = (t: number) => scoreWith("phq9-cuidador", spread(t, 9, 3)).classification;
  assert.deepEqual([4, 5, 9, 10, 14, 15, 19, 20, 27].map(phq), [
    "Sintomas mínimos (0–4)", "Sintomas leves (5–9)", "Sintomas leves (5–9)", "Sintomas moderados (10–14)", "Sintomas moderados (10–14)",
    "Moderadamente graves (15–19)", "Moderadamente graves (15–19)", "Graves (20–27)", "Graves (20–27)",
  ]);
  const gad = (t: number) => scoreWith("gad7-cuidador", spread(t, 7, 3)).classification;
  assert.deepEqual([4, 5, 9, 10, 14, 15].map(gad), ["Ansiedade mínima (0–4)", "Ansiedade leve (5–9)", "Ansiedade leve (5–9)", "Ansiedade moderada (10–14)", "Ansiedade moderada (10–14)", "Ansiedade grave (15–21)"]);
});

test("PHQ-9 do cuidador: item 9 é sentinela e o instrumento fica fora da pré-consulta automática", () => {
  const items = interactiveScaleItems["phq9-cuidador"].domains[0].items;
  const nine = items[8];
  assert.ok(typeof nine === "object" && "sentinel" in nine && nine.sentinel?.positiveOptionIndexes.join() === "1,2,3");
  assert.equal(isSuicideInstrument(allScales.find((s) => s.id === "phq9-cuidador")!), true);
  for (const contexto of ["primeira-consulta", "retorno"] as const) {
    const rows = recommendPreConsultaScales({ idadeMeses: 60, queixa: "depressao", respondente: "pais", contexto });
    assert.ok(rows.every((r) => !r.scale?.id.endsWith("-cuidador")), "escala do cuidador não substitui escala da criança");
  }
});

test("Simpson-Angus e CGI: fronteiras", () => {
  const sas = (t: number) => scoreWith("sas", spread(t, 10, 4)).classification;
  assert.match(sas(3), /^Sem parkinsonismo/);
  assert.match(sas(4), /^Sinais extrapiramidais \(total ≥ 4\)/);
  assert.match(sas(16), /acentuados/);
  const cgi = (v: number) => scoreWith("cgi-s", [v - 1]).classification;
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((v) => cgi(v).slice(0, 1)), ["1", "2", "3", "4", "5", "6", "7"]);
  const cgiI = (v: number) => scoreWith("cgi-i", [v - 1]).classification;
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((v) => cgiI(v).slice(0, 1)), ["1", "2", "3", "4", "5", "6", "7"]);
});

test("instrumentos sem corte aplicável ficam descritivos (AIMS, PUTS, P-YMRS, SWAN)", () => {
  for (const id of ["aims-efeitos", "puts", "p-ymrs", "swan"]) {
    assert.equal(interactiveScaleItems[id].descriptiveDomainSummary, true, id);
    const result = scoreWith(id, new Array(20).fill(4));
    assert.equal(result.classification, "Perfil descritivo", id);
  }
});

test("EPDS: opções próprias por item, cortes 10 e 13 e item 10 sentinela; respondida pelo cuidador", async () => {
  const { itemOptions } = await import("../../client/src/components/GenericScale");
  const def = interactiveScaleItems.epds;
  const items = def.domains[0].items;
  assert.equal(items.length, 10);
  for (const item of items) assert.equal(itemOptions(item, def.labels).length, 4);
  assert.equal(itemOptions(items[0], def.labels)[0], "Tanto quanto antes");
  const ten = items[9];
  assert.ok(typeof ten === "object" && "sentinel" in ten && ten.sentinel?.positiveOptionIndexes.join() === "1,2,3");
  const epds = (t: number) => scoreWith("epds", spread(t, 10, 3)).classification;
  assert.deepEqual([9, 10, 12, 13, 30].map(epds), ["Abaixo do corte (0–9)", "Possível depressão (10–12)", "Possível depressão (10–12)", "Provável depressão (≥ 13)", "Provável depressão (≥ 13)"]);
  const scale = allScales.find((s) => s.id === "epds")!;
  assert.deepEqual(scale.respondente, ["pais"]);
  assert.equal(isSuicideInstrument(scale), true);
});

test("PedMIDAS: 6 perguntas de dias (texto), aplicação completa e licença livre", () => {
  const def = interactiveScaleItems.pedmidas;
  const items = def.domains.flatMap((d) => d.items);
  assert.equal(items.length, 6);
  assert.ok(items.every((item) => typeof item === "object" && item.responseType === "text"));
  const scale = allScales.find((s) => s.id === "pedmidas")!;
  assert.equal(getImplementationStatus(scale), "complete");
  assert.equal(scale.licencaUso, "livre");
});

test("escalas sem opções por item mantêm o mesmo escore máximo (sem regressão)", async () => {
  const { itemOptions } = await import("../../client/src/components/GenericScale");
  for (const [id, def] of Object.entries(interactiveScaleItems)) {
    const items = def.domains.flatMap((d) => d.items);
    if (items.some((item) => typeof item === "object" && item.responseType !== "text" && "options" in item && item.options?.length)) continue;
    for (const item of items) assert.deepEqual(itemOptions(item, def.labels), def.labels, id);
  }
});
