// Trava anti-regressão do gate de auditoria de dependências
// (`scripts/guards/npm-audit-gate.mjs`).
//
// O advisory GHSA-86w9-cpqp-85rv (node-forge <= 1.4.0) foi resolvido
// atualizando a dependência para 1.4.2. O gate mantém o comportamento original:
// falhar por qualquer high/critical e exigir exceções explícitas quando uma
// dependência ainda não tiver correção upstream.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { execFileSync } from "node:child_process";

const GATE = "scripts/guards/npm-audit-gate.mjs";

test("gate: nenhuma high/critical fora da allowlist ativa no grafo atual", () => {
  const stdout = execFileSync("node", [GATE], { encoding: "utf8" });
  assert.match(stdout, /nenhuma vulnerabilidade high\/critical fora da allowlist ativa/);
  assert.doesNotMatch(stdout, /GHSA-86w9-cpqp-85rv/);
});

test("gate: excecao obsoleta de node-forge foi removida", () => {
  const source = readFileSync(GATE, "utf8");
  assert.doesNotMatch(source, /GHSA-86w9-cpqp-85rv/);
  assert.doesNotMatch(source, /packageName: "node-forge"/);
  assert.match(source, /const ALLOWLIST = \[\];/);
});

test("gate: excecao obsoleta de braces foi removida", () => {
  const source = readFileSync(GATE, "utf8");
  assert.doesNotMatch(source, /GHSA-vfj7-8cjw-p6xm/);
  assert.doesNotMatch(source, /packageName: "braces"/);
});

test("gate: contrata high/critical — moderate/low nao bloqueia a esteira", () => {
  const source = readFileSync(GATE, "utf8");
  assert.match(
    source,
    /vulnerability\.severity === "high" \|\| vulnerability\.severity === "critical"/,
    "gate filtra por severidade high/critical conforme o contrato documentado",
  );
  const stdout = execFileSync("node", [GATE], { encoding: "utf8" });
  assert.doesNotMatch(stdout, /BLOQUEADO: postcss-selector-parser/);
});

test("workflows usam o gate; nenhuma chamada direta de npm audit restou fora do monitor dedicado", () => {
  const workflows = readdirSync(".github/workflows").filter((name) => name.endsWith(".yml"));
  assert.ok(workflows.length > 10);
  for (const name of workflows) {
    const content = readFileSync(`.github/workflows/${name}`, "utf8");
    if (name === "security-audit.yml") continue; // monitor dedicado, não é gate de pipeline
    assert.doesNotMatch(content, /run:\s*npm audit --audit-level=high/, `${name}: deve usar o gate rastreável`);
  }
  const deployCloudflare = readFileSync(".github/workflows/deploy-cloudflare.yml", "utf8");
  assert.match(deployCloudflare, /node scripts\/guards\/npm-audit-gate\.mjs/);
});
