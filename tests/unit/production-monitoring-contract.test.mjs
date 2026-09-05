/**
 * Contrato de monitoramento de produção.
 *
 * O que está sendo protegido: a diferença entre ter um smoke de produção e
 * EXECUTAR um smoke de produção.
 *
 * O repositório já tinha `tests/e2e/published-health.mjs` e o script
 * `test:e2e:published-health` no package.json — e nenhum workflow os chamava.
 * Um smoke que ninguém dispara não é monitoramento: é código morto com nome
 * tranquilizador. Entre dois deploys, a produção podia estar fora do ar por
 * horas sem sinal nenhum.
 *
 * Este contrato trava duas coisas:
 *   1. todo gate `test:e2e:published*` precisa ser referenciado por algum
 *      workflow (senão volta a ser decoração);
 *   2. o smoke de saúde precisa rodar em AGENDA, não só reagindo a deploy —
 *      falha às 03:00 sem deploy nenhum é exatamente o caso que importa.
 *
 * Rodar: node tests/unit/production-monitoring-contract.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => readFileSync(join(repoRoot, relative), "utf8");

const workflowsDir = join(repoRoot, ".github", "workflows");
const workflows = readdirSync(workflowsDir)
  .filter((name) => /\.ya?ml$/.test(name))
  .map((name) => ({ name, source: read(join(".github", "workflows", name)) }));

const scripts = JSON.parse(read("package.json")).scripts ?? {};
const publishedGates = Object.keys(scripts).filter((name) =>
  name.startsWith("test:e2e:published"),
);

assert.ok(
  publishedGates.length > 0,
  "nenhum gate test:e2e:published* no package.json — o smoke de produção sumiu",
);

// 1) Nenhum gate de produção pode ficar órfão.
for (const gate of publishedGates) {
  const owners = workflows
    .filter(({ source }) => source.includes(`npm run ${gate}`))
    .map(({ name }) => name);
  assert.ok(
    owners.length > 0,
    `gate de produção "${gate}" não é executado por workflow algum — smoke que ninguém dispara não é monitoramento`,
  );
}

// 2) O smoke de saúde precisa ter agenda própria, e não só reagir a deploy.
const healthOwners = workflows.filter(({ source }) =>
  source.includes("npm run test:e2e:published-health"),
);
const scheduled = healthOwners.filter(({ source }) => {
  const trigger = source.split(/^jobs:/m)[0] ?? "";
  return /^\s*schedule:\s*$/m.test(trigger) && /^\s*-\s*cron:/m.test(trigger);
});
assert.ok(
  scheduled.length > 0,
  "o smoke de saúde de produção não roda em agenda — uma queda fora de janela de deploy passaria despercebida",
);

// 3) Ele precisa falhar fechado: sem `if: always()` no upload, tudo bem, mas o
//    gate em si não pode estar sob continue-on-error — um monitor que nunca
//    reprova não avisa ninguém.
for (const { name, source } of scheduled) {
  const gateIndex = source.indexOf("npm run test:e2e:published-health");
  const before = source.slice(0, gateIndex);
  const stepStart = before.lastIndexOf("      - name:");
  const stepBlock = source.slice(stepStart, source.indexOf("      - name:", gateIndex + 1) >>> 0 || undefined);
  assert.doesNotMatch(
    stepBlock,
    /continue-on-error:\s*true/,
    `${name}: o smoke de produção não pode rodar sob continue-on-error — deixaria de ser alarme`,
  );
}

console.log(
  `✅ monitoramento de produção: ${publishedGates.length} gate(s) publicados com dono, smoke de saúde agendado em ${scheduled.map((w) => w.name).join(", ")} e falhando fechado.`,
);
