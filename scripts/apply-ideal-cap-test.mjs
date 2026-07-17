import { readFileSync, writeFileSync } from "node:fs";

const path = "tests/clinical/test-filter-ideal-choice.mjs";
let source = readFileSync(path, "utf8");

source = source.replace(
  'const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");',
  'const { selectCuratedTiers, selectPodium, PODIUM_QUESTION_CAP, estimatedQuestionCount } = await imp("client/src/data/filterPodium.ts");',
);

source = source.replace(
  '  const isFallback = matches.length > 0 && matches.every((m) => m.isBroadbandFallback);\n  const issues = [];',
  `  const isFallback = matches.length > 0 && matches.every((m) => m.isBroadbandFallback);\n  const issues = [];\n  const feasibleCounts = matches\n    .filter((m) => m.scale.ageMin <= ctx.ageMonths && m.scale.ageMax >= ctx.ageMonths)\n    .map((m) => estimatedQuestionCount(m.scale))\n    .filter((count) => Number.isFinite(count) && count > 0 && count <= PODIUM_QUESTION_CAP)\n    .sort((a, b) => a - b);\n  const trioFitsBudget =\n    feasibleCounts.length >= 3 &&\n    feasibleCounts[0] + feasibleCounts[1] + feasibleCounts[2] <= PODIUM_QUESTION_CAP;\n  const podiumQuestionTotal = slots.reduce(\n    (sum, slot) => sum + estimatedQuestionCount(slot.scale),\n    0,\n  );`,
);

source = source.replace(
  '  if (slots.length !== 3) r7.push("R7-incompleto");',
  '  if (trioFitsBudget && slots.length !== 3) r7.push("R7-incompleto");\n  if (podiumQuestionTotal > PODIUM_QUESTION_CAP) r7.push("R7-carga-acima-100");',
);

writeFileSync(path, source);
console.log("✓ teste ideal alinhado ao teto absoluto de 100 perguntas");
