// E2E: calculadora de dose (apoio). Dados fictícios; sem rede externa.
// Prova no navegador: gotas no Clonazepam, tomada por esquema de frequência,
// peso fora da faixa sem resultado, vírgula decimal e lista que fecha no Esc e no blur.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.CALC_ARTIFACT_DIR || "/tmp/calculadora-dose";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await context.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const outbound = [];
page.on("request", (r) => { if (!r.url().startsWith(server.origin) && !r.url().startsWith("data:")) outbound.push(r.url()); });

try {
  await page.goto(`${server.origin}/#/calculadora-dose`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  const weight = page.getByTestId("input-weight");
  const search = page.getByTestId("input-medication-search");
  const listbox = page.getByRole("listbox", { name: "Medicamentos" });
  await weight.waitFor({ timeout: 20000 });

  // Clonazepam em gotas: 20 kg → 1 mg/dia; 8/8h → 0,33 mg = 3,33 gotas (antes "3.3 mL").
  await weight.fill("20");
  await search.fill("clonaz");
  await listbox.waitFor();
  assert.equal(await search.getAttribute("aria-expanded"), "true");
  await page.getByTestId("option-med-Clonazepam").click();
  assert.equal(await listbox.isVisible(), false, "a lista fecha ao escolher");
  assert.equal(await page.getByTestId("dose-daily").innerText(), "1");
  const clonazepam = await page.getByTestId("dose-intakes").innerText();
  assert.match(clonazepam, /3,33\s*gotas \(0,1 mg\/gota\)/);
  assert.doesNotMatch(clonazepam, /\bmL\b/);
  assert.match(clonazepam, /3 tomadas\/dia \(8\/8h\)/);
  assert.match(clonazepam, /2 tomadas\/dia \(12\/12h\)/);
  await page.screenshot({ path: `${dir}/calculadora-clonazepam-390.png`, fullPage: true });

  // Esquemas 1x/dia ou 12/12h: a tomada única não é mais a metade.
  await search.fill("atomox");
  await page.getByTestId("option-med-Atomoxetina").click();
  await weight.fill("30");
  const atomoxetina = await page.getByTestId("dose-intakes").innerText();
  assert.match(atomoxetina, /36\s*mg · 1 tomada\/dia \(1x\/dia\)/);
  assert.match(atomoxetina, /18\s*mg · 2 tomadas\/dia \(12\/12h\)/);

  // Dose pequena não some em "0,0".
  await search.fill("clonid");
  await page.getByTestId("option-med-Clonidina").click();
  await weight.fill("20");
  assert.equal(await page.getByTestId("dose-daily").innerText(), "0,08");
  assert.match(await page.getByTestId("dose-intakes").innerText(), /0,027\s*mg/);

  // Peso fora da faixa: sem resultado e sem "usar dose máxima".
  await weight.fill("1500");
  assert.match(await page.getByTestId("weight-error").innerText(), /acima de 150 kg/);
  assert.equal(await page.getByTestId("dose-intakes").count(), 0);
  assert.equal(await weight.getAttribute("aria-invalid"), "true");

  // Vírgula decimal aceita.
  await weight.fill("25,5");
  assert.equal(await page.getByTestId("weight-error").count(), 0);
  assert.equal(await page.getByTestId("dose-daily").innerText(), "0,1");

  // Lista fecha no Esc e ao sair do campo.
  await search.fill("ris");
  await listbox.waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await listbox.isVisible(), false, "Esc fecha a lista");
  await search.fill("risp");
  await listbox.waitFor();
  await weight.click();
  assert.equal(await listbox.isVisible(), false, "blur fecha a lista");

  await page.screenshot({ path: `${dir}/calculadora-390.png`, fullPage: true });
  assert.deepEqual(errors, [], `erros de página: ${errors.join(" | ")}`);
  assert.deepEqual(outbound, [], `rede externa: ${outbound.join(" | ")}`);
  console.log("✓ calculadora de dose: gotas, esquemas de tomada, precisão, faixa de peso, vírgula e lista acessível");
} finally {
  await browser.close();
  await server.close();
}
