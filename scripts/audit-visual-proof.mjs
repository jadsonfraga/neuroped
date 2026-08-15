// @ts-check
/**
 * Prova visual determinística do NeuroPed.
 *
 * Captura uma matriz de telas em Chromium real e falha quando encontra:
 * - overflow horizontal;
 * - colisão entre dock móvel, ajuda flutuante e mascote;
 * - elementos fixos cortados pelo viewport;
 * - erros de runtime;
 * - alvos principais menores que 44 px no mobile.
 *
 * As imagens e o relatório JSON são publicados como artefato da CI para
 * revisão humana. Este script não converte regras estáticas em "nota estética".
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
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
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const CASES = [
  { id: "home-mobile-light", route: "/", width: 390, height: 844, theme: "light" },
  { id: "home-tablet-light", route: "/", width: 820, height: 1180, theme: "light" },
  { id: "home-desktop-light", route: "/", width: 1440, height: 1000, theme: "light" },
  { id: "home-desktop-dark", route: "/", width: 1440, height: 1000, theme: "dark" },
  { id: "filtro-mobile-light", route: "/#/filtro", width: 390, height: 844, theme: "light" },
  { id: "filtro-desktop-light", route: "/#/filtro", width: 1440, height: 1000, theme: "light" },
  { id: "prontuario-mobile-light", route: "/#/prontuario", width: 390, height: 844, theme: "light" },
  { id: "prontuario-desktop-dark", route: "/#/prontuario", width: 1440, height: 1000, theme: "dark" },
];

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

const server = await startStaticServer(ensureClientBuild(repoRoot));
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const testCase of CASES) {
    const isMobile = testCase.width < 768;
    const context = await browser.newContext({
      viewport: { width: testCase.width, height: testCase.height },
      colorScheme: testCase.theme,
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
      isMobile,
      hasTouch: isMobile,
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
      const rect = (element) => {
        if (!(element instanceof HTMLElement)) return null;
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || box.width === 0 || box.height === 0) return null;
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
        mascot: '[data-mascot-era]',
      };
      const boxes = Object.fromEntries(
        Object.entries(selectors).map(([name, selector]) => [name, [...document.querySelectorAll(selector)].map(rect).filter(Boolean)]),
      );

      const fixedClipping = [];
      for (const element of document.querySelectorAll("body *")) {
        if (!(element instanceof HTMLElement)) continue;
        const style = getComputedStyle(element);
        if (style.position !== "fixed") continue;
        const box = rect(element);
        if (!box) continue;
        const tolerance = 1;
        if (box.left < -tolerance || box.top < -tolerance || box.right > innerWidth + tolerance || box.bottom > innerHeight + tolerance) {
          fixedClipping.push({
            selector: element.dataset.testid ? `[data-testid="${element.dataset.testid}"]` : `${element.tagName.toLowerCase()}.${[...element.classList].slice(0, 3).join(".")}`,
            box,
          });
        }
      }

      const mobileTargetFailures = [];
      if (innerWidth < 768) {
        for (const selector of [
          '[data-testid="mobile-primary-dock"] button',
          '[data-testid="button-floating-help"]',
        ]) {
          for (const element of document.querySelectorAll(selector)) {
            const box = rect(element);
            if (box && (box.width < 44 || box.height < 44)) {
              mobileTargetFailures.push({ selector, width: box.width, height: box.height });
            }
          }
        }
      }

      return {
        viewport: { width: innerWidth, height: innerHeight },
        document: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
        },
        boxes,
        fixedClipping,
        mobileTargetFailures,
      };
    });

    const collisions = [];
    for (const [leftName, rightName] of [["dock", "help"], ["dock", "mascot"], ["help", "mascot"]]) {
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
      ...audit.fixedClipping.map((item) => `fixo-cortado:${item.selector}`),
      ...audit.mobileTargetFailures.map((item) => `alvo-mobile:${item.selector}:${item.width}x${item.height}`),
      ...runtimeErrors,
    ];

    await page.screenshot({
      path: resolve(outputDir, `${testCase.id}.png`),
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
  summary: { totalCases: results.length, failedCases: results.filter((result) => result.failures.length).length, failures },
};
writeFileSync(resolve(outputDir, "report.json"), JSON.stringify(report, null, 2));
writeFileSync(resolve(outputDir, "index.md"), [
  "# NeuroPed — prova visual",
  "",
  `Casos: ${report.summary.totalCases} · casos com falha: ${report.summary.failedCases}`,
  "",
  ...results.map((result) => `- ${result.failures.length ? "❌" : "✅"} **${result.id}** — ${result.width}×${result.height}, ${result.theme}, ${result.route}${result.failures.length ? ` — ${result.failures.join("; ")}` : ""}`),
  "",
  "A aprovação automatizada cobre integridade responsiva e de composição. A avaliação estética final continua exigindo revisão humana das capturas.",
].join("\n"));

if (failures.length) {
  console.error(`[visual-proof] ✗ ${failures.length} falha(s):\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
} else {
  console.log(`[visual-proof] ✓ ${results.length} capturas sem overflow, colisão, clipping, erro de runtime ou alvo principal subdimensionado.`);
}