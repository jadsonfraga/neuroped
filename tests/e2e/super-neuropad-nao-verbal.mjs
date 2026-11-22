// E2E do SuperNeuroPad Não Verbal: sessão completa no navegador, com axe em cada
// tela, captura no celular e no desktop, e sem erro de página. Usa a API
// sintética (sem paciente real) e o build em dist/public.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.SUPER_NEUROPAD_NV_ARTIFACT_DIR || "/tmp/super-neuropad-nao-verbal";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());

async function run(viewport, tag, years) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
  // Sem voz sintetizada no navegador de teste: o jogo segue sem ela.
  await context.addInitScript(() => { try { delete window.speechSynthesis; } catch { /* ignora */ } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const axe = async (name) => {
    const result = await new AxeBuilder({ page }).include("main").analyze();
    const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    await writeFile(`${dir}/${tag}-${name}-axe.json`, JSON.stringify(result.violations, null, 2));
    assert.deepEqual(serious.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], `${tag} ${name}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, `${tag} ${name}: rolagem horizontal`);
    await page.screenshot({ path: `${dir}/${tag}-${name}.png`, fullPage: true });
  };
  try {
    await page.goto(`${server.origin}/#/super-neuropad-nao-verbal`);
    await page.waitForLoadState("networkidle");
    const login = page.locator("#login-email");
    if (await login.count()) {
      await login.fill(SYNTHETIC_CREDENTIALS.email);
      await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
      await page.locator('[data-testid="login-form"] button[type="submit"]').click();
    }
    await page.getByRole("heading", { name: "SuperNeuroPad Não Verbal" }).waitFor({ timeout: 20000 });
    const start = page.getByRole("button", { name: "Começar" });
    assert.equal(await start.isDisabled(), true, "Começar exige idade");
    await page.getByRole("button", { name: `${years} anos`, exact: true }).click();
    await axe("inicio");
    await start.click();

    await page.getByRole("button", { name: "Estrela de treino" }).click();
    let total = 0;
    for (let guard = 0; guard < 40; guard++) {
      await page.waitForTimeout(400);
      if (await page.getByRole("heading", { name: /Você conseguiu/ }).count()) break;
      if (await page.getByRole("button", { name: "Bolha 1" }).count()) {
        if (total === 4) await axe("bolhas");
        await page.getByRole("button", { name: "Bolha 1" }).click();
        await page.getByRole("button", { name: /continuar/i }).click();
        continue;
      }
      const group = page.getByRole("group", { name: "Figuras para tocar" });
      if (!(await group.count())) continue; // prévia de memória em contagem
      if (total === 0) await axe("desafio");
      total++;
      if (total === 2) {
        await page.getByRole("button", { name: "Sem resposta" }).click();
      } else {
        await group.getByRole("button").first().click();
        // Durante a festa a resposta já foi registrada: repetir o enunciado fica bloqueado.
        if (total === 1) assert.equal(await page.getByRole("button", { name: "Ouvir o desafio de novo" }).isDisabled(), true, "ouvir de novo bloqueado na festa");
        await page.waitForTimeout(1500);
      }
    }
    await page.getByRole("heading", { name: /Você conseguiu/ }).waitFor({ timeout: 10000 });
    await axe("fim");
    await page.getByRole("button", { name: "Área da aplicadora" }).click();
    await page.getByRole("heading", { name: /registro da aplicação/ }).waitFor();
    const rows = await page.locator("tbody tr").count();
    assert.equal(rows, total, `${tag}: linhas do registro`);
    assert.ok((await page.locator("text=Sem resposta").count()) >= 1, "sem resposta registrado");
    await axe("aplicadora");
    assert.deepEqual(errors, [], `${tag}: erros de página`);
    console.log(`✓ ${tag} (${years} anos): ${total} desafios jogados, registro com ${rows} linhas, axe sem violação séria`);
  } finally {
    await context.close();
  }
}

/** Encerrar e pausar durante a festa (1,3 s) não podem avançar a sessão sozinhos. */
async function controlsDuringCelebration() {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 }, reducedMotion: "reduce" });
  await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
  await context.addInitScript(() => { try { delete window.speechSynthesis; } catch { /* ignora */ } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${server.origin}/#/super-neuropad-nao-verbal`);
    await page.waitForLoadState("networkidle");
    if (await page.locator("#login-email").count()) {
      await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
      await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
      await page.locator('[data-testid="login-form"] button[type="submit"]').click();
    }
    await page.getByRole("heading", { name: "SuperNeuroPad Não Verbal" }).waitFor({ timeout: 20000 });
    assert.ok(await page.getByText(/não validada/).count(), "status de validação na tela inicial");
    await page.getByRole("button", { name: "2 anos", exact: true }).click();
    await page.getByRole("button", { name: "Começar" }).click();
    await page.getByRole("button", { name: "Estrela de treino" }).click();
    const group = page.getByRole("group", { name: "Figuras para tocar" });
    const counter = page.getByText(/^\d+ de \d+$/);
    // Pausa durante a festa: não avança; ao voltar, segue para o próximo.
    await group.waitFor();
    await group.getByRole("button").first().click();
    await page.getByRole("button", { name: "Pausar" }).click();
    await page.waitForTimeout(2000);
    assert.equal(await counter.textContent(), "1 de 12", "avançou durante a pausa");
    await page.getByRole("button", { name: "Voltar" }).last().click();
    await page.waitForTimeout(500);
    assert.equal(await counter.textContent(), "2 de 12", "não avançou ao voltar da pausa");
    // Encerrar durante a festa do 4º desafio (o que antecede as bolhas): fica no fim, sem voltar para as bolhas.
    for (const n of [2, 3]) {
      await group.getByRole("button").first().click();
      await page.waitForTimeout(1600);
      assert.equal(await counter.textContent(), `${n + 1} de 12`);
    }
    await group.getByRole("button").first().click();
    await page.getByRole("navigation", { name: "Controles da aplicadora" }).getByRole("button", { name: "Encerrar", exact: true }).click();
    await page.waitForTimeout(2000);
    assert.ok(await page.getByRole("heading", { name: /Você conseguiu/ }).count(), "saiu da tela de fim");
    await page.getByRole("button", { name: "Área da aplicadora" }).click();
    assert.equal(await page.getByRole("button", { name: "Bolha 1" }).count(), 0, "voltou para as bolhas depois de encerrar");
    assert.equal(await page.locator("tbody tr").count(), 4, "registro após encerrar");
    assert.ok(await page.getByText(/não validada/).count(), "status de validação no registro");
    assert.deepEqual(errors, [], "erros de página");
    console.log("✓ pausar e encerrar durante a festa não avançam a sessão sozinhos");
  } finally {
    await context.close();
  }
}

try {
  await controlsDuringCelebration();
  await run({ width: 390, height: 844 }, "celular", 3);
  await run({ width: 1180, height: 900 }, "desktop", 5);
} finally {
  await browser.close();
  await server.close();
}
