// @ts-check
/**
 * Prova visual dos estados transitórios de assistência.
 *
 * O audit principal cobre páginas em repouso. Este gate abre ajuda,
 * preferências e tour em navegador real e falha por clipping, overflow,
 * foco fora do diálogo, mais de um diálogo visível, erro de runtime ou alvo
 * tátil menor que 44 px no shell compacto.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  ensureClientBuild,
  startStaticServer,
} from "./lib/browser-audit-runtime.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const outputDir = resolve(repoRoot, "artifacts/visual-proof");
mkdirSync(outputDir, { recursive: true });

const CASES = [
  { id: "help-mobile-light", state: "help", width: 390, height: 844, theme: "light" },
  { id: "preferences-mobile-light", state: "preferences", width: 390, height: 844, theme: "light" },
  { id: "tour-mobile-dark", state: "tour", width: 390, height: 844, theme: "dark" },
  { id: "preferences-tablet-dark", state: "preferences", width: 820, height: 1180, theme: "dark" },
  { id: "help-desktop-dark", state: "help", width: 1440, height: 1000, theme: "dark" },
];

const ASSET_SETTLE_TIMEOUT_MS = 5_000;

/** @param {import("playwright").Page} page @param {string} state */
async function openAssistanceState(page, state) {
  await page.getByTestId("button-floating-help").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("button-floating-help").click();
  const helpDialog = page.getByTestId("help-dialog");
  await helpDialog.waitFor({ state: "visible", timeout: 10_000 });

  if (state === "preferences") {
    await page.getByTestId("button-open-preferences").click();
    await helpDialog.waitFor({ state: "detached", timeout: 10_000 });
    await page.getByTestId("preferences-panel").waitFor({ state: "visible", timeout: 10_000 });
  } else if (state === "tour") {
    await page.getByTestId("button-start-tour").click();
    await helpDialog.waitFor({ state: "detached", timeout: 10_000 });
    // aria-labelledby tem precedência sobre aria-label no nome acessível.
    // O seletor estrutural confirma o mesmo diálogo sem depender do título da etapa.
    await page.locator('[role="dialog"][aria-label="Tour guiado"]').waitFor({
      state: "visible",
      timeout: 10_000,
    });
  }
}

const server = await startStaticServer(ensureClientBuild(repoRoot), 0);
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const testCase of CASES) {
    const compact = testCase.width < 1024;
    const context = await browser.newContext({
      viewport: { width: testCase.width, height: testCase.height },
      colorScheme: testCase.theme,
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
      isMobile: testCase.width < 768,
      hasTouch: compact,
    });
    await context.addInitScript(({ storage, theme }) => {
      for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
      localStorage.setItem("neuroped:theme", theme);
    }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, theme: testCase.theme });

    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror:${error.message}`));
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (/AbortError|favicon|ERR_ABORTED/i.test(text)) return;
      runtimeErrors.push(`console:${text}`);
    });

    await page.goto(`${server.origin}/#/`, { waitUntil: "networkidle" });
    await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 15_000 });
    await page.evaluate(async (assetTimeoutMs) => {
      const bounded = (promise) => Promise.race([
        promise,
        new Promise((resolveTimeout) => setTimeout(resolveTimeout, assetTimeoutMs)),
      ]);

      if (document.fonts?.ready) await bounded(document.fonts.ready);
      const imagesReady = Promise.all([...document.images].map((image) => image.complete
        ? Promise.resolve()
        : new Promise((resolveImage) => {
            image.addEventListener("load", resolveImage, { once: true });
            image.addEventListener("error", resolveImage, { once: true });
          })));
      await bounded(imagesReady);
    }, ASSET_SETTLE_TIMEOUT_MS);

    await openAssistanceState(page, testCase.state);
    await page.waitForTimeout(100);

    const audit = await page.evaluate(({ state, compactViewport }) => {
      const selector = state === "preferences"
        ? '[data-testid="preferences-panel"]'
        : state === "tour"
          ? '[role="dialog"][aria-label="Tour guiado"]'
          : '[data-testid="help-dialog"]';
      const dialog = document.querySelector(selector);
      if (!(dialog instanceof HTMLElement)) throw new Error(`diálogo ausente: ${selector}`);

      const visible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element.closest('[hidden], [inert], [aria-hidden="true"], [data-state="closed"]')) {
          return false;
        }
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity) !== 0
          && box.width > 0
          && box.height > 0
          && box.right > 0
          && box.bottom > 0
          && box.left < innerWidth
          && box.top < innerHeight;
      };
      const box = dialog.getBoundingClientRect();
      const visibleDialogs = [...document.querySelectorAll('[role="dialog"]')].filter(visible);
      const smallTargets = [];
      if (compactViewport) {
        const targets = dialog.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"], [role="switch"]',
        );
        for (const element of targets) {
          if (!(element instanceof HTMLElement) || !visible(element)) continue;
          const target = element.getBoundingClientRect();
          if (target.width < 44 || target.height < 44) {
            smallTargets.push({
              label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 48) || element.tagName,
              width: Number(target.width.toFixed(2)),
              height: Number(target.height.toFixed(2)),
            });
          }
        }
      }

      return {
        selector,
        dialog: {
          left: Number(box.left.toFixed(2)),
          top: Number(box.top.toFixed(2)),
          right: Number(box.right.toFixed(2)),
          bottom: Number(box.bottom.toFixed(2)),
          width: Number(box.width.toFixed(2)),
          height: Number(box.height.toFixed(2)),
        },
        viewport: { width: innerWidth, height: innerHeight },
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        visibleDialogCount: visibleDialogs.length,
        focusInside: dialog.contains(document.activeElement),
        smallTargets,
      };
    }, { state: testCase.state, compactViewport: compact });

    const tolerance = 1;
    const failures = [
      ...(audit.horizontalOverflow > tolerance ? [`overflow-horizontal:${audit.horizontalOverflow}px`] : []),
      ...(audit.dialog.left < -tolerance ? [`dialogo-cortado-esquerda:${audit.dialog.left}px`] : []),
      ...(audit.dialog.top < -tolerance ? [`dialogo-cortado-topo:${audit.dialog.top}px`] : []),
      ...(audit.dialog.right > audit.viewport.width + tolerance
        ? [`dialogo-cortado-direita:${audit.dialog.right}px>${audit.viewport.width}px`]
        : []),
      ...(audit.dialog.bottom > audit.viewport.height + tolerance
        ? [`dialogo-cortado-base:${audit.dialog.bottom}px>${audit.viewport.height}px`]
        : []),
      ...(audit.visibleDialogCount !== 1 ? [`dialogos-visiveis:${audit.visibleDialogCount}`] : []),
      ...(!audit.focusInside ? ["foco-fora-do-dialogo"] : []),
      ...audit.smallTargets.map((target) => `alvo-compacto:${target.label}:${target.width}x${target.height}`),
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

    results.push({ ...testCase, audit, runtimeErrors, failures });
    console.log(`[assistance-proof] ${testCase.id}: ${failures.length ? `FALHOU — ${failures.join(", ")}` : "OK"}`);
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}

const failures = results.flatMap((result) => result.failures.map((failure) => `${result.id}: ${failure}`));
const report = {
  generatedAt: new Date().toISOString(),
  browser: "playwright-chromium",
  cases: results,
  summary: {
    totalCases: results.length,
    screenshots: results.length * 2,
    failedCases: results.filter((result) => result.failures.length).length,
    failures,
  },
};
writeFileSync(resolve(outputDir, "assistance-report.json"), JSON.stringify(report, null, 2));
writeFileSync(resolve(outputDir, "assistance-index.md"), [
  "# NeuroPed — prova visual dos estados de assistência",
  "",
  `Casos: ${report.summary.totalCases} · capturas: ${report.summary.screenshots} · casos com falha: ${report.summary.failedCases}`,
  "",
  ...results.map((result) => `- ${result.failures.length ? "❌" : "✅"} **${result.id}** — ${result.width}×${result.height}, ${result.theme}${result.failures.length ? ` — ${result.failures.join("; ")}` : ""}`),
  "",
].join("\n"));

if (failures.length) {
  console.error(`[assistance-proof] ✗ ${failures.length} falha(s):\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
} else {
  console.log(`[assistance-proof] ✓ ${results.length} estados e ${results.length * 2} capturas sem clipping, overflow, foco externo, duplicidade, erro de runtime ou alvo tátil subdimensionado.`);
}
