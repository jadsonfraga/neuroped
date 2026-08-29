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

      await page.getByTestId("input-search").fill("mchat");

      const contract = await page.evaluate(() => {
        const hero = document.querySelector('[data-testid="premium-hero"]');
        const grid = hero?.querySelector(".np-v13-hero-grid");
        const copy = hero?.querySelector(".np-v13-hero-copy");
        const panel = hero?.querySelector(".np-v13-control-panel");
        const clear = hero?.querySelector(".np-v13-search button");
        const metricHeading = document.querySelector(".np-v13-metric-heading p");
        const metricDetail = document.querySelector(".np-v13-metric-detail");
        const rail = document.querySelector('[data-testid="premium-flow-grid"]');
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
          coarse: matchMedia("(any-pointer: coarse)").matches,
          documentWidth: document.documentElement.scrollWidth,
          grid: rect(grid),
          copy: rect(copy),
          panel: rect(panel),
          clear: rect(clear),
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

      assert.equal(contract.coarse, true, `${spec.name}: any-pointer coarse não ativou`);
      assert.ok(
        contract.documentWidth <= spec.width + 1,
        `${spec.name}: overflow horizontal no documento`,
      );
      assert.ok(contract.grid && contract.copy && contract.panel && contract.clear);
      assert.ok(
        contract.panel.top >= contract.copy.bottom - 1,
        `${spec.name}: painel sobrepôs conteúdo com cascade coarse ativa`,
      );
      assert.ok(
        contract.clear.width >= 44 && contract.clear.height >= 44,
        `${spec.name}: botão limpar busca menor que 44 px`,
      );

      if (spec.width <= 767) {
        assert.ok(
          contract.metricHeadingSize >= 11,
          `${spec.name}: rótulo de métrica ilegível (${contract.metricHeadingSize}px)`,
        );
        assert.ok(
          contract.metricDetailSize >= 11,
          `${spec.name}: detalhe de métrica ilegível (${contract.metricDetailSize}px)`,
        );
        assert.equal(contract.railDisplay, "flex", `${spec.name}: rail deixou de ser flex`);
        assert.equal(contract.railOverflow, "auto", `${spec.name}: rail deixou de rolar`);
        assert.ok(
          contract.railScrollWidth > contract.railClientWidth * 2,
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
