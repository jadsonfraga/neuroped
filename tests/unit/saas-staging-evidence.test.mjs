import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const output = path.join(os.tmpdir(), `saas-staging-evidence-${process.pid}.json`);
try {
  execFileSync("node", ["scripts/guards/saas-staging-evidence.mjs", "--environment", "staging", "--database", "neuroped-staging", "--out", output], { cwd: root, stdio: "pipe" });
  const evidence = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.equal(evidence.evidenceType, "saas-production-gate");
  assert.equal(evidence.environment, "staging");
  assert.equal(evidence.migrationRange, "0016-0024");
  assert.equal(evidence.checks.metadataOnly, true);
  assert.equal(evidence.checks.secretsValuesExposed, false);
  assert.equal(evidence.checks.phiExposed, false);
  assert.equal(evidence.checks.clinicalLiveMutated, false);
  assert.equal(evidence.checks.remoteMigrationApplied, false);
  assert.equal(evidence.rollback.automaticDownMigration, false);
  assert.match(evidence.manifestDigestSha256, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(evidence), /CLINICAL_DATA_KEY|OPERATIONAL_DATA_KEY|patient|prontuário|email/i);
} finally {
  fs.rmSync(output, { force: true });
}
console.log("[saas-staging-evidence] ✓ evidência staging metadata-only e rollback forward-only validados");
