import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.SUPER_NEUROPAD_ARTIFACT_DIR || "/tmp/super-neuropad-accessibility";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());

try {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 } });
  await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  await page.goto(`${server.origin}/#/super-neuropad-game`);
  await page.waitForLoadState("networkidle");
  if (await page.locator("#login-email").count()) {
    await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  const root = page.getByTestId("super-neuropad-game");
  await root.waitFor();
  await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "14", exact: true }).click();
  await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 1, "preparação sem overflow em 320 px");

  await page.getByRole("button", { name: "Começar a aventura", exact: true }).press("Enter");
  await page.locator('[data-testid="super-neuropad-game"][data-screen="intro"]').waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H2", "a introdução recebe foco ao iniciar");
  await page.getByRole("button", { name: /Entrar na fase/ }).press("Enter");
  await page.locator('[data-testid="super-neuropad-game"][data-screen="play"]').waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H2", "o desafio recebe foco ao entrar na fase");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 1, "desafio sem overflow em 320 px");

  await page.getByRole("button", { name: "Pausa", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Continuar", exact: true }).last().waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), "Continuar", "pausa mantém foco na ação de retorno");
  await page.evaluate(() => { document.documentElement.classList.add("dark"); document.documentElement.style.fontSize = "32px"; });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 1, "zoom de 200% sem overflow em 320 px");
  const axe = await new AxeBuilder({ page }).include('[data-testid="super-neuropad-game"]').analyze();
  assert.deepEqual(axe.violations.map((violation) => violation.id), [], "axe sem violações no jogo pausado");
  await page.screenshot({ path: `${dir}/jogo-pausado-320px-zoom200.png` });
  console.log(`[super-neuropad-accessibility] ✓ teclado, 320 px, zoom 200% e axe · artefatos em ${dir}`);
} finally {
  await browser.close();
  await server.close();
}
