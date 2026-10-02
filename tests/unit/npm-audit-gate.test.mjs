// Trava anti-regressão do gate de auditoria de dependências
// (`scripts/guards/npm-audit-gate.mjs`).
//
// O advisory GHSA-86w9-cpqp-85rv (node-forge <= 1.4.0, sem correção upstream)
// derrubava todos os pipelines com `npm audit`. O gate substitui as chamadas
// diretas nos workflows e mantém o comportamento original — falhar por
// qualquer high/critical — com UMA exceção rastreável: id exato do advisory,
// pacote afetado, motivo e data de validade. Vencida a data, volta a bloquear.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from "node:fs";
import test from "node:test";
import { execFileSync } from "node:child_process";

const GATE = "scripts/guards/npm-audit-gate.mjs";

test("gate: nenhuma high/critical fora da allowlist ativa no grafo atual", () => {
  const stdout = execFileSync("node", [GATE], { encoding: "utf8" });
  assert.match(stdout, /nenhuma vulnerabilidade high\/critical fora da allowlist ativa/);
  assert.match(stdout, /GHSA-86w9-cpqp-85rv/);
});

test("gate: exceção vencida volta a bloquear a esteira", () => {
  const source = readFileSync(GATE, "utf8");
  assert.match(source, /expiresOn: "2026-11-02"/, "prazo da exceção documentado no fonte");
  const expired = source.replace('expiresOn: "2026-11-02"', 'expiresOn: "2020-01-01"');
  const tmp = `${process.env.RUNNER_TEMP ?? "/tmp"}/npm-audit-gate-expired.mjs`;
  writeFileSync(tmp, expired);
  try {
    execFileSync("node", [tmp], { encoding: "utf8" });
    assert.fail("exceção vencida não pode passar no gate");
  } catch (error) {
    assert.match(String(error.stderr ?? ""), /BLOQUEADO: node-forge/);
  } finally {
    unlinkSync(tmp);
  }
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
