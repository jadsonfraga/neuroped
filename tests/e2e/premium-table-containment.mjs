/**
 * Gate real de contenção para tabelas clínicas aninhadas em cards.
 *
 * Usa a tabela comparativa da rota /pac em um contexto touch/coarse de 390 px
 * para provar que o wrapper é dimensionado pelo pai, mantém scroll próprio e
 * não cria corte inacessível nem overflow no documento.
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
fs.rmSync(path.resolve(repoRoot, "dist/public"), {
  recursive: true,
  force: true,
});
const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist, 0);
const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
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
    await page.goto(`${server.origin}/#/pac`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page
      .getByTestId("splash-screen")
      .waitFor({ state: "detached", timeout: 15000 })
      .catch(() => {});
    await page.locator(".np-app-content table").first().waitFor({
      state: "visible",
      timeout: 25000,
    });
    await page.evaluate(async () => {
      await document.fonts?.ready;
      window.scrollTo(0, 0);
    });

    const contract = await page.evaluate(() => {
      const table = document.querySelector(".np-app-content table");
      const wrapper = table?.parentElement;
      const parent = wrapper?.parentElement;
      const card = table?.closest(".shadcn-card");
      const rect = (element) => {
        if (!(element instanceof HTMLElement)) return null;
        const box = element.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          width: box.width,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          overflowX: getComputedStyle(element).overflowX,
          maxWidth: getComputedStyle(element).maxWidth,
          minWidth: getComputedStyle(element).minWidth,
        };
      };
      return {
        workspace: document.documentElement.dataset.npWorkspace,
        route: document.documentElement.dataset.npRoute,
        coarse: matchMedia("(any-pointer: coarse)").matches,
        documentWidth: document.documentElement.scrollWidth,
        table: rect(table),
        wrapper: rect(wrapper),
        parent: rect(parent),
        card: rect(card),
      };
    });

    assert.equal(contract.workspace, "clinical", "PAC deixou o workspace clínico");
    assert.equal(contract.route, "pac", "Token visual da rota PAC divergente");
    assert.equal(contract.coarse, true, "Contexto touch/coarse não foi ativado");
    assert.ok(contract.table && contract.wrapper && contract.parent && contract.card);
    assert.ok(
      contract.documentWidth <= 391,
      `Tabela criou overflow no documento (${contract.documentWidth}px)`,
    );
    assert.ok(
      contract.wrapper.clientWidth <= contract.parent.clientWidth + 1,
      `Wrapper (${contract.wrapper.clientWidth}px) excedeu o pai (${contract.parent.clientWidth}px)`,
    );
    assert.ok(
      contract.wrapper.width <= contract.parent.width + 1,
      "Wrapper foi dimensionado pelo viewport em vez do contêiner",
    );
    assert.equal(
      contract.wrapper.overflowX,
      "auto",
      "Tabela aninhada perdeu o scroll horizontal próprio",
    );
    assert.ok(
      contract.wrapper.scrollWidth >= contract.wrapper.clientWidth,
      "Geometria de scroll da tabela ficou inválida",
    );
    assert.ok(
      contract.wrapper.left >= contract.card.left - 8 &&
        contract.wrapper.right <= contract.card.right + 8,
      "Wrapper saiu visualmente do card e pode ser cortado pelo shell",
    );

    console.log(
      "[premium-table-containment] ✓ tabela PAC dimensionada pelo contêiner em touch/coarse.",
    );
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
