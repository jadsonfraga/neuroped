import { testCard } from "../fixtures/owner-pdf-test-card.mjs";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import {
  ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const originalApi = createSyntheticClinicalApi({ userRole: "professional", primaryRole: "owner" });
const synthetic = testCard();
const server = await startStaticServer("dist/public", {
  port: 0, apiHandler(req, res, pathname, searchParams) {
    if (req.method === "GET" && req.url === "/api/me/pdf-facsimile") {
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
      res.end(synthetic);
      return true;
    }
    return originalApi(req, res, pathname, searchParams);
  },
});
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions());
  const ctx = await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" });
  await ctx.route("**/*", route => route.request().url().startsWith(server.origin + "/") ? route.continue() : route.abort());
  await ctx.addInitScript(storage => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await ctx.newPage();
  const runtimeErrors = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto(`${server.origin}/?next=%2Flaudo-neuroped#/login`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.getByTestId("login-form").locator('button[type="submit"]').click();
  const narrative = "Laudo sintético para verificar a indicação de assinatura.";
  const editor = page.getByTestId("textarea-laudo-integral");
  try { await editor.fill(narrative, { timeout: 12_000 }); }
  catch (error) { console.error(page.url(), (await page.locator("body").innerText()).slice(0, 450), runtimeErrors); throw error; }
  await page.getByRole("button", { name: "Visualizar", exact: true }).click();
  const preview = page.frameLocator('iframe[title="Laudo Preview"]');
  await preview.locator("main").waitFor();
  assert.equal(await preview.locator(".doc-text").innerText(), narrative);
  assert.match(await preview.locator(".sig-area").innerText(), /sem assinatura digital/i);
  assert.match(await preview.locator(".footer").innerText(), /sem assinatura digital/i);
  assert.doesNotMatch(await preview.locator(".footer").innerText(), /assinatura digital ICP-Brasil PAdES-BES/i);
  await page.evaluate(() => {
    const open = window.open.bind(window);
    window.open = (...args) => {
      const popup = open(...args);
      if (popup) popup.print = () => {};
      return popup;
    };
  });
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Imprimir / Salvar PDF", exact: true }).click();
  const printed = await popup;
  await printed.locator("main").waitFor();
  assert.equal(await printed.locator(".doc-text").innerText(), narrative);
  const signature = printed.getByRole("img", { name: "Imagem manuscrita do titular" });
  await signature.waitFor();
  assert.ok(await signature.evaluate(img => img.complete && img.naturalWidth > 0));
  assert.match(await printed.locator("[data-owner-facsimile]").innerText(), /não é assinatura digital/i);
  assert.match(await printed.locator(".footer").innerText(), /sem assinatura digital/i);
  const pdf = await printed.pdf({ format: "A4", printBackground: true, path: process.env.NEUROPED_LAUDO_UNSIGN_TEST_PDF });
  assert.ok(pdf.length > 1_000, "a via impressa continua gerando PDF real");
  const artifact = await PDFDocument.load(pdf);
  const isSignatureDictionary = dict =>
    dict instanceof PDFDict && ["Type", "FT"].some(key => dict.get(PDFName.of(key))?.toString() === "/Sig");
  assert.ok(!artifact.context.enumerateIndirectObjects().some(([, dict]) => isSignatureDictionary(dict)),
    "a impressão simples não contém dicionário de assinatura");

  await page.getByRole("heading", { name: "Assinatura Eletrônica ICP-Brasil", exact: true }).waitFor();
  assert.deepEqual(runtimeErrors, []);
  console.log("Laudo: texto integral preservado, imagem fictícia na impressão, PDF sem dicionário de assinatura, painel ICP preservado.");
} finally {
  await browser?.close();
  await server.close();
}
