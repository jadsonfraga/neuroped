/** Anonimização por construção: catálogos públicos de atividades e frases inventadas. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { examBands } from "../../client/src/data/exame-por-idade.ts";
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



  await nav("/exame-via-assistente");
  const age = page.locator("#assistant-exam-age");
  await age.selectOption({ label: "Nascimento a 27 dias" });
  await page.locator("summary").filter({ hasText: "Rosto conhecido" }).click();
  const infant = await page.getByLabel("O que aconteceu · Rosto conhecido", { exact: true }).getAttribute("placeholder");
  const observed = {};
  observed.newbornNeutral = !/giz/.test(infant);
  await age.selectOption({ label: "3 anos" });
  await page.locator("summary").filter({ hasText: "Copiar um risco" }).click();
  await page.getByText("Materiais e recurso desta atividade", { exact: true }).filter({visible:true}).click();
  await button("Registrar falta de material").click();
  assert.equal(await page.getByLabel("O que aconteceu · Copiar um risco", { exact: true }).isDisabled(), true);
  observed.inviteBlocked = await button("Mostrar convite na tela").count() === 0;
  observed.resourceBlocked = await button("Abrir recurso da atividade").count() === 0;
  await button("Retirar marcação").click();
  assert.equal(await button("Mostrar convite na tela").isVisible(), true);
  assert.equal(await button("Abrir recurso da atividade").isVisible(), true);

  await nav("/testes-diretos?modo=observacao-social");
  await page.getByRole("combobox", { name: "Idade na data da observação" }).selectOption({ label: "18–23 meses" });
  await page.getByRole("button", { name: /^Brincadeira sem tela/ }).click();
  await button("Registrar esta brincadeira").waitFor();
  observed.noOpportunityShortcut = await button("Oportunidade insuficiente").count() === 1;
  observed.stopShortcut = await button("Participante preferiu parar").count() === 1;
  if (observed.noOpportunityShortcut) await button("Oportunidade insuficiente").click();
  else await button("Registrar esta brincadeira").click();
  const note = page.getByRole("textbox", { name: "O que você observou presencialmente?" });
  observed.neutralSocialPrompt = !/segunda figura/.test(await note.getAttribute("placeholder"));
  assert.equal(await page.getByRole("radio", { name: "Oportunidade insuficiente" }).isChecked(), observed.noOpportunityShortcut);
  assert.equal(await note.inputValue(), "");

  await nav("/exame-neurologico-mental");
  const medicalAge = page.locator("#exam-age");
  await medicalAge.selectOption({ label: "12 a 14 anos" });
  await page.getByText("Abrir ficha médica completa", { exact: true }).click();
  const temp = page.getByLabel("Observação temporária · " + examBands.find(x=>x.age==="12 a 14 anos").steps[0].title, { exact: true });
  await temp.fill("Nota fictícia de transição entre telas.");
  assert.match(await page.getByRole("list", { name: "Registros do exame" }).innerText(), /Nota fictícia/);

  // A troca por hash não depende de uma âncora específica da navegação.
  let seen = 0;
  page.once("dialog", d => { seen++; void d.dismiss(); });
  await page.evaluate(() => { location.hash="/exame-via-assistente"; });
  // O handler captura hashchange, antes do roteador renderizar a nova rota.
  await page.waitForFunction(() => location.hash.includes("/exame-via-assistente") || location.hash.includes("/exame-neurologico-mental"));
  await page.waitForFunction(() => document.querySelector("#exam-age") || document.querySelector("#assistant-exam-age"));
  if (seen === 0) {
    await Promise.race([
      page.locator("#assistant-exam-age").waitFor({timeout:2400}),
      page.waitForEvent("dialog", {timeout:2400}),
    ]).catch(() => {});
  }
  observed.exitWarned = seen === 1;
  if (observed.exitWarned) await page.waitForURL(url => url.hash === "#/exame-neurologico-mental");
  observed.keptAfterCancel = (await temp.count()) === 1 && (await temp.inputValue()) === "Nota fictícia de transição entre telas.";
  if (observed.exitWarned) {
    page.once("dialog", d => { seen++; void d.accept(); });
    await page.evaluate(() => { location.hash="/exame-via-assistente"; });
    await page.locator("#assistant-exam-age").waitFor();
    assert.equal(seen,2, "só um aviso por saída");
    await nav("/exame-neurologico-mental");
    assert.equal(await medicalAge.inputValue(),"", "saída confirmada não mantém a nota em outra sessão");
  }
  assert.deepEqual(writes, ["/api/auth/login"]);
  assert.deepEqual(errors, []);
  assert.deepEqual(observed, {
    newbornNeutral:true, inviteBlocked:true, resourceBlocked:true, noOpportunityShortcut:true,
    stopShortcut:true, neutralSocialPrompt:true, exitWarned:true, keptAfterCancel:true
  });
  console.log("AUDITORIA OK: cinco falhas corrigidas; cancelar mantém a nota e confirmar limpa a sessão.");
} finally {
  await browser?.close();
  await server.close();
}
