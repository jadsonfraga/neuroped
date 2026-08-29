/**
 * Gate geométrico da sidebar premium v16.
 *
 * Valida o rail expandido no desktop e o drawer móvel real, comprovando que os
 * quatro atalhos compactos permanecem legíveis, inteiros e sem overflow. Não
 * interage com dados clínicos nem altera destinos de navegação.
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
  process.env.PREMIUM_SIDEBAR_DIR || "artifacts/premium-v16",
);
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist, 0);
const browser = await chromium.launch();

async function prepare(page) {
  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage)) {
      localStorage.setItem(key, value);
    }
    localStorage.setItem("neuroped:theme", "light");
    localStorage.setItem("neuroped:sidebar-collapsed", "0");
  }, ACCEPTED_FIRST_VISIT_STORAGE);
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
  await page.evaluate(async () => {
    await document.fonts?.ready;
    window.scrollTo(0, 0);
  });
}

function assertTiles(contract, caseName) {
  assert.equal(
    contract.tiles.length,
    4,
    `${caseName}: inventário dos quatro atalhos compactos mudou`,
  );
  assert.ok(
    contract.sidebar.scrollWidth <= contract.sidebar.clientWidth + 1,
    `${caseName}: overflow horizontal dentro da sidebar`,
  );

  for (const tile of contract.tiles) {
    assert.ok(tile.width >= 105, `${caseName}: tile ${tile.testId} estreito`);
    assert.ok(tile.height >= 73, `${caseName}: tile ${tile.testId} baixo`);
    assert.ok(
      tile.labelFontSize >= 10,
      `${caseName}: rótulo ${tile.testId} menor que 10 px`,
    );
    assert.equal(
      tile.labelWhiteSpace,
      "normal",
      `${caseName}: rótulo ${tile.testId} deixou de quebrar por palavras`,
    );
    assert.equal(
      tile.labelLineClamp,
      "3",
      `${caseName}: limite de três linhas removido de ${tile.testId}`,
    );
    assert.ok(
      tile.labelLineRects >= 1 && tile.labelLineRects <= 3,
      `${caseName}: ${tile.testId} ocupa ${tile.labelLineRects} linhas`,
    );
    assert.equal(
      tile.trailingDisplay,
      "none",
      `${caseName}: chevron voltou a disputar largura em ${tile.testId}`,
    );
    assert.ok(
      tile.right <= contract.sidebar.right + 1 &&
        tile.left >= contract.sidebar.left - 1,
      `${caseName}: ${tile.testId} saiu do rail`,
    );
  }
}

async function readContract(page) {
  return page.evaluate(() => {
    const sidebar = document.querySelector(".np-app-sidebar");
    const main = document.querySelector("#main-content");
    const tileElements = Array.from(
      document.querySelectorAll(
        '.np-app-sidebar .grid.grid-cols-2 [data-testid^="featured-"]',
      ),
    );
    const geometry = (element) => {
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    };

    return {
      documentWidth: document.documentElement.scrollWidth,
      sidebar: geometry(sidebar),
      main: geometry(main),
      tiles: tileElements.map((tile) => {
        const rect = tile.getBoundingClientRect();
        const label = tile.querySelector(
          ":scope > span:nth-of-type(2) > span:first-child",
        );
        const trailing = tile.querySelector(":scope > span:last-child");
        const labelStyle =
          label instanceof HTMLElement ? getComputedStyle(label) : null;
        let labelLineRects = 0;
        if (label instanceof HTMLElement) {
          const range = document.createRange();
          range.selectNodeContents(label);
          labelLineRects = Array.from(range.getClientRects()).filter(
            (line) => line.width > 0 && line.height > 0,
          ).length;
        }
        return {
          testId: tile.getAttribute("data-testid") || "",
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          labelFontSize: labelStyle
            ? Number.parseFloat(labelStyle.fontSize)
            : 0,
          labelWhiteSpace: labelStyle?.whiteSpace ?? "",
          labelLineClamp: labelStyle?.webkitLineClamp ?? "",
          labelLineRects,
          trailingDisplay:
            trailing instanceof HTMLElement
              ? getComputedStyle(trailing).display
              : null,
        };
      }),
    };
  });
}

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const desktopPage = await desktopContext.newPage();
  try {
    await prepare(desktopPage);
    const contract = await readContract(desktopPage);
    assert.ok(contract.sidebar && contract.main, "desktop: shell ausente");
    assert.ok(
      contract.documentWidth <= 1441,
      "desktop: overflow horizontal no documento",
    );
    assert.ok(
      contract.sidebar.width >= 279 && contract.sidebar.width <= 281,
      `desktop: largura expandida inesperada (${contract.sidebar.width}px)`,
    );
    assert.ok(
      contract.main.left >= contract.sidebar.right - 1,
      "desktop: conteúdo principal invadiu a sidebar",
    );
    assertTiles(contract, "desktop");
    await desktopPage.screenshot({
      path: path.join(outputDir, "sidebar-desktop-1440x1000.png"),
      fullPage: true,
      animations: "disabled",
    });
    console.log("[premium-sidebar-v16] ✓ desktop");
  } finally {
    await desktopContext.close();
  }

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const mobilePage = await mobileContext.newPage();
  try {
    await prepare(mobilePage);
    await mobilePage.getByTestId("button-mobile-menu").click();
    await mobilePage
      .locator('.np-app-sidebar[aria-hidden="false"], .np-app-sidebar:not([aria-hidden])')
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
    const contract = await readContract(mobilePage);
    assert.ok(contract.sidebar, "mobile: drawer ausente");
    assert.ok(
      contract.documentWidth <= 391,
      "mobile: overflow horizontal no documento",
    );
    assert.ok(
      contract.sidebar.width >= 255 && contract.sidebar.width <= 257,
      `mobile: largura do drawer inesperada (${contract.sidebar.width}px)`,
    );
    assertTiles(contract, "mobile");
    await mobilePage.screenshot({
      path: path.join(outputDir, "sidebar-mobile-drawer-390x844.png"),
      fullPage: false,
      animations: "disabled",
    });
    console.log("[premium-sidebar-v16] ✓ mobile drawer");
  } finally {
    await mobileContext.close();
  }
} finally {
  await browser.close();
  await server.close();
}
