import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, extname, sep, join } from "node:path";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

// Executa somente em servidor efêmero local. Nenhuma credencial/pessoa real.
const DIST = resolve("dist/public");
const OUT = resolve("artifacts/regula20");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const USER = { id: "regula20-local-fixture", email: "regula20@neuroped.invalid", name: "Equipe E2E local", role: "professional" };
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = resolve(DIST, `.${path}`);
  if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403); res.end(); return; }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await context.newPage();
const apiWrites = [];
const pageErrors = [];
const checks = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("request", (request) => {
  if (new URL(request.url()).pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method()) && !request.url().includes("/auth/")) apiWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
});

await context.addInitScript((user) => {
  localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
  localStorage.setItem("neuroped:onboarding-seen", "1");
  localStorage.setItem("np_tour_intro_v2", "done");
  localStorage.setItem("np_tour_v2_done", "1");
  sessionStorage.setItem("neuroped:access", "regula20-local-access-fixture");
  sessionStorage.setItem("neuroped:refresh", "regula20-local-refresh-fixture");
  sessionStorage.setItem("neuroped:user", JSON.stringify(user));
}, USER);
await context.route("**/api/**", (route) => {
  const path = new URL(route.request().url()).pathname;
  const body = path === "/api/health" ? { status: "ok", authentication: { required: true, configured: true } }
    : path === "/api/auth/me" ? USER
      : path === "/api/tenants" ? { data: [] } : [];
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
});
const assertDisabled = async (id) => assert.equal(await page.locator(id).isDisabled(), true);
async function opened() {
  await page.getByTestId("regula20-app").waitFor({ state: "visible", timeout: 30000 });
  await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
}
async function fillSetup() {
  await page.locator("#regula-years").fill("8");
  await page.locator("#regula-months").fill("0");
  await page.locator("#regula-respondent").selectOption("pais");
  await page.locator("#regula-context").selectOption("casa");
  await page.locator("#regula-focus").selectOption("irritabilidade-funcional");
  await page.locator("#regula-observer").fill("OBSERVADOR_FIXTURE_NAO_PERSISTIR");
  await page.locator("#regula-observed").check();
  await page.locator("#regula-urgent").selectOption("nao");
}
async function answerAll(value, alert = "nao-relatado") {
  for (let i = 0; i < 20; i++) await page.locator(`input[name="regula-item-${i}"][value="${value}"]`).check();
  for (let i = 0; i < 7; i++) await page.locator(`#regula-alert-${i}`).selectOption(i === 0 ? alert : "nao-relatado");
  await page.locator("#regula-next-steps").check();
}
async function verifyPrivacy() {
  const stores = await page.evaluate(() => ({ local: JSON.stringify({ ...localStorage }), session: JSON.stringify({ ...sessionStorage }) }));
  for (const text of Object.values(stores)) assert.equal(text.includes("OBSERVADOR_FIXTURE_NAO_PERSISTIR"), false);
  assert.equal(page.url().includes("OBSERVADOR_FIXTURE"), false);
  assert.deepEqual(apiWrites, [], "não há gravação ou envio automático de respostas");
}
async function clearFamily() {
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Nova família / limpar esta aplicação" }).click();
  assert.equal(await page.locator("#regula-observer").inputValue(), "");
  assert.equal(await page.locator("#regula-purpose").inputValue(), "");
  assert.equal(await page.locator("#regula-years").inputValue(), "");
  await assertDisabled("#regula-start");
}
async function switchAwayAndBack() {
  await page.locator("#filter-general-tab").click();
  await page.getByTestId("age-band-scroll").waitFor({ state: "visible", timeout: 30000 });
  assert.equal(await page.getByTestId("regula20-app").isVisible(), false);
  await page.locator("#filter-authorial-tab").click();
  await opened();
}

try {
  await page.goto(`${base}/#/filtro?autoral=regula-20-sdg`, { waitUntil: "domcontentloaded" });
  await opened();
  await assertDisabled("#regula-start");
  await fillSetup();
  await assertDisabled("#regula-start");
  await page.locator("#regula-purpose").selectOption("basal-funcional");
  assert.equal(await page.locator("#regula-start").isDisabled(), false);
  await page.locator("#regula-years").fill("2");
  await page.locator("#regula-months").fill("11");
  await assertDisabled("#regula-start");
  await page.locator("#regula-years").fill("18");
  await page.locator("#regula-months").fill("0");
  await assertDisabled("#regula-start");
  await page.locator("#regula-years").fill("8");
  await page.locator("#regula-respondent").selectOption("professor");
  await assertDisabled("#regula-start");
  await page.locator("#regula-respondent").selectOption("pais");
  await page.locator("#regula-urgent").selectOption("sim");
  await assertDisabled("#regula-start");
  assert.match(await page.getByTestId("regula20-app").innerText(), /avise a equipe agora/);
  await page.locator("#regula-urgent").selectOption("nao-sei");
  await assertDisabled("#regula-start");
  await page.locator("#regula-urgent").selectOption("nao");
  checks.push("filtro: idade, finalidade não inferida, contexto escolar e urgência");
  await page.locator("#regula-start").click();
  assert.equal(await page.locator('[data-testid^="regula-item-"]').count(), 20);
  await page.locator("#regula-finish").click();
  assert.match(await page.getByTestId("regula20-app").innerText(), /responda aos 20 itens/);
  await answerAll("5");
  await switchAwayAndBack();
  assert.equal(await page.getByTestId("regula20-app").locator('input[type="radio"]:checked').count(), 20);
  assert.equal(await page.locator('input[name="regula-item-19"][value="5"]').isChecked(), true);
  assert.equal(await page.locator("#regula-next-steps").isChecked(), true);
  await verifyPrivacy();
  checks.push("troca de abas preserva 20 respostas e contexto somente em memória");
  await page.locator("#regula-finish").click();
  await page.locator("[data-scale-response-report]").waitFor({ state: "visible", timeout: 15000 });
  const report = await page.locator("[data-scale-response-report] pre").first().textContent();
  assert.ok(report.includes("Item 20."));
  assert.ok(report.includes("Alerta 7"));
  assert.ok(report.includes("Próximos passos"));
  assert.ok(report.includes("1.0-pdf-20260912"));
  assert.ok(report.includes("Média global descritiva 0–4"));
  assert.ok(report.includes("Não calculável: 0/20"));
  assert.match(await page.getByTestId("regula20-app").innerText(), /Média global não calculável/);
  await switchAwayAndBack();
  assert.equal(await page.locator("[data-scale-response-report] pre").first().textContent(), report);
  await verifyPrivacy();
  checks.push("20 N/O: relatório integral preservado, versão e ausência de média enganosa");
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: join(OUT, "mobile-result.png"), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "sem overflow no celular");
  await clearFamily();
  await fillSetup();
  await page.locator("#regula-purpose").selectOption("seguimento-funcional");
  await page.locator("#regula-start").click();
  assert.equal(await page.getByTestId("regula20-app").locator('input[type="radio"]:checked').count(), 0);
  await answerAll("0", "presente");
  await page.locator("#regula-finish").click();
  await page.getByRole("button", { name: "Mostrar registro para avaliação da equipe" }).waitFor();
  assert.equal(await page.locator("[data-scale-response-report]").count(), 0);
  await page.getByRole("button", { name: "Mostrar registro para avaliação da equipe" }).click();
  await page.locator("[data-scale-response-report]").waitFor({ state: "visible" });
  assert.match(await page.getByTestId("regula20-app").innerText(), /Alertas presentes ou informação incerta/);
  const scoredReport = await page.locator("[data-scale-response-report] pre").first().textContent();
  assert.ok(scoredReport.includes("Média global descritiva 0–4"));
  assert.ok(scoredReport.includes("0,00/4"));
  assert.ok(scoredReport.includes("0/80"));
  assert.equal((scoredReport.match(/média descritiva 0–4/g) || []).length, 4);
  await verifyPrivacy();
  checks.push("médias/global/soma presentes no relatório; escores zero não anulam alerta");
  await clearFamily();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: join(OUT, "desktop-filter.png"), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await switchAwayAndBack();
  await page.goto(`${base}/?autoral=regula-20-sdg#/filtro`, { waitUntil: "domcontentloaded" });
  await opened();
  assert.equal(await page.locator("#regula-purpose").inputValue(), "");
  await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
  await page.locator("#pre-consulta-anos").fill("8");
  await page.getByRole("button", { name: "Irritabilidade · registro funcional", exact: true }).click();
  const link = page.getByRole("link", { name: /Abrir questionário/ });
  assert.equal(await link.count(), 1);
  await link.click();
  await opened();
  checks.push("navegação geral/autoral, duas formas de query e acesso pela pré-consulta");
  assert.deepEqual(pageErrors, []);
  writeFileSync(join(OUT, "report.json"), JSON.stringify({ checks, pageErrors, apiWrites, provenance: "localhost; sessão e endpoints de leitura simulados; sem validação de gravação no backend de produção" }, null, 2));
  console.log("[regula20-e2e] PASS", checks);
} catch (error) {
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: join(OUT, "failure.png"), fullPage: true }).catch(() => {});
  writeFileSync(join(OUT, "failure.txt"), `${error.stack}\nURL: ${page.url()}\n${await page.locator("body").innerText().catch(() => "")}`);
  throw error;
} finally {
  await context.close();
  await browser.close();
  server.close();
}
