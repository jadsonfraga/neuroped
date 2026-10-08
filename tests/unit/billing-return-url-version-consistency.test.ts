import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkoutReturnBaseUrl, createAsaasRecurringCheckout } from "../../functions/api/billing/_provider";
import { onRequestGet as versionGet } from "../../functions/api/version";

// 1) Base dos retornos do checkout: AUTH_PUBLIC_APP_URL basta (é o que o
//    go-live e os convites exigem); APP_BASE_URL, se existir, tem precedência.
assert.equal(
  checkoutReturnBaseUrl({ AUTH_PUBLIC_APP_URL: "https://neuroped.pages.dev" }).origin,
  "https://neuroped.pages.dev",
);
assert.equal(
  checkoutReturnBaseUrl({ APP_BASE_URL: "https://app.exemplo.test", AUTH_PUBLIC_APP_URL: "https://neuroped.pages.dev" }).origin,
  "https://app.exemplo.test",
);
assert.equal(
  checkoutReturnBaseUrl({ APP_BASE_URL: "   ", AUTH_PUBLIC_APP_URL: "https://neuroped.pages.dev" }).origin,
  "https://neuroped.pages.dev",
);
assert.throws(() => checkoutReturnBaseUrl({}), /APP_BASE_URL_NOT_CONFIGURED/);

// 2) Checkout real (fetch sintético): só com as variáveis que o go-live
//    verifica, o payload sai com os retornos no hash do SPA.
const originalFetch = globalThis.fetch;
let sentBody: Record<string, any> | null = null;
globalThis.fetch = (async (_url: string, init?: RequestInit) => {
  sentBody = JSON.parse(String(init?.body));
  return new Response(JSON.stringify({ id: "chk_sintetico", link: "https://sandbox.asaas.test/c/1" }), { status: 200 });
}) as typeof fetch;
try {
  const checkout = await createAsaasRecurringCheckout(
    {
      ASAAS_API_KEY: "chave-sintetica-de-teste-0001",
      ASAAS_WEBHOOK_TOKEN: "x".repeat(32),
      ASAAS_ENVIRONMENT: "sandbox",
      AUTH_PUBLIC_APP_URL: "https://neuroped.pages.dev/",
    },
    { externalReference: "neuroped:teste", seats: 1 },
  );
  assert.equal(checkout.id, "chk_sintetico");
  assert.equal(sentBody?.callback?.successUrl, "https://neuroped.pages.dev/#/billing/retorno?status=success");
} finally {
  globalThis.fetch = originalFetch;
}

// 3) /api/version não publica mais o bloco fixo que contradizia /api/health.
const response = await versionGet({} as Parameters<typeof versionGet>[0]);
const body = await response.json() as Record<string, unknown>;
assert.equal(body.features, undefined);
assert.equal(body.readiness, "/api/health");
assert.doesNotMatch(JSON.stringify(body), /DEMO_HOMOLOGACAO|realPatientsEnabled/);

// 4) Documentação alinhada ao nome real da variável dos convites.
const doc = readFileSync(new URL("../../docs/saas-live-clinical-rollout.md", import.meta.url), "utf8");
assert.doesNotMatch(doc, /convite exige `APP_BASE_URL`/);

console.log("✓ checkout usa AUTH_PUBLIC_APP_URL, /api/version sem estado fixo enganoso, doc alinhada");
