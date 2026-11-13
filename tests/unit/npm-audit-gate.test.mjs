// Trava anti-regressão do gate de auditoria de dependências
// (`scripts/guards/npm-audit-gate.mjs`).
//
// O advisory GHSA-86w9-cpqp-85rv (node-forge <= 1.4.0) foi resolvido
// atualizando a dependência para 1.4.2. O gate mantém o comportamento original:
// falhar por qualquer high/critical e exigir exceções explícitas quando uma
// dependência ainda não tiver correção upstream.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("gate: node-forge corrigido permanece travado no lockfile (>= 1.4.2)", () => {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const entry = lock.packages?.["node_modules/node-forge"];
  assert.ok(entry?.version, "node-forge presente no lockfile");
  const [major, minor, patch] = entry.version.split(".").map(Number);
  assert.ok(
    major > 1 || (major === 1 && (minor > 4 || (minor === 4 && patch >= 2))),
    `node-forge ${entry.version} precisa ser >= 1.4.2 (GHSA-86w9-cpqp-85rv)`,
  );
});

// Sem vulnerabilidade real no grafo, a regra de validade das exceções é
// exercitada numa cópia temporária do gate que lê um relatório sintético no
// lugar do `npm audit`. O gate publicado não ganha entrada nenhuma.
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
  const dir = mkdtempSync(join(tmpdir(), "npm-audit-gate-"));
  const file = join(dir, "gate.mjs");
  writeFileSync(file, patched);
  try {
    return { status: 0, stdout: execFileSync("node", [file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" };
  } catch (error) {
    return { status: error.status, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? "") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
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
