/** Anonimização por construção: catálogos públicos de atividades e frases inventadas. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { examBands } from "../../client/src/data/exame-por-idade.ts";
import { bands } from "../../client/src/data/observacaoSocial.ts";
import { examExamples } from "../../client/src/data/clinicalAssistantGuide.ts";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const server = await startStaticServer(ensureClientBuild(process.cwd(), "authenticated"), {
  port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }),
});
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--no-zygote", "--single-process"] }));
  const context = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true, serviceWorkers: "block" });
  await context.addInitScript(storage => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const writes = [];
  const errors = [];
  await page.route("**/*", route => route.request().url().startsWith(server.origin + "/") ? route.continue() : route.abort());
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    const { pathname } = new URL(request.url());
    if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(pathname);
  });
  const button = name => page.getByRole("button", { name, exact: typeof name === "string" });
  async function clear(age) {
    page.once("dialog", dialog => dialog.accept());
    await button("Encerrar e limpar").click();
    assert.equal(await age.inputValue(), "", "próxima sessão começa sem idade ou anotação anterior");
  }
  const nav = path => page.goto(server.origin + "/#" + path);
  await nav("/login");
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.getByTestId("login-form").locator("button[type=submit]").click();
  await page.getByTestId("login-form").waitFor({ state: "detached" });

  await nav("/exame-neurologico-mental");
  const age = page.getByLabel("Faixa etária", { exact: true });
  for (const [i, band] of examBands.entries()) {
    await age.selectOption({ label: band.age });
    assert.equal(await age.isEnabled(), true);
    await page.getByText("Abrir ficha médica completa", { exact: true }).click();
    const first = band.steps[0].title;
    const note = page.getByLabel("Observação temporária · " + first, { exact: true });
    const item = "Simulação médica " + i + ": " + band.age;
    await note.fill(item);
    const status = ["direct", "assisted", "reported", "noOpportunity", "stopped", "materialsMissing"][i % 6];
    await page.getByLabel("Como foi avaliado · " + first, { exact: true }).selectOption(status);
    const review = page.getByRole("list", { name: "Registros do exame" });
    assert.equal(await review.getByRole("listitem").count(), 1, band.age);
    assert.ok((await review.innerText()).includes(item), band.age);
    assert.equal(await age.isDisabled(), true);
    await clear(age);
  }

  await nav("/exame-via-assistente");
  for (const [i, band] of examBands.entries()) {
    await age.selectOption({ label: band.age });
    const activity = examExamples[band.age][0].title;
    await page.locator("summary").filter({ hasText: activity }).click();
    const note = page.getByLabel("O que aconteceu · " + activity, { exact: true });
    const item = "Simulação via assistente " + i + ": " + band.age;
    await note.fill(item);
    await button(i % 2 ? "Preferiu parar" : "Sem oportunidade de observar").click();
    const review = page.getByRole("list", { name: "Observações temporárias" });
    assert.equal(await review.getByRole("listitem").count(), 1, band.age);
    assert.ok((await review.innerText()).includes(item), band.age);
    assert.equal(await note.inputValue(), item);
    await clear(age);
  }

  await nav("/testes-diretos?modo=observacao-social");
  const socialAge = page.getByRole("combobox", { name: "Idade na data da observação" });
  for (const [i, [label, scenes]] of bands.entries()) {
    await socialAge.selectOption({ label });
    await page.getByRole("button").filter({ hasText: scenes[i % 3][0] }).click();
    assert.equal(await button("Apresentar no tablet").count(), i < 2 ? 0 : 1, label);
    if (i % 2) await button("Participante preferiu parar").click();
    else await button("Registrar sem usar a tela").click();
    const item = "Simulação social " + i + ": " + label;
    await page.getByRole("textbox", { name: "O que você observou presencialmente?" }).fill(item);
    await button("Revisar sessão (1 registro)").click();
    await page.getByText("Observação direta: " + item, { exact: false }).waitFor();
    await clear(socialAge);
  }
  assert.deepEqual(writes, ["/api/auth/login"]);
  assert.deepEqual(errors, []);
  console.log("55 faixas por aba em Chromium tablet: 17 exame médico, 17 via assistente, 21 social; 55 registros/revisões/limpezas, sem escrita clínica.");
} finally {
  await browser?.close();
  await server.close();
}
