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

const validateStart = prCheck.indexOf("\n  validate:\n");
const reportStart = prCheck.indexOf("\n  report:\n");
assert.ok(validateStart >= 0, "PR Check deve manter o job obrigatório validate");
assert.ok(reportStart > validateStart, "PR Check deve separar o job de relatório");
const validateBlock = prCheck.slice(validateStart, reportStart);
const reportBlock = prCheck.slice(reportStart);

assert.match(
  prCheck,
  /^permissions:\n  contents: read$/m,
  "permissão padrão do workflow deve ser somente leitura",
);
assert.match(
  validateBlock,
  /permissions:\n\s+contents: read\n\s+pull-requests: read/,
  "o job que executa código deve ter somente permissões de leitura",
);
assert.match(
  validateBlock,
  /persist-credentials: false/,
  "checkout do job que executa código não deve persistir credencial",
);
assert.doesNotMatch(
  validateBlock,
  /issues: write|pull-requests: write/,
  "build e testes não podem receber token gravável",
);
assert.match(
  reportBlock,
  /needs: validate[\s\S]*?if: always\(\)/,
  "o relatório deve rodar depois da validação, inclusive em caso de falha",
);
assert.match(
  reportBlock,
  /issues: write[\s\S]*?pull-requests: write/,
  "somente o job de relatório pode comentar no PR",
);
assert.doesNotMatch(
  reportBlock,
  /actions\/checkout|\brun:\s*(?:npm|node|pnpm|yarn)\b/,
  "o job gravável não pode fazer checkout nem executar código do repositório",
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

function extractInlineScript(workflow) {
  const marker = "          script: |\n";
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, "workflow deve conter um script inline");
  const lines = workflow.slice(start + marker.length).split("\n");
  const collected = [];
  for (const line of lines) {
    if (line.length > 0 && !line.startsWith("            ")) break;
    collected.push(line.startsWith("            ") ? line.slice(12) : line);
  }
  return collected.join("\n");
}

const quarantineScript = extractInlineScript(quarantine);
assert.doesNotThrow(
  () =>
    new Function(
      "github",
      "context",
      "core",
      "return (async () => {\n" + quarantineScript + "\n})();",
    ),
  "o JavaScript inline da quarentena deve compilar antes do merge",
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
  "✓ quarentena nativa, token isolado, estado atual do PR e renames protegidos",
);
