import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const workflowsDir = join(repoRoot, ".github/workflows");
const workflowFiles = readdirSync(workflowsDir).filter((file) => /\.ya?ml$/.test(file));

for (const file of workflowFiles) {
  const source = readFileSync(join(workflowsDir, file), "utf8");

  for (const match of source.matchAll(/\b(?:scripts|tests)\/[A-Za-z0-9._/-]+/g)) {
    assert.ok(existsSync(join(repoRoot, match[0])), `${file}: referência local inexistente (${match[0]})`);
  }

  if (file !== "pr-check.yml") {
    assert.doesNotMatch(
      source,
      /run:\s*npm run verify\s*\n\s*continue-on-error:\s*true/,
      `${file}: a catraca canônica não pode ser convertida em sucesso`,
    );
  }
}

const prCheck = readFileSync(join(workflowsDir, "pr-check.yml"), "utf8");
assert.match(prCheck, /const allPassed = buildStatus && typecheckStatus && lintStatus;/);
assert.match(prCheck, /github\.event\.pull_request\.head\.sha/);
assert.match(prCheck, /github\.rest\.issues\.updateComment/);
assert.match(prCheck, /steps\.build\.outcome == 'failure'/);
assert.match(prCheck, /steps\.typecheck\.outcome == 'failure'/);
assert.match(prCheck, /steps\.lint\.outputs\.lint_status == 'failed'/);

const securityAudit = readFileSync(join(workflowsDir, "security-audit.yml"), "utf8");
assert.equal(
  Array.from(securityAudit.matchAll(/github\.paginate\(github\.rest\.issues\.listForRepo/g)).length,
  2,
  "a abertura e o fechamento de alertas devem percorrer todas as issues abertas",
);

const testAndBuild = readFileSync(join(workflowsDir, "test-and-build.yml"), "utf8");
assert.doesNotMatch(testAndBuild, /blockingRules\.test\.ts/);
assert.match(testAndBuild, /needs: \[quality, build, production-readiness\]/);
assert.match(testAndBuild, /needs\.production-readiness\.result.*!= "success"/);

console.log(`✅ WORKFLOWS DE CI OK — ${workflowFiles.length} arquivos auditados.`);
