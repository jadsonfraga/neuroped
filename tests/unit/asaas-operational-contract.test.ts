import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { onRequestPost as webhookPost } from "../../functions/api/billing/webhook";
import {
  assertAsaasOutboundContract,
  createAsaasRecurringCheckout,
  describeAsaasOperationalContract,
  probeAsaasReadOnly,
  validateAsaasWebhook,
} from "../../functions/api/billing/_provider";

const TOKEN = "token-webhook-operacional-32-chars-min";
const PUBLIC_URL = "https://neuroped.example";
const SENTINEL_KEY = "$aact_hmlg_SENTINELA_NAO_IMPRIMIR_9f3c";

function sandboxEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    ASAAS_API_KEY: "asaas-chave-sintetica-sandbox",
    ASAAS_WEBHOOK_TOKEN: TOKEN,
    ASAAS_ENVIRONMENT: "sandbox",
    AUTH_PUBLIC_APP_URL: PUBLIC_URL,
    ...overrides,
  };
}

const ausente = describeAsaasOperationalContract({});
assert.equal(ausente.pronto, false);
assert.equal(ausente.blockedExternal, true);
assert.equal(ausente.code, "ASAAS_ENVIRONMENT_NOT_CONFIGURED");
assert.equal(ausente.cobrancaExterna, "BLOCKED_EXTERNAL");
assert.equal(ausente.cobrancaComprovada, false);
assert.equal(ausente.receitaCentavos, 0);
assert.equal(ausente.ambiente, null);

const producaoSemPrefixo = describeAsaasOperationalContract(sandboxEnv({
  ASAAS_ENVIRONMENT: "production",
  ASAAS_API_KEY: "chave-sem-prefixo-de-producao",
}));
assert.equal(producaoSemPrefixo.pronto, false);
assert.equal(producaoSemPrefixo.code, "ASAAS_API_KEY_ENVIRONMENT_MISMATCH");
assert.equal(producaoSemPrefixo.cobrancaComprovada, false);

const producaoComSandbox = describeAsaasOperationalContract(sandboxEnv({
  ASAAS_ENVIRONMENT: "production",
  ASAAS_API_KEY: "$aact_hmlg_sintetica_nao_real",
}));
assert.equal(producaoComSandbox.code, "ASAAS_API_KEY_ENVIRONMENT_MISMATCH");

const sandboxComProducao = describeAsaasOperationalContract(sandboxEnv({
  ASAAS_API_KEY: "$aact_prod_sintetica_nao_real",
}));
assert.equal(sandboxComProducao.code, "ASAAS_API_KEY_ENVIRONMENT_MISMATCH");

const tokenCurto = describeAsaasOperationalContract(sandboxEnv({
  ASAAS_WEBHOOK_TOKEN: "curto",
}));
assert.equal(tokenCurto.code, "ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED");

const tokenChave = describeAsaasOperationalContract(sandboxEnv({
  ASAAS_WEBHOOK_TOKEN: "$aact_hmlg_isso_nao_e_token_webhook",
}));
assert.equal(tokenChave.code, "ASAAS_WEBHOOK_TOKEN_INVALID");

const localPronto = describeAsaasOperationalContract(sandboxEnv());
assert.equal(localPronto.pronto, true);
assert.equal(localPronto.code, "ASAAS_CONTRACT_READY");
assert.equal(localPronto.blockedExternal, false);
assert.equal(localPronto.ambiente, "sandbox");
assert.equal(localPronto.host, "api-sandbox.asaas.com");
assert.equal(localPronto.cobrancaExterna, "BLOCKED_EXTERNAL");
assert.equal(localPronto.cobrancaComprovada, false);
assert.equal(localPronto.receitaCentavos, 0);
assert.doesNotMatch(JSON.stringify(localPronto), /asaas-chave-sintetica-sandbox/);

const producaoHttp = describeAsaasOperationalContract(sandboxEnv({
  ASAAS_ENVIRONMENT: "production",
  ASAAS_API_KEY: "$aact_prod_sintetica_nao_real",
  AUTH_PUBLIC_APP_URL: "http://neuroped.example",
}));
assert.equal(producaoHttp.code, "APP_BASE_URL_INSECURE");
assert.equal(producaoHttp.cobrancaComprovada, false);

const producaoPronta = describeAsaasOperationalContract(sandboxEnv({
  ASAAS_ENVIRONMENT: "production",
  ASAAS_API_KEY: "$aact_prod_sintetica_nao_real",
}));
assert.equal(producaoPronta.pronto, true);
assert.equal(producaoPronta.ambiente, "production");
assert.equal(producaoPronta.host, "api.asaas.com");
assert.equal(producaoPronta.cobrancaComprovada, false);

let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error("FETCH_NAO_DEVERIA_OCORRER");
}) as typeof fetch;
try {
  await assert.rejects(
    () => createAsaasRecurringCheckout(sandboxEnv({ ASAAS_ENVIRONMENT: undefined, ASAAS_WEBHOOK_TOKEN: undefined }), {
      externalReference: "neuroped:sintetico",
      seats: 1,
    }),
    /ASAAS_ENVIRONMENT_NOT_CONFIGURED|ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED|ASAAS_API_KEY_ENVIRONMENT_MISMATCH/,
  );
  await assert.rejects(
    () => createAsaasRecurringCheckout(sandboxEnv({
      ASAAS_ENVIRONMENT: "production",
      ASAAS_API_KEY: "$aact_hmlg_sintetica_nao_real",
    }), { externalReference: "neuroped:sintetico", seats: 1 }),
    /ASAAS_API_KEY_ENVIRONMENT_MISMATCH/,
  );
  assert.equal(fetchCalls, 0, "contrato incompleto não chama o provedor");
} finally {
  globalThis.fetch = originalFetch;
}

const target = assertAsaasOutboundContract(sandboxEnv({
  ASAAS_ENVIRONMENT: "production",
  ASAAS_API_KEY: "$aact_prod_sintetica_nao_real",
}));
assert.equal(target.baseUrl, "https://api.asaas.com/v3");
assert.equal(target.environment, "production");

let probeUrl = "";
let probeMethod = "";
const probe = await probeAsaasReadOnly(sandboxEnv(), async (url, init) => {
  probeUrl = String(url);
  probeMethod = init?.method ?? "";
  return new Response("{}", { status: 200 });
});
assert.equal(probe.ok, true);
assert.equal(probe.code, "ASAAS_READ_PROBE_OK");
assert.equal(probeMethod, "GET");
assert.equal(probeUrl, "https://api-sandbox.asaas.com/v3/customers?limit=1");

const rejeitada = await probeAsaasReadOnly(sandboxEnv(), async () => new Response("{}", { status: 401 }));
assert.equal(rejeitada.ok, false);
assert.equal(rejeitada.code, "ASAAS_CREDENTIAL_REJECTED");

await assert.rejects(
  () => probeAsaasReadOnly(sandboxEnv({ ASAAS_ENVIRONMENT: "production" })),
  /ASAAS_API_KEY_ENVIRONMENT_MISMATCH/,
);

const request = new Request("https://neuroped.example/api/billing/webhook", {
  method: "POST",
  headers: { "content-type": "application/json", "asaas-access-token": TOKEN },
  body: "{}",
});
assert.equal(validateAsaasWebhook(request, sandboxEnv()), true);
assert.throws(
  () => validateAsaasWebhook(request, sandboxEnv({ ASAAS_WEBHOOK_TOKEN: undefined })),
  /ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED/,
);

const webhook = await webhookPost({
  env: {
    DB: { prepare() { throw new Error("NAO_DEVE_CONSULTAR"); } },
  },
  request: new Request("https://neuroped.example/api/billing/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: "evt", event: "PAYMENT_CONFIRMED" }),
  }),
} as never);
assert.equal(webhook.status, 503);
assert.equal((await webhook.json() as { code: string }).code, "WEBHOOK_NOT_CONFIGURED");

function runContract(extraEnv: Record<string, string | undefined>, args: string[] = []) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/asaas-operational-contract.mts", ...args],
    {
      cwd: new URL("../..", import.meta.url),
      env: { ...process.env, ...extraEnv },
      encoding: "utf8",
    },
  );
}

const bloqueado = runContract({
  ASAAS_API_KEY: "",
  ASAAS_WEBHOOK_TOKEN: "",
  ASAAS_ENVIRONMENT: "",
  APP_BASE_URL: "",
  AUTH_PUBLIC_APP_URL: "",
}, ["--probe"]);
assert.equal(bloqueado.status, 2);
const bloqueadoJson = JSON.parse(bloqueado.stdout) as {
  efeito: string;
  cobrancaComprovada: boolean;
  receitaCentavos: number;
  probe: string;
};
assert.equal(bloqueadoJson.efeito, "BLOCKED_EXTERNAL");
assert.equal(bloqueadoJson.cobrancaComprovada, false);
assert.equal(bloqueadoJson.receitaCentavos, 0);
assert.equal(bloqueadoJson.probe, "nao_executado");
assert.doesNotMatch(`${bloqueado.stdout}${bloqueado.stderr}`, /MRR|cliente pagante|receita comprovada/i);

const vazamento = runContract({
  ASAAS_API_KEY: SENTINEL_KEY,
  ASAAS_WEBHOOK_TOKEN: TOKEN,
  ASAAS_ENVIRONMENT: "production",
  AUTH_PUBLIC_APP_URL: PUBLIC_URL,
});
assert.equal(vazamento.status, 2);
assert.equal(JSON.parse(vazamento.stdout).code, "ASAAS_API_KEY_ENVIRONMENT_MISMATCH");
assert.doesNotMatch(`${vazamento.stdout}${vazamento.stderr}`, /SENTINELA_NAO_IMPRIMIR/);

const script = readFileSync(new URL("../../scripts/asaas-operational-contract.mts", import.meta.url), "utf8");
assert.doesNotMatch(script, /\/checkouts|\/payments|charge_paid/);
const runbook = readFileSync(new URL("../../docs/ASAAS_OPERATIONAL_CONTRACT.md", import.meta.url), "utf8");
assert.match(runbook, /asaas-operational-contract\.mts/);
assert.match(runbook, /BLOCKED_EXTERNAL/);
assert.match(runbook, /charge_paid/);
assert.match(runbook, /não\s+comprova cobrança/i);

console.log("✓ contrato operacional Asaas: fail-closed, sem cobrança presumida, runbook presente");
