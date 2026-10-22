/**
 * Contrato operacional Asaas: caminho de produção explícito e fail-closed.
 * Sem credencial, o produto declara BLOCKED_EXTERNAL e não chama o provedor.
 * Probe de conta é GET /myAccount — não cria checkout nem charge_paid.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  assessAsaasOperationalContract,
  asaasBaseUrl,
  checkoutUnavailableCode,
  createAsaasRecurringCheckout,
  probeAsaasAccount,
  validateAsaasWebhook,
} from "../../functions/api/billing/_provider";

const SECRET = "segredo-sintetico-nao-imprimir-0001";
const CONFIGURED = {
  ASAAS_API_KEY: "chave-sintetica-de-teste-0001",
  ASAAS_WEBHOOK_TOKEN: "x".repeat(32),
  ASAAS_ENVIRONMENT: "sandbox",
  AUTH_PUBLIC_APP_URL: "https://neuroped.pages.dev",
};

assert.throws(() => asaasBaseUrl({}), /ASAAS_ENVIRONMENT_NOT_CONFIGURED/);
assert.equal(asaasBaseUrl({ ASAAS_ENVIRONMENT: "Production" }), "https://api.asaas.com/v3");

const blocked = assessAsaasOperationalContract({ ASAAS_API_KEY: SECRET });
assert.equal(blocked.status, "BLOCKED_EXTERNAL");
assert.equal(blocked.code, "BLOCKED_EXTERNAL_ASAAS");
assert.deepEqual(blocked.missing, ["ASAAS_WEBHOOK_TOKEN", "ASAAS_ENVIRONMENT", "AUTH_PUBLIC_APP_URL"]);
assert.equal(JSON.stringify(blocked).includes(SECRET), false);
assert.ok(blocked.doesNotProve.includes("RECEITA"));
assert.ok(blocked.doesNotProve.includes("CLIENTE_PAGANTE"));

const ready = assessAsaasOperationalContract(CONFIGURED);
assert.equal(ready.status, "CONFIGURACAO_PRESENTE");
assert.equal(ready.environment, "sandbox");
assert.deepEqual(ready.missing, []);
assert.ok(ready.doesNotProve.includes("MRR"));

const httpBase = assessAsaasOperationalContract({
  ...CONFIGURED,
  AUTH_PUBLIC_APP_URL: "http://inseguro.test",
});
assert.equal(httpBase.status, "BLOCKED_EXTERNAL");
assert.deepEqual(httpBase.missing, ["AUTH_PUBLIC_APP_URL"]);

let fetches = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  fetches += 1;
  throw new Error("fetch não deveria ocorrer");
}) as typeof fetch;
try {
  await assert.rejects(
    () => createAsaasRecurringCheckout(
      { ...CONFIGURED, ASAAS_WEBHOOK_TOKEN: undefined },
      { externalReference: "neuroped:teste", seats: 1 },
    ),
    /ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED/,
  );
  assert.equal(fetches, 0, "checkout sem webhook não chama o provedor");
  assert.equal(
    checkoutUnavailableCode(new Error("ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED")),
    "BILLING_BLOCKED_EXTERNAL",
  );
} finally {
  globalThis.fetch = originalFetch;
}

let probeRequest: { url: string; method: string } | null = null;
const probe = await probeAsaasAccount(CONFIGURED, (async (url: string | URL | Request, init?: RequestInit) => {
  probeRequest = { url: String(url), method: init?.method ?? "GET" };
  return new Response(JSON.stringify({ email: "pessoa.real@exemplo.com", name: "Pessoa Real" }), { status: 200 });
}) as typeof fetch);
assert.equal(probe.code, "ASAAS_ACCOUNT_READ_OK");
assert.equal(probe.httpStatus, 200);
assert.equal(probeRequest?.method, "GET");
assert.equal(probeRequest?.url, "https://api-sandbox.asaas.com/v3/myAccount");
assert.equal(JSON.stringify(probe).includes("pessoa.real@exemplo.com"), false);

const rejected = await probeAsaasAccount(CONFIGURED, (async () => new Response("no", { status: 401 })) as typeof fetch);
assert.equal(rejected.code, "BLOCKED_EXTERNAL_ASAAS_CREDENTIAL_REJECTED");
assert.equal(
  checkoutUnavailableCode(new Error("ASAAS_CHECKOUT_FAILED_502")),
  "BILLING_PROVIDER_UNAVAILABLE",
);

const unconfiguredProbe = await probeAsaasAccount({});
assert.equal(unconfiguredProbe.code, "BLOCKED_EXTERNAL_ASAAS");

const provider = readFileSync("functions/api/billing/_provider.ts", "utf8");
const webhook = readFileSync("functions/api/billing/webhook.ts", "utf8");
const script = readFileSync("scripts/ops/asaas-operational-contract.ts", "utf8");
assert.doesNotMatch(provider, /ASAAS_ENVIRONMENT \?\? "sandbox"/);
assert.match(webhook, /validateAsaasWebhook/);
assert.match(webhook, /idempotency_key/);
assert.match(webhook, /charge_paid/);
assert.match(webhook, /SET status = 'active'/);
assert.match(script, /Não crie checkout nem evento charge_paid/);
assert.doesNotMatch(script, /method:\s*"POST"/);
assert.doesNotMatch(script, /\/payments/);
assert.doesNotMatch(script, /INSERT INTO billing_invoice_events/);
const ui = readFileSync("client/src/pages/configuracoes.tsx", "utf8");
assert.match(ui, /Nenhuma assinatura foi criada/);

const childEnv = { ...process.env, ASAAS_API_KEY: SECRET };
delete childEnv.ASAAS_WEBHOOK_TOKEN;
delete childEnv.ASAAS_ENVIRONMENT;
delete childEnv.APP_BASE_URL;
delete childEnv.AUTH_PUBLIC_APP_URL;
const run = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/ops/asaas-operational-contract.ts"],
  { cwd: process.cwd(), encoding: "utf8", env: childEnv },
);
assert.equal(run.status, 2);
assert.match(run.stdout, /BLOCKED_EXTERNAL_ASAAS/);
assert.equal(run.stdout.includes(SECRET), false);
assert.equal(run.stderr.includes(SECRET), false);

// Chave x ambiente e token x chave (valores 100% sintéticos).
const PROD_KEY = "$aact_prod_sintetica-nao-real-0001";
const PROD_ENV = {
  ...CONFIGURED,
  ASAAS_ENVIRONMENT: "production",
  ASAAS_API_KEY: PROD_KEY,
};
const prodOk = assessAsaasOperationalContract(PROD_ENV);
assert.equal(prodOk.status, "CONFIGURACAO_PRESENTE");
assert.equal(prodOk.environment, "production");

const prodWithSandboxKey = assessAsaasOperationalContract({ ...PROD_ENV, ASAAS_API_KEY: CONFIGURED.ASAAS_API_KEY });
assert.equal(prodWithSandboxKey.status, "BLOCKED_EXTERNAL");
assert.deepEqual(prodWithSandboxKey.missing, ["ASAAS_API_KEY_ENVIRONMENT_MISMATCH"]);

const sandboxWithProdKey = assessAsaasOperationalContract({ ...CONFIGURED, ASAAS_API_KEY: PROD_KEY });
assert.equal(sandboxWithProdKey.status, "BLOCKED_EXTERNAL");
assert.deepEqual(sandboxWithProdKey.missing, ["ASAAS_API_KEY_ENVIRONMENT_MISMATCH"]);
assert.equal(JSON.stringify(sandboxWithProdKey).includes(PROD_KEY), false);

const SHARED = "z".repeat(40);
const tokenEqualsKey = assessAsaasOperationalContract({
  ...CONFIGURED,
  ASAAS_API_KEY: SHARED,
  ASAAS_WEBHOOK_TOKEN: SHARED,
});
assert.equal(tokenEqualsKey.status, "BLOCKED_EXTERNAL");
assert.deepEqual(tokenEqualsKey.missing, ["ASAAS_WEBHOOK_TOKEN_INVALID"]);
assert.equal(JSON.stringify(tokenEqualsKey).includes(SHARED), false);

let guardFetches = 0;
globalThis.fetch = (async () => {
  guardFetches += 1;
  throw new Error("fetch não deveria ocorrer");
}) as typeof fetch;
try {
  const params = { externalReference: "neuroped:teste", seats: 1 };
  await assert.rejects(
    () => createAsaasRecurringCheckout({ ...CONFIGURED, ASAAS_API_KEY: PROD_KEY }, params),
    /ASAAS_API_KEY_ENVIRONMENT_MISMATCH/,
  );
  await assert.rejects(
    () => createAsaasRecurringCheckout({ ...PROD_ENV, ASAAS_API_KEY: CONFIGURED.ASAAS_API_KEY }, params),
    /ASAAS_API_KEY_ENVIRONMENT_MISMATCH/,
  );
  await assert.rejects(
    () => createAsaasRecurringCheckout({ ...CONFIGURED, ASAAS_API_KEY: SHARED, ASAAS_WEBHOOK_TOKEN: SHARED }, params),
    /ASAAS_WEBHOOK_TOKEN_INVALID/,
  );
  assert.equal(guardFetches, 0, "recusa antes de qualquer chamada ao provedor");
} finally {
  globalThis.fetch = originalFetch;
}
for (const code of ["ASAAS_API_KEY_ENVIRONMENT_MISMATCH", "ASAAS_WEBHOOK_TOKEN_INVALID"]) {
  assert.equal(checkoutUnavailableCode(new Error(code)), "BILLING_BLOCKED_EXTERNAL");
}
assert.throws(
  () => validateAsaasWebhook(
    new Request("https://x.test/api/billing/webhook", { headers: { "asaas-access-token": SHARED } }),
    { ASAAS_API_KEY: SHARED, ASAAS_WEBHOOK_TOKEN: SHARED },
  ),
  /ASAAS_WEBHOOK_TOKEN_INVALID/,
);
assert.equal(
  validateAsaasWebhook(
    new Request("https://x.test/api/billing/webhook", { headers: { "asaas-access-token": CONFIGURED.ASAAS_WEBHOOK_TOKEN } }),
    CONFIGURED,
  ),
  true,
);

console.log("asaas operational contract: fail-closed, sem cobrança simulada ✔");
