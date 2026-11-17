// Banco kawaii autoral (recognition-v3): integridade, regeneração idêntica,
// estilo por idade e registro do estilo realmente apresentado.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildKawaiiBank, KAWAII_VERSION } from "../../scripts/build-recognition-kawaii.mjs";
import {
  ITEMS, VERSION, ART_STYLES, KAWAII_MAX_MONTHS, defaultArtStyle, configArtStyle, eligibleItems, easyPlanSelection,
  buildPlan, makeTrial, observe, reportText, itemFor, assetHash, hasArt, emptyDraft, type Config, type Draft, type StageEvent,
} from "../../client/src/features/visual-recognition/model.ts";

const kawaiiRoot = new URL("../../client/public/recognition-v3/", import.meta.url);
const soberRoot = new URL("../../client/public/recognition-v2/", import.meta.url);
const kawaiiManifest = JSON.parse(readFileSync(new URL("manifest.json", kawaiiRoot), "utf8"));
const soberManifest = JSON.parse(readFileSync(new URL("manifest.json", soberRoot), "utf8"));
const NEW_IDS = ["pintinho", "urso", "macaco", "joaninha", "zebra", "coruja", "abacate", "mamao", "trator", "foguete", "copo", "mamadeira", "livro", "balao", "boneca", "celular"];
const events: StageEvent[] = [{ kind: "apresentado", at: "2026-11-17T12:00:00Z" }, { kind: "encerrado", at: "2026-11-17T12:00:02Z" }];
const answered = (): Draft => ({ ...emptyDraft(), outcome: "correspondente", channel: "apontar", familiarity: "conhecida" });

test("arquivos publicados são exatamente a regeneração determinística do desenho", () => {
  const files = buildKawaiiBank();
  const published = readdirSync(kawaiiRoot).sort();
  assert.deepEqual(published, [...files.keys()].sort(), "nenhum arquivo a mais ou a menos");
  for (const [name, content] of files) {
    assert.equal(readFileSync(new URL(name, kawaiiRoot), "utf8"), content, `${name} difere da regeneração; rode node scripts/build-recognition-kawaii.mjs`);
  }
  assert.equal(kawaiiManifest.version, KAWAII_VERSION);
  assert.equal(VERSION, KAWAII_VERSION, "versão do banco registrada nas oportunidades");
});

test("cada figura kawaii: hash, SVG seguro, quadro fixo, sem texto e licença autoral", () => {
  assert.equal(kawaiiManifest.items.length, 74);
  for (const item of kawaiiManifest.items) {
    const bytes = readFileSync(new URL(`${item.id}.svg`, kawaiiRoot));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256, item.id);
    const svg = bytes.toString("utf8");
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 240 240"/, item.id);
    assert.doesNotMatch(svg, /<(?:script|foreignObject|image|text|title|desc|metadata|use|style)\b|\son\w+\s*=|href\s*=|url\((?!#)/i, item.id);
    assert.equal(item.license, "LicenseRef-NeuroPed-autoral");
    assert.equal(item.style, "kawaii");
    assert.equal(item.sourcePath, `NEUROPED/kawaii/${item.id}.svg`);
    assert.ok(Buffer.byteLength(svg) < 12_000, `${item.id}: figura enxuta para carregar rápido no tablet`);
  }
});

test("todas as figuras sóbrias têm versão kawaii com o mesmo rótulo, categoria e faixa", () => {
  const kawaii = new Map(kawaiiManifest.items.map((item: { id: string }) => [item.id, item]));
  for (const sober of soberManifest.items) {
    const twin = kawaii.get(sober.id) as { label: string; category: string; minMonths: number } | undefined;
    assert.ok(twin, `${sober.id} sem versão kawaii`);
    assert.equal(twin.label, sober.label, sober.id);
    assert.equal(twin.category, sober.category, sober.id);
    assert.equal(twin.minMonths, sober.minMonths, `${sober.id}: o redesenho não muda o roteiro etário`);
  }
  const added = kawaiiManifest.items.filter((item: { id: string }) => !soberManifest.items.some((sober: { id: string }) => sober.id === item.id));
  assert.deepEqual(added.map((item: { id: string }) => item.id).sort(), [...NEW_IDS].sort());
  for (const item of added) assert.ok(item.minMonths <= 48, `${item.id}: figura nova voltada a 1–4 anos`);
});

test("estilo padrão pela idade: kawaii até 59 meses, sóbrio a partir de 5 anos", () => {
  assert.equal(KAWAII_MAX_MONTHS, 59);
  for (const age of [12, 24, 36, 48, 59]) assert.equal(defaultArtStyle(age), "kawaii", String(age));
  for (const age of [60, 84, 120, 239]) assert.equal(defaultArtStyle(age), "sobrio", String(age));
  assert.equal(configArtStyle({ ageMonths: 36 }), "kawaii");
  assert.equal(configArtStyle({ ageMonths: 36, artStyle: "sobrio" }), "sobrio", "o profissional pode trocar");
  assert.deepEqual(Object.keys(ART_STYLES), ["kawaii", "sobrio"]);
});

test("figuras novas só existem no kawaii; chamadas sem estilo (Super NeuroPad) seguem no banco sóbrio", () => {
  for (const id of NEW_IDS) {
    const item = itemFor(id);
    assert.equal(hasArt(item, "kawaii"), true, id);
    assert.equal(hasArt(item, "sobrio"), false, id);
    assert.throws(() => assetHash(item, "sobrio"), /não existe no estilo/);
  }
  const kawaii36 = eligibleItems(36, "receptivo", "kawaii").map((item) => item.id);
  const sober36 = eligibleItems(36, "receptivo", "sobrio").map((item) => item.id);
  assert.ok(["pintinho", "urso", "macaco", "joaninha", "copo", "livro", "balao"].every((id) => kawaii36.includes(id)));
  assert.equal(sober36.some((id) => NEW_IDS.includes(id)), false);
  assert.deepEqual(eligibleItems(36, "receptivo").map((item) => item.id), sober36, "padrão sem estilo é o banco sóbrio");
  assert.ok(easyPlanSelection(30).includes("pintinho"), "Modo Fácil aos 2 anos usa as figuras kawaii");
  assert.equal(easyPlanSelection(72).some((id) => NEW_IDS.includes(id)), false, "Modo Fácil aos 6 anos segue sóbrio");
  assert.throws(() => makeTrial("pintinho", "receptivo", ITEMS, 2, 1, 0, "sobrio"), /não existe no estilo/);
  for (const item of ITEMS.filter((entry) => entry.art !== "symbol")) assert.ok(hasArt(item, "kawaii") && hasArt(item, "sobrio"), item.id);
});

test("sessão kawaii registra estilo, hash da figura mostrada e autoria no relatório", () => {
  const config: Config = {
    ageMonths: 36, mode: "receptivo", choices: 2, count: 8, seed: 17756, distractors: "distantes", contextAcknowledged: false, conditions: [],
    selectedIds: eligibleItems(36, "receptivo", "kawaii").filter((item) => !item.context).map((item) => item.id), artStyle: "kawaii",
  };
  const plan = buildPlan(config);
  assert.deepEqual(plan, buildPlan(config), "determinístico");
  assert.ok(plan.every((trial) => trial.artStyle === "kawaii" && trial.assetVersion === VERSION));
  const symbolTrial = plan.find((trial) => itemFor(trial.targetId).art === "symbol")!;
  const record = observe(symbolTrial, answered(), events, []);
  const target = itemFor(symbolTrial.targetId);
  assert.equal(record.item.hash, target.assets.kawaii!.hash, "hash da figura kawaii realmente apresentada");
  if (target.assets.sobrio) assert.notEqual(record.item.hash, target.assets.sobrio.hash);
  for (const option of record.options) assert.equal(option.hash, assetHash(itemFor(option.id), "kawaii"));
  const report = reportText(config, plan, [record]);
  assert.match(report, /Figuras: Kawaii · 1 a 4 anos/);
  assert.match(report, /banco autoral NeuroPed \(recognition-v3\)/);
  assert.doesNotMatch(report, /Mulberry/);

  const sober: Config = { ...config, artStyle: "sobrio", selectedIds: eligibleItems(36, "receptivo", "sobrio").filter((item) => !item.context).map((item) => item.id) };
  const soberPlan = buildPlan(sober);
  assert.ok(soberPlan.every((trial) => trial.artStyle === "sobrio"));
  assert.match(reportText(sober, soberPlan, []), /Mulberry Symbols/);
  assert.throws(() => buildPlan({ ...sober, selectedIds: [...sober.selectedIds, "pintinho"] }), /Seleção incompatível/);
  assert.throws(() => buildPlan({ ...config, artStyle: "neon" as never }), /Configuração inválida/);
});
