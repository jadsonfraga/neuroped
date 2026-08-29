/**
 * Prova visual e estrutural do NeuroPED Premium v13/v14.
 *
 * Gera capturas reprodutíveis em desktop, iPad e iPhone, nos modos claro e
 * escuro. Também bloqueia regressões de composição, overflow, touch, shell e
 * comportamento app-like no mobile.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  ensureClientBuild,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";

const repoRoot = process.cwd();
const outputDir = path.resolve(
  repoRoot,
  process.env.PREMIUM_PROOF_DIR || "artifacts/premium-v13",
);

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist, 0);
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const browser = await chromium.launch(
  executablePath
    ? {
        executablePath,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      }
    : undefined,
);

const cases = [
  {
    name: "desktop-light-1440x1000",
    width: 1440,
    height: 1000,
    theme: "light",
  },
  {
    name: "desktop-dark-1440x1000",
    width: 1440,
    height: 1000,
    theme: "dark",
  },
  {
    name: "tablet-light-1024x1366",
    width: 1024,
    height: 1366,
    theme: "light",
  },
  {
    name: "mobile-light-390x844",
    width: 390,
    height: 844,
    theme: "light",
  },
  {
    name: "mobile-dark-390x844",
    width: 390,
    height: 844,
    theme: "dark",
  },
];

const manifest = {
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || "local",
  source: "tests/e2e/premium-visual-proof.mjs",
  captures: [],
};

function rectsOverlap(a, b) {
  return !(
    a.right <= b.left + 1 ||
    b.right <= a.left + 1 ||
    a.bottom <= b.top + 1 ||
    b.bottom <= a.top + 1
  );
}

async function capture(spec) {
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    colorScheme: spec.theme,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.addInitScript(
    ({ storage, theme }) => {
      for (const [key, value] of Object.entries(storage)) {
        localStorage.setItem(key, value);
      }
      localStorage.setItem("neuroped:theme", theme);
    },
    { storage: ACCEPTED_FIRST_VISIT_STORAGE, theme: spec.theme },
  );

  try {
    await page.goto(`${server.origin}/#/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page
      .getByTestId("splash-screen")
      .waitFor({ state: "detached", timeout: 15000 })
      .catch(() => {});
    await page
      .getByTestId("premium-home-v13")
      .waitFor({ state: "visible", timeout: 20000 });
    await page.getByTestId("text-page-title").waitFor({
      state: "visible",
      timeout: 10000,
    });
    await page.evaluate(async () => {
      await document.fonts?.ready;
      window.scrollTo(0, 0);
    });

    const contract = await page.evaluate(() => {
      const root = document.documentElement;
      const title = document.querySelector(
        '[data-testid="text-page-title"]',
      );
      const search = document.querySelector(
        '[data-testid="input-search"]',
      );
      const primaryAction = document.querySelector(
        '[data-testid="premium-primary-action"]',
      );
      const secondaryAction = document.querySelector(
        '[data-testid="premium-secondary-action"]',
      );
      const menu = document.querySelector(
        '[data-testid="button-mobile-menu"]',
      );
      const dock = document.querySelector(
        '[data-testid="mobile-primary-dock"]',
      );
      const sidebar = document.querySelector(
        'aside[aria-label="Menu de navegação"]',
      );
      const flowGrid = document.querySelector(
        '[data-testid="premium-flow-grid"]',
      );
      const flowElements = Array.from(
        document.querySelectorAll('[data-testid^="home-flow-"]'),
      );

      const rectHeight = (element) =>
        element instanceof HTMLElement
          ? element.getBoundingClientRect().height
          : 0;
      const visible = (element) =>
        element instanceof HTMLElement &&
        getComputedStyle(element).display !== "none" &&
        getComputedStyle(element).visibility !== "hidden" &&
        element.getBoundingClientRect().width > 0 &&
        element.getBoundingClientRect().height > 0;
      const serializeRect = (element) => {
        if (!(element instanceof HTMLElement)) return null;
        const rect = element.getBoundingClientRect();
        return {
          testId: element.getAttribute("data-testid") || "",
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        titleVisible: visible(title),
        searchVisible: visible(search),
        primaryVisible: visible(primaryAction),
        secondaryVisible: visible(secondaryAction),
        primaryHeight: rectHeight(primaryAction),
        secondaryHeight: rectHeight(secondaryAction),
        flowCount: flowElements.length,
        flowGridDisplay:
          flowGrid instanceof HTMLElement
            ? getComputedStyle(flowGrid).display
            : null,
        flowGridOverflowX:
          flowGrid instanceof HTMLElement
            ? getComputedStyle(flowGrid).overflowX
            : null,
        flowGridScrollWidth:
          flowGrid instanceof HTMLElement ? flowGrid.scrollWidth : 0,
        flowGridClientWidth:
          flowGrid instanceof HTMLElement ? flowGrid.clientWidth : 0,
        flowRects: flowElements.map(serializeRect).filter(Boolean),
        metricCount: document.querySelectorAll(
          '[data-testid="premium-metric-card"]',
        ).length,
        quickLinkCount: document.querySelectorAll(
          '[data-testid="premium-quick-link"]',
        ).length,
        dark: root.classList.contains("dark"),
        menuVisible: visible(menu),
        dockVisible: visible(dock),
        sidebarVisible: visible(sidebar),
        sidebarAriaHidden: sidebar?.getAttribute("aria-hidden") ?? null,
      };
    });

    assert.equal(
      contract.viewport.width,
      spec.width,
      `${spec.name}: largura do viewport divergente`,
    );
    assert.ok(
      contract.documentWidth <= spec.width + 1,
      `${spec.name}: overflow horizontal no documento (${contract.documentWidth}px)`,
    );
    assert.ok(
      contract.bodyWidth <= spec.width + 1,
      `${spec.name}: overflow horizontal no body (${contract.bodyWidth}px)`,
    );
    assert.equal(contract.titleVisible, true, `${spec.name}: título invisível`);
    assert.equal(contract.searchVisible, true, `${spec.name}: busca invisível`);
    assert.equal(
      contract.primaryVisible,
      true,
      `${spec.name}: ação primária invisível`,
    );
    assert.equal(
      contract.secondaryVisible,
      true,
      `${spec.name}: ação secundária invisível`,
    );
    assert.ok(
      contract.primaryHeight >= 44,
      `${spec.name}: ação primária menor que 44 px`,
    );
    assert.ok(
      contract.secondaryHeight >= 44,
      `${spec.name}: ação secundária menor que 44 px`,
    );
    assert.equal(contract.flowCount, 5, `${spec.name}: fluxos clínicos alterados`);
    assert.equal(contract.metricCount, 4, `${spec.name}: métricas alteradas`);
    assert.equal(
      contract.quickLinkCount,
      3,
      `${spec.name}: atalhos operacionais alterados`,
    );
    assert.equal(
      contract.dark,
      spec.theme === "dark",
      `${spec.name}: modo ${spec.theme} não aplicado`,
    );

    if (spec.width < 1024) {
      assert.equal(
        contract.menuVisible,
        true,
        `${spec.name}: menu mobile ausente`,
      );
      assert.equal(
        contract.dockVisible,
        true,
        `${spec.name}: dock mobile ausente`,
      );
      assert.equal(
        contract.sidebarAriaHidden,
        "true",
        `${spec.name}: drawer deve iniciar fechado`,
      );
    } else {
      assert.equal(
        contract.menuVisible,
        false,
        `${spec.name}: menu mobile vazou para desktop`,
      );
      assert.equal(
        contract.dockVisible,
        false,
        `${spec.name}: dock mobile vazou para desktop`,
      );
      assert.equal(
        contract.sidebarVisible,
        true,
        `${spec.name}: sidebar desktop ausente`,
      );
    }

    if (spec.width <= 767) {
      assert.equal(
        contract.flowGridDisplay,
        "flex",
        `${spec.name}: rail clínico móvel deve permanecer flex`,
      );
      assert.equal(
        contract.flowGridOverflowX,
        "auto",
        `${spec.name}: rail clínico precisa continuar rolável horizontalmente`,
      );
      assert.ok(
        contract.flowGridScrollWidth > contract.flowGridClientWidth * 2,
        `${spec.name}: rail perdeu a paginação horizontal nativa`,
      );
      assert.equal(
        contract.flowRects.length,
        5,
        `${spec.name}: geometria incompleta dos fluxos móveis`,
      );
      for (const rect of contract.flowRects) {
        assert.ok(
          rect.width >= spec.width * 0.7 && rect.width <= spec.width * 0.86,
          `${spec.name}: ${rect.testId} perdeu proporção de card nativo (${rect.width}px)`,
        );
        assert.ok(
          rect.height >= 160,
          `${spec.name}: ${rect.testId} colapsou verticalmente (${rect.height}px)`,
        );
      }
      assert.ok(
        contract.flowRects[0].left >= -1 &&
          contract.flowRects[0].right <= spec.width + 1,
        `${spec.name}: primeiro fluxo precisa iniciar visível no viewport`,
      );
      for (let i = 0; i < contract.flowRects.length; i += 1) {
        for (let j = i + 1; j < contract.flowRects.length; j += 1) {
          assert.equal(
            rectsOverlap(contract.flowRects[i], contract.flowRects[j]),
            false,
            `${spec.name}: ${contract.flowRects[i].testId} sobrepõe ${contract.flowRects[j].testId}`,
          );
        }
      }
      const railTop = contract.flowRects[0].top;
      for (const rect of contract.flowRects.slice(1)) {
        assert.ok(
          Math.abs(rect.top - railTop) <= 2,
          `${spec.name}: ${rect.testId} saiu do alinhamento horizontal do rail`,
        );
      }
    }

    const fileName = `${spec.name}.png`;
    await page.screenshot({
      path: path.join(outputDir, fileName),
      fullPage: true,
      animations: "disabled",
    });

    manifest.captures.push({
      ...spec,
      file: fileName,
      contract,
    });
    console.log(`[premium-v13-proof] ✓ ${spec.name}`);
  } finally {
    await context.close();
  }
}

try {
  for (const spec of cases) await capture(spec);
  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `[premium-v13-proof] ✓ ${manifest.captures.length} capturas gravadas em ${outputDir}`,
  );
} finally {
  await browser.close();
  await server.close();
}
