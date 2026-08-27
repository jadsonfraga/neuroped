import { chromium } from "playwright";

const origin = (process.env.PUBLISHED_ORIGIN || "https://neuroped.pages.dev").replace(/\/$/, "");
const routes = [
  { path: "/?availability=1#/", marker: "NeuroPed" },
  { path: "/?availability=2#/brincando-e-aprendendo", marker: "Escolha sua missão de hoje" },
  { path: "/?availability=3#/missao-saude", marker: "Missão Saúde" },
  { path: "/?availability=4#/eletroencefalograma", marker: "Vídeo-EEG" },
  { path: "/?availability=5#/portal-familia", marker: "Portal dos Pais / Psicoeducação" },
  { path: "/?availability=6#/ajuda", marker: "Central de Ajuda" },
  { path: "/?availability=7#/sobre-neuroped", marker: "NeuroPed" },
];
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const failures = [];
const results = [];

try {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "allow" });
    await context.addInitScript(() => {
      localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "availability-smoke");
      localStorage.setItem("neuroped:onboarding-seen", "1");
      localStorage.setItem("np_tour_intro_v2", "done");
      localStorage.setItem("np_tour_v2_done", "1");
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const badResponses = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(`${error.name}: ${error.message}`));
    page.on("requestfailed", (request) => {
      const resource = request.resourceType();
      if (["script", "stylesheet", "xhr", "fetch", "document"].includes(resource)) {
        failedRequests.push(`${resource} ${request.url()} :: ${request.failure()?.errorText ?? "unknown"}`);
      }
    });
    page.on("response", (response) => {
      const resource = response.request().resourceType();
      if (response.status() >= 400 && ["script", "stylesheet", "xhr", "fetch", "document"].includes(resource)) {
        badResponses.push(`${response.status()} ${resource} ${response.url()}`);
      }
    });

    let navigation = "ok";
    try {
      await page.goto(`${origin}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(5000);
    } catch (error) {
      navigation = `${error.name}: ${error.message}`;
    }
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const hasMarker = bodyText.includes(route.marker);
    const hasGlobalError = bodyText.includes("O NeuroPed encontrou uma falha");
    const routeResult = {
      route: route.path,
      navigation,
      hasMarker,
      hasGlobalError,
      consoleErrors,
      pageErrors,
      failedRequests,
      badResponses,
    };
    results.push(routeResult);
    if (navigation !== "ok" || !hasMarker || hasGlobalError || consoleErrors.length || pageErrors.length || failedRequests.length || badResponses.length) {
      failures.push(routeResult);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ origin, routeCount: routes.length, passed: failures.length === 0, results }, null, 2));
if (failures.length) {
  console.error(`\n[availability] ✗ ${failures.length}/${routes.length} rotas falharam no smoke test publicado.`);
  process.exit(1);
}
console.log(`\n[availability] ✓ ${routes.length}/${routes.length} rotas publicadas carregaram sem falhas de runtime ou recursos essenciais.`);
