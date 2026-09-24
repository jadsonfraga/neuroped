import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const root = process.cwd();
const output = resolve(root, "artifacts/tenant-metrics");
mkdirSync(output, { recursive: true });
const dist = ensureClientBuild(root, "authenticated");
const api = createSyntheticClinicalApi();
let mode = "ready";
let metricsRequests = 0;
const fixture = {
  source: "saas_audit_log",
  window: { from: "2026-08-16", toExclusive: "2026-09-15", timezone: "UTC", currentDayPartial: true },
  auditedActorsToday: 2, auditedActors7Days: 5, auditedActors30Days: 9, auditedEvents30Days: 42,
  daily: [{ day: "2026-09-14", actors: 2, events: 4 }],
  coverage: { auditedOperationsOnly: true, anonymousVisitorsCollected: false, fullProductDau: null, fullProductMau: null, retention: null },
  apiInstrumentationBindingPresent: false,
};
const server = await startStaticServer(dist, { port: 4379, apiHandler: async (request, response, pathname, searchParams) => {
  if (new URL(request.url, "http://localhost").pathname === "/api/tenants/clinic-sintetica-alfa/metrics") {
    metricsRequests += 1;
    response.setHeader("Content-Type", "application/json"); response.setHeader("Cache-Control", "no-store");
    response.writeHead(mode === "error" ? 503 : 200);
    response.end(JSON.stringify(mode === "error" ? { error: "Synthetic unavailable" } : mode === "invalid" ? {} : fixture));
    return true;
  }
  return api(request, response, pathname, searchParams);
} });
let browser;
const results = [];
try {
  const login = await fetch(`${server.origin}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: SYNTHETIC_CREDENTIALS.email, password: SYNTHETIC_CREDENTIALS.password }),
  });
  assert.equal(login.status, 200); const session = await login.json();
  browser = await chromium.launch(auditBrowserLaunchOptions());
  for (const width of [390, 1440]) {
    for (const scenario of ["ready", "error", "invalid"]) {
      mode = scenario;
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      await context.addInitScript(({ storage, auth }) => {
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        sessionStorage.setItem("neuroped:access", auth.accessToken);
        sessionStorage.setItem("neuroped:refresh", auth.refreshToken);
        sessionStorage.setItem("neuroped:user", JSON.stringify(auth.user));
      }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, auth: session });
      await context.route("**/*", (route) => new URL(route.request().url()).origin === server.origin ? route.continue() : route.abort());
      const page = await context.newPage(); const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto(`${server.origin}/#/configuracoes`, { waitUntil: "domcontentloaded" });
      await page.getByRole("tab", { name: "Atividade", exact: true }).click();
      await page.getByRole("heading", { name: "Atividade auditada da clínica", exact: true }).waitFor();
      if (scenario === "ready") {
        await page.getByTestId("tenant-metrics-summary").waitFor();
        assert.match(await page.getByTestId("tenant-metrics-summary").innerText(), /42/);
        const before = metricsRequests;
        const refreshed = page.waitForResponse((response) => response.url().endsWith("/metrics") && response.status() === 200);
        await page.getByRole("button", { name: "Atualizar métricas" }).click();
        await refreshed;
        assert.ok(metricsRequests > before, "refresh must reach the endpoint");
      } else {
        await page.getByRole("alert").filter({ hasText: "Nenhum valor foi estimado" }).waitFor();
        assert.equal(await page.getByTestId("tenant-metrics-summary").count(), 0, "error must not show zero or stale counts");
      }
      assert.equal(await page.getByTestId("login-form").count(), 0, "must test authenticated panel, not login gate");
      assert.deepEqual(pageErrors, []);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, "settings must fit viewport");
      await page.screenshot({ path: resolve(output, `${scenario}-${width}.png`), fullPage: true });
      results.push({ scenario, width, passed: true });
      await context.close();
    }
  }
  writeFileSync(resolve(output, "result.json"), JSON.stringify({ syntheticOnly: true, backendProof: "separate SQLite and middleware tests", results }, null, 2));
  console.log(`Tenant activity browser: ${results.length} synthetic states passed.`);
} finally {
  await browser?.close(); await server.close();
}
