import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/cert-retirement-smoke.yml", "utf8");
assert.match(workflow, /workflow_run:/);
assert.match(workflow, /Deploy Cloudflare Pages/);
assert.match(workflow, /head_branch == 'main'/);
assert.match(workflow, /\/api\/cert/);
assert.match(workflow, /410 Gone|HTTP 410/);
assert.match(workflow, /CERT_ENDPOINT_RETIRED/);

console.log("[cert-retirement-workflow] ✓ smoke pós-deploy exige 410 / CERT_ENDPOINT_RETIRED na main.");
