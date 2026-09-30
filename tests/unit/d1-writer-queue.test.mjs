// Fila das escritas D1 de produção (scripts/ci/wait-d1-writers.mjs).
// Regressão: deploy e migrações compartilhavam o grupo `cloudflare-pages`; como
// o GitHub mantém uma única execução pendente por grupo, migrações e o deploy
// do último commit eram cancelados antes de começar.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { blockingRuns, D1_MIGRATION_WORKFLOWS, PAGES_PUBLISHER_WORKFLOWS } from "../../scripts/ci/wait-d1-writers.mjs";
import { deployCheck } from "../../scripts/ci/write-deploy-check.mjs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const conecta = ".github/workflows/conecta-d1-migration.yml";
const billing = ".github/workflows/saas-billing-d1-migration.yml";
const run = (id, path, extra = {}) => ({ id, path, event: "push", head_branch: "main", status: "in_progress", ...extra });

// 1) Migração espera só migrações MAIS ANTIGAS (FIFO, sem ciclo).
{
  const runs = [run(10, conecta), run(30, billing), run(20, ".github/workflows/deploy-cloudflare.yml")];
  assert.deepEqual(blockingRuns(runs, { mode: "migration", ownRunId: 25 }).map((r) => r.id), [10]);
  assert.deepEqual(blockingRuns(runs, { mode: "migration", ownRunId: 5 }), [], "migração nunca espera a mais nova nem o deploy");
}
// 2) Deploy espera toda migração ativa, mais nova ou mais antiga.
{
  const runs = [run(10, conecta), run(30, billing, { status: "queued" }), run(40, billing, { status: "completed" })];
  assert.deepEqual(blockingRuns(runs, { mode: "deploy", ownRunId: 20 }).map((r) => r.id), [10, 30]);
}
// 3) Execuções de PR, de outra branch, a própria execução e duplicatas não contam.
{
  const runs = [
    run(10, conecta, { event: "pull_request" }),
    run(11, conecta, { head_branch: "feature" }),
    run(12, conecta),
    run(12, conecta),
    run(13, ".github/workflows/test.yml"),
  ];
  assert.deepEqual(blockingRuns(runs, { mode: "deploy", ownRunId: 12 }), []);
  assert.equal(blockingRuns([run(9, conecta, { event: "workflow_dispatch" })], { mode: "migration", ownRunId: 12 }).length, 1);
}
// 3b) Publicações do Pages: FIFO entre publicadores, migração nunca espera publicador.
{
  const deploy = ".github/workflows/deploy-cloudflare.yml";
  const boa = ".github/workflows/boaconsulta-import-release.yml";
  const provision = ".github/workflows/provision-d1.yml";
  const runs = [run(10, deploy), run(20, boa), run(30, provision, { event: "workflow_dispatch" }), run(40, deploy, { status: "queued" })];
  assert.deepEqual(blockingRuns(runs, { mode: "deploy", ownRunId: 25 }).map((r) => r.id), [10, 20].filter((id) => id !== 25));
  assert.deepEqual(blockingRuns(runs, { mode: "deploy", ownRunId: 20 }).map((r) => r.id), [10], "publicador espera só publicadores mais antigos");
  assert.deepEqual(blockingRuns(runs, { mode: "deploy", ownRunId: 5 }), [], "publicador mais antigo não espera o mais novo (sem deadlock)");
  assert.deepEqual(blockingRuns(runs, { mode: "migration", ownRunId: 99 }), [], "migração nunca espera publicação do Pages");
  assert.deepEqual(blockingRuns([run(10, boa, { head_branch: "feature" }), run(11, deploy, { event: "pull_request" })], { mode: "deploy", ownRunId: 50 }), []);
  for (const path of PAGES_PUBLISHER_WORKFLOWS) assert.ok(!D1_MIGRATION_WORKFLOWS.includes(path));
}
// 3c) Sentinela de deploy: mesmos campos para todo publicador; falha fechado sem commit.
{
  const env = { GITHUB_REF_NAME: "main", GITHUB_SHA: "a".repeat(40), GITHUB_RUN_ID: "123", GITHUB_RUN_NUMBER: "7" };
  const sentinel = deployCheck(env, new Date("2026-09-30T00:00:00.123Z"));
  assert.deepEqual(sentinel, { app: "NeuroPed", provider: "cloudflare-pages", branch: "main", commit: "a".repeat(40), run_id: "123", run_number: "7", deployed_at_utc: "2026-09-30T00:00:00Z" });
  assert.throws(() => deployCheck({ ...env, GITHUB_SHA: "" }), /GITHUB_SHA/);
  assert.throws(() => deployCheck({ ...env, GITHUB_SHA: "pending-deploy-workflow" }), /inválido/);
}

// 4) Contrato dos workflows.
const workflows = readdirSync(new URL("../../.github/workflows/", import.meta.url)).map((f) => `.github/workflows/${f}`);
for (const path of D1_MIGRATION_WORKFLOWS) {
  assert.ok(workflows.includes(path), `${path} listado na fila, mas inexistente`);
  const yml = read(path);
  assert.doesNotMatch(yml, /group: cloudflare-pages\s*$/m, `${path}: migração não pode disputar o slot do deploy`);
  assert.match(yml, /^concurrency:\n(?:\s*#.*\n)*\s*group: [^\n]*\$\{\{ github\.ref \}\}/m, `${path}: grupo precisa incluir a ref (PR não cancela main)`);
  assert.match(yml, /^\s+actions: read$/m, `${path}: a fila precisa de actions: read`);
  const lock = yml.indexOf("MODE: migration");
  const firstWrite = yml.search(/d1 execute neuroped-db --remote --yes/);
  assert.ok(lock > 0 && lock < firstWrite, `${path}: a fila precisa vir antes da primeira escrita D1`);
}
const publishers = [".github/workflows/deploy-cloudflare.yml", ".github/workflows/boaconsulta-import-release.yml", ".github/workflows/provision-d1.yml"];
for (const path of publishers) {
  assert.ok(PAGES_PUBLISHER_WORKFLOWS.includes(path), `${path} deve estar na fila de publicadores do Pages`);
  const yml = read(path);
  const lock = yml.indexOf("MODE: deploy");
  const firstWrite = yml.search(/d1 execute[^\n]*--remote[^\n]*--yes|d1 execute[^\n]*--yes[^\n]*--remote|--remote --file=/);
  assert.ok(lock > 0 && lock < firstWrite, `${path}: o deploy precisa esperar as migrações antes de escrever no D1`);
  assert.ok(lock < yml.search(/pages deploy/), `${path}: e antes de publicar`);
  const stamp = yml.indexOf("node scripts/ci/write-deploy-check.mjs");
  assert.ok(stamp > 0 && stamp < yml.search(/npm run build:client/), `${path}: sentinela de deploy antes do build`);
  assert.doesNotMatch(yml, /cat > client\/public\/deploy-check\.json/, `${path}: sentinela vem do script compartilhado`);
}
// Deploy canônico segue no grupo cloudflare-pages (com a sincronização diária);
// BoaConsulta e provisionamento saem da vaga pendente única, com grupo por ref.
assert.match(read(publishers[0]), /^concurrency:\n\s*group: cloudflare-pages$/m);
for (const path of publishers.slice(1)) {
  const yml = read(path);
  assert.doesNotMatch(yml, /group: cloudflare-pages\s*$/m, `${path}: não pode disputar a vaga pendente do deploy canônico`);
  assert.match(yml, /group: pages-publisher-\$\{\{ github\.workflow \}\}-\$\{\{ github\.ref \}\}\n\s*cancel-in-progress: false/);
}
// Nenhum outro workflow disparado por push/PR aplica arquivo de migração fora da fila.
for (const path of workflows) {
  const yml = read(path);
  if (!/--file=\.\/db\/(migrations|schema)/.test(yml) || !/^\s{2}(push|pull_request):/m.test(yml)) continue;
  assert.ok(/MODE: (migration|deploy)/.test(yml), `${path} aplica migração D1 sem entrar na fila`);
}
console.log(`✓ fila D1: ${D1_MIGRATION_WORKFLOWS.length} migrações FIFO, deploy após migrações, PR fora do slot do main`);
