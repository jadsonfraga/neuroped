import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL(`../../${relative}`, import.meta.url), "utf8");

const billingMe = read("functions/api/billing/me.ts");
const liveMiddleware = read("functions/api/live/_middleware.ts");
const entitlement = read("server/lib/billingEntitlement.ts");
const migrationWorkflow = read(".github/workflows/saas-billing-d1-migration.yml");
const provider = read("functions/api/billing/_provider.ts");
const checkout = read("functions/api/billing/checkout.ts");
const webhook = read("functions/api/billing/webhook.ts");

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
assert.doesNotMatch(provider, /\?\? "sandbox"/, "ambiente ausente não pode cair em sandbox");
assert.match(provider, /\$aact_prod_/);
assert.match(provider, /ASAAS_API_KEY_ENVIRONMENT_MISMATCH/);
assert.match(provider, /assertAsaasOutboundContract/);
assert.match(provider, /customers\?limit=1/);
assert.doesNotMatch(provider, /method:\s*"POST"[\s\S]{0,80}customers\?limit=1/);
assert.match(checkout, /BILLING_PROVIDER_NOT_CONFIGURED/);
assert.match(webhook, /idempotency_key/);
assert.match(webhook, /charge_paid/);
assert.match(webhook, /SET status = 'active'/);

console.log("saas-billing-production-wiring: rotas, entitlement e migração de produção aprovados ✔");
