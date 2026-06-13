// @ts-check
/**
 * test-interactive-scales.mjs — Auditoria travada das escalas INTERATIVAS.
 *
 * Garante que toda escala interativa (acervo "runner" interactiveScales + acervo
 * de itens interactiveScaleItems) ABRE, PONTUA e tem FAIXAS coerentes:
 *  - tem itens respondíveis (≥1 item; opções suficientes);
 *  - o escore é calculável e limitado;
 *  - as faixas de interpretação cobrem TODO o intervalo possível, sem buraco;
 *  - o id existe no catálogo / em allScales (logo /generic-scale/:id renderiza
 *    a aplicação, nunca "escala não encontrada").
 *
 * Falha (exit 1) em qualquer violação — trava contra regressão clínica.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { interactiveScales, maxScoreOf } = await imp("client/src/data/interactiveScales.ts");
const itemsMod = await imp("client/src/data/interactiveScaleItems.ts");
const interactiveScaleItems = itemsMod.interactiveScaleItems ?? itemsMod.default ?? {};

const allIds = new Set(allScales.map((s) => s.id));
const catalogIds = new Set(mergeFilterableCatalog(allScales).map((s) => s.id));

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) { failures++; console.error(`  ❌ ${msg}`); }
}
function head(t) { console.log(`\n=== ${t} ===`); }

// ---------- A) Acervo RUNNER (interactiveScales) — bandas {min,max} ----------
head("A) Runner (interactiveScales) — itens, escore e faixas contíguas");
const runnerEntries = Object.entries(interactiveScales);
ok(runnerEntries.length > 0, "registro runner não-vazio");
for (const [id, def] of runnerEntries) {
  ok(Array.isArray(def.items) && def.items.length >= 1, `${id}: tem ≥1 item`);
  ok(def.items.every((it) => Array.isArray(it.options) && it.options.length >= 2), `${id}: todo item tem ≥2 opções`);
  ok(def.items.every((it) => it.options.every((o) => Number.isFinite(o.value))), `${id}: toda opção tem valor numérico`);

  const max = maxScoreOf(def);
  // Escore mínimo possível = soma do menor valor de cada item (pode ser >0 em
  // escalas de NÍVEL, ex.: Viking/MACS/BFMF começam no nível I = 1).
  const min = def.items.reduce((acc, it) => acc + Math.min(...it.options.map((o) => o.value)), 0);
  ok(max > min, `${id}: escore máximo > mínimo (${min}..${max})`);

  // Faixas cobrem [min, max] de forma contígua e completa.
  const bands = [...def.bands].sort((a, b) => a.min - b.min);
  ok(bands.length >= 1, `${id}: tem ≥1 faixa`);
  ok(bands.every((b) => b.min <= b.max), `${id}: toda faixa tem min ≤ max`);
  ok(bands[0].min === min, `${id}: primeira faixa começa no escore mínimo (${min})`);
  ok(bands[bands.length - 1].max >= max, `${id}: última faixa cobre o escore máximo (${bands[bands.length - 1].max} ≥ ${max})`);
  let contiguous = true;
  for (let i = 1; i < bands.length; i++) if (bands[i].min !== bands[i - 1].max + 1) contiguous = false;
  ok(contiguous, `${id}: faixas contíguas (sem buraco/sobreposição)`);
  ok(bands.every((b) => b.risk && b.description && b.tone), `${id}: toda faixa tem rótulo, descrição e tom`);

  // Abre: id no catálogo OU alias conhecido (ex.: "faces" = FPS-R).
  ok(catalogIds.has(id) || allIds.has(id) || id === "faces", `${id}: existe no catálogo/allScales (abre via rota)`);
}

// ---------- B) Acervo de ITENS (interactiveScaleItems) — bandas {minPct} ----------
head("B) Acervo de itens (interactiveScaleItems) — itens, opções e faixas %");
const itemEntries = Object.entries(interactiveScaleItems);
ok(itemEntries.length > 0, "acervo de itens não-vazio");
const orphans = [];
for (const [id, def] of itemEntries) {
  const totalItems = (def.domains ?? []).reduce((acc, d) => acc + (d.items?.length ?? 0), 0);
  ok(totalItems >= 1, `${id}: tem ≥1 item (em ${def.domains?.length ?? 0} domínios)`);
  ok((def.domains ?? []).every((d) => Array.isArray(d.items) && d.items.length >= 1), `${id}: todo domínio tem ≥1 item`);
  ok(Array.isArray(def.labels) && def.labels.length >= 2, `${id}: ≥2 opções de resposta`);
  if (def.optionPoints) ok(def.optionPoints.length === def.labels.length, `${id}: optionPoints casa com labels`);

  ok(Array.isArray(def.bands) && def.bands.length >= 1, `${id}: tem ≥1 faixa de interpretação`);
  ok(def.bands.every((b) => b.minPct >= 0 && b.minPct <= 100), `${id}: minPct ∈ [0,100]`);
  ok(Math.min(...def.bands.map((b) => b.minPct)) === 0, `${id}: faixa mínima começa em 0% (cobre qualquer escore)`);
  ok(def.bands.every((b) => b.classification && b.description), `${id}: toda faixa tem classificação e descrição`);

  // INVARIANTE CRÍTICO: toda escala SELECIONÁVEL no filtro precisa abrir como
  // aplicação. Se está no catálogo, tem de estar em allScales (senão
  // /generic-scale/:id mostra "não encontrada"). Defs cujo id não está no
  // catálogo são órfãs (não selecionáveis, não alcançáveis) — apenas reportadas.
  if (catalogIds.has(id)) {
    ok(allIds.has(id), `${id}: SELECIONÁVEL e abre como aplicação (existe em allScales)`);
  } else if (!allIds.has(id)) {
    orphans.push(id);
  }
}
if (orphans.length) {
  console.log(`  ⚠️  ${orphans.length} definições órfãs (id fora do catálogo/allScales) — dados mortos, não selecionáveis. Ex.: ${orphans.slice(0, 8).join(", ")}`);
}

// ---------- C) Cobertura ----------
head("C) Cobertura no filtro");
const interactiveInCatalog = new Set(
  [...runnerEntries.map(([id]) => id), ...itemEntries.map(([id]) => id)].filter((id) => catalogIds.has(id))
);
console.log(`  runner=${runnerEntries.length} | acervo=${itemEntries.length} | interativas no catálogo=${interactiveInCatalog.size}`);
ok(interactiveInCatalog.size >= 100, `≥100 escalas interativas selecionáveis no filtro (=${interactiveInCatalog.size})`);
const priorityClinicalPack = [
  "engel", "bears", "flacc", "rflacc", "comfort-b", "bars", "uku",
  "psc17", "erc", "hine", "catclams", "fas-fluencia", "bisq", "nddie", "scas", "rcads", "fas-pr",
];
for (const id of priorityClinicalPack) {
  ok(interactiveInCatalog.has(id), `${id}: pacote prioritario abre como escala preenchivel`);
}

console.log(`\n${"=".repeat(48)}`);
if (failures === 0) {
  console.log(`✅ INTERATIVAS OK — ${checks} verificações passaram.`);
  process.exit(0);
} else {
  console.error(`❌ INTERATIVAS FALHOU — ${failures}/${checks} verificações falharam.`);
  process.exit(1);
}
