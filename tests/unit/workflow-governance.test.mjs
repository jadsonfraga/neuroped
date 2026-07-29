import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const cloudflareDeploy = read(".github/workflows/deploy-cloudflare.yml");
const githubPagesDeploy = read(".github/workflows/deploy.yml");
const securityAudit = read(".github/workflows/security-audit.yml");
const testAndBuild = read(".github/workflows/test-and-build.yml");
const vercelDeploy = read(".github/workflows/deploy-vercel.yml");
const verify = read(".github/workflows/verify.yml");
const prCheck = read(".github/workflows/pr-check.yml");
const vercelConfig = read("vercel.json");

assert.match(securityAudit, /set -euo pipefail/);
assert.match(securityAudit, /if \[ "\$audit_exit" -gt 1 \]/);
assert.match(securityAudit, /python3 - "\$report"/);
assert.match(securityAudit, /npm audit --json "\$@"/);
assert.match(
  securityAudit,
  /run_audit audit-production-report\.json --omit=dev/,
);
assert.doesNotMatch(securityAudit, /npm audit[^\n]*\|\| true/);
assert.doesNotMatch(securityAudit, /\|\| echo "0"/);
assert.match(securityAudit, /Alerta de vulnerabilidades high\/critical/);
assert.match(
  securityAudit,
  /github\.paginate\(github\.rest\.issues\.listForRepo/,
);
assert.match(securityAudit, /state: "all"/);
assert.match(securityAudit, /state_reason = "reopened"/);
assert.match(securityAudit, /state_reason: "not_planned"/);
assert.match(securityAudit, /state_reason: "completed"/);

assert.match(prCheck, /issues: write/);
assert.match(prCheck, /- name: Lint\s+id: lint\s+run: npm run lint/);
assert.doesNotMatch(prCheck, /npm run lint --if-present/);
assert.match(
  prCheck,
  /const ready = buildStatus && typecheckStatus && lintStatus && accessStatus/,
);
assert.match(
  prCheck,
  /id: access[\s\S]{0,240}npm run validate:public && npm run audit:access[\s\S]{0,160}route-guard-policy\.test\.ts/,
  "o status do PR deve incluir a política de acesso fail-closed",
);
assert.match(prCheck, /<!-- neuroped-pr-check -->/);
assert.match(prCheck, /github\.paginate\(github\.rest\.issues\.listComments/);
assert.match(prCheck, /github\.rest\.issues\.updateComment/);

for (const [name, workflow] of [
  ["Deploy Cloudflare", cloudflareDeploy],
  ["Deploy GitHub Pages", githubPagesDeploy],
  ["Deploy Vercel", vercelDeploy],
  ["Test, Lint & Build", testAndBuild],
  ["Verify NeuroPed", verify],
]) {
  assert.match(
    workflow,
    /npm audit --audit-level=high/,
    `${name} deve bloquear high/critical no grafo completo`,
  );
}

assert.match(testAndBuild, /permissions:\s*\n\s*contents: read/);
assert.match(
  testAndBuild,
  /require-checks:[\s\S]{0,180}if: always\(\)/,
  "o agregador deve executar mesmo após falha, cancelamento ou skip",
);
assert.match(
  testAndBuild,
  /- name: Check CI Status[\s\S]{0,700}exit 1/,
  "o agregador deve reprovar explicitamente qualquer resultado não-success",
);
assert.match(
  prCheck,
  /- name: Falhar se qualquer verificação crítica quebrou[\s\S]{0,650}steps\.access\.outcome[\s\S]{0,160}exit 1/,
  "o PR Check deve falhar quando o gate de acesso falhar",
);
for (const dependency of ["quality", "build", "production-readiness"]) {
  assert.match(
    testAndBuild,
    new RegExp(`needs\\.${dependency.replace("-", "\\-")}\\.result \\}\\}" != "success"`),
    `o agregador deve falhar se ${dependency} for skipped/cancelled`,
  );
}

for (const [name, workflow, firstJob] of [
  ["Cloudflare", cloudflareDeploy, "status-pending"],
  ["GitHub Pages", githubPagesDeploy, "status-pending"],
  ["Vercel", vercelDeploy, "preflight"],
]) {
  assert.doesNotMatch(
    workflow,
    /workflow_dispatch:/,
    `${name} não deve executar YAML ou secrets a partir de uma ref escolhida manualmente`,
  );
  assert.match(workflow, /assert-main:/, `${name} deve validar a origem do deploy`);
  assert.match(
    workflow,
    /if \[ "\$GITHUB_REF" != "refs\/heads\/main" \]; then[\s\S]{0,180}exit 1/,
    `${name} deve falhar explicitamente fora da main`,
  );
  assert.match(
    workflow,
    new RegExp(`${firstJob}:\\n\\s*needs: assert-main`),
    `${name} deve bloquear todos os jobs de publicação atrás de assert-main`,
  );
}

assert.match(
  vercelDeploy,
  /npm install --global vercel@56\.4\.1/,
  "Vercel CLI deve usar versão reproduzível",
);
assert.doesNotMatch(vercelDeploy, /vercel@latest/);
assert.match(
  vercelConfig,
  /connect-src 'self' https:\/\/neuroped\.pages\.dev https:\/\/raw\.githubusercontent\.com/,
  "o mirror Vercel deve autorizar somente os destinos de rede necessários",
);
assert.doesNotMatch(
  vercelConfig,
  /connect-src 'self' https:;/,
  "o mirror Vercel não pode liberar conexões para qualquer origem HTTPS",
);

assert.match(cloudflareDeploy, /A project with this name already exists\./);
assert.match(cloudflareDeploy, /\[code: 8000002\]/);
assert.doesNotMatch(
  cloudflareDeploy,
  /pages project create[^\n]*\\\s*\n\s*\|\| echo/,
  "falhas inesperadas ao criar/consultar projeto Cloudflare não podem ser mascaradas",
);
assert.equal(
  cloudflareDeploy.match(/context="NeuroPed \/ Cloudflare production"/g)
    ?.length,
  2,
  "Cloudflare deve publicar status pendente e resultado final no commit",
);
assert.match(
  cloudflareDeploy,
  /DEPLOY_RESULT: \$\{\{ needs\.deploy-cloudflare\.result \}\}/,
);
assert.match(
  cloudflareDeploy,
  /Backend canônico, D1, CORS e autenticação confirmados\./,
);
assert.doesNotMatch(
  cloudflareDeploy,
  /CERT_P12_B64|CERT_P12_PASSWORD|CERT_B64|CERT_PW/,
  "o deploy nunca deve sincronizar certificado ICP-Brasil ou senha para o provedor",
);

console.log(
  "✓ workflows falham fechado e não emitem sinais ou alertas duplicados",
);
