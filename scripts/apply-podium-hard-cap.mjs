import { readFileSync, writeFileSync } from "node:fs";

const filterPath = "client/src/data/filterPodium.ts";
let filter = readFileSync(filterPath, "utf8");
const importMarker =
  'import { getDeliveredInteractiveItemCount, type Respondente } from "./scaleFilter";\n';
if (!filter.includes('from "./podiumHardCap"')) {
  if (!filter.includes(importMarker)) throw new Error("Import de ScaleFilter não encontrado");
  filter = filter.replace(
    importMarker,
    `${importMarker}import { enforcePodiumHardCap } from "./podiumHardCap";\n`,
  );
}
const start = filter.indexOf("  // ── LIMITE TOTAL DO PÓDIO");
const end = filter.indexOf(
  "  // Direct and school also join the used set to prevent deduplication with medals.",
  start,
);
if (start < 0 || end < 0) throw new Error("Bloco flexível do limite não encontrado");
const hardBlock = `  // ── REGRA DE OURO ABSOLUTA: PÓDIO ≤ 100 PERGUNTAS ────────────────\n  // Diferentemente do passe flexível anterior, esta catraca nunca admite resíduo.\n  // Se não existir trio seguro dentro do teto, reduz medalhas em vez de entregar\n  // uma bateria excessiva. A combinação preserva cobertura, relevância e curadoria.\n  const cappedPodium = enforcePodiumHardCap({\n    ouro,\n    prata,\n    bronze,\n    candidates: sorted,\n    selectedQueixas,\n    ageMonths: exactAge,\n    countQuestions: (match) => estimatedQuestionCount(match.scale),\n  });\n  ouro = cappedPodium.ouro;\n  prata = cappedPodium.prata;\n  bronze = cappedPodium.bronze;\n  used.clear();\n  usedModes.clear();\n  for (const medal of [ouro, prata, bronze]) {\n    if (!medal) continue;\n    used.add(medal.scale.id);\n    usedModes.add(medal.applicationMode ?? "");\n  }\n\n`;
filter = filter.slice(0, start) + hardBlock + filter.slice(end);
writeFileSync(filterPath, filter);

const testPath = "tests/clinical/test-filter-podium.mjs";
let test = readFileSync(testPath, "utf8");
test = test.replace(
  'const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");',
  'const { selectCuratedTiers, selectPodium, PODIUM_QUESTION_CAP, estimatedQuestionCount } = await imp("client/src/data/filterPodium.ts");',
);
const idsMarker = "  const ids = slots.map((m) => m.scale.id);\n";
if (!test.includes("const podiumQuestionTotal")) {
  if (!test.includes(idsMarker)) throw new Error("Marcador de ids do teste não encontrado");
  test = test.replace(
    idsMarker,
    `${idsMarker}  const questionCounts = slots.map((m) => estimatedQuestionCount(m.scale));\n  const podiumQuestionTotal = questionCounts.reduce((sum, count) => sum + count, 0);\n`,
  );
}
const duplicateMarker =
  '  ok(new Set(ids).size === ids.length, "Ouro/Prata/Bronze nao podem repetir escala", { ...ctx, ids });\n';
if (!test.includes("REGRA DE OURO ABSOLUTA")) {
  if (!test.includes(duplicateMarker)) throw new Error("Marcador de duplicidade não encontrado");
  test = test.replace(
    duplicateMarker,
    `${duplicateMarker}  ok(\n    podiumQuestionTotal <= PODIUM_QUESTION_CAP,\n    "REGRA DE OURO ABSOLUTA: Ouro + Prata + Bronze nao podem ultrapassar 100 perguntas",\n    { ...ctx, ids, questionCounts, podiumQuestionTotal, cap: PODIUM_QUESTION_CAP },\n  );\n`,
  );
}
writeFileSync(testPath, test);
console.log("✓ catraca dura aplicada: nenhum pódio acima de 100 perguntas");
