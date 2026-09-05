/**
 * Trava de segurança do ensaio de DR.
 *
 * O workflow `dr-mechanism-rehearsal.yml` cria e DESTRÓI um banco D1. O modo
 * de falha que este teste impede não é o workflow quebrar — é ele funcionar
 * apontando para o lugar errado. Um `d1 delete` no alvo errado não tem undo.
 *
 * Invariantes travadas aqui:
 *   1. nunca dispara sozinho (sem `schedule`, sem `push`) — só por acionamento
 *      humano com confirmação digitada;
 *   2. todo comando de mutação usa o alvo derivado, nunca o nome de produção
 *      literal;
 *   3. o destroy reconfere a marca `dr-rehearsal` antes de executar;
 *   4. produção não aparece em nenhum comando wrangler.
 *
 * Rodar: node tests/unit/dr-rehearsal-safety.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflow = readFileSync(
  join(repoRoot, ".github", "workflows", "dr-mechanism-rehearsal.yml"),
  "utf8",
);

const triggerBlock = workflow.split(/^jobs:/m)[0] ?? "";

// 1) Só acionamento humano.
assert.match(triggerBlock, /workflow_dispatch:/, "o ensaio precisa ser acionável manualmente");
assert.doesNotMatch(
  triggerBlock,
  /^\s*schedule:/m,
  "o ensaio NUNCA pode rodar em agenda — cria e destrói banco",
);
assert.doesNotMatch(
  triggerBlock,
  /^\s*push:/m,
  "o ensaio NUNCA pode rodar em push",
);
assert.match(
  workflow,
  /inputs\.confirmar \}\}" != "ENSAIAR"/,
  "o ensaio precisa exigir confirmação digitada antes de qualquer passo",
);

// 2) e 4) Nenhum comando wrangler pode nomear produção.
const producao = /neuroped-db/;
for (const line of workflow.split("\n")) {
  if (!/wrangler@4 d1/.test(line)) continue;
  assert.doesNotMatch(
    line,
    producao,
    `comando wrangler nomeando produção: ${line.trim()}`,
  );
}

// 3) O destroy reconfere a marca antes de rodar.
const destroyIndex = workflow.indexOf("d1 delete");
assert.ok(destroyIndex > 0, "o ensaio precisa destruir o alvo temporário");
const destroyStep = workflow.slice(
  workflow.lastIndexOf("      - name:", destroyIndex),
  destroyIndex,
);
assert.match(
  destroyStep,
  /\*dr-rehearsal\*\)/,
  "o destroy precisa reconferir a marca dr-rehearsal antes de executar",
);
assert.match(
  destroyStep,
  /Recusando destruir produção/,
  "o destroy precisa recusar explicitamente o banco de produção",
);
assert.match(
  destroyStep,
  /if: always\(\)/,
  "o destroy precisa rodar mesmo quando um passo anterior falha — alvo órfão custa dinheiro",
);

// 5) O relatório não pode prometer mais do que o ensaio prova.
assert.match(
  workflow,
  /NÃO mede o RTO de um restore de produção/,
  "o relatório precisa declarar que é mechanism rehearsal, não restore integral",
);

console.log(
  "✅ ensaio de DR: só por acionamento humano confirmado, nenhum comando nomeia produção, destroy reconfere a marca e o relatório não superdeclara.",
);
