import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { awaitsPsychometricValidation } from "../../scripts/guards/lib/catalog-validation.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const loader = import.meta.resolve("tsx");
const reviewedUnvalidated = {
  licencaUso: "autoral", pendente_validacao_clinica: false,
  validacaoBrasil: "Sem validação psicométrica publicada.",
};
test("clinical review cannot remove explicit psychometric debt", () => {
  assert.equal(awaitsPsychometricValidation(reviewedUnvalidated), true);
  assert.equal(awaitsPsychometricValidation({ tipo: "Instrumento não validado", licencaUso: "autoral" }), true);
  assert.equal(awaitsPsychometricValidation({ pendente_validacao_clinica: true }), true);
  assert.equal(awaitsPsychometricValidation({ fonte: "" }), false, "missing source is a separate axis");
  assert.equal(awaitsPsychometricValidation({ pendente_validacao_clinica: false, validacaoBrasil: "Estudo publicado" }), false);
  assert.equal(awaitsPsychometricValidation({ validacaoBrasil: null, tipo: null }), false);
});
function runFixture(count) {
  const dir = mkdtempSync(join(tmpdir(), "neuroped-validation-census-"));
  try {
    for (const file of ["scripts/guards/check-baseline.mjs", "scripts/guards/validate-catalog.mjs", "scripts/guards/scorecard.mjs", "scripts/guards/lib/catalog-validation.mjs"]) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      copyFileSync(join(root, file), join(dir, file));
    }
    writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
    for (const file of ["client/public/data/neuroped_escalas_neuropsiquiatria_infantil_100.json", "data/neuroped_escalas_neuropsiquiatria_infantil_100.json"]) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      writeFileSync(join(dir, file), "[]\n");
    }
    const scales = Array.from({ length: count }, (_, i) => ({ ...reviewedUnvalidated,
      id: `synthetic-${i}`, name: `Synthetic ${i}`, fullName: `Synthetic ${i}`,
      ageMin: 0, ageMax: 20, fonte: "Synthetic test fixture, not a clinical instrument",
    }));
    mkdirSync(join(dir, "client/src/data"), { recursive: true });
    writeFileSync(join(dir, "client/src/data/scaleFilter.ts"),
      `export const allScales = ${JSON.stringify(scales)};\nexport const allScalesComFichas = allScales;\n`);
    // Other axes are valid controls: this fixture isolates the debt ceiling.
    const baseline = { catalogRunnablePendingPsychometricValidationMax: 110,
      catalogRunnablePendingProvenanceMax: 0, catalogDocumentedPendingProvenanceMax: 0,
      catalogRunnableInstruments: 0, catalogRunnableWithFonte: 0,
      catalogRunnableReviewedWithFonte: 0, catalogDocumentedInstruments: 0,
      catalogDocumentedWithFonte: 0, typescriptErrors: 0, clinicalCasesMin: 0 };
    writeFileSync(join(dir, "scripts/guards/baseline.json"), JSON.stringify(baseline));
    mkdirSync(join(dir, "docs"));
    const run = (file) => spawnSync(process.execPath, ["--import", loader, join(dir, "scripts/guards", file)],
      { cwd: dir, encoding: "utf8", timeout: 30000, windowsHide: true });
    const scorecard = run("scorecard.mjs");
    return { report: run("validate-catalog.mjs"), gate: run("check-baseline.mjs"), scorecard,
      markdown: readFileSync(join(dir, "docs/PLACAR_9.0.md"), "utf8") };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test("real report, scorecard and release CLI count 110 reviewed-but-unvalidated instruments identically", () => {
  const { report, gate, scorecard, markdown } = runFixture(110);
  assert.equal(report.status, 0, report.stderr);
  assert.equal(gate.status, 0, gate.stderr);
  assert.match(report.stdout, /110 aguardando valida/);
  assert.match(gate.stdout, /psicom.trica pendente=110/);
  assert.equal(scorecard.status, 0, scorecard.stderr);
  assert.match(markdown, /Aguardando validação psicométrica publicada \| 110 \| máx\. 110 \| OK/);
});
test("actual release CLI rejects 111, despite completed clinical review", () => {
  const { report, gate, scorecard, markdown } = runFixture(111);
  assert.equal(report.status, 0, report.stderr);
  assert.equal(gate.status, 1, gate.stdout + gate.stderr);
  assert.match(gate.stderr, /catalogRunnablePendingPsychometricValidation: atual 111 > teto 110/);
  assert.equal(scorecard.status, 1, scorecard.stdout + scorecard.stderr);
  assert.match(markdown, /Aguardando validação psicométrica publicada \| 111 \| máx\. 110 \| REGRESSÃO/);
});
test("all three consumers import one canonical predicate", () => {
  for (const file of ["check-baseline.mjs", "validate-catalog.mjs", "scorecard.mjs"]) {
    const source = readFileSync(join(root, "scripts/guards", file), "utf8");
    assert.ok(source.includes('import { awaitsPsychometricValidation } from "./lib/catalog-validation.mjs"'));
  }
});
