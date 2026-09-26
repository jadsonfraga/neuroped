/** UI proof only. Real authorization/persistence: tenant-management-authorization.test.ts. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const output = resolve("artifacts/tenant-management");
mkdirSync(output, { recursive: true });
const dist = ensureClientBuild(process.cwd(), "authenticated");
const results = [];
const browser = await chromium.launch(auditBrowserLaunchOptions());
try {
  for (const userRole of ["reader", "operator"]) {
    const server = await startStaticServer(dist, { port: 4386, apiHandler: createSyntheticClinicalApi({ userRole }) });
    try {
      const login = await fetch(`${server.origin}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SYNTHETIC_CREDENTIALS),
      });
      assert.equal(login.status, 200);
      const session = await login.json();
      assert.equal(session.user.role, userRole);
      for (const width of [390, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
        try {
          await context.addInitScript(({ storage, auth }) => {
            for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
            sessionStorage.setItem("neuroped:access", auth.accessToken);
            sessionStorage.setItem("neuroped:refresh", auth.refreshToken);
            sessionStorage.setItem("neuroped:user", JSON.stringify(auth.user));
          }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, auth: session });
          await context.route("**/*", (route) => new URL(route.request().url()).origin === server.origin ? route.continue() : route.abort());
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto(`${server.origin}/#/configuracoes`, { waitUntil: "domcontentloaded" });
          await page.getByRole("heading", { name: "Sua conta e sua clínica", exact: true }).waitFor();
          await page.getByRole("tab", { name: "Clínica", exact: true }).click();
          const clinicName = page.getByLabel("Nome", { exact: true });
          await clinicName.waitFor();
          assert.equal(await clinicName.isEnabled(), true);
          const newName = `Clínica Sintética ${userRole} ${width}`;
          await clinicName.fill(newName);
          const savedResponse = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes("/api/tenants/"));
          await page.getByRole("button", { name: "Salvar clínica", exact: true }).click();
          assert.equal((await savedResponse).status(), 200);
          await page.getByText("Clínica atualizada ✓", { exact: true }).waitFor();
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.getByRole("tab", { name: "Clínica", exact: true }).click();
          await clinicName.waitFor();
          assert.equal(await clinicName.inputValue(), newName);
          assert.equal(await page.getByTestId("login-form").count(), 0);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          assert.deepEqual(errors, []);
          await page.screenshot({ path: resolve(output, `${userRole}-${width}.png`), fullPage: true });
          await page.goto(`${server.origin}/#/prontuario`, { waitUntil: "domcontentloaded" });
          await page.getByRole("heading", { name: "Acesso não autorizado", exact: true }).waitFor();
          assert.deepEqual(errors, []);
          results.push({ userRole, width, settings: "edited-and-reloaded", medicalRecord: "denied" });
        } finally { await context.close(); }
      }
    } finally { await server.close(); }
  }
} finally { await browser.close(); }
writeFileSync(resolve(output, "result.json"), JSON.stringify({ syntheticOnly: true, backendEvidence: "tests/unit/tenant-management-authorization.test.ts", results }, null, 2));
console.log(`Tenant management UI: ${results.length} role/viewport cases passed.`);
