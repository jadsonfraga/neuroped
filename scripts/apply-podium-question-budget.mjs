import { readFileSync, writeFileSync } from "node:fs";

function patch(path, replacements) {
  let source = readFileSync(path, "utf8");
  for (const [before, after] of replacements) {
    if (!source.includes(before)) {
      throw new Error(`Marcador não encontrado em ${path}: ${before.slice(0, 120)}`);
    }
    source = source.replace(before, after);
  }
  writeFileSync(path, source);
}

patch("client/src/data/filterPodium.ts", [
  [
    'import type { Respondente } from "./scaleFilter";\n',
    'import type { Respondente } from "./scaleFilter";\nimport { enforcePodiumQuestionBudget } from "./podiumQuestionBudget";\n',
  ],
  [
    '  // Direct and school also join the used set to prevent deduplication with medals.\n',
    '  // REGRA DE OURO DE CARGA: a soma real/estimada das perguntas de Ouro,\n' +
      '  // Prata e Bronze nunca ultrapassa 100. O pós-passe procura uma combinação\n' +
      '  // global que preserve três medalhas, cobertura, idade e relevância sempre\n' +
      '  // que o catálogo contenha trio seguro dentro do orçamento.\n' +
      '  ({ ouro, prata, bronze } = enforcePodiumQuestionBudget({\n' +
      '    ouro,\n' +
      '    prata,\n' +
      '    bronze,\n' +
      '    candidates: sorted,\n' +
      '    ageMonths: exactAge,\n' +
      '    selectedQueixas,\n' +
      '  }));\n\n' +
      '  // Direct and school also join the used set to prevent deduplication with medals.\n',
  ],
]);

patch("tests/clinical/test-filter-podium.mjs", [
  [
    'const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");\n',
    'const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");\n' +
      'const { MAX_PODIUM_QUESTIONS, getScaleQuestionCount, podiumQuestionTotal } = await imp("client/src/data/podiumQuestionBudget.ts");\n',
  ],
  [
    '  const ids = slots.map((m) => m.scale.id);\n',
    '  const ids = slots.map((m) => m.scale.id);\n' +
      '  const questionCounts = slots.map((m) => getScaleQuestionCount(m.scale));\n' +
      '  const questionTotal = podiumQuestionTotal(slots);\n',
  ],
  [
    '  ok(new Set(ids).size === ids.length, "Ouro/Prata/Bronze nao podem repetir escala", { ...ctx, ids });\n',
    '  ok(new Set(ids).size === ids.length, "Ouro/Prata/Bronze nao podem repetir escala", { ...ctx, ids });\n' +
      '  ok(\n' +
      '    questionTotal <= MAX_PODIUM_QUESTIONS,\n' +
      '    "REGRA DE OURO: Ouro + Prata + Bronze nao podem ultrapassar 100 perguntas",\n' +
      '    { ...ctx, ids, questionCounts, questionTotal, max: MAX_PODIUM_QUESTIONS },\n' +
      '  );\n',
  ],
]);

console.log("✓ regra de carga do pódio aplicada: Ouro + Prata + Bronze <= 100");
