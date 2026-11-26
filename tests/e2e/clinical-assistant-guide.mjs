/** Dados inteiramente fictícios; exercita as rotas protegidas no Chromium. */
import assert from "node:assert/strict";
import { join } from "node:path";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const server = await startStaticServer(ensureClientBuild(process.cwd(), "authenticated"), { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--no-zygote", "--single-process"] }));
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, serviceWorkers: "block" });
  await context.addInitScript(storage => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  await page.route("**/*", route => route.request().url().startsWith(server.origin + "/") ? route.continue() : route.abort());
  const writes = [];
  const errors = [];
  page.on("pageerror", err => errors.push(err.message));
  page.on("request", req => {
    if (req.url().includes("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method())) writes.push(new URL(req.url()).pathname);
  });
  await page.goto(server.origin + "/#/login");
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.getByTestId("login-form").locator("button[type=submit]").click();
  await page.getByTestId("login-form").waitFor({ state: "detached" });
  await page.goto(server.origin + "/#/exame-neurologico-mental");
  const age = page.getByLabel("Faixa etária", { exact: true });
  const button = name => page.getByRole("button", { name, exact: true });
  await age.selectOption({ label: "Nascimento a 27 dias" });
  await page.getByText("Rosto conhecido", { exact: true }).click();
  assert.equal(await button("Mostrar cartão visual").count(), 0);
  await age.selectOption({ label: "3 anos" });
  await page.locator("summary").filter({ hasText: "Copiar um risco" }).click();
  assert.equal(await page.getByRole("heading", { name: "Preparar · 3 anos" }).isVisible(), false);
  const noteName = "O que aconteceu · Copiar um risco";
  if (process.env.NEUROPED_GUIDE_SCREENSHOTS) {
    await page.getByRole("region", { name: "Atividades guiadas · 3 anos" })
      .screenshot({ path: join(process.env.NEUROPED_GUIDE_SCREENSHOTS, "NeuroPed-exame-guia-3-anos.png") });
  }
  await page.getByText("Ajustar para esta criança", { exact: true }).click();
  await button("Comunicação").click();
  await page.getByText(/Use o meio habitual/).waitFor();
  assert.equal(await age.isEnabled(), true);
  await button("Mostrar cartão visual").press("Enter");
  const examCard = page.getByRole("dialog", { name: "Copiar um risco" });
  await examCard.waitFor();
  assert.equal(await examCard.evaluate(element => element.contains(document.activeElement) && document.activeElement.matches("button")), true,
    "ao abrir por teclado o foco deve ficar em um botão dentro do cartão, após a renderização");
  assert.match(await examCard.innerText(), /Você quer tentar do seu jeito/);
  assert.doesNotMatch(await examCard.innerText(), /apoio|prontuário/);
  await button("Fazer uma pausa").click();
  assert.doesNotMatch(await examCard.innerText(), /Você quer tentar do seu jeito/);
  await button("Voltar ao convite").click();
  assert.match(await examCard.innerText(), /Você quer tentar do seu jeito/);
  await page.keyboard.press("Escape");
  await examCard.waitFor({ state: "hidden" });
  assert.equal(await button("Mostrar cartão visual").evaluate(el => el === document.activeElement), true);
  await button("Mostrar cartão visual").press("Enter");
  await examCard.waitFor();
  assert.match(await examCard.innerText(), /Você quer tentar do seu jeito/);
  await button("Fechar cartão").press("Enter");
  assert.equal(await page.getByLabel(noteName).inputValue(), "");
  await page.getByLabel(noteName).fill("Registro fictício: pegou o giz e pediu outra folha.");
  const drawingGuide = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Copiar um risco" }) });
  await drawingGuide.getByText("Acrescentar proposta e apoio", { exact: true }).click();
  await page.getByLabel("Apoio ou contexto · Copiar um risco").fill("Deixei a folha mais perto.");
  assert.match(await page.getByRole("list", { name: "Observações das atividades guiadas" }).innerText(), /Apoio ou contexto: Deixei a folha mais perto/);
  assert.equal(await age.isDisabled(), true);
  assert.match(await page.getByRole("list", { name: "Observações das atividades guiadas" }).innerText(), /Registro fictício/);
  assert.equal(await page.getByRole("list", { name: "Registros do exame" }).count(), 0);
  page.once("dialog", dialog => dialog.dismiss());
  await button("Encerrar e limpar").click();
  assert.equal(await age.isDisabled(), true);
  page.once("dialog", dialog => dialog.accept());
  await button("Encerrar e limpar").click();
  assert.equal(await age.inputValue(), "");
  await age.selectOption({ label: "3 anos" });
  await page.locator("summary").filter({ hasText: "Copiar um risco" }).click();
  assert.equal(await page.getByLabel(noteName).inputValue(), "");

  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(server.origin + "/#/testes-diretos");
  await button("Observação social").click();
  await page.getByLabel("Idade na data da observação").selectOption({ label: "8 anos" });
  await page.getByRole("button", { name: /Dica para o colega/ }).click();
  const preview = page.getByRole("list", { name: "Prévia dos cartões" });
  assert.equal(await preview.getByRole("listitem").count(), 2);
  await page.getByText("Outra brincadeira sem tela · 8 anos", { exact: true }).click();
  await page.getByText(/Ponha dois títulos inventados/).waitFor();
  if (process.env.NEUROPED_GUIDE_SCREENSHOTS) {
    await page.locator("article").filter({ has: page.getByRole("heading", { name: "Preparar a interação" }) })
      .screenshot({ path: join(process.env.NEUROPED_GUIDE_SCREENSHOTS, "NeuroPed-observacao-guia-8-anos.png") });
  }
  await button("Apresentar no tablet").press("Enter");
  const child = page.getByRole("dialog");
  await child.waitFor();
  assert.equal(await child.evaluate(element => element.contains(document.activeElement) && document.activeElement.matches("button")), true,
    "o cartão social deve iniciar com foco dentro do diálogo");
  await page.keyboard.press("Tab");
  assert.equal(await child.evaluate(element => element.contains(document.activeElement)), true);
  await child.getByRole("button", { name: "Quebra-cabeça", exact: true }).click();
  assert.equal(await child.getByRole("button", { name: "Quebra-cabeça", exact: true }).getAttribute("aria-pressed"), "true");
  assert.ok(await child.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  await button("Fazer uma pausa").click();
  assert.equal(await child.getByRole("button", { name: "Quebra-cabeça", exact: true }).count(), 0);
  await page.keyboard.press("Escape");
  await child.waitFor({ state: "hidden" });
  const recordHeading = page.getByRole("heading", { name: "Registrar o que aconteceu" });
  await recordHeading.waitFor();
  assert.equal(await recordHeading.evaluate(el => el === document.activeElement), true,
    "fechar o cartão na primeira apresentação deve focar o novo título de registro");
  const socialNote = page.getByRole("textbox", { name: "O que você observou presencialmente?" });
  await socialNote.waitFor();
  assert.equal(await socialNote.inputValue(), "");
  assert.equal(await page.locator('[name="social-condition"]:checked').count(), 0);
  await socialNote.fill("Registro fictício: olhou para a figura após a fala do cuidador.");
  await button("Voltar às atividades").click();
  await page.getByRole("button", { name: /^Brincadeira sem tela/ }).click();
  await button("Registrar esta brincadeira").click();
  assert.equal(await socialNote.inputValue(), "");
  assert.equal(await button("Reapresentar situação").count(), 0);
  await page.getByText("Acrescentar o que foi oferecido", { exact: true }).click();
  await page.getByLabel("O que foi oferecido?").fill("Ofereci o bichinho familiar.");
  await page.getByRole("button", { name: /Revisar sessão/ }).click();
  await page.getByText(/8 anos · Brincadeira sem tela/).waitFor();
  await page.getByText(/Proposta realizada: Ofereci o bichinho familiar/).waitFor();
  await page.getByText(/Observação direta: Registro fictício/).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(writes, ["/api/auth/login"]);
  assert.deepEqual(errors, []);
  console.log("GUIA OK: exemplos por idade, cartão separado, pausa, notas descritivas sem autoachado, revisão, limpeza, foco por teclado e reflow a 320 px.");
} finally {
  await browser?.close();
  await server.close();
}
