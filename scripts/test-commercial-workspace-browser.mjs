import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions } from "./lib/browser-audit-runtime.mjs";

// Servidor isolado de fixtures: não usa conta, banco ou endpoint de produção.
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  esbuild: { jsx: "automatic" },
  resolve: { alias: [
    { find: "@/lib/authClient", replacement: resolve("tests/fixtures/commercial-workspace/authClient.ts") },
    { find: "@shared", replacement: resolve("shared") },
    { find: "@", replacement: resolve("client/src") },
  ] },
  optimizeDeps: { entries: [resolve("tests/fixtures/commercial-workspace/index.html")] },
  server: { host: "127.0.0.1", port: 0, strictPort: false, hmr: false },
});
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch(auditBrowserLaunchOptions({ headless: true }));
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.exportEffects = { prints: 0, written: "", copied: "", email: "", closed: 0 };
    window.open = () => ({
      closed: false, opener: null,
      document: { write: (html) => { window.exportEffects.written = html; }, close() {} },
      focus() {}, print() { window.exportEffects.prints++; }, close() { window.exportEffects.closed++; },
    });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text) => { window.exportEffects.copied = text; },
    } });
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest?.("a");
      if (anchor?.href.startsWith("mailto:")) { event.preventDefault(); window.exportEffects.email = anchor.href; }
    }, true);
  });
  const requests = [];
  let mode = "allow";
  let release = null;
  await page.route("**/api/commercial/materials/**", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    assert.equal(request.method(), "POST");
    assert.deepEqual(Object.keys(payload), ["channel"]);
    requests.push(payload.channel);
    if (mode === "hold") await new Promise((resolvePromise) => { release = resolvePromise; });
    await route.fulfill({
      status: mode === "deny" ? 403 : 200, contentType: "application/json",
      body: JSON.stringify(mode === "deny" ? { code: "COMMERCIAL_USER_NOT_AUTHORIZED", error: "Synthetic denied" } : { recorded: true, stage: "authorized_initiation" }),
    });
  });
  const url = (feature) => `${base}/tests/fixtures/commercial-workspace/index.html?feature=${feature}`;
  for (const feature of ["form.change_log", "form.school_feedback", "form.approved_plan", "form.routine_log"]) {
    await page.goto(url(feature));
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("commercial-export-download").click();
    const download = await downloadPromise;
    const content = await readFile(await download.path(), "utf8");
    assert.ok(content.includes("modelo em branco"));
    assert.ok(!/<input|<textarea|<script/i.test(content));
    assert.equal(requests.at(-1), "download");
  }
  await page.goto(url("form.approved_plan"));
  await page.getByTestId("commercial-export-print").click();
  await page.getByRole("status").filter({ hasText: "Diálogo de impressão solicitado" }).waitFor();
  assert.equal(await page.evaluate(() => window.exportEffects.prints), 1);
  assert.ok((await page.evaluate(() => window.exportEffects.written)).includes("Plano aprovado"));
  await page.getByTestId("commercial-export-copy").click();
  await page.getByRole("status").filter({ hasText: "Modelo copiado" }).waitFor();
  assert.ok((await page.evaluate(() => window.exportEffects.copied)).includes("PLANO APROVADO"));
  await page.getByTestId("commercial-export-email").click();
  await page.getByRole("status").filter({ hasText: "Rascunho solicitado" }).waitFor();
  assert.ok((await page.evaluate(() => window.exportEffects.email)).startsWith("mailto:"));
  assert.deepEqual(requests.slice(-3), ["print", "copy", "email"]);

  await page.goto(url("form.approved_plan"));
  mode = "deny";
  await page.getByTestId("commercial-export-print").click();
  await page.getByRole("status").filter({ hasText: "interrompida" }).waitFor();
  assert.deepEqual(await page.evaluate(() => [window.exportEffects.prints, window.exportEffects.written, window.exportEffects.closed]), [0, "", 1]);

  await page.goto(url("form.approved_plan"));
  mode = "hold";
  const requestPromise = page.waitForRequest("**/api/commercial/materials/**");
  await page.getByTestId("commercial-export-copy").click();
  await requestPromise;
  await page.evaluate(() => window.commercialTest.switchClinic());
  assert.equal(typeof release, "function");
  release();
  await page.getByRole("status").filter({ hasText: "interrompida" }).waitFor();
  assert.equal(await page.evaluate(() => window.exportEffects.copied), "");
  assert.deepEqual(errors, []);
  console.log("✅ Commercial browser: 4 downloads reais, print/copy/mail handoffs, recusa sem saída e troca de unidade durante autorização.");
} finally {
  if (browser) await browser.close();
  await server.close();
}
