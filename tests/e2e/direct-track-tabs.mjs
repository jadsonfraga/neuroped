// Aba "Direto ao teste" nas três aplicações diretas: com a idade informada, a aplicadora
// experiente chega à aplicação sem guia, checklist, kit item a item ou ensaio, e o registro
// declara o modo direto. O fluxo guiado continua sendo o padrão ao abrir cada página.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.DIRECT_TRACK_ARTIFACT_DIR || "/tmp/direct-track-tabs";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
const button = (name) => page.getByRole("button", { name, exact: true });
const tab = (name) => page.getByRole("tab", { name: new RegExp(`^${name}`) });
async function screen(name, scope) {
  const axe = await new AxeBuilder({ page }).include(scope).analyze();
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(axe.violations, null, 2));
  assert.deepEqual(axe.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}

try {
  // Sonda Dez
  await open("testes-diretos", "sonda-track-tabs");
  assert.equal(await tab("Guia de primeira aplicação").getAttribute("aria-selected"), "true", "Sonda abre no modo guiado");
  await expectVisible("Guia da primeira aplicação — do acolhimento à entrega");
  await tab("Direto ao teste").click();
  await page.getByTestId("sonda-direct-start").waitFor();
  assert.equal(await page.getByText("Guia da primeira aplicação — do acolhimento à entrega").count(), 0, "guia oculto no modo direto");
  assert.equal(await page.getByText("Conferir antes de começar").count(), 0, "checklist oculto no modo direto");
  assert.equal(await button("Iniciar aplicação").isDisabled(), true, "sem idade não inicia");
  await page.getByLabel("Idade em anos").fill("4");
  await page.getByLabel("Meses adicionais").fill("0");
  await screen("sonda-direct", '[data-testid="sonda-digital"]');
  await button("Iniciar aplicação").click();
  await button("Abrir estímulo desta etapa").waitFor();
  assert.equal(await page.getByText(/Seu primeiro ensaio/).count(), 0, "ensaio nunca apareceu");
  assert.equal(await tab("Direto ao teste").isDisabled(), true, "aba travada depois do início");
  await button("Revisar / encerrar").click();
  const sondaReport = await page.getByLabel("Registro completo").inputValue();
  assert.match(sondaReport, /Modo direto: guia de primeira aplicação, conferência de preparo e ensaio dispensados/, "registro da Sonda declara o modo direto");

  // OBS-10
  await open("avaliacao-pre-consulta-faixa-etaria", "obs10-track-tabs");
  assert.equal(await tab("Guia da assistente").getAttribute("aria-selected"), "true", "OBS-10 abre no modo guiado");
  assert.equal(await page.getByTestId("obs10-first-time").count(), 1, "guia de primeira vez visível no modo guiado");
  await tab("Direto ao teste").click();
  await page.getByTestId("obs10-direct-start").waitFor();
  assert.equal(await page.getByTestId("obs10-first-time").count(), 0, "guia oculto no modo direto");
  assert.equal(await page.locator(".obs10-checklist").count(), 0, "checklist oculto no modo direto");
  assert.equal(await page.getByTestId("obs10-readiness").count(), 0, "prontidão guiada oculta no modo direto");
  assert.equal(await button("Iniciar aplicação · 10 minutos").isDisabled(), true, "sem idade não inicia");
  await page.getByLabel("Anos completos", { exact: true }).fill("4");
  await page.getByLabel("Meses adicionais", { exact: true }).fill("0");
  await screen("obs10-direct", ".obs10");
  await button("Iniciar aplicação · 10 minutos").click();
  await page.getByTestId("obs10-clock").waitFor();
  await button("Encerrar antes").click();
  const obsReport = await page.locator(".obs10-summary pre").first().textContent();
  assert.match(obsReport ?? "", /Preparação: modo direto; guia, kit item a item, checklist de segurança e ensaio dispensados/, "registro do OBS-10 declara o modo direto");

  // Reconhecimento Visual
  await open("testes-reconhecimento", "rv-track-tabs");
  assert.equal(await tab("Guia de primeira aplicação").getAttribute("aria-selected"), "true", "Reconhecimento abre no modo guiado");
  await expectVisible("3. Prepare e comece");
  await tab("Direto ao teste").click();
  await page.getByTestId("rv-direct-start").waitFor();
  assert.equal(await page.getByText("3. Prepare e comece").count(), 0, "conferências ocultas no modo direto");
  await page.getByLabel("Anos completos", { exact: true }).fill("4");
  await page.getByLabel("Meses adicionais", { exact: true }).fill("0");
  await screen("rv-direct", ".rv-workspace");
  await button("Iniciar aplicação").click();
  await button("Mostrar somente as figuras à criança").waitFor();
  await button("Revisar registros").click();
  const rvReport = await page.locator(".rv-report").textContent();
  assert.match(rvReport ?? "", /Condições declaradas: Modo direto: guia de primeira aplicação e conferências de preparo dispensados/, "registro do Reconhecimento declara o modo direto");

  assert.deepEqual(errors, [], "sem erros de página");
  console.log("Direto ao teste: três abas verificadas no navegador (guiado por padrão, direto sem guia/checklist/ensaio, registro declarado).");
} finally {
  await browser.close();
  await server.close();
}

async function open(route, testId) {
  await page.goto(`${server.origin}/#/${route}`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId(testId).waitFor({ timeout: 20000 });
}
async function expectVisible(text) {
  assert.equal(await page.getByText(text).count(), 1, `visível: ${text}`);
}
