// @ts-check
/**
 * Prova visual determinística do NeuroPed.
 *
 * Captura uma matriz representativa em Chromium real e falha quando encontra:
 * - overflow horizontal;
 * - colisão entre dock, ajuda, tour e mascotes;
 * - ajuda/tour duplicados ou flutuantes sobre controles clínicos;
 * - elementos fixos visíveis cortados pelo viewport;
 * - reserva inferior menor que o dock compacto;
 * - erros de runtime;
 * - alvos principais menores que 44 px em celular/tablet.
 *
 * As capturas de viewport e página completa são publicadas como artefato para
 * revisão humana. Integridade automatizada não é convertida em “nota estética”.
 */
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
const outputDir = resolve(repoRoot, "artifacts/visual-proof");
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const CASES = [
  { id: "home-mobile-small-light", route: "/", width: 360, height: 800, theme: "light" },
  { id: "home-mobile-light", route: "/", width: 390, height: 844, theme: "light" },
  { id: "home-tablet-light", route: "/", width: 820, height: 1180, theme: "light" },
  { id: "home-desktop-light", route: "/", width: 1440, height: 1000, theme: "light" },
  { id: "home-desktop-dark", route: "/", width: 1440, height: 1000, theme: "dark" },
  { id: "filtro-mobile-light", route: "/#/filtro", width: 390, height: 844, theme: "light" },
  { id: "filtro-tablet-light", route: "/#/filtro", width: 820, height: 1180, theme: "light" },
  { id: "filtro-desktop-light", route: "/#/filtro", width: 1440, height: 1000, theme: "light" },
  { id: "prontuario-mobile-light", route: "/#/prontuario", width: 390, height: 844, theme: "light" },
  { id: "prontuario-tablet-dark", route: "/#/prontuario", width: 820, height: 1180, theme: "dark" },
  { id: "prontuario-desktop-dark", route: "/#/prontuario", width: 1440, height: 1000, theme: "dark" },
  { id: "mchat-mobile-light", route: "/#/mchat", width: 390, height: 844, theme: "light" },
  { id: "familia-mobile-light", route: "/#/portal-familia", width: 390, height: 844, theme: "light" },
  { id: "familia-tablet-light", route: "/#/portal-familia", width: 820, height: 1180, theme: "light" },
  { id: "familia-desktop-dark", route: "/#/portal-familia", width: 1440, height: 1000, theme: "dark" },
];

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

const server = await startStaticServer(ensureClientBuild(repoRoot));
const browser = await chromium.launch(auditBrowserLaunchOptions());
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
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });

    await page.goto(`${server.origin}${testCase.route}`, { waitUntil: "networkidle" });
    await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 10_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

    const audit = await page.evaluate(() => {
      const describe = (element) => {
        if (!(element instanceof HTMLElement)) return "elemento";
        if (element.dataset.testid) return `[data-testid="${element.dataset.testid}"]`;
        if (element.id) return `#${element.id}`;
        const role = element.getAttribute("role");
        const label = element.getAttribute("aria-label");
        if (role && label) return `[role="${role}"][aria-label="${label}"]`;
        const classes = [...element.classList].slice(0, 3).join(".");
        return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
      };

      const intentionallyInactive = (element) => Boolean(
        element.closest("[hidden], [inert], [data-state=\"closed\"], aside[aria-hidden=\"true\"]"),
      );

      const rect = (element) => {
        if (!(element instanceof HTMLElement) || intentionallyInactive(element)) return null;
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) === 0 ||
          box.width === 0 ||
          box.height === 0
        ) return null;
        return {
          left: Number(box.left.toFixed(2)),
          top: Number(box.top.toFixed(2)),
          right: Number(box.right.toFixed(2)),
          bottom: Number(box.bottom.toFixed(2)),
          width: Number(box.width.toFixed(2)),
          height: Number(box.height.toFixed(2)),
        };
      };

      const selectors = {
        dock: '[data-testid="mobile-primary-dock"]',
        help: '[data-testid="button-floating-help"]',
        tour: '[data-testid="button-tour"]',
        mascot: '[data-mascot-era]',
      };
      const boxes = Object.fromEntries(
        Object.entries(selectors).map(([name, selector]) => [
          name,
          [...document.querySelectorAll(selector)].map(rect).filter(Boolean),
        ]),
      );

      const fixedClipping = [];
      for (const element of document.querySelectorAll("body *")) {
        if (!(element instanceof HTMLElement)) continue;
        const style = getComputedStyle(element);
        if (style.position !== "fixed") continue;
        const box = rect(element);
        if (!box) continue;
        const tolerance = 1;
        if (
          box.left < -tolerance ||
          box.top < -tolerance ||
          box.right > innerWidth + tolerance ||
          box.bottom > innerHeight + tolerance
        ) fixedClipping.push({ selector: describe(element), box });
      }

      const compactTargetFailures = [];
      if (innerWidth < 1024) {
        for (const selector of [
          '[data-testid="mobile-primary-dock"] button',
          '[data-testid="button-floating-help"]',
          '[data-testid="prontuario-print"]',
          '.np-prontuario-tabs [role="tab"]',
        ]) {
          for (const element of document.querySelectorAll(selector)) {
            const box = rect(element);
            if (box && (box.width < 44 || box.height < 44)) {
              compactTargetFailures.push({ selector: describe(element), width: box.width, height: box.height });
            }
          }
        }
      }

      const floatingOverlap = [];
      const floatingSelector = [
        '[data-testid="button-floating-help"]',
        '[data-testid="button-tour"]',
        '[data-mascot-era]',
      ].join(",");
      const actionableSelector = [
        "#main-content button",
        "#main-content a[href]",
        "#main-content input",
        "#main-content textarea",
        "#main-content select",
        '#main-content [role="tab"]',
        '#main-content [role="button"]',
      ].join(",");
      const floatingElements = [...document.querySelectorAll(floatingSelector)];
      const actionableElements = [...document.querySelectorAll(actionableSelector)];
      for (const floating of floatingElements) {
        const floatingBox = rect(floating);
        if (!floatingBox) continue;
        for (const actionable of actionableElements) {
          if (floating.contains(actionable) || actionable.contains(floating)) continue;
          const actionBox = rect(actionable);
          if (!actionBox) continue;
          const overlapWidth = Math.max(0, Math.min(floatingBox.right, actionBox.right) - Math.max(floatingBox.left, actionBox.left));
          const overlapHeight = Math.max(0, Math.min(floatingBox.bottom, actionBox.bottom) - Math.max(floatingBox.top, actionBox.top));
          const overlapArea = overlapWidth * overlapHeight;
          const actionArea = actionBox.width * actionBox.height;
          if (overlapArea > 0 && overlapArea / Math.max(1, actionArea) >= 0.08) {
            floatingOverlap.push({ floating: describe(floating), actionable: describe(actionable) });
          }
        }
      }

      const dock = document.querySelector('[data-testid="mobile-primary-dock"]');
      const dockBox = rect(dock);
      const main = document.querySelector("#main-content");
      const mainPaddingBottom = main instanceof HTMLElement
        ? Number.parseFloat(getComputedStyle(main).paddingBottom) || 0
        : 0;
      const dockReserve = dockBox
        ? { actual: Number(mainPaddingBottom.toFixed(2)), required: Number((dockBox.height + 12).toFixed(2)) }
        : null;

      return {
        viewport: { width: innerWidth, height: innerHeight },
        document: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
        },
        boxes,
        fixedClipping,
        compactTargetFailures,
        floatingOverlap,
        dockReserve,
        visibleAssistanceCount: (boxes.help?.length ?? 0) + (boxes.tour?.length ?? 0),
      };
    });

    const collisions = [];
    for (const [leftName, rightName] of [
      ["dock", "help"],
      ["dock", "tour"],
      ["dock", "mascot"],
      ["help", "tour"],
      ["help", "mascot"],
      ["tour", "mascot"],
    ]) {
      for (const left of audit.boxes[leftName] ?? []) {
        for (const right of audit.boxes[rightName] ?? []) {
          if (intersects(left, right)) collisions.push(`${leftName}×${rightName}`);
        }
      }
    }

    const horizontalOverflow = Math.max(0, audit.document.scrollWidth - audit.document.clientWidth);
    const failures = [
      ...(horizontalOverflow > 1 ? [`overflow-horizontal:${horizontalOverflow}px`] : []),
      ...collisions.map((collision) => `colisao:${collision}`),
      ...(audit.visibleAssistanceCount > 1 ? [`ajuda-duplicada:${audit.visibleAssistanceCount}`] : []),
      ...audit.fixedClipping.map((item) => `fixo-cortado:${item.selector}`),
      ...audit.compactTargetFailures.map((item) => `alvo-compacto:${item.selector}:${item.width}x${item.height}`),
      ...audit.floatingOverlap.map((item) => `flutuante-sobre-controle:${item.floating}→${item.actionable}`),
      ...(audit.dockReserve && audit.dockReserve.actual + 1 < audit.dockReserve.required
        ? [`reserva-dock:${audit.dockReserve.actual}px<${audit.dockReserve.required}px`]
        : []),
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

    results.push({ ...testCase, ...audit, horizontalOverflow, collisions, runtimeErrors, failures });
    console.log(`[visual-proof] ${testCase.id}: ${failures.length ? `FALHOU — ${failures.join(", ")}` : "OK"}`);
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
writeFileSync(resolve(outputDir, "report.json"), JSON.stringify(report, null, 2));
writeFileSync(resolve(outputDir, "index.md"), [
  "# NeuroPed — prova visual",
  "",
  `Casos: ${report.summary.totalCases} · capturas: ${report.summary.screenshots} · casos com falha: ${report.summary.failedCases}`,
  "",
  ...results.map((result) => `- ${result.failures.length ? "❌" : "✅"} **${result.id}** — ${result.width}×${result.height}, ${result.theme}, ${result.route}${result.failures.length ? ` — ${result.failures.join("; ")}` : ""}`),
  "",
  "A aprovação automatizada cobre integridade responsiva e de composição. A avaliação estética final continua exigindo revisão humana das capturas.",
].join("\n"));

if (failures.length) {
  console.error(`[visual-proof] ✗ ${failures.length} falha(s):\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
} else {
  console.log(`[visual-proof] ✓ ${results.length} casos e ${results.length * 2} capturas sem overflow, colisão, clipping, duplicidade, sobreposição acionável, erro de runtime ou alvo subdimensionado.`);
}
