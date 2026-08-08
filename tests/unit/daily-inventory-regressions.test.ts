import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { scaleMessageCatalog2026 } from "../../client/src/data/scaleMessageCatalog2026.ts";
import {
  dailyInventorySearchText,
  parseReferenceAgeRange,
} from "../../client/src/lib/instrument-library-filters.ts";
import {
  isValidCalendarDate,
  positiveModulo,
  replaceDatedRecord,
  selectTopic,
} from "../../scripts/generate-daily-authorial-inventory.mts";

const ageCases: Array<[string, [number, number] | null]> = [
  ["6 meses–7 anos, com usos específicos até 21 anos", [6, 251]],
  ["2 anos ou mais", [24, 251]],
  ["predominantemente adultos", [216, 251]],
  ["1 mês–5a11m", [1, 71]],
  ["0–7a11m", [0, 95]],
  ["GRS-P 4–6a11m; GRS-S 6–13a11m", [48, 167]],
  ["3–10/11 anos", [36, 132]],
  ["1,5–18 anos", [18, 216]],
  ["12 meses–adulto", [12, 251]],
  ["3 meses–80+ anos", [3, 251]],
  ["8+ anos", [96, 251]],
  ["2–85+ anos", [24, 251]],
  ["primeira infância", [0, 72]],
  ["crianças", [0, 215]],
  ["pré-escolares e escolares", [36, 215]],
  ["6–12 anos, também utilizado em pré-escolares", [36, 144]],
  ["recém-nascido a termo", [0, 1]],
  ["variável por idade/linguagem", null],
];

for (const [label, expected] of ageCases) {
  assert.deepEqual(
    parseReferenceAgeRange(label),
    expected,
    `faixa etária incorreta para “${label}”`,
  );
}

const catalogRanges = [
  ...new Set(scaleMessageCatalog2026.map((record) => record.ageRange)),
];
assert.deepEqual(
  catalogRanges
    .filter((label) => parseReferenceAgeRange(label) === null)
    .sort(),
  ["conforme manual", "variável por idade/linguagem"],
  "somente faixas deliberadamente indeterminadas podem ficar sem limites",
);
for (const label of catalogRanges) {
  const range = parseReferenceAgeRange(label);
  if (!range) continue;
  assert.ok(range[0] >= 0 && range[0] <= range[1] && range[1] <= 251, label);
}

const searchText = dailyInventorySearchText({
  title: "Inventário de eventos paroxísticos",
  shortTitle: "Eventos paroxísticos",
  topic: "Semiologia",
  category: "Neurologia infantil",
  subcategory: "Epilepsia",
  purpose: "Registrar episódios súbitos.",
  tags: ["epilepsia"],
  domains: [
    {
      label: "Fenômenos autonômicos",
      description: "Cor, respiração e sinais vegetativos.",
    },
  ],
  items: [{ text: "O episódio começa de forma súbita." }],
});
assert.match(searchText, /sinais vegetativos/);

assert.equal(isValidCalendarDate("2028-02-29"), true);
assert.equal(isValidCalendarDate("2027-02-29"), false);
assert.equal(isValidCalendarDate("2027-02-30"), false);
assert.equal(isValidCalendarDate("2027-13-01"), false);
assert.equal(positiveModulo(-1, 5), 4);
assert.equal(positiveModulo(-6, 5), 4);
assert.ok(
  selectTopic("2026-07-26", []).id,
  "backfill anterior à âncora deve selecionar tema",
);

const outputDir = await mkdtemp(
  path.join(tmpdir(), "neuroped-daily-inventory-"),
);
try {
  await writeFile(
    path.join(outputDir, "2026-08-08-antigo.json"),
    JSON.stringify({ generatedOn: "2026-08-08", id: "old-a" }),
  );
  await writeFile(
    path.join(outputDir, "2026-08-08-duplicado.json"),
    JSON.stringify({ generatedOn: "2026-08-08", id: "old-b" }),
  );
  await writeFile(
    path.join(outputDir, "2026-08-07-preservar.json"),
    JSON.stringify({ generatedOn: "2026-08-07", id: "keep" }),
  );

  const replacement = JSON.stringify({ generatedOn: "2026-08-08", id: "new" });
  await replaceDatedRecord(
    "2026-08-08",
    "2026-08-08-substituto.json",
    replacement,
    outputDir,
  );

  assert.deepEqual((await readdir(outputDir)).sort(), [
    "2026-08-07-preservar.json",
    "2026-08-08-substituto.json",
  ]);
  assert.equal(
    await readFile(path.join(outputDir, "2026-08-08-substituto.json"), "utf8"),
    replacement,
  );
} finally {
  await rm(outputDir, { recursive: true, force: true });
}

console.log(
  "✓ regressões pós-merge do inventário diário permanecem corrigidas",
);
