import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const securityAudit = read(".github/workflows/security-audit.yml");
const prCheck = read(".github/workflows/pr-check.yml");

assert.match(securityAudit, /set -euo pipefail/);
assert.match(securityAudit, /if \[ "\$audit_exit" -gt 1 \]/);
assert.match(securityAudit, /python3 - "\$report"/);
assert.match(securityAudit, /npm audit --json "\$@"/);
assert.match(
  securityAudit,
  /run_audit audit-production-report\.json --omit=dev/,
);
assert.doesNotMatch(securityAudit, /npm audit[^\n]*\|\| true/);
assert.doesNotMatch(securityAudit, /\|\| echo "0"/);
assert.match(securityAudit, /Alerta de vulnerabilidades high\/critical/);
assert.match(
  securityAudit,
  /github\.paginate\(github\.rest\.issues\.listForRepo/,
);
assert.match(securityAudit, /state: "all"/);
assert.match(securityAudit, /state_reason = "reopened"/);
assert.match(securityAudit, /state_reason: "not_planned"/);
assert.match(securityAudit, /state_reason: "completed"/);

assert.match(prCheck, /issues: write/);
assert.match(prCheck, /- name: Lint\s+id: lint\s+run: npm run lint/);
assert.doesNotMatch(prCheck, /npm run lint --if-present/);
assert.match(
  prCheck,
  /const ready = buildStatus && typecheckStatus && lintStatus/,
);
assert.match(prCheck, /<!-- neuroped-pr-check -->/);
assert.match(prCheck, /github\.paginate\(github\.rest\.issues\.listComments/);
assert.match(prCheck, /github\.rest\.issues\.updateComment/);

console.log(
  "✓ workflows falham fechado e não emitem sinais ou alertas duplicados",
);
