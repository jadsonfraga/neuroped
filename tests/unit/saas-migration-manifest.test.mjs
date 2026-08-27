import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "docs/saas-migration-manifest.sha256");
const lines = fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#"));
assert.equal(lines.shift(), "schemaVersion=1");
const entries = lines.map((line) => {
  const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/i);
  assert.ok(match, `linha inválida no manifesto: ${line}`);
  return { sha256: match[1], file: match[2] };
});
const expectedFiles = [
  "db/migrations/0016_saas_control_plane_hardening.sql",
  "db/migrations/0017_saas_membership_invites.sql",
  "db/migrations/0018_saas_privacy_governance.sql",
  "db/migrations/0019_saas_integrations_control.sql",
  "db/migrations/0020_saas_integration_idempotency.sql",
  "db/migrations/0021_saas_backup_evidence_append_only.sql",
  "db/migrations/0022_saas_webhook_deliveries.sql",
  "db/migrations/0023_saas_incident_events.sql",
];
assert.deepEqual(entries.map((item) => item.file), expectedFiles);
for (const item of entries) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, item.file))).digest("hex");
  assert.equal(item.sha256, actual, `${item.file} divergiu do manifesto`);
}
execFileSync("node", ["scripts/guards/saas-migration-manifest.mjs", "--check"], { cwd: root, stdio: "pipe" });
const workflow = fs.readFileSync(path.join(root, ".github/workflows/saas-production-gates.yml"), "utf8");
const rollback = fs.readFileSync(path.join(root, "docs/saas-migration-rollback.md"), "utf8");
assert.match(workflow, /rollback_reference/);
assert.match(workflow, /saas-migration-manifest/);
assert.match(workflow, /apply_migrations == true/);
assert.match(rollback, /forward-only/);
assert.match(rollback, /down migration/);
console.log("[saas-migration-manifest] ✓ hashes, ordem, preflight e rollback forward-only validados");
