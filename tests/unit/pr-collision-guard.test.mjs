import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(
    /\r\n?/g,
    "\n",
  );

const guard = read(".github/workflows/pr-collision-guard.yml");
const quarantine = read(".github/workflows/pr-collision-fanout.yml");
const prCheck = read(".github/workflows/pr-check.yml");

for (const [name, workflow] of [
  ["guard independente", guard],
  ["gate obrigatório", prCheck],
  ["quarentena", quarantine],
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
  ["quarentena", quarantine],
]) {
  assert.match(
    workflow,
    /pulls\.get/,
    `${name} deve consultar o estado atual do PR em vez de confiar em payload antigo`,
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
}

assert.match(
  prCheck,
  /node tests\/unit\/pr-collision-guard\.test\.mjs/,
  "o contrato da trava deve ser executado no próprio gate obrigatório",
);
assert.doesNotMatch(
  prCheck,
  /workflow_dispatch:/,
  "o gate obrigatório não deve criar checks laterais fora do SHA do PR",
);
assert.match(
  prCheck,
  /const ready = buildStatus && typecheckStatus && lintStatus && functionsBuildStatus && accessStatus && conectaStatus/,
  "o contrato histórico do gate de release e do NeuroPed Conecta deve ser preservado",
);
assert.match(
  prCheck,
  /steps\.collision_contract\.outcome/,
  "a condição final deve bloquear quando o contrato da trava falhar",
);

assert.match(
  quarantine,
  /pull_request_target:/,
  "quarentena deve reagir a mudanças de PR usando a definição protegida da main",
);
assert.match(
  quarantine,
  /push:\s*\n\s*branches: \[main\]/,
  "quarentena deve reagir quando a main avançar",
);
assert.match(
  quarantine,
  /convertPullRequestToDraft/,
  "PR desatualizado ou concorrente deve ser convertido para draft",
);
assert.match(
  quarantine,
  /behind > 0/,
  "avanço da main deve colocar branches desatualizadas em quarentena",
);
assert.match(
  quarantine,
  /currentPaths\.has\(path\) && isCritical\(path\)/,
  "eventos de PR devem detectar sobreposição crítica",
);
assert.doesNotMatch(
  quarantine,
  /createWorkflowDispatch|workflow_dispatch/,
  "quarentena não deve produzir checks laterais associados à main",
);
assert.doesNotMatch(
  quarantine,
  /actions\/checkout/,
  "pull_request_target não pode fazer checkout ou executar código do PR",
);
assert.doesNotMatch(
  quarantine,
  /\b(run|uses):\s*(npm|node|pnpm|yarn)\b/,
  "quarentena privilegiada não pode executar scripts do repositório",
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
  "✓ quarentena nativa, estado atual do PR e renames protegidos",
);
