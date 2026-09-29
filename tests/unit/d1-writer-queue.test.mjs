// Fila das escritas D1 de produção (scripts/ci/wait-d1-writers.mjs).
// Regressão: deploy e migrações compartilhavam o grupo `cloudflare-pages`; como
// o GitHub mantém uma única execução pendente por grupo, migrações e o deploy
// do último commit eram cancelados antes de começar.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { blockingRuns, D1_MIGRATION_WORKFLOWS } from "../../scripts/ci/wait-d1-writers.mjs";

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
for (const path of [".github/workflows/deploy-cloudflare.yml", ".github/workflows/boaconsulta-import-release.yml", ".github/workflows/provision-d1.yml"]) {
  const yml = read(path);
  assert.match(yml, /group: cloudflare-pages/, `${path}: publicações do Pages seguem serializadas entre si`);
  const lock = yml.indexOf("MODE: deploy");
  const firstWrite = yml.search(/d1 execute[^\n]*--remote[^\n]*--yes|d1 execute[^\n]*--yes[^\n]*--remote|--remote --file=/);
  assert.ok(lock > 0 && lock < firstWrite, `${path}: o deploy precisa esperar as migrações antes de escrever no D1`);
  assert.ok(lock < yml.search(/pages deploy/), `${path}: e antes de publicar`);
}
// Nenhum outro workflow disparado por push/PR aplica arquivo de migração fora da fila.
for (const path of workflows) {
  const yml = read(path);
  if (!/--file=\.\/db\/(migrations|schema)/.test(yml) || !/^\s{2}(push|pull_request):/m.test(yml)) continue;
  assert.ok(/MODE: (migration|deploy)/.test(yml), `${path} aplica migração D1 sem entrar na fila`);
}
console.log(`✓ fila D1: ${D1_MIGRATION_WORKFLOWS.length} migrações FIFO, deploy após migrações, PR fora do slot do main`);
