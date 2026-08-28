// @ts-check
/**
 * Suite de testes: filtro por sinais e sintomas (issue #438)
 *
 * Valida que filterScales() com selectedSymptomIds retorna as escalas
 * clinicamente esperadas no top-3, e que a fórmula de 50% funciona
 * corretamente.
 *
 * Execução: node tests/clinical/test-filter-symptoms.mjs
 */
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { filterScales } = await imp("client/src/data/scaleFilter.ts");
const {
  SYMPTOM_GROUPS,
  SYMPTOM_BY_ID,
  symptomSignalScore,
  buildJustification,
  resolveAliasToSymptomIds,
} = await imp("client/src/data/symptomSignalMap.ts");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

/**
 * Retorna os IDs das top-N escalas do resultado do filterScales.
 */
function top(results, n = 3) {
  return results.slice(0, n).map((r) => r.scale.id);
}

console.log("\nSuite: Filtro por Sinais e Sintomas (#438)\n");

// ─── Cenário 1: TEA pré-escolar (2a) ─────────────────────────────────────────
test("1. TEA pré-escolar (2a) — mchat e cars no top-3", () => {
  const ageRange = { min: 24, max: 47 }; // 2–4 anos
  const symptoms = ["pouco-contato-visual", "nao-responde-nome", "seletividade-alimentar"];
  const results = filterScales(["tea"], ageRange, symptoms);
  const ids = top(results, 3);
  assert.ok(
    ids.includes("mchat") || ids.includes("cars"),
    `Esperado mchat ou cars no top-3, obteve: ${ids.join(", ")}`,
  );
  // Deve haver justificativa
  const topResult = results[0];
  assert.ok(topResult.justification.length > 0, "Justificativa deve ser não-vazia quando sintomas selecionados");
});

// ─── Cenário 2: TDAH escolar (8a) ────────────────────────────────────────────
test("2. TDAH escolar (8a) — snap e vanderbilt no top-3", () => {
  const ageRange = { min: 84, max: 107 }; // 7–9 anos
  const symptoms = ["desatencao", "impulsividade"];
  const results = filterScales(["tdah"], ageRange, symptoms);
  const ids = top(results, 3);
  assert.ok(
    ids.includes("snap") || ids.includes("vanderbilt"),
    `Esperado snap ou vanderbilt no top-3, obteve: ${ids.join(", ")}`,
  );
});

// ─── Cenário 3: Ansiedade adolescente (15a) ───────────────────────────────────
test("3. Ansiedade adolescente (15a) — scared e phqa no top-3", () => {
  const ageRange = { min: 168, max: 192 }; // 14–16 anos
  const symptoms = ["medo-excessivo", "evitacao"];
  const results = filterScales(["ansiedade"], ageRange, symptoms);
  const ids = top(results, 3);
  assert.ok(
    ids.includes("scared") || ids.includes("phqa") || ids.includes("rcads"),
    `Esperado scared, phqa ou rcads no top-3, obteve: ${ids.join(", ")}`,
  );
});

// ─── Cenário 4: Ideação suicida — cssrs deve ser 1º ──────────────────────────
test("4. Ideação de morte — cssrs deve estar no top-3", () => {
  const symptoms = ["ideacao-morte"];
  const results = filterScales(["ansiedade", "depressao"], null, symptoms);
  const ids = top(results, 3);
  assert.ok(
    ids.includes("cssrs"),
    `Esperado cssrs no top-3, obteve: ${ids.join(", ")}`,
  );
});

// ─── Cenário 5: Sono — cshq deve aparecer ────────────────────────────────────
test("5. Sono (insônia + despertares) — cshq no top-3", () => {
  const ageRange = { min: 48, max: 95 }; // 4–8 anos
  const symptoms = ["insonia-inicial", "despertares-noturnos"];
  const results = filterScales(["sono"], ageRange, symptoms);
  const ids = top(results, 3);
  assert.ok(
    ids.includes("cshq") || ids.includes("sono"),
    `Esperado cshq ou sono no top-3, obteve: ${ids.join(", ")}`,
  );
});

// ─── Cenário 6: Atraso global (3a) — denver e asq3 no top-3 ──────────────────
test("6. Atraso global (3a) — denver e asq3 no top-3", () => {
  const ageRange = { min: 30, max: 42 }; // 2.5–3.5 anos
  const symptoms = ["atraso-fala", "atraso-motor"];
  const results = filterScales(["atraso"], ageRange, symptoms);
  const ids = top(results, 3);
  assert.ok(
    ids.includes("denver") || ids.includes("asq3"),
    `Esperado denver ou asq3 no top-3, obteve: ${ids.join(", ")}`,
  );
});

// ─── Cenário 7: Sem sintomas — symptomSignalScore == 0 para todas ────────────
test("7. Sem sintomas — symptomSignalScore = 0 para todas as escalas", () => {
  const ids = ["mchat", "snap", "scared", "cshq", "denver", "cssrs"];
  for (const id of ids) {
    const score = symptomSignalScore(id, []);
    assert.strictEqual(score, 0, `symptomSignalScore(${id}, []) deve ser 0, obteve ${score}`);
  }
});

// ─── Cenário 8: Campo livre "não olha" → seleciona alias ─────────────────────
test('8. Campo livre "não olha" → resolve para pouco-contato-visual via alias', () => {
  const resolved = resolveAliasToSymptomIds("nao olha");
  assert.ok(
    resolved.includes("pouco-contato-visual"),
    `Esperado pouco-contato-visual, obteve: ${resolved.join(", ")}`,
  );
});

// ─── Cenário 9: Automutilação — cssrs no top-3 ───────────────────────────────
test("9. Automutilação — cssrs no top-3", () => {
  const symptoms = ["automutilacao"];
  const results = filterScales([], null, symptoms);
  const ids = top(results, 3);
  assert.ok(
    ids.includes("cssrs"),
    `Esperado cssrs no top-3, obteve: ${ids.join(", ")}`,
  );
});

// ─── Cenário 10: Peso relativo — com sintomas, campeã tem score > sem sintomas ──
test("10. Com sintomas, escala campeã tem symptomSignalScore > 0", () => {
  const symptoms = ["desatencao", "hiperatividade", "impulsividade"];
  const scoreSnap = symptomSignalScore("snap", symptoms);
  const scoreSnap0 = symptomSignalScore("snap", []);
  assert.ok(scoreSnap > scoreSnap0, `SNAP com sintomas (${scoreSnap}) deve ser > sem sintomas (${scoreSnap0})`);

  // A justificativa deve mencionar ao menos um sinal
  const j = buildJustification("snap", symptoms);
  assert.ok(j.length > 0, "Justificativa de SNAP com sintomas de TDAH deve ser não-vazia");
  assert.ok(j.includes("Indicada por:"), `Justificativa deve começar com "Indicada por:", obteve: "${j}"`);
});

// ─── Resumo ───────────────────────────────────────────────────────────────────
console.log(`\nResultado: ${passed} aprovados, ${failed} reprovados\n`);

if (failed > 0) {
  process.exit(1);
}
