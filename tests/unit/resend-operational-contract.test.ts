/**
 * Contrato operacional Resend: sem provedor, BLOCKED_EXTERNAL.
 * Probe é GET /domains. Não envia mensagem e não marca e-mail verificado.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  assessResendOperationalContract,
  probeResendAccount,
  sendTransactionalEmail,
} from "../../functions/api/auth/_mailTransport";

const SECRET = "re_segredo-sintetico-nao-imprimir";
const CONFIGURED = {
  AUTH_PUBLIC_APP_URL: "https://neuroped.pages.dev",
  AUTH_RESEND_API_KEY: "re_chave_sintetica_de_teste",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@exemplo.test>",
};

const blocked = assessResendOperationalContract({ AUTH_RESEND_API_KEY: SECRET });
assert.equal(blocked.status, "BLOCKED_EXTERNAL");
assert.equal(blocked.code, "BLOCKED_EXTERNAL_RESEND");
assert.deepEqual(blocked.missing, ["AUTH_PUBLIC_APP_URL", "AUTH_EMAIL_FROM"]);
assert.equal(JSON.stringify(blocked).includes(SECRET), false);
assert.ok(blocked.doesNotProve.includes("EMAIL_VERIFICADO"));
assert.ok(blocked.doesNotProve.includes("ENTREGA_REAL"));

const ready = assessResendOperationalContract(CONFIGURED);
assert.equal(ready.status, "CONFIGURACAO_PRESENTE");
assert.deepEqual(ready.missing, []);
assert.ok(ready.doesNotProve.includes("CONVITE_ENTREGUE"));

const httpBase = assessResendOperationalContract({
  ...CONFIGURED,
  AUTH_PUBLIC_APP_URL: "http://inseguro.test",
});
assert.equal(httpBase.status, "BLOCKED_EXTERNAL");
assert.ok(httpBase.missing.includes("AUTH_PUBLIC_APP_URL"));

let probeRequest: { url: string; method: string } | null = null;
const probe = await probeResendAccount(CONFIGURED, (async (url: string | URL | Request, init?: RequestInit) => {
  probeRequest = { url: String(url), method: init?.method ?? "GET" };
  return new Response(JSON.stringify({ data: [{ name: "pessoa.real@exemplo.com" }] }), { status: 200 });
}) as typeof fetch);
assert.equal(probe.code, "RESEND_ACCOUNT_READ_OK");
assert.equal(probeRequest?.method, "GET");
assert.match(probeRequest?.url ?? "", /\/domains$/);
assert.equal(JSON.stringify(probe).includes("pessoa.real@exemplo.com"), false);
assert.doesNotMatch(probeRequest?.url ?? "", /\/emails$/);

const rejected = await probeResendAccount(CONFIGURED, (async () => new Response("no", { status: 401 })) as typeof fetch);
assert.equal(rejected.code, "BLOCKED_EXTERNAL_RESEND_CREDENTIAL_REJECTED");

const unconfigured = await probeResendAccount({});
assert.equal(unconfigured.code, "BLOCKED_EXTERNAL_RESEND");

let sends = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  sends += 1;
  return new Response("{}", { status: 200 });
}) as typeof fetch;
try {
  const sent = await sendTransactionalEmail({}, {
    to: "pessoa@exemplo.test",
    subject: "nao enviar",
    text: "token-em-claro",
  });
  assert.equal(sent, false);
  assert.equal(sends, 0);
} finally {
  globalThis.fetch = originalFetch;
}

const signup = readFileSync("functions/api/auth/signup.ts", "utf8");
const verify = readFileSync("functions/api/auth/verify-email.ts", "utf8");
const script = readFileSync("scripts/ops/resend-operational-contract.ts", "utf8");
const ui = readFileSync("client/src/pages/cadastro.tsx", "utf8");
assert.match(signup, /blockedExternal: "BLOCKED_EXTERNAL_RESEND"/);
assert.match(verify, /email_verified_source = 'self_service_token'/);
assert.match(script, /não marca email_verified_at/);
assert.doesNotMatch(script, /UPDATE users/);
assert.doesNotMatch(script, /method:\s*"POST"/);
assert.match(ui, /não foi marcado como verificado/);

const childEnv = { ...process.env, AUTH_RESEND_API_KEY: SECRET };
delete childEnv.AUTH_EMAIL_FROM;
delete childEnv.AUTH_PUBLIC_APP_URL;
delete childEnv.AUTH_EMAIL_TRANSPORT;
const run = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/ops/resend-operational-contract.ts"],
  { cwd: process.cwd(), encoding: "utf8", env: childEnv },
);
assert.equal(run.status, 2);
assert.match(run.stdout, /BLOCKED_EXTERNAL_RESEND/);
assert.equal(run.stdout.includes(SECRET), false);
assert.equal(run.stderr.includes(SECRET), false);

console.log("resend operational contract: fail-closed, sem e-mail verificado por bypass ✔");
