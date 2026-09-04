import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const migration = read("db/migrations/0018_saas_remote_intake.sql");
const publicEndpoint = read("functions/api/public-intake.ts");
const staffEndpoint = read("functions/api/live/intake/index.ts");
const shared = read("functions/api/intake/_shared.ts");
const middleware = read("functions/api/_middleware.ts");
const publicJs = read("client/public/intake.js");
const publicHtml = read("client/public/intake.html");
const publicHeaders = read("client/public/_headers");
const cockpit = read("client/src/components/clinical/PatientCockpit.tsx");
const intakePanel = read("client/src/components/clinical/RemoteIntakePanel.tsx");

assert.match(migration, /token_hash TEXT NOT NULL/);
assert.doesNotMatch(migration, /\btoken\s+TEXT\b/);
assert.match(migration, /payload_encrypted TEXT NOT NULL/);
assert.match(migration, /review_status[^\n]+pending[^\n]+accepted[^\n]+rejected/);
assert.match(migration, /trg_live_intake_submission_matches_invitation/);

assert.match(shared, /clinicalBlindIndex\(env, clinicId, "remote-intake-token", secret\)/);
assert.match(shared, /crypto\.getRandomValues/);
assert.match(shared, /constantTimeTextEqual/);

assert.match(publicEndpoint, /readRemoteIntakeToken\(context\.request\)/);
assert.doesNotMatch(publicEndpoint, /searchParams\.get\(["']token["']\)/);
assert.match(publicEndpoint, /encryptClinicalJson/);
assert.match(publicEndpoint, /review_status, submitted_at/);
assert.doesNotMatch(publicEndpoint, /INSERT INTO live_clinical_events/);

assert.match(staffEndpoint, /membershipCanWriteClinical/);
assert.match(staffEndpoint, /requireBillingEntitlement/);
assert.match(staffEndpoint, /event_type, occurred_at/);
assert.match(staffEndpoint, /'document'/);
assert.match(staffEndpoint, /'imported'/);
assert.match(staffEndpoint, /provenanceSource/);
assert.match(staffEndpoint, /review_status = 'accepted'/);

assert.match(middleware, /"\/api\/public-intake"/);
assert.match(middleware, /Access-Control-Allow-Headers[^\n]+X-Tenant-Id/);

assert.match(publicHtml, /meta name="referrer" content="no-referrer"/);
assert.match(publicHtml, /noindex,nofollow,noarchive/);
assert.match(publicHtml, /http-equiv="Content-Security-Policy"/);
assert.match(publicHtml, /default-src 'none'/);
assert.match(publicHeaders, /\/intake\.html/);
assert.match(publicHeaders, /Cache-Control: no-store/);
assert.match(publicHeaders, /Referrer-Policy: no-referrer/);
assert.match(publicHeaders, /X-Frame-Options: DENY/);
assert.match(publicHeaders, /frame-ancestors 'none'/);
assert.match(publicJs, /window\.location\.hash/);
assert.match(publicJs, /history\.replaceState/);
assert.match(publicJs, /Authorization: `Intake \$\{intakeToken\}`/);
assert.doesNotMatch(publicJs, /localStorage/);
assert.doesNotMatch(publicJs, /sessionStorage/);

assert.match(cockpit, /RemoteIntakePanel/);
assert.match(intakePanel, /"X-Tenant-Id": activeClinicId/);
assert.match(intakePanel, /VITE_API_URL/);
assert.match(intakePanel, /\/intake\.html#token=/);

console.log("saas remote intake security contract: ok");
