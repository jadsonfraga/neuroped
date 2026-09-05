import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { findUnreviewedSha256Literals } from "../../scripts/guards/public-provenance-digests.mjs";

const registryPath = "client/src/data/authorialSdgRegistry.ts";
const manifestPath = "client/public/authorial-sdg-manifest.json";
const corePath = "tests/clinical/test-authorial-sdg-core.mjs";
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read(manifestPath));
let checks = 0;
for (const path of [registryPath, manifestPath, corePath]) {
  assert.deepEqual(findUnreviewedSha256Literals(path, read(path)), [], `${path}: somente a proveniência revisada é aceita`);
  checks++;
}
for (const { sourceSha256: digest } of manifest.instruments) {
  for (const [path, snippet, count] of [
    [registryPath, `{ sourceSha256: "${digest}" }`, 0],
    [manifestPath, `{ "sourceSha256": "${digest}" }`, 0],
    [registryPath, `const MASTER_PIN = "${digest}";`, 1],
    [registryPath, `{ PIN_HASH: "${digest}" }`, 1],
    [registryPath, `verifyPassword("${digest}");`, 1],
    [registryPath, `const sourceSha256 = "${digest}";`, 1],
    [registryPath, `{ sourceSha256: "${digest}", secret: "${"a".repeat(64)}" }`, 1],
    [registryPath, `{ sourceSha256: "${"a".repeat(64)}" }`, 1],
    [registryPath, `{ another_sourceSha256: "${digest}" }`, 1],
    [corePath, `{ textSha256: "${digest}" }`, 1],
    ["client/src/components/PasswordGate.tsx", `{ sourceSha256: "${digest}" }`, 1],
    ["unreviewed.json", `{ "sourceSha256": "${digest}" }`, 1],
  ]) {
    assert.equal(findUnreviewedSha256Literals(path, snippet).length, count, `${path}: ${snippet.slice(0, 45)}`);
    checks++;
  }
}
const auditor = read("scripts/guards/audit-access-policy.mjs");
assert.match(auditor, /findUnreviewedSha256Literals\(rel, content\)/);
for (const label of ["verificador de PIN hardcoded", "PIN literal hardcoded", "fallback literal de secret do GitHub", "token Railway hardcoded", "segredo de aplicacao hardcoded"]) {
  assert.ok(auditor.includes(label), `${label}: proteção anterior deve permanecer`);
  checks++;
}
// Também executar o auditor completo em árvore sintética, sem tocar no app/PHI.
const fixture = mkdtempSync(join(tmpdir(), "sdg-access-guard-"));
const write = (path, content) => {
  const target = join(fixture, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
};
try {
  write("scripts/guards/audit-access-policy.mjs", auditor);
  write("scripts/guards/public-provenance-digests.mjs", read("scripts/guards/public-provenance-digests.mjs"));
  const routes = ["familia", "marcacao", "eletroencefalograma", "missao-saude", "pre-consulta", "pre-retorno", "efeitos-colaterais", "verificar", "portal-familia", "consentimento-lgpd"];
  write("client/src/App.tsx", `<PrivateGate><RouteGuard>${routes.map((route) => `<Route path="/${route}" component={Page} />`).join("\n")}</RouteGuard></PrivateGate>`);
  write("client/src/components/RouteGuard.tsx", "decideRouteAccess");
  write(manifestPath, read(manifestPath));
  for (const [suffix, expected] of [
    ["", 0],
    [`const MASTER_PIN = "${"fixture-only-not-a-secret"}";`, 1],
    [`const arbitrary = "${"b".repeat(64)}";`, 1],
    [`const suspicious = { sourceSha256: "${"b".repeat(64)}" };`, 1],
  ]) {
    write(registryPath, read(registryPath) + "\n" + suffix);
    const result = spawnSync(process.execPath, [join(fixture, "scripts/guards/audit-access-policy.mjs")], { cwd: fixture, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, expected, result.stderr || result.stdout);
    checks++;
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
console.log(`[public provenance] ${checks} verificações aprovadas; hashes documentais revisados não liberam PINs/tokens nem outros campos ou arquivos.`);
