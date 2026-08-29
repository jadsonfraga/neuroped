import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(
    /\r\n?/g,
    "\n",
  );

const guard = read(".github/workflows/pr-collision-guard.yml");
const fanout = read(".github/workflows/pr-collision-fanout.yml");
const prCheck = read(".github/workflows/pr-check.yml");

for (const [name, workflow] of [
  ["guard independente", guard],
  ["gate obrigatório", prCheck],
  ["fan-out", fanout],
]) {
  assert.match(
    workflow,
    /previous_filename/,
    `${name} deve considerar o caminho anterior de arquivos renomeados`,
  );
}

for (const [name, workflow] of [
  ["guard independente", guard],
  ["gate obrigatório", prCheck],
]) {
  assert.match(
    workflow,
    /flatMap\(filePaths\)/,
    `${name} deve indexar filename e previous_filename`,
  );
  assert.match(
    workflow,
    /pulls\.get/,
    `${name} deve consultar o estado atual do PR em vez de confiar em payload antigo`,
  );
}

assert.match(
  prCheck,
  /workflow_dispatch:\s*\n\s*inputs:\s*\n\s*pr_number:/,
  "PR Check deve aceitar revalidação disparada pelo fan-out",
);
assert.match(
  prCheck,
  /github\.event\.pull_request\.number \|\| inputs\.pr_number/,
  "concorrência do PR Check deve funcionar também em workflow_dispatch",
);
assert.match(
  prCheck,
  /expected_head_sha/,
  "revalidação fan-out deve fixar o SHA exato que será testado",
);
assert.match(
  prCheck,
  /steps\.collision\.outputs\.pr_number/,
  "comentário consolidado deve usar o PR resolvido pelo gate",
);
assert.match(
  prCheck,
  /node tests\/unit\/pr-collision-guard\.test\.mjs/,
  "o contrato da trava deve ser executado no próprio gate obrigatório",
);

assert.match(
  fanout,
  /pull_request_target:/,
  "fan-out deve reagir a mudanças em PRs pares usando a definição protegida da main",
);
assert.match(
  fanout,
  /push:\s*\n\s*branches: \[main\]/,
  "fan-out deve reagir quando a base main avançar",
);
assert.match(
  fanout,
  /actions: write/,
  "fan-out precisa apenas da permissão necessária para redisparar workflows",
);
assert.match(
  fanout,
  /createWorkflowDispatch/,
  "fan-out deve redisparar o PR Check para PRs afetados",
);
assert.match(
  fanout,
  /workflow_id: workflowId/,
  "fan-out deve apontar para o workflow canônico pr-check.yml",
);
assert.match(
  fanout,
  /pr_number: String\(target\.number\)/,
  "fan-out deve identificar explicitamente o PR revalidado",
);
assert.match(
  fanout,
  /expected_head_sha: target\.head\.sha/,
  "fan-out deve despachar o SHA imutável da revisão",
);
assert.match(
  fanout,
  /ref: baseRef/,
  "fan-out deve executar a definição confiável do PR Check hospedada na main",
);
assert.doesNotMatch(
  fanout,
  /getContent|target\.head\.ref,\s*inputs/,
  "fan-out não pode depender de uma definição de workflow da branch revalidada",
);
assert.match(
  fanout,
  /eventPaths\.has\(path\) && isCritical\(path\)/,
  "eventos de PR devem revalidar somente pares com sobreposição crítica",
);
assert.doesNotMatch(
  fanout,
  /actions\/checkout/,
  "pull_request_target não pode fazer checkout ou executar código não confiável",
);

// Prova unitária do caso de rename levantado na revisão.
const filePaths = (file) =>
  [...new Set([file.filename, file.previous_filename].filter(Boolean))];

const renamedByA = {
  filename: "server/bar.ts",
  previous_filename: "server/foo.ts",
};
const editedByB = { filename: "server/foo.ts" };
const pathsA = new Set(filePaths(renamedByA));
const shared = filePaths(editedByB).filter((path) => pathsA.has(path));

assert.deepEqual(
  shared,
  ["server/foo.ts"],
  "rename x edição do caminho anterior deve produzir colisão",
);

console.log(
  "✓ fan-out, estado atual do PR e colisões de arquivos renomeados protegidos",
);
