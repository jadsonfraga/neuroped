#!/usr/bin/env node
/**
 * Fila das escritas no D1 de produção (neuroped-db) — sem descartar execuções.
 *
 * Antes, o deploy canônico e todas as migrações D1 compartilhavam o grupo de
 * concorrência `cloudflare-pages`. O GitHub mantém só UMA execução pendente por
 * grupo: cada nova execução enfileirada CANCELA a pendente anterior. Num merge
 * que dispara o deploy e várias migrações, o resultado era deploy do último
 * commit cancelado antes de começar (e o Vercel falhando por esperar o mesmo
 * commit no Cloudflare) ou migrações canceladas em silêncio.
 *
 * Agora cada migração tem o próprio grupo e a serialização das escritas D1 é
 * feita aqui, por ordem de criação (id da execução), sem pending slot:
 *
 *   MODE=migration  espera toda migração D1 MAIS ANTIGA (id menor) terminar.
 *                   Fila FIFO entre migrações; nunca espera deploy, então não
 *                   há ciclo de espera (deadlock).
 *   MODE=deploy     espera TODA migração D1 em andamento/enfileirada terminar
 *                   antes das escritas D1 e da publicação do deploy — o deploy
 *                   roda depois das migrações do mesmo push.
 *
 * Só contam execuções de push/workflow_dispatch em main (execuções de
 * pull_request não escrevem no D1). Estouro do prazo falha fechado.
 */

export const D1_MIGRATION_WORKFLOWS = Object.freeze([
  ".github/workflows/clinical-core-d1-migration.yml",
  ".github/workflows/conecta-d1-migration.yml",
  ".github/workflows/lgpd-worker-foundation-d1.yml",
  ".github/workflows/operations-clinic-scope-d1-migration.yml",
  ".github/workflows/operations-d1-migration.yml",
  ".github/workflows/public-booking-consent-d1.yml",
  ".github/workflows/saas-billing-d1-migration.yml",
  ".github/workflows/saas-billing-trial-seats.yml",
  ".github/workflows/saas-phase1-d1-migration.yml",
  // Migrações mais novas, que já tinham grupo próprio mas não esperavam nada.
  ".github/workflows/canonical-email-identity-d1.yml",
  ".github/workflows/clinic-feature-flags-d1.yml",
  ".github/workflows/email-verification-d1.yml",
  ".github/workflows/membership-seat-fix-d1.yml",
  ".github/workflows/password-recovery-d1.yml",
  ".github/workflows/public-submission-audit-d1.yml",
  ".github/workflows/remote-scale-response-d1.yml",
  ".github/workflows/saas-identity-settings-d1.yml",
  ".github/workflows/saas-remote-intake-d1.yml",
]);

const ACTIVE_STATUSES = ["queued", "in_progress", "waiting", "requested", "pending"];

/** Execuções que bloqueiam a execução atual. Função pura (testada). */
export function blockingRuns(runs, { mode, ownRunId }) {
  const own = Number(ownRunId);
  const seen = new Set();
  return runs.filter((run) => {
    if (!run || seen.has(run.id)) return false;
    seen.add(run.id);
    if (Number(run.id) === own) return false;
    if (!D1_MIGRATION_WORKFLOWS.includes(String(run.path ?? "").split("@")[0])) return false;
    if (!["push", "workflow_dispatch"].includes(run.event)) return false;
    if (run.head_branch !== "main") return false;
    if (!ACTIVE_STATUSES.includes(run.status)) return false;
    return mode === "deploy" ? true : Number(run.id) < own;
  });
}

async function listActiveRuns({ repository, token, apiUrl }) {
  const runs = [];
  for (const status of ACTIVE_STATUSES) {
    const response = await fetch(
      `${apiUrl}/repos/${repository}/actions/runs?status=${status}&branch=main&per_page=100`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } },
    );
    if (!response.ok) throw new Error(`GitHub API ${response.status} ao listar execuções (${status}).`);
    const body = await response.json();
    runs.push(...(body.workflow_runs ?? []));
  }
  return runs;
}

async function main() {
  const mode = process.env.MODE;
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repository, GITHUB_RUN_ID: ownRunId } = process.env;
  const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
  const timeoutMinutes = Number(process.env.TIMEOUT_MINUTES || 30);
  const pollSeconds = Number(process.env.POLL_SECONDS || 20);
  if (mode !== "migration" && mode !== "deploy") throw new Error("MODE deve ser 'migration' ou 'deploy'.");
  if (!token || !repository || !ownRunId) throw new Error("GITHUB_TOKEN, GITHUB_REPOSITORY e GITHUB_RUN_ID são obrigatórios.");

  const deadline = Date.now() + timeoutMinutes * 60_000;
  for (;;) {
    const blockers = blockingRuns(await listActiveRuns({ repository, token, apiUrl }), { mode, ownRunId });
    if (blockers.length === 0) {
      console.log(`Fila D1 livre (modo ${mode}); seguindo.`);
      return;
    }
    const summary = blockers.map((run) => `${run.name ?? run.path} #${run.id} (${run.status})`).join(", ");
    if (Date.now() >= deadline) {
      console.log(`::error::Fila D1 ainda ocupada após ${timeoutMinutes} min: ${summary}. Nada foi escrito no D1; reexecute quando a fila esvaziar.`);
      process.exit(1);
    }
    console.log(`Aguardando escritas D1 anteriores: ${summary}`);
    await new Promise((resolve) => setTimeout(resolve, pollSeconds * 1000));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.log(`::error::Falha ao verificar a fila D1: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
