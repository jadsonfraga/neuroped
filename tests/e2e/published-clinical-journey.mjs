import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const origins = (process.env.PUBLISHED_ORIGINS ?? "https://neuroped.pages.dev,https://superneuroped.vercel.app,https://jadsonfraga.github.io/neuroped/")
  .split(",")
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);
const routes = ["/", "/#/filtro", "/#/mchat", "/#/marcacao", "/#/eletroencefalograma", "/#/prontuario"];
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const result = { startedAt: new Date().toISOString(), origins, environments: [] };
const e2eEmail = process.env.PUBLISHED_E2E_EMAIL?.trim();
const e2ePassword = process.env.PUBLISHED_E2E_PASSWORD;

function isAssetRequest(request) {
  return /\.(?:js|css|png|jpe?g|svg|webp|woff2?|ico)(?:\?|$)/i.test(request.url());
}

async function inspectEnvironment(browser, origin) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e-published");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
  });
  const environment = { origin, routes: [], consoleErrors: [], pageErrors: [], httpErrors: [], auth: { configured: Boolean(e2eEmail && e2ePassword), attempted: false, succeeded: false }, clinicalJourney: null };
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") environment.consoleErrors.push({ route: page.url(), text: message.text() });
  });
  page.on("pageerror", (error) => environment.pageErrors.push({ route: page.url(), text: error.message }));
  page.on("response", (response) => {
    if (response.status() >= 500 && !isAssetRequest(response.request())) {
      environment.httpErrors.push({ route: page.url(), url: response.url(), status: response.status() });
    }
  });
  async function loginIfConfigured() {
    if (!e2eEmail || !e2ePassword || origin.includes("github.io")) return;
    environment.auth.attempted = true;
    await page.goto(`${origin}/#/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.getByTestId("login-form").waitFor({ timeout: 20000 });
    await page.locator("#login-email").fill(e2eEmail);
    await page.locator("#login-password").fill(e2ePassword);
    await page.getByRole("button", { name: /entrar com segurança/i }).click();
    await page.waitForFunction(() => !location.hash.endsWith("/login"), null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    environment.auth.succeeded = Boolean(await page.locator("#root").count());
  }
  async function runClinicalJourney() {
    if (!environment.auth.succeeded) return;
    await page.goto(`${origin}/#/mchat`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.getByTestId("button-yes-0").waitFor({ timeout: 20000 });
    const total = await page.locator('[data-testid^="button-yes-"]').count();
    for (let index = 0; index < total; index += 1) await page.getByTestId(`button-no-${index}`).click();
    const submit = page.getByTestId("button-submit");
    await submit.waitFor({ timeout: 10000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="button-submit"]')?.getAttribute("aria-disabled") !== "true", null, { timeout: 10000 });
    await submit.click();
    await page.locator("[data-scale-response-report]").waitFor({ state: "visible", timeout: 20000 });
    await page.getByTestId("button-print-report").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("[data-scale-response-action]").waitFor({ state: "visible", timeout: 10000 });
    return { scale: "M-CHAT-R/F", questionsAnswered: total, reportVisible: true, printActionVisible: true, persistenceActionVisible: true, finalUrl: page.url() };
  }
  await loginIfConfigured();
  if (environment.auth.succeeded) {
    try { environment.clinicalJourney = { ok: true, ...(await runClinicalJourney()) }; }
    catch (error) { environment.clinicalJourney = { ok: false, error: String(error?.message ?? error) }; }
  }
  for (const route of routes) {
    const item = { route, ok: false, url: null, title: null, bodySample: null, authWall: false, controls: {} };
    try {
      await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2500);
      item.url = page.url();
      item.title = await page.title();
      item.bodySample = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 320);
      item.authWall = /entrar|login|autentica[cç][aã]o|sess[aã]o necess[aá]ria/i.test(item.bodySample ?? "");
      item.controls = {
        h1: await page.locator("h1").count(),
        main: await page.locator("main").count(),
        buttons: await page.locator("button").count(),
        links: await page.locator("a").count(),
        radioGroups: await page.locator('[role="radiogroup"]').count(),
        radioButtons: await page.locator('[role="radio"]').count(),
        submit: await page.getByTestId("button-submit").count(),
        report: await page.locator("[data-scale-response-report]").count(),
      };
      item.ok = Boolean(item.title && item.bodySample);
    } catch (error) {
      item.error = String(error?.message ?? error);
    }
    environment.routes.push(item);
  }
  await context.close();
  return environment;
}

async function main() {
  const browser = await chromium.launch(executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined);
  try {
    for (const origin of origins) result.environments.push(await inspectEnvironment(browser, origin));
  } finally {
    await browser.close();
  }
  result.finishedAt = new Date().toISOString();
  await mkdir("artifacts/e2e", { recursive: true });
  await writeFile("artifacts/e2e/published-clinical-journey.json", JSON.stringify(result, null, 2));
  for (const environment of result.environments) {
    console.log(`\n[${environment.origin}]`);
    for (const route of environment.routes) console.log(`${route.ok ? "✓" : "✗"} ${route.route} title=${JSON.stringify(route.title)} authWall=${route.authWall} controls=${JSON.stringify(route.controls)}${route.error ? ` error=${route.error}` : ""}`);
    console.log(`consoleErrors=${environment.consoleErrors.length} pageErrors=${environment.pageErrors.length} httpErrors=${environment.httpErrors.length}`);
  }
  const failures = result.environments.flatMap((environment) => environment.routes.filter((route) => !route.ok).map((route) => `${environment.origin}${route.route}`));
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => { console.error("[published-e2e] FALHOU", error); process.exit(1); });
