/**
 * Diagnóstico e trava focada de contraste do NeuroAcompanhamento.
 *
 * O gate integral já percorre a navegação completa; esta sentinela mantém o
 * alvo e o HTML mínimo no log quando uma regressão reaparece, reduzindo o risco
 * de correções por tentativa e erro.
 */
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
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

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  await context.addInitScript((values) => {
    for (const [key, value] of Object.entries(values)) {
      localStorage.setItem(key, value);
    }
    localStorage.setItem("neuroped:theme", "light");
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();

  try {
    await page.goto(`${server.origin}/#/neuroacompanhamento`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page
      .getByTestId("splash-screen")
      .waitFor({ state: "detached", timeout: 15000 });
    await page
      .getByTestId("neuroacompanhamento-page")
      .waitFor({ state: "visible", timeout: 20000 });
    await page.evaluate(async () => {
      await document.fonts?.ready;
      window.scrollTo(0, 0);
    });

    const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
    const relevant = results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    );

    for (const violation of relevant) {
      console.error(
        `[premium-neuro-a11y] ${violation.id} (${violation.impact}) — ${violation.help}`,
      );
      for (const node of violation.nodes) {
        console.error(
          JSON.stringify(
            {
              target: node.target,
              html: node.html,
              failureSummary: node.failureSummary,
            },
            null,
            2,
          ),
        );
      }
    }

    assert.equal(
      relevant.length,
      0,
      `NeuroAcompanhamento contém ${relevant.length} violação(ões) serious/critical`,
    );
    console.log("[premium-neuro-a11y] ✓ sem violações serious/critical.");
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
