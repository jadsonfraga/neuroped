// @ts-check
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  auditBrowserLaunchOptions,
  ensureClientBuild,
  startStaticServer,
} from "./lib/browser-audit-runtime.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const outputDir = resolve(repoRoot, "artifacts/especialidades-premium");
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const cases = [
  { id: "especialidades-mobile", width: 390, height: 844, theme: "light" },
  { id: "especialidades-tablet", width: 820, height: 1180, theme: "light" },
  { id: "especialidades-desktop", width: 1536, height: 960, theme: "light" },
];

const server = await startStaticServer(ensureClientBuild(repoRoot));
const browser = await chromium.launch(auditBrowserLaunchOptions());
const results = [];

try {
  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: { width: testCase.width, height: testCase.height },
      colorScheme: testCase.theme,
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
      isMobile: testCase.width < 768,
      hasTouch: testCase.width < 1024,
    });
    await context.addInitScript((storage) => {
      for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
      localStorage.setItem("neuroped:theme", "light");
    }, ACCEPTED_FIRST_VISIT_STORAGE);

    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });

    await page.goto(`${server.origin}/#/especialidades`, { waitUntil: "networkidle" });
    await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 10_000 }).catch(() => {});
    await page.getByTestId("especialidades-premium-surface").waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("heading", { name: /Especialidades em Neurologia Infantil/i }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(350);

    const audit = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="especialidades-premium-surface"]');
      const ctas = [...document.querySelectorAll('a[href="#/agendar"]')].length;
      const whatsapp = [...document.querySelectorAll('a[href^="https://wa.me/"]')].length;
      return {
        rootVisible: root instanceof HTMLElement && root.getBoundingClientRect().width > 0,
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        ctas,
        whatsapp,
        headingCount: document.querySelectorAll("h1").length,
      };
    });

    const failures = [
      ...(!audit.rootVisible ? ["superficie-nao-visivel"] : []),
      ...(audit.horizontalOverflow > 1 ? [`overflow-horizontal:${audit.horizontalOverflow}px`] : []),
      ...(audit.ctas < 1 ? ["cta-agendamento-ausente"] : []),
      ...(audit.whatsapp < 1 ? ["cta-whatsapp-ausente"] : []),
      ...(audit.headingCount !== 1 ? [`h1-invalido:${audit.headingCount}`] : []),
      ...runtimeErrors,
    ];

    await page.screenshot({
      path: resolve(outputDir, `${testCase.id}-viewport.png`),
      fullPage: false,
      animations: "disabled",
    });
    await page.screenshot({
      path: resolve(outputDir, `${testCase.id}-full.png`),
      fullPage: true,
      animations: "disabled",
    });

    results.push({ ...testCase, ...audit, failures });
    console.log(`[especialidades-premium] ${testCase.id}: ${failures.length ? failures.join(", ") : "OK"}`);
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}

const failures = results.flatMap((result) => result.failures.map((failure) => `${result.id}: ${failure}`));
writeFileSync(resolve(outputDir, "report.json"), JSON.stringify({ results, failures }, null, 2));
if (failures.length) {
  console.error(`[especialidades-premium] ✗ ${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`[especialidades-premium] ✓ ${results.length} viewports e ${results.length * 2} capturas aprovadas.`);
}
