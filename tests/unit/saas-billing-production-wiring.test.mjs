import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL(`../../${relative}`, import.meta.url), "utf8");

const billingMe = read("functions/api/billing/me.ts");
const liveMiddleware = read("functions/api/live/_middleware.ts");
const entitlement = read("server/lib/billingEntitlement.ts");
const migrationWorkflow = read(".github/workflows/saas-billing-d1-migration.yml");
const soloMigrationWorkflow = read(".github/workflows/saas-billing-trial-seats.yml");
const billingSecurityWorkflow = read(".github/workflows/billing-security-guard.yml");
const pkg = JSON.parse(read("package.json"));

assert.match(billingMe, /export const onRequestGet/);
assert.match(billingMe, /getContextUser/);
assert.match(billingMe, /BILLING_SCOPE_INVALID/);
assert.match(liveMiddleware, /requireBillingEntitlement/);
assert.match(liveMiddleware, /BILLING_CLINIC_CONTEXT_REQUIRED/);
assert.match(entitlement, /trialEndsAt/);
assert.match(entitlement, /trialValid/);
assert.match(entitlement, /cust === "suspended"/);
assert.match(entitlement, /past_due sem carência válida/);
assert.match(migrationWorkflow, /0012_saas_billing_onboarding\.sql/);
assert.match(migrationWorkflow, /0013_saas_billing_provider\.sql/);
assert.match(migrationWorkflow, /pragma_table_info/);
assert.match(migrationWorkflow, /0013-post-alter\.sql/);
assert.match(migrationWorkflow, /billing_provider_checkouts/);
assert.match(migrationWorkflow, /trg_billing_customer_cancel_terminal/);
for (const [name, workflow] of [
  ["migração principal", migrationWorkflow],
  ["migração Solo", soloMigrationWorkflow],
]) {
  assert.match(
    workflow,
    /--file=.*0038_neuroped_solo_default_seat\.sql/,
    `${name} deve aplicar 0038 como autoridade final do trigger`,
  );
  assert.doesNotMatch(
    workflow,
    /--file=.*0015_saas_billing_trial_seats_hardening\.sql/,
    `${name} não pode reaplicar 0015 e converter trials Solo para dois assentos`,
  );
  assert.match(workflow, /SOLO_TRIGGER_OK/, `${name} deve provar o default físico de um assento`);
  assert.match(workflow, /SOLO_TRIAL_POLICY_OK/, `${name} deve provar assentos suficientes sem impor dois`);
}

const saasSuite = pkg.scripts["test:saas-self-service"];
for (const testFile of [
  "saas-solo-billing-foundation.test.ts",
  "solo-billing-ui.test.ts",
  "solo-onboarding-projection.test.ts",
]) {
  assert.match(saasSuite, new RegExp(testFile.replaceAll(".", "\\.")), `${testFile} deve integrar a suíte SaaS`);
  assert.match(billingSecurityWorkflow, new RegExp(testFile.replaceAll(".", "\\.")), `${testFile} deve rodar no workflow de billing`);
}
assert.match(billingSecurityWorkflow, /0038_neuroped_solo_default_seat\.sql/);

console.log("saas-billing-production-wiring: rotas, entitlement e migração de produção aprovados ✔");
