import assert from "node:assert/strict";
import {
  asaasBaseUrl,
  amountCentsFromWebhook,
  webhookEventKey,
  webhookExternalReference,
} from "../../functions/api/billing/_provider";
import { BillingCustomerStatus, nextBillingStatus } from "../../shared/billing";

assert.equal(asaasBaseUrl({ ASAAS_ENVIRONMENT: "sandbox" }), "https://api-sandbox.asaas.com/v3");
assert.equal(asaasBaseUrl({ ASAAS_ENVIRONMENT: "production" }), "https://api.asaas.com/v3");
assert.throws(() => asaasBaseUrl({ ASAAS_ENVIRONMENT: "invalid" }), /ASAAS_ENVIRONMENT_INVALID/);

assert.equal(webhookEventKey({ id: "evt_1" }), "asaas:evt_1");
assert.throws(() => webhookEventKey({}), /ASAAS_EVENT_ID_REQUIRED/);

assert.equal(
  webhookExternalReference({ checkout: { externalReference: "neuroped:customer:checkout" } }),
  "neuroped:customer:checkout",
);
assert.equal(
  amountCentsFromWebhook({ payment: { value: 99.9 } }),
  9990,
);

assert.equal(
  nextBillingStatus(BillingCustomerStatus.Canceled, "payment_succeeded"),
  BillingCustomerStatus.Canceled,
);

console.log("saas-billing-provider: assertions passed");
