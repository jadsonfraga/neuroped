// Super NeuroPad — teste negativo do modo médico: só o owner autenticado vê exame do médico, cobertura e
// exportação clínica. Um profissional logado (papel de clínica "professional") abre o circuito e não encontra
// nada disso; a pré-consulta continua disponível. Dados sintéticos; sem rede clínica.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const circuitOf = (page) => page.getByTestId("super-neuropad-clinical-circuit");

async function login(page) {
  await page.waitForLoadState("networkidle");
  if (await page.locator("#login-email").count()) {
    await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
}

async function main() {
  const server = await startStaticServer("dist/public", {
    port: 0,
    apiHandler: createSyntheticClinicalApi({ patients: "empty", primaryRole: "professional", userRole: "professional" }),
  });
  const browser = await chromium.launch(auditBrowserLaunchOptions());
  const pageErrors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
    await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(`${server.origin}/#/super-neuropad-game`);
    await login(page);
    await page.getByTestId("super-neuropad-game").waitFor({ timeout: 20000 });
    await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
    await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "7", exact: true }).click();
    await circuitOf(page).waitFor();

    const texto = await circuitOf(page).innerText();
    assert.equal(await circuitOf(page).getByRole("button", { name: /Exame do médico/ }).count(), 0, "profissional não vê a aba do médico");
    assert.equal(await circuitOf(page).getByRole("button", { name: /Cobertura e lacunas/ }).count(), 0, "profissional não vê a cobertura");
    assert.equal(await circuitOf(page).getByRole("button", { name: /Copiar registro clínico do médico/ }).count(), 0, "sem exportação clínica");
    assert.equal(await circuitOf(page).getByRole("button", { name: /Baixar TXT do médico/ }).count(), 0, "sem TXT clínico");
    assert.equal(await circuitOf(page).getByRole("button", { name: /Copiar registro da pré-consulta/ }).count(), 1, "pré-consulta continua disponível");
    assert.doesNotMatch(texto, /Prontidão para o laudo|Passo a passo do examinador|Pendências para revisão/, "nenhum conteúdo do modo médico na tela");
    assert.deepEqual(pageErrors, [], "nenhum erro não tratado na página");
    console.log("[super-neuropad-acesso-medico] ✓ profissional logado não vê exame do médico, cobertura nem exportação clínica; pré-consulta disponível");
  } finally {
    await browser.close();
    await server.close();
  }
}

await main();
