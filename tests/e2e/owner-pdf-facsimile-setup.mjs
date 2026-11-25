import { testCard } from "../fixtures/owner-pdf-test-card.mjs";
/** Só ambiente Pages/D1 isolado com usuários e imagem sintéticos. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.PDF_FACSIMILE_TEST_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
for (const envKey of ["PDF_FACSIMILE_TEST_OWNER", "PDF_FACSIMILE_TEST_OPERATOR"]) assert.ok(process.env[envKey]?.endsWith("@example.test"));
assert.ok(process.env.PDF_FACSIMILE_TEST_PASSWORD);
const target = "/configuracoes";
const browser = await chromium.launch(auditBrowserLaunchOptions());
async function enter(email) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 820, height: 1050 } });
  await ctx.route("**/*", route => route.request().url().startsWith(base.origin + "/") ? route.continue() : route.abort());
  await ctx.addInitScript(storage => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await ctx.newPage();
  page.setDefaultTimeout(18000);
  const status = [];
  page.on("response", r => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith("/api/tenants") || path.startsWith("/api/me/pdf-facsimile")) status.push([path, r.status()]);
  });
  await page.goto(new URL("/?next=" + encodeURIComponent(target) + "#/login", base).href);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(process.env.PDF_FACSIMILE_TEST_PASSWORD);
  const login = page.waitForResponse(r => new URL(r.url()).pathname === "/api/auth/login");
  await page.getByTestId("login-form").locator("button[type=submit]").click();
  assert.equal((await login).status(), 200);
  return { ctx, page, status };
}

try {
  const owner = await enter(process.env.PDF_FACSIMILE_TEST_OWNER);
  try {
    await owner.page.getByRole("heading", { name: "Imagem manuscrita do proprietário" }).waitFor();
  } catch (e) {
    console.error(owner.page.url(), owner.status, (await owner.page.locator("body").innerText()).slice(0, 700));
    throw e;
  }
  await owner.page.getByText("Nenhuma imagem cadastrada nesta clínica.", { exact: true }).waitFor();
  let uploads = 0;
  owner.page.on("request", req => { if (req.method() === "PUT" && new URL(req.url()).pathname === "/api/me/pdf-facsimile") uploads++; });
  await owner.page.getByLabel("Escolher imagem PNG ou JPEG").setInputFiles({ name: "test-card-only.png", mimeType: "image/png", buffer: testCard() });
  await owner.page.getByText("Imagem selecionada. Nada foi enviado ainda.", { exact: true }).waitFor();
  assert.equal(uploads, 0);
  await owner.page.getByRole("button", { name: "Cadastrar imagem privada" }).click();
  await owner.page.getByText("Imagem cadastrada para os PDFs compatíveis desta clínica.", { exact: true }).waitFor();
  assert.equal(uploads, 1);
  await owner.page.reload();
  await owner.page.getByText("Imagem privada cadastrada.", { exact: true }).waitFor();
  assert.equal(await owner.page.evaluate(() => JSON.stringify([localStorage, sessionStorage]).includes("data:image/png")), false);
  await owner.ctx.close();
  const otherBrowser = await enter(process.env.PDF_FACSIMILE_TEST_OWNER);
  await otherBrowser.page.getByText("Imagem privada cadastrada.", { exact: true }).waitFor();
  await otherBrowser.ctx.close();
  const operator = await enter(process.env.PDF_FACSIMILE_TEST_OPERATOR);
  await operator.page.getByTestId("configuracoes-shell").waitFor();
  assert.equal(await operator.page.getByLabel("Escolher imagem PNG ou JPEG").count(), 0);
  await operator.ctx.close();
  console.log("Chromium + Pages/D1: upload só após clicar, estado sobrevive ao recarregar e a um novo login sem storage anterior, operador sem acesso.");
} finally { await browser.close(); }
