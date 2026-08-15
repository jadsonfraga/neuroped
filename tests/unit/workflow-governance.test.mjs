import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(
    /\r\n?/g,
    "\n",
  );
const cloudflareDeploy = read(".github/workflows/deploy-cloudflare.yml");
const boaConsultaPr = read(".github/workflows/boaconsulta-import-pr.yml");
const dailyContract = read(".github/workflows/daily-authorial-contract.yml");
const dailyInventory = read(".github/workflows/daily-authorial-inventory.yml");
const dailyStaticSync = read(
  ".github/workflows/daily-authorial-static-sync.yml",
);
const githubPagesDeploy = read(".github/workflows/deploy.yml");
const packageJson = JSON.parse(read("package.json"));
const provisionD1 = read(".github/workflows/provision-d1.yml");
const securityAudit = read(".github/workflows/security-audit.yml");
const testAndBuild = read(".github/workflows/test-and-build.yml");
const vercelDeploy = read(".github/workflows/deploy-vercel.yml");
const verify = read(".github/workflows/verify.yml");
const prCheck = read(".github/workflows/pr-check.yml");
const vercelConfig = read("vercel.json");

assert.match(boaConsultaPr, /on:\s*\n\s*pull_request:/);
assert.doesNotMatch(
  boaConsultaPr,
  /secrets\.|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|--remote|pages secret|d1 execute/,
  "workflows de pull request devem permanecer somente leitura e nunca tocar produção",
);

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
  /const ready = buildStatus && typecheckStatus && lintStatus && accessStatus && conectaStatus/,
  "o PR Check deve exigir também o contrato do NeuroPed Conecta",
);
assert.match(
  prCheck,
  /id: access[\s\S]{0,240}npm run validate:public && npm run audit:access[\s\S]{0,160}route-guard-policy\.test\.ts/,
  "o status do PR deve incluir a política de acesso fail-closed",
);
assert.match(prCheck, /<!-- neuroped-pr-check -->/);
assert.match(prCheck, /github\.paginate\(github\.rest\.issues\.listComments/);
assert.match(prCheck, /github\.rest\.issues\.updateComment/);

assert.equal(
  packageJson.scripts?.["test:daily-inventory"],
  "node --import tsx tests/unit/daily-inventory-regressions.test.ts",
  "o teste de regressão diário deve permanecer nomeado e executável",
);
assert.match(
  packageJson.scripts?.["verify:release"] ?? "",
  /npm run test:daily-inventory/,
  "o gate de release não pode desconectar as regressões do inventário diário",
);
for (const guardedPath of [
  "client/src/lib/instrument-library-filters.ts",
  "tests/unit/daily-inventory-regressions.test.ts",
  "package.json",
]) {
  assert.match(
    dailyContract,
    new RegExp(guardedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `o contrato diário deve observar ${guardedPath}`,
  );
}
assert.match(
  dailyContract,
  /run: npm run test:daily-inventory/,
  "o contrato especializado deve executar a regressão diretamente",
);
assert.match(
  dailyInventory,
  /npm run verify/,
  "a automação diária deve passar pelo gate completo antes de gravar na main",
);
assert.match(
  dailyInventory,
  /GH_TOKEN: \$\{\{ secrets\.NEUROPED_AUTOMATION_TOKEN \|\| github\.token \}\}/,
  "a automação diária deve usar github.token como fallback seguro quando o token dedicado estiver ausente",
);
assert.doesNotMatch(
  dailyInventory,
  /NEUROPED_AUTOMATION_TOKEN é obrigatório/,
  "a ausência do token dedicado não pode invalidar um artefato já gerado, auditado e preservado em PR draft",
);
assert.match(
  dailyInventory,
  /git push origin "HEAD:refs\/heads\/\$branch"/,
  "o fallback deve continuar publicando somente uma branch de revisão, nunca a main",
);
assert.match(
  dailyInventory,
  /Data inválida[^\n]*calendário|isValidCalendarDate|toISOString\(\)\.slice\(0, 10\)/,
  "a entrada manual deve rejeitar datas inexistentes antes da geração e do fallback",
);
assert.doesNotMatch(
  dailyInventory,
  /rm -f "\$\{\{ steps\.current\.outputs\.file \}\}"/,
  "falhas de promoção ou force devem preservar o inventário anterior",
);
assert.match(
  dailyInventory,
  /Bloquear force não concretizado[\s\S]{0,300}steps\.gpt\.outcome != 'success'[\s\S]{0,180}exit 1/,
  "force que não substituiu o registro deve falhar de modo explícito",
);
assert.ok(
  (dailyStaticSync.match(/npm run verify/g) ?? []).length >= 2,
  "cada rota auxiliar de sincronização deve validar a revisão antes de publicar",
);
assert.match(
  dailyStaticSync,
  /cloudflare:[\s\S]{0,500}concurrency:\s*\n\s*group: cloudflare-pages/,
  "a sincronização Cloudflare deve compartilhar o lock do deploy canônico",
);
assert.match(
  dailyStaticSync,
  /vercel:[\s\S]{0,500}concurrency:\s*\n\s*group: vercel-production/,
  "a sincronização Vercel deve compartilhar o lock do deploy canônico",
);
assert.match(provisionD1, /group: cloudflare-pages/);
assert.match(provisionD1, /ref: main/);
assert.match(
  provisionD1,
  /GITHUB_REF[^\n]*refs\/heads\/main[\s\S]{0,180}exit 1/,
  "o provisionamento não pode executar a partir de uma ref escolhida manualmente",
);
assert.match(
  provisionD1,
  /npm run verify/,
  "o provisionamento não pode publicar frontend sem o gate completo",
);

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
const prCriticalFailureStep =
  prCheck.match(
    /- name: Falhar se qualquer verificação crítica quebrou[\s\S]*?(?=\n\s{6}- name:|\s*$)/,
  )?.[0] ?? "";
assert.match(
  prCriticalFailureStep,
  /steps\.access\.outcome/,
  "o PR Check deve falhar quando o gate de acesso falhar",
);
assert.match(
  prCriticalFailureStep,
  /steps\.conecta\.outcome/,
  "o PR Check deve falhar quando o gate do Conecta falhar",
);
assert.match(
  prCriticalFailureStep,
  /exit 1/,
  "o PR Check deve reprovar explicitamente qualquer gate crítico não-success",
);
for (const dependency of ["quality", "build", "production-readiness"]) {
  assert.match(
    testAndBuild,
    new RegExp(
      `needs\\.${dependency.replace("-", "\\-")}\\.result \\}\\}" != "success"`,
    ),
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
  assert.match(
    workflow,
    /assert-main:/,
    `${name} deve validar a origem do deploy`,
  );
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
