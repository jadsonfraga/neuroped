import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const marker = "NEUROPED_LEGACY_DEPLOY_DISABLED";
const scriptExtensions = new Set([
  ".sh",
  ".bat",
  ".ps1",
  ".vbs",
  ".cjs",
  ".mjs",
]);
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  "tests",
]);
const workflowOwnedMutators = new Set([
  "scripts/finalize-clinical-encryption-release.sh",
]);

const legacyEntrypoints = [
  "deploy.sh",
  "deploy-production.sh",
  "scripts/deploy.sh",
  "railway_deploy.bat",
  "RAILWAY-TOKEN-DEPLOY.bat",
  "railway_api_deploy.ps1",
  "fix.cjs",
  "fix-railway.mjs",
  "DEPLOY-AGORA.ps1",
  "WRANGLER-DEPLOY.ps1",
  "neuroped_deploy.bat",
  "DEPLOY-NEUROPED-FINAL.bat",
  "RODAR-RAILWAY-API.bat",
  "push-railway-fix.ps1",
  "run-git-push.bat",
  "PUSH-E-WORKFLOW.ps1",
  "PUSH_FINAL.bat",
  "push_neuroped.bat",
  "EXECUTAR_GIT_PUSH.bat",
  "RUN_GIT_PUSH.vbs",
  "FIX_DEPLOY.vbs",
  "_build_fix.bat",
  "_git_setup.bat",
  "railway_check.bat",
  "rn.ps1",
];

const forbiddenMutations = [
  /\bgit\s+push\b/i,
  /\bvercel\s+(?:deploy|--prod|login)\b/i,
  /\brailway\s+(?:init|up|login|add|variables)\b/i,
  /\b(?:npx\s+)?wrangler(?:@\S+)?\s+pages\s+deploy\b/i,
  /\b(?:projectCreate|serviceCreate|serviceInstanceDeploy|variableUpsert)\b/,
  /\bpages-action@v1\b/i,
];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function walk(directory, found = []) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const absolute = join(directory, entry);
    const info = statSync(absolute);
    if (info.isDirectory()) {
      walk(absolute, found);
    } else if (scriptExtensions.has(extname(entry).toLowerCase())) {
      found.push(absolute);
    }
  }
  return found;
}

for (const path of legacyEntrypoints) {
  assert.equal(
    existsSync(join(root, path)),
    true,
    `helper inventariado ausente: ${path}`,
  );
  const content = read(path);
  assert.match(
    content,
    new RegExp(marker),
    `helper sem trava explícita: ${path}`,
  );

  const extension = extname(path).toLowerCase();
  const exitPattern =
    extension === ".bat"
      ? /exit\s+\/b\s+1/i
      : extension === ".vbs"
        ? /WScript\.Quit\s+1/i
        : [".cjs", ".mjs"].includes(extension)
          ? /process\.exit\(1\)/
          : /exit\s+1/i;
  assert.match(content, exitPattern, `helper não falha fechado: ${path}`);
}

const violations = [];
for (const absolute of walk(root)) {
  const relativePath = relative(root, absolute);
  if (workflowOwnedMutators.has(relativePath)) continue;
  const content = readFileSync(absolute, "utf8");
  for (const pattern of forbiddenMutations) {
    if (pattern.test(content)) {
      violations.push(`${relative(root, absolute)}: ${pattern}`);
    }
  }
}
assert.deepEqual(
  violations,
  [],
  `scripts fora dos workflows não podem publicar ou alterar provedores:\n${violations.join("\n")}`,
);

const clinicalFinalizer = read("scripts/finalize-clinical-encryption-release.sh");
assert.match(clinicalFinalizer, /GITHUB_ACTIONS[^\n]*true/);
assert.match(clinicalFinalizer, /GITHUB_REF[^\n]*refs\/heads\/main/);
assert.match(clinicalFinalizer, /GITHUB_WORKFLOW[^\n]*Deploy Cloudflare Pages/);
assert.match(clinicalFinalizer, /wrangler@4 pages deploy dist\/public --project-name \"?\$PROJECT\"? --branch main/);
assert.match(
  read(".github/workflows/deploy-cloudflare.yml"),
  /run: bash scripts\/finalize-clinical-encryption-release\.sh/,
  "o único helper mutador permitido deve ser invocado pelo workflow oficial",
);

for (const path of [
  "HOSPEDAGEM.md",
  "DEPLOY.md",
  "docs/DEPLOY.md",
  "docs/ADMIN_LOGIN_SETUP.md",
]) {
  const content = read(path);
  assert.match(content, /DEPLOY_OFICIAL\.md/);
  assert.doesNotMatch(
    content,
    /vercel\.com\/new|railway\.app|render\.com|wrangler\s+pages\s+deploy/i,
    `guia vigente contém rota manual obsoleta: ${path}`,
  );
}

for (const path of [
  "CLOUD-STORAGE.md",
  "DEPLOYMENT_FINAL_SESSION.md",
  "DEPLOYMENT_SUMMARY.md",
  "DEPLOYMENT_READY.md",
  "STRATEGIC_PROMPT_CLAUDE_COWORK.md",
  "docs/DEPLOY_RECENTE_60_MIN.md",
  "docs/PLANO_BACKEND_GRATUITO.md",
]) {
  assert.match(
    read(path).slice(0, 320),
    /NEUROPED_HISTORICAL_DEPLOY_RECORD/,
    `registro histórico sem aviso de segurança: ${path}`,
  );
}

const packageJson = JSON.parse(read("package.json"));
assert.equal(
  packageJson.scripts["db:push"],
  "node scripts/guards/deny-external-db-push.mjs",
  "db:push deve falhar fechado sem alcançar Postgres externo",
);

const dbPushGuard = "scripts/guards/deny-external-db-push.mjs";
assert.match(read(dbPushGuard), /NEUROPED_LEGACY_DEPLOY_DISABLED/);
const dbPushResult = spawnSync(process.execPath, [join(root, dbPushGuard)], {
  encoding: "utf8",
});
assert.equal(dbPushResult.status, 1, "guard de db:push deve encerrar com erro");

const vercelConfig = JSON.parse(read("vercel.json"));
assert.equal(
  vercelConfig.git?.deploymentEnabled,
  false,
  "Vercel Git auto-deploy deve ficar desativado; somente o workflow oficial publica",
);
assert.match(read("CONTRIBUTING.md"), /Git auto-deploy da Vercel permanece desativado/);
assert.doesNotMatch(
  read("CONTRIBUTING.md"),
  /branches feature criam preview environments/i,
);

const cloudflareWorkflow = read(".github/workflows/deploy-cloudflare.yml");
assert.match(cloudflareWorkflow, /denied_ok=0/);
assert.match(
  cloudflareWorkflow,
  /cors-denied=\$\{GITHUB_RUN_ID\}&origin=\$\{denied_index\}&try=\$\{attempt\}/,
);
assert.match(
  cloudflareWorkflow,
  /Negação CORS ainda propagando[^\n]+tentativa \$attempt\/12/,
);
assert.match(cloudflareWorkflow, /for attempt in \$\(seq 1 12\); do/);
assert.match(cloudflareWorkflow, /\[ "\$denied_get_code" = "200" \]/);
assert.match(cloudflareWorkflow, /\[ "\$denied_code" = "204" \]/);
assert.match(
  cloudflareWorkflow,
  /header_present\(\) \{[\s\S]*?grep -qi "\^\$\{2\}:"[\s\S]*?\}/,
  "presença de ACAO deve ser detectada mesmo com valor vazio ou sem espaço",
);
assert.doesNotMatch(
  cloudflareWorkflow,
  /-z "\$\(header_value "\$denied(?:_preflight)?_headers" Access-Control-Allow-Origin\)"/,
);
const deniedHeaderChecks = cloudflareWorkflow.match(
  /! header_present "\$denied(?:_preflight)?_headers" Access-Control-Allow-Origin/g,
);
assert.equal(
  deniedHeaderChecks?.length,
  2,
  "GET e OPTIONS negados devem exigir ausência completa de ACAO",
);

for (const manifest of ["railway.json", "railway.toml", "nixpacks.toml"]) {
  assert.equal(
    existsSync(join(root, manifest)),
    false,
    `manifest legado autodetectável não pode existir: ${manifest}`,
  );
}

const drizzleConfig = read("drizzle.config.ts");
assert.match(drizzleConfig, /NEUROPED_ALLOW_LOCAL_SCHEMA_TOOLS/);
assert.match(drizzleConfig, /localhost.*127\.0\.0\.1.*::1/s);
assert.doesNotMatch(drizzleConfig, /url:\s*process\.env\.DATABASE_URL/);

for (const path of [
  "db/schema.sql",
  "db/seed_demo.sql",
  "db/migrations/0001_users_auth.sql",
  "wrangler.toml",
  "wrangler.toml.example",
]) {
  assert.doesNotMatch(
    read(path),
    /wrangler[^\n]*(?:--remote|secret\s+put|pages\s+deploy)|d1\s+execute[^\n]*(?:produção|remote)/i,
    `arquivo contém instrução manual de mutação remota: ${path}`,
  );
}

console.log(
  "✓ entrypoints legados falham fechado e deploy manual não reaparece",
);
