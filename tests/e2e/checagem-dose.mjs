// E2E: checagem de dose (apoio). Dados fictícios; sem rede externa.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.DOSE_ARTIFACT_DIR || "/tmp/checagem-dose";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: "reduce" });
await context.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const outbound = [];
page.on("request", (r) => { if (!r.url().startsWith(server.origin) && !r.url().startsWith("data:")) outbound.push(r.url()); });

const preencher = async (med, dose, vezes, peso, anos, meses = "0") => {
  await page.getByTestId("dose-medicamento").fill(med);
  await page.getByTestId("dose-dose").fill(dose);
  await page.getByTestId("dose-vezes").fill(vezes);
  await page.getByTestId("dose-peso").fill(peso);
  await page.getByTestId("dose-anos").fill(anos);
  await page.getByTestId("dose-meses").fill(meses);
};

try {
  await page.goto(`${server.origin}/#/checagem-dose`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId("page-checagem-dose").waitFor({ timeout: 20000 });
  assert.match(await page.getByTestId("dose-aviso-apoio").innerText(), /Não é prescrição.*não sugere conduta/s);
  await page.getByTestId("dose-aguardando-dados").waitFor();

  // Acima da dose-alvo da fonte (fictício: 20 kg, 5 anos, 700 mg 2x/dia = 70 mg/kg/dia)
  await preencher("levetiracetam", "700", "2", "20", "5");
  await page.getByTestId("dose-resultado").waitFor();
  assert.match(await page.getByTestId("dose-calculo").innerText(), /1400 mg\/dia.*70 mg\/kg\/dia/);
  assert.match(await page.getByTestId("dose-status-validacao").innerText(), /Aguardando validação do médico/);
  assert.equal(await page.locator('[data-codigo="acima-da-dose-alvo-da-fonte"]').count(), 1);
  assert.match(await page.getByTestId("dose-alertas").innerText(), /recommended daily dose of 60 mg\/kg/);
  const fonte = await page.getByTestId("dose-fonte").innerText();
  assert.match(fonte, /versão SPL 36/);
  assert.match(fonte, /consultada em 16\/10\/2026/);
  assert.equal(await page.locator('[data-testid="dose-fonte"] a[rel~="noopener"]').count(), 1);
  await page.screenshot({ path: `${dir}/acima.png`, fullPage: true });

  // Dentro da faixa: sem alerta de atenção
  await preencher("Keppra", "300", "2", "20", "5");
  await page.locator('[data-codigo="dentro-da-faixa-da-fonte"]').waitFor();
  assert.equal(await page.locator('[data-codigo="acima-do-limite-da-fonte"]').count(), 0);

  // Sem dado validado: população fora da fonte
  await preencher("atomoxetina", "10", "1", "18", "5");
  await page.getByTestId("dose-sem-dado").waitFor();
  assert.match(await page.getByTestId("dose-sem-dado").innerText(), /Sem dado validado/);

  // Medicamento fora da base
  await preencher("risperidona", "1", "2", "20", "6");
  await page.getByTestId("dose-sem-dado").waitFor();
  assert.equal(await page.getByTestId("dose-resultado").count(), 0);

  // Entrada inválida
  await preencher("levetiracetam", "0", "2", "20", "5");
  await page.getByTestId("dose-invalida").waitFor();

  assert.equal(outbound.length, 0, `requisições externas: ${outbound.join(", ")}`);
  assert.deepEqual(errors, []);
  console.log("e2e checagem-dose: OK");
} catch (e) {
  await page.screenshot({ path: `${dir}/falha.png`, fullPage: true }).catch(() => {});
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.close?.();
}
