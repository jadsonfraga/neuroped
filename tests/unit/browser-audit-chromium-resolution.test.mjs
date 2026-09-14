/**
 * Regressão dos gates de navegador.
 *
 * Dois defeitos reais desta suíte nasceram juntos:
 *
 * 1. Cada gate resolvia o Chromium sozinho e enxergava só duas fontes — a
 *    variável `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` e o browser gerenciado
 *    exatamente na revisão que o Playwright instalado espera. Numa imagem que
 *    já traz Chromium em outra revisão (runner com download de browser
 *    desligado), todo gate visual declarava "Chromium indisponível" e a prova
 *    visual virava bloqueio externo permanente.
 * 2. O gate de contraste respondia a essa ausência com `process.exit(0)`.
 *    `verify:release` ficava verde tendo medido zero superfície — o "check
 *    verde via skip" que o AGENTS.md proíbe.
 *
 * Estas assertivas falham se qualquer um dos dois voltar.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditBrowserLaunchOptions,
  discoverManagedChromium,
  resolveAuditChromiumPath,
} from "../../scripts/lib/browser-audit-runtime.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(resolve(repoRoot, relativePath), "utf8");

function makeBinary(root, revisionDir, ...segments) {
  const binary = join(root, revisionDir, ...segments);
  mkdirSync(dirname(binary), { recursive: true });
  writeFileSync(binary, "#!/bin/sh\n");
  return binary;
}

const sandbox = mkdtempSync(join(tmpdir(), "neuroped-chromium-"));
const savedEnv = { ...process.env };

try {
  // --- descoberta na imagem -------------------------------------------------
  assert.equal(discoverManagedChromium([join(sandbox, "vazio")]), null, "raiz inexistente não pode inventar binário");

  const roots = join(sandbox, "pw-browsers");
  const shell = makeBinary(roots, "chromium_headless_shell-1194", "chrome-headless-shell-linux64", "chrome-headless-shell");
  assert.equal(discoverManagedChromium([roots]), shell, "headless shell serve quando é tudo que existe");

  const full = makeBinary(roots, "chromium-1194", "chrome-linux", "chrome");
  assert.equal(discoverManagedChromium([roots]), full, "Chromium completo tem precedência sobre o headless shell");

  const newer = makeBinary(roots, "chromium-1208", "chrome-linux", "chrome");
  assert.equal(discoverManagedChromium([roots]), newer, "revisão mais alta vence");
  assert.notEqual(discoverManagedChromium([roots]), full);

  // Diretório com o prefixo certo mas sem binário não conta como instalação.
  mkdirSync(join(roots, "chromium-1300"), { recursive: true });
  assert.equal(discoverManagedChromium([roots]), newer, "pasta sem executável não pode ser eleita");

  // --- precedência da variável explícita ------------------------------------
  const explicit = join(sandbox, "explicito", "chrome");
  mkdirSync(dirname(explicit), { recursive: true });
  writeFileSync(explicit, "#!/bin/sh\n");
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = explicit;
  assert.equal(resolveAuditChromiumPath(), explicit, "variável explícita vence toda descoberta");
  assert.deepEqual(
    auditBrowserLaunchOptions().args,
    ["--no-sandbox", "--disable-dev-shm-usage"],
    "launch com caminho resolvido precisa dos flags de container",
  );
  assert.equal(auditBrowserLaunchOptions().headless, true);
  assert.equal(auditBrowserLaunchOptions({ headless: false }).headless, false, "chamador ainda sobrepõe opções");

  // Caminho explícito inexistente NÃO vira fallback silencioso: quem configurou
  // errado precisa ver o erro do launch, não um browser diferente.
  const ghost = join(sandbox, "nao-existe", "chrome");
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = ghost;
  assert.equal(resolveAuditChromiumPath(), ghost, "configuração explícita errada não pode ser mascarada");

  // --- o gate de contraste não pode passar sem medir -------------------------
  const contrast = read("scripts/guards/audit-surface-contrast.mjs");
  const missingBrowserBranch = contrast.slice(contrast.indexOf("isMissingBrowserError(error)"));
  assert.ok(
    /process\.exit\(1\)/.test(missingBrowserBranch.slice(0, 600)),
    "contraste sem Chromium precisa falhar fechado",
  );
  assert.ok(
    !/process\.exit\(0\)|process\.exitCode\s*=\s*0/.test(contrast),
    "nenhum caminho do gate de contraste pode devolver verde por omissão",
  );

  // --- nenhum gate pode reabrir a resolução própria --------------------------
  for (const file of [
    "scripts/audit-a11y.mjs",
    "scripts/audit-lighthouse.mjs",
    "scripts/guards/audit-screens.mjs",
    "scripts/guards/audit-surface-contrast.mjs",
    "scripts/audit-visual-authenticated.mjs",
    "scripts/audit-visual-proof.mjs",
  ]) {
    const source = read(file);
    assert.ok(
      !source.includes("process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"),
      `${file} deve resolver o Chromium pelo runtime compartilhado, não por leitura própria da variável`,
    );
    assert.ok(
      /auditBrowserLaunchOptions|resolveAuditChromiumPath/.test(source),
      `${file} precisa usar a resolução compartilhada de Chromium`,
    );
  }

  console.log("PASS browser-audit: descoberta na imagem, precedência explícita e contraste fail-closed");
} finally {
  for (const key of ["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"]) {
    if (key in savedEnv) process.env[key] = savedEnv[key];
    else delete process.env[key];
  }
  rmSync(sandbox, { recursive: true, force: true });
}
