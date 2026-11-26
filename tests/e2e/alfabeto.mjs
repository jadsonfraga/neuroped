import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const dist = ensureClientBuild(process.cwd(), "authenticated");
const server = await startStaticServer(dist, {
  port: 0,
  apiHandler: createSyntheticClinicalApi({ patients: "empty", userRole: "operator", primaryRole: "assistant" }),
});
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions());
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, serviceWorkers: "block" });
  await context.addInitScript(storage => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  await page.route("**/*", route => route.request().url().startsWith(server.origin + "/") ? route.continue() : route.abort());
  await page.goto(server.origin + "/#/alfabeto");
  await page.waitForURL(url => url.hash === "#/login");
  await page.goto(server.origin + "/?next=%2Frecepcao#/login");
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.getByTestId("login-form").locator("button[type=submit]").click();
  await page.waitForURL(url => url.hash === "#/recepcao");
  const nav = page.getByRole("navigation", { name: "Navegação principal em grupos recolhíveis" });
  await nav.getByRole("link", { name: /^Alfabeto/ }).click();
  await page.waitForURL(url => url.hash === "#/alfabeto");
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.getByRole("heading", { name: "Alfabeto", exact: true }).waitFor({ timeout: 6000 });
  const grid = page.getByRole("group", { name: "Letras do alfabeto" });
  const letter = value => grid.getByRole("button", { name: "Letra " + value, exact: true });
  const original = (await grid.getByRole("button").allTextContents()).join("");
  assert.equal([...original].sort().join(""), alphabet);
  assert.notEqual(original, alphabet);
  assert.equal(await grid.locator('[aria-pressed="true"]').count(), 0);

  const requests = [];
  page.on("request", req => { if (new URL(req.url()).pathname.startsWith("/api/")) requests.push(req.url()); });
  await letter("A").tap();
  assert.equal(await letter("A").getAttribute("aria-pressed"), "true");
  assert.equal(await letter("B").getAttribute("aria-pressed"), "false");
  assert.match(await letter("A").locator("span").evaluate(el => getComputedStyle(el).fontFamily), /NeuroPed Cursiva/);
  assert.equal(await page.evaluate(() => [...document.fonts].some(face => face.family.includes("NeuroPed Cursiva") && face.status === "loaded")), true);
  await letter("B").press("Enter");
  assert.equal(await grid.locator('[aria-pressed="true"]').count(), 2);
  if (process.env.ALFABETO_SCREENSHOT) await grid.screenshot({ path: process.env.ALFABETO_SCREENSHOT });
  await letter("A").press("Space");
  assert.equal(await letter("A").getAttribute("aria-pressed"), "false");
  assert.equal(await letter("B").getAttribute("aria-pressed"), "true");
  assert.equal((await grid.getByRole("button").allTextContents()).join(""), original);

  await page.getByRole("button", { name: "Embaralhar letras" }).click();
  const shuffled = (await grid.getByRole("button").allTextContents()).join("");
  assert.equal([...shuffled].sort().join(""), alphabet);
  assert.notEqual(shuffled, original);
  assert.equal(await grid.locator('[aria-pressed="true"]').count(), 0);

  await page.setViewportSize({ width: 320, height: 640 });
  assert.equal(await grid.evaluate(el => el.scrollWidth <= el.clientWidth), true);
  assert.ok((await letter("M").boundingBox()).height >= 44);
  await letter("M").tap();
  assert.equal(await grid.locator('[aria-pressed="true"]').count(), 1);
  assert.deepEqual(requests, [], "a atividade não chama API");
  await page.reload();
  await grid.waitFor();
  await page.route("**/*.woff2", route => route.request().url().includes("playwrite-br") ? route.abort() : route.fallback());
  await page.reload();
  await page.getByRole("status").filter({ hasText: "A escrita cursiva não carregou" }).waitFor();
  assert.equal(await letter("A").isDisabled(), true);
  assert.equal(await grid.locator('[aria-pressed="true"]').count(), 0);
  assert.equal(await grid.locator('[aria-pressed="true"]').count(), 0);
  console.log("Alfabeto: rota autenticada, touch, teclado, fonte local, embaralhamento, 320 px e limpeza aprovados.");
} finally {
  await browser?.close();
  await server.close();
}
