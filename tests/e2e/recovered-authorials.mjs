import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, extname, sep, join } from "node:path";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const DIST = resolve("dist/public"), OUT = resolve("artifacts/recovered-authorials");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const server = createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = resolve(DIST, `.${pathname}`);
  if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403); res.end(); return; }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await context.newPage(); const errors = [], writes = [], passed = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method()) && !request.url().includes("/auth/")) writes.push(`${request.method()} ${new URL(request.url()).pathname}`); });
const user = { id: "authorials-local-fixture", email: "authorials@neuroped.invalid", name: "Equipe sintética", role: "professional" };
await context.addInitScript((user) => {
  if (window.location.protocol !== "http:") return; // fixture somente no servidor local
  for (const [key, value] of [["neuroped:aviso-educativo-aceito-v1", "e2e"], ["neuroped:onboarding-seen", "1"], ["np_tour_intro_v2", "done"], ["np_tour_v2_done", "1"]]) localStorage.setItem(key, value);
  sessionStorage.setItem("neuroped:access", "authorials-local-access-fixture");
  sessionStorage.setItem("neuroped:refresh", "authorials-local-refresh-fixture");
  sessionStorage.setItem("neuroped:user", JSON.stringify(user));
}, user);
await context.route("**/api/**", (route) => {
  const path = new URL(route.request().url()).pathname;
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(path === "/api/health" ? { status: "ok", authentication: { required: true, configured: true } } : path === "/api/auth/me" ? user : path === "/api/tenants" ? { data: [] } : []) });
});
const cases = [
  { id: "adapta-18-sdg", focus: "transicoes", count: 18, value: 3, operational: true },
  { id: "porta-20-sdg", focus: "participacao-escolar", count: 20, value: 3, school: true },
  { id: "ticar-18-sdg", focus: "tiques", count: 18, value: 3, operational: true },
  { id: "ponte-16-sdg", focus: "generalizacao", count: 16, value: 3, operational: true, multi: true },
  { id: "rota-aut-18-sdg", focus: "autonomia", count: 18, value: 4 },
  { id: "ritmo-sono-20-sdg", focus: "sono", count: 20, value: 5, no: true },
];
async function openHub() {
  await page.goto("about:blank"); // cada caso usa nova carga; retenção é testada separadamente
  await page.goto(`${base}/#/filtro?autoral=acervo`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("authorial-hub").waitFor({ state: "visible", timeout: 30000 });
  await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
}
async function fillProfile(c) {
  await page.locator("#authorial-years").fill("8");
  await page.locator("#authorial-respondent").selectOption(c.school ? "professor" : "pais");
  await page.locator(`#authorial-context-${c.school ? "escola" : "casa"}`).check();
  if (c.multi) await page.locator("#authorial-context-escola").check();
  await page.locator(`#authorial-focus-${c.focus}`).click();
  await page.locator("#authorial-observed").check();
  await page.locator("#authorial-urgent").selectOption("nao");
  assert.equal(await page.getByTestId(`authorial-card-${c.id}`).count(), 0, "purpose must not be inferred");
  await page.locator("#authorial-purpose").selectOption("basal");
}
async function switchTabs() {
  await page.locator("#filter-general-tab").click();
  await page.getByTestId("age-band-scroll").waitFor({ state: "visible", timeout: 30000 });
  await page.locator("#filter-recovered-tab").click();
  await page.getByTestId("recovered-questionnaire").waitFor({ state: "visible" });
}
try {
  for (const c of cases) {
    await openHub(); await fillProfile(c);
    await page.getByTestId(`authorial-card-${c.id}`).getByRole("button").click();
    await page.getByTestId("recovered-questionnaire").waitFor({ state: "visible" });
    assert.equal(await page.locator('[data-testid^="monitor-item-"]').count(), c.count);
    await page.locator("#monitor-finish").click();
    assert.match(await page.getByTestId("recovered-questionnaire").innerText(), /Complete a identificação/);
    await page.locator("#monitor-observer").fill("OBSERVADOR_FIXTURE_SEM_PERSISTENCIA");
    if (c.school) {
      const currentEnd = await page.locator("#monitor-window-end").inputValue();
      await page.locator("#monitor-window-start").fill(currentEnd);
    }
    for (let i = 0; i < c.count; i++) await page.locator(`input[name="monitor-item-${i}"][value="${c.value}"]`).check();
    const alerts = page.locator('select[id^="monitor-alert-"]');
    for (let i = 0; i < await alerts.count(); i++) await alerts.nth(i).selectOption(c.id === "adapta-18-sdg" && i === 0 ? "incerto" : "nao");
    await page.locator("#monitor-next-agreed").check();
    if (c.school) {
      await page.locator("#monitor-school-window-confirmed").check();
      await page.locator("#monitor-finish").click();
      assert.equal(await page.locator("[data-scale-response-report]").count(), 0, "same-day school window must stay blocked");
      assert.match(await page.getByTestId("recovered-questionnaire").innerText(), /pelo menos 14 dias escolares/);
      const start = new Date(); start.setDate(start.getDate() - 22);
      await page.locator("#monitor-window-start").fill(start.toISOString().slice(0, 10));
      assert.equal(await page.locator("#monitor-school-window-confirmed").isChecked(), false, "changing the school window must invalidate prior confirmation");
      await page.locator("#monitor-finish").click();
      assert.equal(await page.locator("[data-scale-response-report]").count(), 0, "plausible dates alone must not create a snapshot");
      assert.match(await page.getByTestId("recovered-questionnaire").innerText(), /confirmação explícita/);
      await page.locator("#monitor-school-window-confirmed").check();
    }
    if (c.operational) {
      await page.locator("#monitor-finish").click();
      assert.equal(await page.locator("[data-scale-response-report]").count(), 0);
      await page.locator("#monitor-source-agreed").check();
    }
    if (c.id === "adapta-18-sdg") {
      await page.locator("#monitor-finish").click();
      assert.equal(await page.locator("[data-scale-response-report]").count(), 0);
      await page.locator("#monitor-review-agreed").check();
    }
    await switchTabs();
    assert.equal(await page.getByTestId("recovered-questionnaire").locator('input[type="radio"]:checked').count(), c.count);
    assert.equal(await page.locator("#monitor-observer").inputValue(), "OBSERVADOR_FIXTURE_SEM_PERSISTENCIA");
    await page.locator("#monitor-finish").click();
    await page.locator("[data-scale-response-report]").waitFor({ state: "visible", timeout: 20000 });
    const text = await page.locator("[data-scale-response-report] pre").first().textContent();
    assert.ok(text.includes(`Item ${c.count}.`));
    assert.ok(text.includes("Próximos passos")); assert.ok(text.includes("Direção e limites"));
    if (c.no) assert.ok(text.includes("Não calculável com a cobertura observada"));
    else if (c.value === 4) assert.ok(text.includes("100,0% descritivo (não percentil)"));
    else assert.ok(text.includes("3,00/3"));
    if (c.school) { assert.ok(text.includes("Apoio escolar")); assert.ok(text.includes("confirmação explícita registrada")); }
    await switchTabs();
    assert.equal(await page.locator("[data-scale-response-report] pre").first().textContent(), text);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${c.id}: mobile overflow`);
    const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    assert.equal(stored.includes("OBSERVADOR_FIXTURE_SEM_PERSISTENCIA"), false);
    assert.equal(page.url().includes("OBSERVADOR_FIXTURE"), false);
    if (c.id === "rota-aut-18-sdg") { mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: join(OUT, "rota-mobile-result.png"), fullPage: true }); }
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Voltar ao filtro / nova aplicação", exact: true }).click();
    await page.getByTestId(`authorial-card-${c.id}`).getByRole("button").click();
    assert.equal(await page.locator("#monitor-observer").inputValue(), "");
    assert.equal(await page.getByTestId("recovered-questionnaire").locator('input[type="radio"]:checked').count(), 0);
    passed.push(c.id);
  }
  await openHub(); await fillProfile(cases[4]);
  await page.locator("#authorial-focus-sono").click(); await page.locator("#authorial-budget").selectOption("40");
  assert.equal(await page.locator('[data-testid^="authorial-card-"]').count(), 2);
  await page.locator("#authorial-urgent").selectOption("incerto");
  assert.equal(await page.locator('[data-testid^="authorial-card-"]').count(), 0);
  await page.locator("#authorial-urgent").selectOption("nao");
  await page.setViewportSize({ width: 1280, height: 900 });
  mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: join(OUT, "hub-desktop.png"), fullPage: true });
  await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Autonomia · monitor autoral", exact: true }).click();
  await page.getByRole("link", { name: /Abrir questionário/ }).click();
  await page.getByTestId("authorial-hub").waitFor({ state: "visible", timeout: 30000 });
  assert.equal(await page.locator("#authorial-purpose").inputValue(), "");
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  writeFileSync(join(OUT, "report.json"), JSON.stringify({ passed, errors, writes, fixture: "localhost only, synthetic identity, mocked read endpoints; no production write verified" }, null, 2));
  console.log("[recovered-authorials] PASS", passed);
} catch (error) {
  mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: join(OUT, "failure.png"), fullPage: true }).catch(() => {});
  writeFileSync(join(OUT, "failure.txt"), `${error.stack}\n${await page.locator("body").innerText().catch(() => "")}`);
  throw error;
} finally { await context.close(); await browser.close(); server.close(); }
