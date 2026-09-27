// Real built UI + Chromium; the clinical API is the existing synthetic fixture.
// No patient data, production credentials, camera permission or clinical write.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import {
  startStaticServer,
  auditBrowserLaunchOptions,
  ACCEPTED_FIRST_VISIT_STORAGE,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../../scripts/lib/synthetic-clinical-api.mjs";

const destination = "https://drjadsoneye.lovable.app";
const directory = process.env.DRJADSONEYE_ARTIFACT_DIR || "/tmp/drjadsoneye-navigation";
await mkdir(directory, { recursive: true });
const server = await startStaticServer("dist/public", {
  port: 0,
  apiHandler: createSyntheticClinicalApi({ patients: "empty" }),
});
const results = [];
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions());
  for (const scenario of [
    { name: "desktop", width: 1180, height: 900, collapsed: false, mobile: false },
    { name: "desktop-collapsed", width: 1180, height: 900, collapsed: true, mobile: false },
    { name: "mobile-with-collapsed-preference", width: 390, height: 844, collapsed: true, mobile: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
    });
    context.setDefaultTimeout(15000);
    try {
      await context.addInitScript(({ storage, collapsed, origin }) => {
        // Only initialize NeuroPed. Never inject its preferences into the external app.
        if (window.location.origin !== origin) return;
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        localStorage.setItem("neuroped:sidebar-collapsed", collapsed ? "1" : "0");
      }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, collapsed: scenario.collapsed, origin: server.origin });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${server.origin}/#/super-neuropad-game`);
      await page.waitForLoadState("networkidle");
      const login = page.locator("#login-email");
      if (await login.count()) {
        assert.equal(await page.getByTestId("nav-DrJadsoneye").count(), 0, "no shortcut before authentication");
        await login.fill(SYNTHETIC_CREDENTIALS.email);
        await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
        await page.locator('[data-testid="login-form"] button[type="submit"]').click();
      }
      const root = page.getByTestId("super-neuropad-game");
      await root.waitFor({ timeout: 20000 });
      await page.locator('[data-testid="super-neuropad-game"][data-screen="setup"]').waitFor();
      await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "6", exact: true }).click();
      await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
      const steps = page.getByRole("list", { name: "Passos da preparação" });
      await steps.getByText(/Idade, concluído/).waitFor();
      await steps.getByText(/Herói, concluído/).waitFor();
      // A DOM sentinel detects a reload/remount without changing application logic.
      await root.evaluate((element) => element.setAttribute("data-navigation-proof", "unsaved-setup-retained"));
      const originalUrl = page.url();

      if (scenario.mobile) await page.getByTestId("button-mobile-menu").click();
      const link = page.getByTestId("nav-DrJadsoneye");
      await link.waitFor({ state: "visible" });
      assert.equal(await link.count(), 1, "one shared navigation entry");
      assert.equal(await link.getAttribute("href"), destination);
      assert.equal(await link.getAttribute("target"), "_blank");
      assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
      assert.equal(await link.getAttribute("referrerpolicy"), "no-referrer");
      const accessibleName = await link.getAttribute("aria-label");
      assert.equal(accessibleName, "DrJadsoneye Aplicativo externo · pesquisa (abre em nova aba)");
      assert.equal(await link.locator(".np-nav-item__label").isVisible(), scenario.mobile || !scenario.collapsed);
      if (scenario.mobile || !scenario.collapsed) {
        const visibleText = (await link.innerText()).replace(/\s+/g, " ").trim();
        assert.ok(visibleText.length > 0, "the visible label is not hidden to bypass its accessibility contract");
        assert.ok(accessibleName.includes(visibleText), "accessible name contains the entire visible label, including the research subtitle");
      }
      await link.scrollIntoViewIfNeeded();
      const box = await link.boundingBox();
      assert.ok(box && box.height >= 44, "minimum touch target remains available");
      await page.screenshot({ path: `${directory}/${scenario.name}-before.png`, fullPage: true });

      const requests = [];
      context.on("request", (request) => {
        if (request.isNavigationRequest() && new URL(request.url()).origin === destination) {
          requests.push({ url: request.url(), headers: request.headers() });
        }
      });
      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        link.click(),
      ]);
      await popup.waitForLoadState("domcontentloaded", { timeout: 30000 });
      const actualUrl = new URL(popup.url());
      assert.equal(actualUrl.origin, destination);
      assert.equal(actualUrl.pathname, "/");
      assert.equal(actualUrl.search, "");
      assert.equal(actualUrl.hash, "");
      assert.equal(await popup.evaluate(() => window.opener === null), true);
      assert.equal(await popup.evaluate(() => document.referrer), "");
      assert.ok(requests.length > 0, "the external application was actually requested");
      assert.equal(requests[0].url, `${destination}/`);
      assert.equal(requests[0].headers.referer, undefined);
      assert.equal(requests[0].headers.authorization, undefined);
      await popup.close();
      await page.bringToFront();

      assert.equal(page.url(), originalUrl, "the NeuroPed consultation URL is unchanged");
      assert.equal(await root.getAttribute("data-navigation-proof"), "unsaved-setup-retained", "the consultation was not unmounted");
      await steps.getByText(/Idade, concluído/).waitFor();
      await steps.getByText(/Herói, concluído/).waitFor();
      if (scenario.mobile) {
        await page.waitForFunction(() => document.querySelector('[data-testid="button-mobile-menu"]')?.getAttribute("aria-expanded") === "false");
        assert.equal(await root.evaluate((element) => Boolean(element.closest("[inert]"))), false, "the closed drawer releases the consultation");
      }
      assert.deepEqual(errors, [], "no NeuroPed page error");
      await page.screenshot({ path: `${directory}/${scenario.name}-after.png`, fullPage: true });
      const result = { scenario: scenario.name, externalUrl: actualUrl.href, consultationPreserved: true, noReferrer: true, openerIsolated: true, status: "passed" };
      results.push(result);
      console.log(JSON.stringify(result));
    } finally {
      await context.close();
    }
  }
  assert.equal(results.length, 3);
  console.log("DrJadsoneye: 3 browser scenarios passed. Built UI, synthetic clinical API, real external navigation; no clinical accuracy claim.");
} finally {
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2));
  if (browser) await browser.close();
  await server.close();
}
