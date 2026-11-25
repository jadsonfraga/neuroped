import { testCard } from "../fixtures/owner-pdf-test-card.mjs";
/** Independent browser proof of non-official print layout, using only a geometric PNG. */
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
const compiled = await build({
  entryPoints: ["client/src/lib/printDocument.ts"], platform: "browser", format: "iife", write: false,
  bundle: true, globalName: "PrintHelpers", alias: { "@": "./client/src" },
});
const png = testCard();
let status = 200;
const server = await startStaticServer("dist/public", { port: 0, apiHandler(req, res, pathname) {
  if (pathname !== "/api/me/pdf-facsimile") return false;
  assert.equal(req.headers.authorization, "Bearer owner-fixture");
  res.writeHead(status, { "Content-Type": "image/png" });
  res.end(status === 200 ? png : undefined);
  return true;
} });
const browser = await chromium.launch(auditBrowserLaunchOptions());
try {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin !== server.origin) return route.abort();
    if (url.pathname === "/print-harness") return route.fulfill({ contentType: "text/html", body: "<html><head></head><body><main><h1>Conteúdo fictício</h1></main></body></html>" });
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(server.origin + "/print-harness");
  await page.addScriptTag({ content: compiled.outputFiles[0].text });
  await page.evaluate(() => {
    sessionStorage.setItem("neuroped:access", "owner-fixture");
    sessionStorage.setItem("neuroped:active-clinic-id", "clinic-fixture");
    window.print = () => {
      document.body.dataset.printed = String(document.querySelectorAll("[data-owner-facsimile]").length);
      window.dispatchEvent(new Event("afterprint"));
    };
    const open = window.open.bind(window);
    window.open = (...args) => {
      const win = open(...args);
      if (win) win.print = () => { win.document.body.dataset.printed = "yes"; };
      return win;
    };
  });
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => window.PrintHelpers.printCurrentPageWithOwnerFacsimile());
  assert.equal(await page.locator("body").getAttribute("data-printed"), "1");
  assert.equal(await page.locator("[data-owner-facsimile]").count(), 0, "remove a imagem após imprimir");

  const next = page.waitForEvent("popup");
  await page.evaluate(() => window.PrintHelpers.printPlainTextDocument({ title: "Teste", text: "<fixture>" }));
  const popup = await next;
  await popup.locator('body[data-printed="yes"]').waitFor();
  assert.equal(await popup.locator("pre").innerText(), "<fixture>");
  await popup.getByRole("img", { name: "Imagem manuscrita do titular" }).waitFor();
  assert.ok(await popup.evaluate(() => window.opener === null));
  await popup.close();

  status = 503;
  const failedPopup = page.waitForEvent("popup");
  await page.evaluate(() => window.PrintHelpers.printPlainTextDocument({ title: "Teste", text: "não expor" }));
  const failed = await failedPopup;
  await failed.getByRole("alert").waitFor();
  assert.match(await failed.getByRole("alert").innerText(), /não foi gerado/);
  assert.equal(await failed.locator('body[data-printed="yes"]').count(), 0);
  console.log("Chromium: rodapé do PDF, isolamento, limpeza e bloqueio de impressão sem imagem.");
} finally {
  await browser.close();
  await server.close();
}
