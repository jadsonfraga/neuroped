// Trava anti-regressão do gate de auditoria de dependências
// (`scripts/guards/npm-audit-gate.mjs`).
//
// O gate substitui as chamadas diretas de `npm audit` nos workflows e mantém o
// comportamento original — falhar por qualquer high/critical — admitindo apenas
// exceções rastreáveis: id exato do advisory, pacote afetado, motivo e data de
// validade. Vencida a data, volta a bloquear. A exceção de node-forge
// (GHSA-86w9-cpqp-85rv) foi removida com node-forge 1.4.2.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from "node:fs";
import test from "node:test";
import { execFileSync } from "node:child_process";

const GATE = "scripts/guards/npm-audit-gate.mjs";

test("gate: nenhuma high/critical fora da allowlist ativa no grafo atual", () => {
  const stdout = execFileSync("node", [GATE], { encoding: "utf8" });
  assert.match(stdout, /nenhuma vulnerabilidade high\/critical fora da allowlist ativa/);
  assert.doesNotMatch(stdout, /excecao ativa/, "allowlist vazia: nenhuma exceção pode estar ativa");
});

test("gate: excecao obsoleta de node-forge foi removida e a versao corrigida esta travada", () => {
  const source = readFileSync(GATE, "utf8");
  assert.doesNotMatch(source, /ghsa: "GHSA-86w9-cpqp-85rv"/);
  assert.doesNotMatch(source, /packageName: "node-forge"/);
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const [major, minor, patch] = lock.packages["node_modules/node-forge"].version.split(".").map(Number);
  assert.ok(major > 1 || (major === 1 && (minor > 4 || (minor === 4 && patch >= 2))), "node-forge >= 1.4.2");
});

test("gate: excecao obsoleta de braces foi removida", () => {
  const source = readFileSync(GATE, "utf8");
  assert.doesNotMatch(source, /GHSA-vfj7-8cjw-p6xm/);
  assert.doesNotMatch(source, /packageName: "braces"/);
});

// Sem vulnerabilidade real no grafo, a regra de validade é exercitada numa cópia
// temporária do gate que lê um relatório sintético no lugar do `npm audit`.
// A cópia só existe dentro do teste; o gate publicado não ganha entrada extra.
function runGateWithSyntheticAudit(expiresOn) {
  const source = readFileSync(GATE, "utf8");
  const allowlist = "const ALLOWLIST = [];";
  assert.equal(source.split(allowlist).length, 2, "allowlist localizada uma única vez");
  const npmCall = /raw = execFileSync\(isWindows \? "npm\.cmd" : "npm", \["audit"[\s\S]*?\}\);/;
  assert.match(source, npmCall, "chamada do npm audit localizada");
  const report = {
    vulnerabilities: {
      "pacote-sintetico": {
        severity: "high",
        via: [{ title: "Advisory sintético", url: "https://github.com/advisories/GHSA-test-0000-0000" }],
      },
    },
  };
  const patched = source
    .replace(allowlist, `const ALLOWLIST = [{ ghsa: "GHSA-test-0000-0000", packageName: "pacote-sintetico", reason: "teste", expiresOn: "${expiresOn}" }];`)
    .replace(npmCall, `raw = ${JSON.stringify(JSON.stringify(report))};`);
  const tmp = `${process.env.RUNNER_TEMP ?? "/tmp"}/npm-audit-gate-synthetic-${expiresOn}.mjs`;
  writeFileSync(tmp, patched);
  try {
    return { status: 0, stdout: execFileSync("node", [tmp], { encoding: "utf8" }), stderr: "" };
  } catch (error) {
    return { status: error.status, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? "") };
  } finally {
    unlinkSync(tmp);
  }
}

test("gate: exceção válida libera somente o advisory listado", () => {
  const result = runGateWithSyntheticAudit("2999-12-31");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /excecao ativa: pacote-sintetico \(GHSA-test-0000-0000\)/);
});

test("gate: exceção vencida volta a bloquear a esteira", () => {
  const result = runGateWithSyntheticAudit("2020-01-01");
  assert.equal(result.status, 1, "exceção vencida não pode passar no gate");
  assert.match(result.stderr, /BLOQUEADO: pacote-sintetico/);
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
