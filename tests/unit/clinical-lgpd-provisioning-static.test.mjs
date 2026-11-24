// Provisionamento LGPD no deploy e gerador do keyring clínico: idempotente,
// condicional ao bloqueio externo, fail-closed na verificação de efeito e sem
// escrita de segredo em CI nem em disco.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import test from "node:test";

const deploy = readFileSync(".github/workflows/deploy-cloudflare.yml", "utf8");
const generator = readFileSync("scripts/ops/generate-clinical-keyring.mjs", "utf8");
const doc = readFileSync("docs/audits/BLOCKED_EXTERNAL_CLINICAL_LGPD_PROVISIONING_2026-09-26.md", "utf8");
const between = (text, from, to) => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));

test("bucket LGPD: confere antes de criar, cria só no 404, bloqueio externo declarado no 401/403, binding só com bucket disponível", () => {
  const step = between(deploy, "Provisionar bucket LGPD (R2) e binding", "- name: Deploy para Cloudflare Pages");
  assert.ok(step.indexOf("Provisionar bucket LGPD") < deploy.indexOf("- name: Deploy para Cloudflare Pages"), "binding entra antes do deploy");
  assert.match(step, /bucket="neuroped-lgpd-exports"/);
  assert.match(step, /200\) echo "bucket \$bucket: já existe\."; available=1/);
  assert.match(step, /404\)[\s\S]*--data "\{\\"name\\":\\"\$bucket\\"\}"/);
  assert.match(step, /401\|403\)[\s\S]*BLOCKED_EXTERNAL_R2_TOKEN_PERMISSION/);
  assert.match(step, /\*\) echo "::error::[^"]*"; exit 1 ;;/, "erro inesperado derruba o deploy");
  assert.match(step, /if \[ "\$available" = "1" \]; then\s*if ! grep -Fq 'binding = "LGPD_EXPORT_BUCKET"' wrangler\.toml; then/);
  assert.match(step, /\[\[r2_buckets\]\]\\nbinding = "LGPD_EXPORT_BUCKET"\\nbucket_name = "%s"/);
  assert.match(step, /LGPD_BUCKET_BOUND=true/);
  assert.match(step, /LGPD_BUCKET_BOUND=false/);
  assert.doesNotMatch(step, /secret put|CLINICAL_DATA_KEY|CLINICAL_INDEX_KEY/, "o passo de bucket não toca em segredos");
});

test("verificação de efeito: fail-closed para binding LGPD aplicado e para o binding D1 sempre", () => {
  const step = between(deploy, "Verificar efeito do provisionamento LGPD", "- name: Validar health autenticado");
  assert.ok(deploy.indexOf("Verificar efeito do provisionamento LGPD") > deploy.indexOf("- name: Deploy para Cloudflare Pages"), "verificação depois do deploy");
  assert.match(step, /d1_databases\.DB\.id \/\/ empty/);
  assert.match(step, /\[ -n "\$db" \] \|\| \{ echo "::error::[^"]*"; exit 1; \}/);
  assert.match(step, /r2_buckets\.LGPD_EXPORT_BUCKET\.name \/\/ empty/);
  assert.match(step, /\[ "\$r2" = "neuroped-lgpd-exports" \] \|\| \{ echo "::error::[^"]*"; exit 1; \}/);
});

test("wrangler.toml versionado continua sem o binding: ele só existe na execução em que o bucket foi comprovado", () => {
  assert.doesNotMatch(readFileSync("wrangler.toml", "utf8"), /r2_buckets|LGPD_EXPORT_BUCKET/);
});

test("secrets do Pages: sincroniza keyring clínico e chave de import BoaConsulta como opcionais (mesmo padrão da operacional)", () => {
  const step = between(deploy, "Configurar secrets/vars de auth no Pages", "- name: Provisionar bucket LGPD");
  assert.match(step, /put_optional CLINICAL_DATA_KEY/);
  assert.match(step, /put_optional CLINICAL_DATA_KEY_ID/);
  assert.match(step, /put_optional CLINICAL_INDEX_KEY/);
  assert.match(step, /put_optional CLINICAL_DATA_KEY_PREVIOUS/);
  assert.match(step, /put_optional CLINICAL_DATA_KEY_PREVIOUS_ID/);
  assert.match(step, /put_optional NEUROPED_IMPORT_ENCRYPTION_KEY/);
  assert.match(step, /put_optional OPERATIONAL_DATA_KEY/);
  assert.match(step, /secrets\.CLINICAL_DATA_KEY/);
  assert.match(step, /secrets\.CLINICAL_INDEX_KEY/);
  assert.doesNotMatch(step, /put_required CLINICAL_DATA_KEY/, "chave clínica continua opcional para não derrubar o deploy");
});

test("gerador do keyring: aleatório, separado, sem gravar em disco, sem enviar a lugar algum", () => {
  assert.match(generator, /randomBytes\(48\)\.toString\("base64url"\)/);
  assert.match(generator, /while \(indexKey === dataKey\)/);
  assert.match(generator, /KEY_ID_PATTERN = \/\^\[A-Za-z0-9_-\]\{1,32\}\$\//);
  assert.doesNotMatch(generator, /writeFile|appendFile|fetch\(|execSync|spawn|child_process/);
  assert.match(generator, /wrangler@4 pages secret put CLINICAL_DATA_KEY --project-name neuroped/);
});

test("bloqueio externo documentado com sistema, permissão exata, ação, risco e verificação", () => {
  for (const needle of ["Workers R2 Storage: Edit", "neuroped-lgpd-exports", "generate-clinical-keyring.mjs", "CLINICAL_CRYPTO_NOT_READY", "LGPD_BUCKET_NOT_CONFIGURED", "Verificação de conclusão", "Rollback"]) {
    assert.ok(doc.includes(needle), needle);
  }
});


test("documentação vigente distingue nome de secret presente de keyring runtime utilizável", () => {
  assert.match(doc, /36370524799/);
  assert.match(doc, /secret_text/);
  assert.match(doc, /CLINICAL_CRYPTO_NOT_CONFIGURED/);
  assert.match(doc, /presença do nome de um secret no metadata \*\*não prova valor utilizável no\s+runtime\*\*/);
  assert.match(doc, /não gerar\/substituir cegamente uma chave existente/);
  assert.match(doc, /Workers R2 Storage: Edit/);
  assert.match(doc, /Criar \*\*somente\*\* o bucket pelo painel[\s\S]*não\s+desbloqueia o pipeline atual/);
  assert.match(doc, /NO-GO/);
});

function executeProvisioning({ bucketName, available = true }) {
  const dir = mkdtempSync(join(tmpdir(), "neuroped-r2-ci-test-"));
  try {
    const step = between(deploy, "Provisionar bucket LGPD (R2) e binding", "- name: Deploy para Cloudflare Pages");
    const script = step.split("run: |\n").at(1).trimEnd().split("\n")
      .map((line) => line.replace(/^ {10}/, "")).join("\n");
    writeFileSync(join(dir, "wrangler.toml"), 'name = "neuroped"\n');
    writeFileSync(join(dir, "output"), "");
    writeFileSync(join(dir, "curl"), `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const url = args.at(-1);
if (args.includes("--data")) process.exit(91);
if (url.endsWith("/r2/buckets/neuroped-lgpd-exports")) {
  fs.writeFileSync(args[args.indexOf("-o") + 1], "{}");
  process.stdout.write("403");
} else if (url.endsWith("/pages/projects/neuroped")) {
  if (process.env.FIXTURE_METADATA_AVAILABLE !== "yes") process.exit(22);
  const bucketName = process.env.FIXTURE_BUCKET;
  const r2_buckets = bucketName ? { LGPD_EXPORT_BUCKET: { name: bucketName } } : {};
  const payload = JSON.stringify({ success: true, result: { deployment_configs: { production: { r2_buckets } } } });
  if (args.includes("-o")) fs.writeFileSync(args[args.indexOf("-o") + 1], payload);
  else process.stdout.write(payload);
} else process.exit(92);
`, { mode: 0o700 });
    const result = spawnSync("bash", ["-c", script], {
      cwd: dir, encoding: "utf8", timeout: 5000,
      env: {
        ...process.env, PATH: dir + delimiter + process.env.PATH,
        CLOUDFLARE_API_TOKEN: "ficticio", CLOUDFLARE_ACCOUNT_ID: "conta-ficticia",
        GITHUB_ENV: join(dir, "output"),
        FIXTURE_METADATA_AVAILABLE: available ? "yes" : "no",
        FIXTURE_BUCKET: bucketName ?? "",
      },
    });
    return { ...result, vars: readFileSync(join(dir, "output"), "utf8"), configuration: readFileSync(join(dir, "wrangler.toml"), "utf8") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("403 no R2: preserva apenas o binding verificado nos metadados do Pages", () => {
  const saved = executeProvisioning({ bucketName: "neuroped-lgpd-exports" });
  assert.equal(saved.status, 0, saved.stderr);
  assert.match(saved.vars, /LGPD_BUCKET_BOUND=true/);
  assert.match(saved.configuration, /bucket_name = "neuroped-lgpd-exports"/);
  const missing = executeProvisioning({});
  assert.equal(missing.status, 0, missing.stderr);
  assert.match(missing.stdout, /BLOCKED_EXTERNAL_R2_TOKEN_PERMISSION/);
  assert.match(missing.vars, /LGPD_BUCKET_BOUND=false/);
  assert.doesNotMatch(missing.configuration, /LGPD_EXPORT_BUCKET/);
});

test("403 no R2: metadados inacessíveis ou vínculo divergente não são aceitos", () => {
  for (const bad of [{ bucketName: "bucket-alheio" }, { available: false }]) {
    const result = executeProvisioning(bad);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.configuration, /LGPD_EXPORT_BUCKET/);
  }
});
