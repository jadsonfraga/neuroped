/**
 * Contrato operacional Asaas — executável, fail-closed.
 *
 * Sem as variáveis exigidas, sai com código 2 e BLOCKED_EXTERNAL_ASAAS.
 * Não cria checkout, não grava charge_paid e não imprime segredo.
 *
 *   node --import tsx scripts/ops/asaas-operational-contract.ts
 *   node --import tsx scripts/ops/asaas-operational-contract.ts --probe
 *
 * `--probe` só faz GET /myAccount. Credencial aceita não é pagamento.
 */
import {
  assessAsaasOperationalContract,
  probeAsaasAccount,
  type BillingProviderEnv,
} from "../../functions/api/billing/_provider";

function envFromProcess(): BillingProviderEnv {
  return {
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
    ASAAS_WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN,
    ASAAS_ENVIRONMENT: process.env.ASAAS_ENVIRONMENT,
    APP_BASE_URL: process.env.APP_BASE_URL,
    AUTH_PUBLIC_APP_URL: process.env.AUTH_PUBLIC_APP_URL,
  };
}

function finish(payload: unknown, code: number): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = code;
}

const env = envFromProcess();
const assessment = assessAsaasOperationalContract(env);
const probe = process.argv.includes("--probe");

if (assessment.status === "BLOCKED_EXTERNAL") {
  finish({
    ...assessment,
    probe: "not_attempted",
    proves: [],
    next: "Provisione as variáveis em missing no Cloudflare Pages (Production) e rode de novo. Não crie checkout nem evento charge_paid à mão.",
    runbook: "docs/ASAAS_OPERATIONAL_CONTRACT.md",
  }, 2);
} else if (!probe) {
  finish({
    ...assessment,
    probe: "not_requested",
    proves: ["CONFIGURACAO_PRESENTE"],
    next: "Rode com --probe para GET /myAccount. Isso não cria cobrança. Entitlement só muda com webhook autenticado e charge_paid persistido.",
    runbook: "docs/ASAAS_OPERATIONAL_CONTRACT.md",
  }, 0);
} else {
  const result = await probeAsaasAccount(env);
  const accepted = result.code === "ASAAS_ACCOUNT_READ_OK";
  finish({
    status: accepted ? "CREDENCIAL_ACEITA_PELO_PROVEDOR" : "BLOCKED_EXTERNAL",
    code: result.code,
    environment: assessment.environment,
    httpStatus: result.httpStatus,
    probe: accepted ? "account_read_ok" : "rejected",
    proves: accepted ? ["CREDENCIAL_ACEITA_PELO_PROVEDOR"] : [],
    doesNotProve: assessment.doesNotProve,
    next: accepted
      ? "Checkout, webhook autenticado e entitlement continuam exigindo um pagamento real no painel e o evento charge_paid persistido. Este probe não é cobrança."
      : "A credencial foi recusada ou o provedor não respondeu. Nenhuma cobrança foi criada.",
    runbook: "docs/ASAAS_OPERATIONAL_CONTRACT.md",
  }, accepted ? 0 : 3);
}
