// Prova de apresentação: navegador real e login contra API 100% sintética.
// Não certifica backend de produção, WebKit/iOS, PWA offline ou aprovação em loja.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "./lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS, SYNTHETIC_PATIENTS } from "./lib/synthetic-clinical-api.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const out = resolve(root, "artifacts/product-signature/screens");
mkdirSync(out, { recursive: true });
const patient = SYNTHETIC_PATIENTS.first.id;
const routes = [
  { id: "login", route: "/login", selector: '[data-testid="login-form"]', anonymous: true },
  { id: "inicio", route: "/", selector: '[data-testid="cockpit-context"]' },
  { id: "pacientes", route: "/pacientes", selector: '[data-testid="button-new-patient"]' },
  { id: "ficha", route: `/paciente/${patient}`, selector: '[data-testid="patient-cockpit"]' },
  { id: "prontuario", route: "/prontuario", query: `patientId=${patient}`, selector: '[data-testid="prontuario-shell"]' },
  { id: "filtro", route: "/filtro", selector: ".container-filtro" },
  { id: "documentos", route: "/documentos", selector: '[data-testid="documentos-shell"]' },
  { id: "laudo", route: "/laudo-neuroped", query: `patientId=${patient}`, selector: '[data-testid="input-paciente"]' },
  { id: "familia", route: "/portal-familia", selector: "#family-resources-title" },
  { id: "escala", route: "/mchat", selector: '[data-testid="card-question-0"]' },
];
const sizes = [
  { id: "desktop-light", width: 1440, height: 1000, theme: "light" },
  { id: "mobile-light", width: 360, height: 800, theme: "light" },
  { id: "mobile-dark", width: 390, height: 844, theme: "dark" },
  { id: "tablet-light", width: 820, height: 1180, theme: "light" },
  { id: "desktop-dark", width: 1440, height: 1000, theme: "dark" },
];
const dist = ensureClientBuild(root, "authenticated");
const server = await startStaticServer(dist, { port: 4387, apiHandler: createSyntheticClinicalApi() });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const results = [];
try {
  for (const size of sizes) {
    for (const route of routes) {
      const id = `${route.id}-${size.id}`;
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height }, colorScheme: size.theme,
        reducedMotion: "reduce", deviceScaleFactor: 1,
        isMobile: size.width < 768, hasTouch: size.width < 1024, serviceWorkers: "block",
      });
      await context.addInitScript(({ storage, theme }) => {
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        localStorage.setItem("neuroped:theme", theme);
      }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, theme: size.theme });
      const failures = [];
      const files = [];
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      page.on("pageerror", (error) => failures.push(`runtime:${error.message}`));
      // Nenhuma requisição de documento/API pode sair do ambiente de teste.
      await context.route("**/*", async (request) => {
        const type = request.request().resourceType();
        if (["document", "xhr", "fetch"].includes(type) && new URL(request.request().url()).origin !== server.origin) {
          failures.push(`origem-externa:${new URL(request.request().url()).origin}`);
          await request.abort();
        } else await request.continue();
      });
      let layout = null;
      try {
        await page.goto(`${server.origin}/#/login`, { waitUntil: "domcontentloaded" });
        await page.locator('[data-testid="login-form"]').waitFor({ state: "visible", timeout: 60_000 });
        if (!route.anonymous) {
          await page.fill("#login-email", SYNTHETIC_CREDENTIALS.email);
          await page.fill("#login-password", SYNTHETIC_CREDENTIALS.password);
          await page.locator('[data-testid="login-form"] button[type="submit"]').click();
          await page.locator('[data-testid="cockpit-context"]').waitFor({ state: "visible", timeout: 60_000 });
          await page.goto(`${server.origin}/${route.query ? `?${route.query}` : ""}#${route.route}`, { waitUntil: "domcontentloaded" });
        }
        await page.locator(route.selector).first().waitFor({ state: "visible", timeout: 60_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(600);
        if (!route.anonymous && await page.locator('[data-testid="login-form"]').isVisible()) failures.push("conteudo-protegido-no-login");
        if (route.anonymous) {
          const toggle = page.getByTestId("toggle-password");
          await toggle.click();
          if (await page.locator("#login-password").getAttribute("type") !== "text") failures.push("senha-nao-revelada");
          await toggle.click();
          if (await page.locator("#login-password").getAttribute("type") !== "password") failures.push("senha-nao-ocultada");
        }
        layout = await page.evaluate(() => ({
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          brokenImages: [...document.images].filter((image) => image.getBoundingClientRect().width > 0 && image.complete && image.naturalWidth === 0).map((image) => image.getAttribute("alt") || "imagem sem alternativa"),
          title: document.querySelector("h1")?.textContent ?? "",
        }));
        if (layout.overflow > 1) failures.push(`overflow:${layout.overflow}px`);
        failures.push(...layout.brokenImages.map((name) => `imagem:${name}`));
        for (const fullPage of [false, true]) {
          const filename = `${id}-${fullPage ? "full" : "viewport"}.png`;
          await page.screenshot({ path: resolve(out, filename), fullPage, animations: "disabled" });
          files.push(filename);
        }
      } catch (error) {
        failures.push(`caso:${error instanceof Error ? error.message : String(error)}`);
        try {
          await page.screenshot({ path: resolve(out, `${id}-FAILED.png`), animations: "disabled" });
        } catch (captureError) {
          failures.push(`captura:${captureError instanceof Error ? captureError.message : String(captureError)}`);
        }
      } finally {
        await context.close();
      }
      results.push({ id, route: route.route, size, layout, files, failures });
      console.log(`[product] ${id}: ${failures.length ? `FAIL ${failures.join("; ")}` : "OK"}`);
      writeFileSync(resolve(out, "report.json"), JSON.stringify({ synthetic: true, results }, null, 2));
    }
  }
} finally {
  await browser.close();
  await server.close();
}
const summary = {
  states: results.length,
  passed: results.filter((result) => result.failures.length === 0).length,
  screenshots: results.reduce((total, result) => total + result.files.length, 0),
  failed: results.filter((result) => result.failures.length).map((result) => result.id),
};
writeFileSync(resolve(out, "report.json"), JSON.stringify({ generatedAt: new Date().toISOString(), synthetic: true, browser: "Chromium", summary, results }, null, 2));
writeFileSync(resolve(out, "index.html"), `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>NeuroPed — prova visual</title><style>body{font:16px system-ui;margin:24px;background:#f8f5ef;color:#0b1f3a}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}figure{margin:0;background:white;padding:16px;border-radius:16px}img{width:100%;height:300px;object-fit:contain;object-position:top}figcaption{padding:8px 0;font-weight:600}</style><h1>NeuroPed — implementação visual</h1><p>Dados totalmente sintéticos. ${summary.passed}/${summary.states} estados sem falhas nesta matriz. ${summary.screenshots} capturas. Não é comprovação de produção ou aprovação da App Store.</p><main>${results.map((result) => `<figure><figcaption>${result.id} · ${result.failures.length ? "FALHA" : "OK"}</figcaption><a href="${result.files[1] ?? `${result.id}-FAILED.png`}"><img loading="lazy" src="${result.files[0] ?? `${result.id}-FAILED.png`}" alt="${result.id}"></a></figure>`).join("")}</main></html>`);
console.log(JSON.stringify(summary));
if (summary.states !== 50 || summary.failed.length) process.exitCode = 1;
