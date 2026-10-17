/**
 * Contrato operacional do Asaas. Não cria checkout, cobrança nem cliente.
 * Sem credencial, sai 2 com BLOCKED_EXTERNAL. Com credencial, a leitura
 * (`--probe`) só mostra se a chave alcança o provedor — nunca se alguém pagou.
 *
 *   node --import tsx scripts/asaas-operational-contract.mts
 *   node --import tsx scripts/asaas-operational-contract.mts --probe
 */
import {
  describeAsaasOperationalContract,
  probeAsaasReadOnly,
  type BillingProviderEnv,
} from "../functions/api/billing/_provider.ts";

const env: BillingProviderEnv = {
  ASAAS_API_KEY: process.env.ASAAS_API_KEY,
  ASAAS_WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN,
  ASAAS_ENVIRONMENT: process.env.ASAAS_ENVIRONMENT,
  APP_BASE_URL: process.env.APP_BASE_URL,
  AUTH_PUBLIC_APP_URL: process.env.AUTH_PUBLIC_APP_URL,
};

const report = describeAsaasOperationalContract(env);
const probeRequested = process.argv.includes("--probe");

function emit(body: Record<string, unknown>, exitCode: number): never {
  process.stdout.write(`${JSON.stringify(body)}\n`);
  process.exit(exitCode);
}

if (!report.pronto) {
  emit({ ...report, probe: "nao_executado", efeito: "BLOCKED_EXTERNAL" }, 2);
}

if (!probeRequested) {
  emit({ ...report, probe: "nao_executado", efeito: "CONFIGURACAO_LOCAL" }, 0);
}

const probe = await probeAsaasReadOnly(env);
emit(
  {
    ...report,
    cobrancaExterna: "BLOCKED_EXTERNAL",
    cobrancaComprovada: false,
    receitaCentavos: 0,
    probe: { code: probe.code, httpStatus: probe.httpStatus },
    efeito: probe.ok ? "CREDENCIAL_ALCANCE_LEITURA" : "BLOCKED_EXTERNAL",
  },
  probe.ok ? 0 : 3,
);
