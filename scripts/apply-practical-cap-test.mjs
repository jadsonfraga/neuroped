import { readFileSync, writeFileSync } from "node:fs";

const path = "tests/clinical/test-filter-practical-100.mjs";
let source = readFileSync(path, "utf8");
source = source.replace(
  'const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");',
  'const { selectCuratedTiers, selectPodium, PODIUM_QUESTION_CAP, estimatedQuestionCount } = await imp("client/src/data/filterPodium.ts");',
);
source = source.replace(
  '  const issues = [];\n  let score = 0;',
  `  const issues = [];\n  let score = 0;\n  const feasibleCounts = matches\n    .filter((m) => m.scale.ageMin <= ctx.ageMonths && m.scale.ageMax >= ctx.ageMonths)\n    .map((m) => estimatedQuestionCount(m.scale))\n    .filter((count) => Number.isFinite(count) && count > 0 && count <= PODIUM_QUESTION_CAP)\n    .sort((a, b) => a - b);\n  const trioFitsBudget =\n    feasibleCounts.length >= 3 &&\n    feasibleCounts[0] + feasibleCounts[1] + feasibleCounts[2] <= PODIUM_QUESTION_CAP;\n  const podiumQuestionTotal = slots.reduce(\n    (sum, slot) => sum + estimatedQuestionCount(slot.scale),\n    0,\n  );`,
);
source = source.replace(
  '  add(slots.length === 3, 1.0, "podio incompleto");',
  '  add(!trioFitsBudget || slots.length === 3, 1.0, "podio incompleto apesar de trio viavel");\n  add(podiumQuestionTotal <= PODIUM_QUESTION_CAP, 0, "podio ultrapassou 100 perguntas");',
);
source = source.replace(
  '  "podio incompleto",',
  '  "podio incompleto apesar de trio viavel",\n  "podio ultrapassou 100 perguntas",',
);
writeFileSync(path, source);
console.log("✓ teste prático alinhado ao teto absoluto");
