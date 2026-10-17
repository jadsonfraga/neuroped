/**
 * Contrato operacional Resend — executável, fail-closed.
 *
 * Sem as variáveis exigidas, sai com código 2 e BLOCKED_EXTERNAL_RESEND.
 * Não envia e-mail, não marca email_verified_at e não imprime segredo.
 *
 *   node --import tsx scripts/ops/resend-operational-contract.ts
 *   node --import tsx scripts/ops/resend-operational-contract.ts --probe
 *
 * `--probe` só faz GET /domains. Credencial aceita não é entrega.
 */
import {
  assessResendOperationalContract,
  probeResendAccount,
  type MailTransportEnv,
} from "../../functions/api/auth/_mailTransport";

function envFromProcess(): MailTransportEnv {
  return {
    AUTH_PUBLIC_APP_URL: process.env.AUTH_PUBLIC_APP_URL,
    AUTH_RESEND_API_KEY: process.env.AUTH_RESEND_API_KEY,
    AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
    AUTH_EMAIL_TRANSPORT: process.env.AUTH_EMAIL_TRANSPORT,
  };
}

function finish(payload: unknown, code: number): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = code;
}

const env = envFromProcess();
const assessment = assessResendOperationalContract(env);
const probe = process.argv.includes("--probe");

if (assessment.status === "BLOCKED_EXTERNAL") {
  finish({
    ...assessment,
    probe: "not_attempted",
    proves: [],
    next: "Provisione as variáveis em missing no Cloudflare Pages (Production) e rode de novo. Não marque e-mail como verificado à mão.",
    runbook: "docs/RESEND_OPERATIONAL_CONTRACT.md",
  }, 2);
} else if (!probe) {
  finish({
    ...assessment,
    probe: "not_requested",
    proves: ["CONFIGURACAO_PRESENTE"],
    next: "Rode com --probe para GET /domains. Isso não envia mensagem. Conta verificada continua exigindo o token consumido em verify-email.",
    runbook: "docs/RESEND_OPERATIONAL_CONTRACT.md",
  }, 0);
} else {
  const result = await probeResendAccount(env);
  const accepted = result.code === "RESEND_ACCOUNT_READ_OK";
  finish({
    status: accepted ? "CREDENCIAL_ACEITA_PELO_PROVEDOR" : "BLOCKED_EXTERNAL",
    code: result.code,
    httpStatus: result.httpStatus,
    probe: accepted ? "domains_read_ok" : "rejected",
    proves: accepted ? ["CREDENCIAL_ACEITA_PELO_PROVEDOR"] : [],
    doesNotProve: assessment.doesNotProve,
    next: accepted
      ? "Verificação de conta e convite continuam exigindo uma mensagem real recebida e o token consumido. Este probe não envia e-mail."
      : "A credencial foi recusada ou o provedor não respondeu. Nenhum e-mail foi enviado.",
    runbook: "docs/RESEND_OPERATIONAL_CONTRACT.md",
  }, accepted ? 0 : 3);
}
