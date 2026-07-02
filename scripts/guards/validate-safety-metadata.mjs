// @ts-check
/**
 * validate-safety-metadata.mjs — Catraca de SEGURANÇA CLÍNICA do filtro.
 *
 * Executado via tsx (resolve os imports .ts do catálogo client).
 *   npm run validate:safety   (e dentro de `npm run verify`)
 *
 * PROBLEMA QUE RESOLVE
 * --------------------
 * Quatro propriedades do motor de filtragem disparam BLOQUEIOS CLÍNICOS DUROS por
 * idade e são inferidas por regex sobre o NOME da escala:
 *   · isSuicideInstrument   → risco suicida exige ≥ 8 anos
 *   · isPsychosisInstrument → psicose/mania exige ≥ 12 anos
 *   · getVerbalRequirement  → escala verbal some para criança não-verbal
 *   · getLiteracyRequirement→ escala alfabetizada some para pré-alfabetizado
 * Inferir uma propriedade de SEGURANÇA de uma substring é frágil: adicionar uma
 * escala cujo nome contenha "mania" ou "matriz" muda um gate silenciosamente.
 *
 * O QUE ESTE GUARD FAZ
 * --------------------
 * Congela a classificação de segurança de TODA escala do catálogo num baseline
 * versionado. Qualquer divergência (classificação de uma escala existente mudou,
 * ou uma escala nova entrou) FALHA o CI — forçando revisão humana consciente.
 * O campo explícito (scale.suicideRiskInstrument / psychosisRiskInstrument /
 * verbalRequirement / literacyRequirement) sempre vence o regex, então a correção
 * de um caso mal classificado é DADO revisado, não um ajuste de regex.
 *
 * Para reconhecer conscientemente a classificação atual (após revisar):
 *   UPDATE_SAFETY_BASELINE=1 npm run validate:safety
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const BASELINE_PATH = resolve(__dirname, "safety-classification-baseline.json");

const { allScales } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
);
const { isSuicideInstrument, isPsychosisInstrument, getVerbalRequirement, getLiteracyRequirement } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/advancedFilterLogic.ts")).href
);

/** Codifica a classificação de segurança de uma escala numa string estável. */
function classify(scale) {
  const s = isSuicideInstrument(scale) ? 1 : 0;
  const p = isPsychosisInstrument(scale) ? 1 : 0;
  const v = getVerbalRequirement(scale);
  const l = getLiteracyRequirement(scale);
  return `${s}${p}|${v}|${l}`;
}

/** @type {Record<string,string>} */
const current = {};
for (const scale of allScales) {
  if (!scale?.id) continue;
  current[scale.id] = classify(scale);
}

const updating = process.env.UPDATE_SAFETY_BASELINE === "1";

if (!existsSync(BASELINE_PATH) || updating) {
  const ordered = Object.fromEntries(Object.keys(current).sort().map((k) => [k, current[k]]));
  writeFileSync(BASELINE_PATH, JSON.stringify(ordered, null, 2) + "\n");
  console.log(
    `[safety] baseline ${existsSync(BASELINE_PATH) && !updating ? "criado" : "regenerado"} com ${Object.keys(current).length} escalas → ${BASELINE_PATH.replace(repoRoot + "/", "")}`
  );
  process.exit(0);
}

/** @type {Record<string,string>} */
const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));

const CODE = { 0: "não", 1: "sim" };
function human(code) {
  const [flags, v, l] = code.split("|");
  const suic = CODE[flags[0]];
  const psic = CODE[flags[1]];
  return `suicídio=${suic} · psicose=${psic} · verbal=${v} · alfabetização=${l}`;
}

const changed = [];
const added = [];
for (const [id, code] of Object.entries(current)) {
  if (!(id in baseline)) {
    added.push(id);
  } else if (baseline[id] !== code) {
    changed.push({ id, from: baseline[id], to: code });
  }
}
const removed = Object.keys(baseline).filter((id) => !(id in current));

if (changed.length) {
  console.error(`\n[safety] ✗ ${changed.length} escala(s) MUDARAM de classificação de segurança:`);
  for (const c of changed) {
    console.error(`  · ${c.id}`);
    console.error(`      antes: ${human(c.from)}`);
    console.error(`      agora: ${human(c.to)}`);
  }
}
if (added.length) {
  console.error(`\n[safety] ✗ ${added.length} escala(s) NOVA(S) sem classificação de segurança congelada:`);
  for (const id of added) console.error(`  · ${id} → ${human(current[id])}`);
}
if (removed.length) {
  console.warn(`\n[safety] ⚠ ${removed.length} escala(s) do baseline não estão mais no catálogo (serão podadas ao regenerar): ${removed.join(", ")}`);
}

if (changed.length || added.length) {
  console.error(
    `\n[safety] Revise clinicamente cada caso acima. Se a classificação está CORRETA, congele-a com:\n` +
    `    UPDATE_SAFETY_BASELINE=1 npm run validate:safety\n` +
    `Se estiver ERRADA, corrija com metadado EXPLÍCITO na escala (suicideRiskInstrument /\n` +
    `psychosisRiskInstrument / verbalRequirement / literacyRequirement) — não ajuste o regex.\n`
  );
  process.exit(1);
}

console.log(`[safety] ✓ classificação de segurança íntegra em ${Object.keys(current).length} escalas (nenhuma mudança vs baseline).`);
