import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

// Production-built UI and its real preference handlers. Authentication/data
// are synthetic; no production session, patient, upstream AI or deployment.
const dir = process.env.SOUND_LABEL_ARTIFACT_DIR || "/tmp/sidebar-sound-label";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, reducedMotion: "reduce" });
await context.addInitScript(values => {
  for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  if (localStorage.getItem("neuroped:sounds") === null) localStorage.setItem("neuroped:sounds", "off");
}, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
const checks = [];
page.on("pageerror", error => errors.push(error.message));
const toggle = () => page.getByTestId("button-sound-toggle");
// This regression targets the sound control; the workflow also runs the
// unchanged full twelve-route Lighthouse gate for all other components.
const audit = () => new AxeBuilder({ page }).include('[data-testid="button-sound-toggle"]').withRules(["label-content-name-mismatch"]).analyze();
async function state(enabled, label) {
  await page.waitForFunction(expected => document.querySelector('[data-testid="button-sound-toggle"]')?.getAttribute("aria-pressed") === String(expected), enabled);
  const name = await toggle().getAttribute("aria-label");
  assert.ok(name?.toLocaleLowerCase("pt-BR").includes(label.toLocaleLowerCase("pt-BR")), `${label} must occur in the accessible name: ${name}`);
  assert.equal(await toggle().locator("span").innerText(), label);
}
async function check(name) {
  const result = await audit();
  await writeFile(`${dir}/${name}.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  checks.push(name);
}
try {
  await page.goto(`${server.origin}/#/filtro`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await toggle().waitFor({ state: "visible", timeout: 20000 });
  await state(false, "Sem som");
  await check("01-desktop-muted");
  // Negative control: recreate precisely the pre-fix attribute on the real
  // button. The unchanged axe rule must detect it; then restore the attribute.
  const fixedName = await toggle().getAttribute("aria-label");
  await toggle().evaluate(el => el.setAttribute("aria-label", "Ativar sons da interface"));
  const negative = await audit();
  await writeFile(`${dir}/negative-control.json`, JSON.stringify(negative.violations, null, 2));
  assert.ok(negative.violations.some(v => v.id === "label-content-name-mismatch" && v.nodes.some(n => n.html.includes('data-testid="button-sound-toggle"'))), "old accessible name must reproduce the actual label mismatch");
  await toggle().evaluate((el, name) => el.setAttribute("aria-label", name), fixedName);
  await check("02-negative-control-restored");
  await toggle().click();
  await state(true, "Sons");
  await check("03-desktop-enabled");
  assert.equal(await page.evaluate(() => localStorage.getItem("neuroped:sounds")), "on");
  await toggle().click();
  await state(false, "Sem som");
  await page.reload();
  await toggle().waitFor({ state: "visible" });
  await state(false, "Sem som");
  assert.equal(await page.evaluate(() => localStorage.getItem("neuroped:sounds")), "off");
  await page.getByTestId("button-sidebar-toggle").click();
  await page.getByRole("button", { name: "Expandir menu", exact: true }).waitFor();
  await check("04-collapsed-sidebar");
  await page.getByTestId("button-sidebar-toggle").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId("button-mobile-menu").click();
  await toggle().waitFor({ state: "visible" });
  await state(false, "Sem som");
  await check("05-mobile-muted");
  await toggle().click();
  await state(true, "Sons");
  await check("06-mobile-enabled");
  await page.getByTestId("button-mobile-close").click();
  assert.equal(await page.getByTestId("button-sound-toggle-mobile").getAttribute("aria-pressed"), "true");
  await page.getByTestId("button-sound-toggle-mobile").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="button-sound-toggle-mobile"]')?.getAttribute("aria-pressed") === "false");
  assert.equal(await page.evaluate(() => localStorage.getItem("neuroped:sounds")), "off");
  assert.deepEqual(errors, []);
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, checks, oldAttributeReproducesFailure: true, preferenceHandlersPreserved: true, pageErrors: errors, scope: "Built UI sound control, synthetic API, unchanged axe rule; full Lighthouse runs separately; no clinical or production proof." }, null, 2));
  console.log("Sound label: six actual browser states pass; the old attribute fails the same axe rule; real preference toggling/persistence preserved.");
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: true });
  await writeFile(`${dir}/failure.txt`, String(error.stack || error));
  throw error;
} finally { await context.close(); await browser.close(); await server.close(); }
