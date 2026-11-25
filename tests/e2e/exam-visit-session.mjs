import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const server = await startStaticServer(ensureClientBuild(process.cwd(), "authenticated"), { port: 0, apiHandler: createSyntheticClinicalApi() });
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions({
    args: process.env.NEUROPED_AUDIT_SINGLE_PROCESS === "1" ? ["--no-zygote", "--single-process"] : [],
  }));
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, serviceWorkers: "block", reducedMotion: "reduce", hasTouch: true });
  await context.addInitScript((entries) => Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value)), ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  await page.route("**/*", route => route.request().url().startsWith(server.origin + "/") ? route.continue() : route.abort());
  const errors = [];
  const writes = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", req => {
    if (req.url().includes("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method())) writes.push(new URL(req.url()).pathname);
  });
  const examUrl = server.origin + "/#/exame-neurologico-mental";
  await page.goto(server.origin + "/#/login");
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type=submit]').click();
  await page.getByTestId("login-form").waitFor({ state: "detached" });
  await page.goto(examUrl);
  await page.getByRole("heading", { name: "Exame neurológico e mental", exact: true }).waitFor({ timeout: 15_000 });
  const selector = page.getByLabel("Faixa etária", { exact: true });
  assert.equal(await selector.locator("option").count(), 18);
  await selector.selectOption({ label: "3 anos" });
  await page.getByRole("heading", { name: "Preparar · 3 anos" }).waitFor();
  assert.equal(await page.getByText("Nenhum registro neste exame.").count(), 1);
  await page.getByLabel(/Como foi avaliado · Olhos/).selectOption("assisted");
  await page.getByLabel(/Observação temporária · Olhos/).fill("Nota sintética exclusiva desta sessão.");
  const first = page.getByRole("button", { name: "Revisar registros (1 de 6)" });
  assert.equal(await selector.isDisabled(), true);
  await first.click();
  assert.equal(await page.evaluate(() => document.activeElement?.id), "exam-review");
  const records = page.getByRole("list", { name: "Registros do exame" });
  assert.match(await records.innerText(), /Observado com apoio/);
  assert.match(await records.innerText(), /Nota sintética exclusiva desta sessão/);
  assert.equal(await records.getByRole("listitem").count(), 1);
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Encerrar e limpar" }).click();
  assert.equal(await records.getByRole("listitem").count(), 1);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Encerrar e limpar" }).click();
  assert.equal(await selector.inputValue(), "");
  assert.equal(await selector.isEnabled(), true);
  await selector.selectOption({ label: "3 anos" });
  assert.equal(await page.getByLabel(/Observação temporária · Olhos/).inputValue(), "");
  await page.getByLabel(/Como foi avaliado · Olhos/).selectOption("noOpportunity");
  assert.match(await records.innerText(), /Sem oportunidade de avaliar/);
  assert.doesNotMatch(await records.innerText(), /normal|Nota sintética exclusiva/);
  assert.deepEqual(writes, ["/api/auth/login"]);
  assert.deepEqual(errors, []);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  console.log("EXAME OK: rota protegida em tablet, idade por sessão, limites explícitos, revisão, cancelamento e limpeza, sem gravação clínica.");
} finally {
  await browser?.close();
  await server.close();
}
