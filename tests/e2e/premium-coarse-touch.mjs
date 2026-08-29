/**
 * Gate específico para dispositivos touch/coarse.
 *
 * Exercita a última camada `tablet-coarse-perf.css`, que só participa quando
 * `(any-pointer: coarse)` é verdadeiro. Protege geometria, touch targets,
 * legibilidade das métricas e o rail clínico móvel.
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
  { name: "phone-coarse", width: 390, height: 844 },
  { name: "tablet-coarse", width: 1024, height: 1366 },
];

try {
  for (const spec of cases) {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      hasTouch: true,
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

      // Estado 1: busca ativa. Serve exclusivamente para medir o alvo touch do
      // botão limpar; a busca substitui deliberadamente os fluxos por resultados.
      await page.getByTestId("input-search").fill("mchat");
      const searchState = await page.evaluate(() => {
        const hero = document.querySelector('[data-testid="premium-hero"]');
        const grid = hero?.querySelector(".np-v13-hero-grid");
        const copy = hero?.querySelector(".np-v13-hero-copy");
        const panel = hero?.querySelector(".np-v13-control-panel");
        const clear = hero?.querySelector(".np-v13-search button");
        const serialize = (el) => {
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
          coarse: matchMedia("(any-pointer: coarse)").matches,
          documentWidth: document.documentElement.scrollWidth,
          grid: serialize(grid),
          copy: serialize(copy),
          panel: serialize(panel),
          clear: serialize(clear),
        };
      });

      assert.equal(
        searchState.coarse,
        true,
        `${spec.name}: any-pointer coarse não ativou`,
      );
      assert.ok(
        searchState.documentWidth <= spec.width + 1,
        `${spec.name}: overflow horizontal no documento durante busca`,
      );
      assert.ok(
        searchState.grid &&
          searchState.copy &&
          searchState.panel &&
          searchState.clear,
      );
      assert.ok(
        searchState.panel.top >= searchState.copy.bottom - 1,
        `${spec.name}: painel sobrepôs conteúdo com cascade coarse ativa`,
      );
      assert.ok(
        searchState.clear.width >= 44 && searchState.clear.height >= 44,
        `${spec.name}: botão limpar busca menor que 44 px`,
      );

      // Estado 2: dashboard operacional. Após limpar a busca, os cinco fluxos e
      // métricas reaparecem; só então validamos rail, legibilidade e scroll.
      await page.getByTestId("input-search").fill("");
      await page
        .getByTestId("premium-flow-grid")
        .waitFor({ state: "visible", timeout: 10000 });

      const dashboardState = await page.evaluate(() => {
        const metricHeading = document.querySelector(
          ".np-v13-metric-heading p",
        );
        const metricDetail = document.querySelector(".np-v13-metric-detail");
        const rail = document.querySelector(
          '[data-testid="premium-flow-grid"]',
        );
        return {
          documentWidth: document.documentElement.scrollWidth,
          metricHeadingSize:
            metricHeading instanceof HTMLElement
              ? Number.parseFloat(getComputedStyle(metricHeading).fontSize)
              : 0,
          metricDetailSize:
            metricDetail instanceof HTMLElement
              ? Number.parseFloat(getComputedStyle(metricDetail).fontSize)
              : 0,
          railDisplay:
            rail instanceof HTMLElement ? getComputedStyle(rail).display : null,
          railOverflow:
            rail instanceof HTMLElement ? getComputedStyle(rail).overflowX : null,
          railScrollWidth: rail instanceof HTMLElement ? rail.scrollWidth : 0,
          railClientWidth: rail instanceof HTMLElement ? rail.clientWidth : 0,
        };
      });

      assert.ok(
        dashboardState.documentWidth <= spec.width + 1,
        `${spec.name}: overflow horizontal no dashboard`,
      );

      if (spec.width <= 767) {
        assert.ok(
          dashboardState.metricHeadingSize >= 11,
          `${spec.name}: rótulo de métrica ilegível (${dashboardState.metricHeadingSize}px)`,
        );
        assert.ok(
          dashboardState.metricDetailSize >= 11,
          `${spec.name}: detalhe de métrica ilegível (${dashboardState.metricDetailSize}px)`,
        );
        assert.equal(
          dashboardState.railDisplay,
          "flex",
          `${spec.name}: rail deixou de ser flex`,
        );
        assert.equal(
          dashboardState.railOverflow,
          "auto",
          `${spec.name}: rail deixou de rolar`,
        );
        assert.ok(
          dashboardState.railScrollWidth > dashboardState.railClientWidth * 2,
          `${spec.name}: rail não preserva os cinco fluxos navegáveis`,
        );
      }

      console.log(`[premium-coarse-touch] ✓ ${spec.name}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
