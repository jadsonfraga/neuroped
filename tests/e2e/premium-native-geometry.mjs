/**
 * Gate geométrico do acabamento native-app.
 * Impede que regras desktop reabram duas colunas e sobreponham o painel
 * operacional em iPhone/iPad. Mede o DOM real em Chromium.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  ensureClientBuild,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";

const repoRoot = process.cwd();
const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist, 0);
const browser = await chromium.launch();

const cases = [
  { name: "iphone", width: 390, height: 844 },
  { name: "ipad-portrait", width: 1024, height: 1366 },
];

try {
  for (const spec of cases) {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.addInitScript((storage) => {
      for (const [key, value] of Object.entries(storage)) {
        localStorage.setItem(key, value);
      }
      localStorage.setItem("neuroped:theme", "light");
    }, ACCEPTED_FIRST_VISIT_STORAGE);

    try {
      await page.goto(`${server.origin}/#/`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page
        .getByTestId("premium-home-v13")
        .waitFor({ state: "visible", timeout: 20000 });
      await page.evaluate(async () => {
        await document.fonts?.ready;
        window.scrollTo(0, 0);
      });

      const geometry = await page.evaluate(() => {
        const hero = document.querySelector('[data-testid="premium-hero"]');
        const grid = hero?.querySelector(".np-v13-hero-grid");
        const copy = hero?.querySelector(".np-v13-hero-copy");
        const panel = hero?.querySelector(".np-v13-control-panel");
        const rect = (el) => {
          if (!(el instanceof HTMLElement)) return null;
          const r = el.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        return {
          hero: rect(hero),
          grid: rect(grid),
          copy: rect(copy),
          panel: rect(panel),
          gridColumns:
            grid instanceof HTMLElement
              ? getComputedStyle(grid).gridTemplateColumns
              : "",
          documentWidth: document.documentElement.scrollWidth,
        };
      });

      assert.ok(geometry.hero && geometry.grid && geometry.copy && geometry.panel);
      assert.ok(
        geometry.documentWidth <= spec.width + 1,
        `${spec.name}: documento excedeu viewport`,
      );
      assert.ok(
        geometry.panel.top >= geometry.copy.bottom - 1,
        `${spec.name}: painel operacional sobrepôs o hero copy`,
      );
      assert.ok(
        geometry.panel.left >= geometry.grid.left - 1 &&
          geometry.panel.right <= geometry.grid.right + 1,
        `${spec.name}: painel saiu da coluna do hero`,
      );
      assert.ok(
        geometry.panel.width >= geometry.grid.width * 0.9,
        `${spec.name}: painel não ocupa a largura de app esperada`,
      );
      assert.ok(
        geometry.copy.width >= geometry.grid.width * 0.9,
        `${spec.name}: conteúdo principal ficou estreito como coluna de site`,
      );

      console.log(`[premium-native-geometry] ✓ ${spec.name}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
