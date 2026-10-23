import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.SUPER_NEUROPAD_ARTIFACT_DIR || "/tmp/super-neuropad-draft-guard";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  const errors = [];
  const dialogs = [];
  let accept = false;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", async (dialog) => { dialogs.push(dialog.message()); await (accept ? dialog.accept() : dialog.dismiss()); });
  await page.goto(`${server.origin}/#/super-neuropad-game`);
  await page.waitForLoadState("networkidle");
  if (await page.locator("#login-email").count()) {
    await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId("super-neuropad-game").waitFor();
  const ages = page.getByRole("group", { name: "Idade em anos" });
  await ages.getByRole("button", { name: "7", exact: true }).click();
  const circuit = page.getByTestId("super-neuropad-clinical-circuit");
  await circuit.getByRole("button", { name: /Cobertura e lacunas/ }).click();
  const note = circuit.getByLabel(/Síntese final \(obrigatória\)/);
  await note.fill("Registro sintético ainda em elaboração, sem dados de criança real.");
  await ages.getByRole("button", { name: "8", exact: true }).click();
  assert.equal(await ages.getByRole("button", { name: "7", exact: true }).getAttribute("aria-pressed"), "true", "cancelar troca preserva idade e rascunho");
  assert.match(await note.inputValue(), /Registro sintético/);
  assert.equal(dialogs.length, 1);
  assert.match(dialogs[0], /circuito/i);
  await ages.getByRole("button", { name: "7", exact: true }).click();
  assert.equal(dialogs.length, 1, "mesma idade não descarta nem pergunta");
  assert.equal(await page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }), true, "rascunho protege recarregar/fechar");
  await ages.getByRole("button", { name: /Menos de 2 anos/ }).click();
  assert.equal(await ages.getByRole("button", { name: "7", exact: true }).getAttribute("aria-pressed"), "true");
  const heldUrl = page.url();
  const warning = page.waitForEvent("dialog");
  await page.evaluate(() => { window.location.hash = "#/filtro"; });
  await warning;
  await page.waitForURL(heldUrl);
  assert.equal(dialogs.length, 3, "navegação interna exige confirmação mesmo sem resposta da bateria");
  assert.match(await note.inputValue(), /Registro sintético/);
  await note.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/rascunho-preservado-mobile.png` });
  accept = true;
  await ages.getByRole("button", { name: "8", exact: true }).click();
  assert.equal(await ages.getByRole("button", { name: "8", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await note.inputValue(), "", "troca confirmada inicia circuito limpo");
  assert.equal(await page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }), false, "circuito novo vazio não mantém guarda obsoleta");
  assert.deepEqual(errors, []);
  console.log("✓ rascunho parcial preservado ao cancelar troca de idade e saída; troca confirmada limpa o circuito; sem erros runtime.");
} finally {
  await browser.close();
  await server.close();
}
