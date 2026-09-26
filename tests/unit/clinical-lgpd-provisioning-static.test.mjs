// Provisionamento LGPD no deploy e gerador do keyring clínico: idempotente,
// condicional ao bloqueio externo, fail-closed na verificação de efeito e sem
// escrita de segredo em CI nem em disco.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
