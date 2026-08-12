/**
 * Gate do shell responsivo em tablets.
 *
 * Exercita os limites reais do drawer/dock e garante que as regras de tela não
 * vazem para impressão. Este teste é deliberadamente curto e roda no mesmo
 * Chromium já instalado pelo workflow de auditoria.
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
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const browser = await chromium.launch(
  executablePath
    ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] }
    : undefined,
);

async function openShell(width) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  await page.goto(`${server.origin}/#/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 15000 });
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(
    (desktop) => window.matchMedia("(min-width: 768px)").matches === desktop,
    width >= 768,
  );
  return { context, page };
}

async function verifyTablet(width) {
  const { context, page } = await openShell(width);
  try {
    const menu = page.getByTestId("button-mobile-menu");
    const dock = page.getByTestId("mobile-primary-dock");
    const sidebar = page.locator('aside[aria-label="Menu de navegação"]');
    const main = page.locator("#main-content");

    await menu.waitFor({ state: "visible" });
    await dock.waitFor({ state: "visible" });
    assert.equal(await sidebar.getAttribute("aria-hidden"), "true", `${width}px deve iniciar com drawer fechado`);

    await menu.click();
    await page.waitForFunction(() => document.body.classList.contains("np-mobile-drawer-open"));
    await sidebar.waitFor({ state: "visible" });
    assert.equal(await menu.getAttribute("aria-expanded"), "true", `${width}px deve anunciar drawer aberto`);
    assert.equal(await sidebar.getAttribute("aria-modal"), "true", `${width}px deve anunciar modal`);
    assert.equal(await main.getAttribute("inert"), "", `${width}px deve inertizar o conteúdo`);
    assert.equal(await dock.isVisible(), false, `${width}px deve ocultar o dock atrás do modal`);
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("data-testid") === "button-mobile-close",
    );

    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.body.classList.contains("np-mobile-drawer-open"));
    assert.equal(await menu.getAttribute("aria-expanded"), "false", `${width}px deve anunciar drawer fechado`);
    assert.equal(await main.getAttribute("inert"), null, `${width}px deve liberar o conteúdo`);
    await dock.waitFor({ state: "visible" });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("data-testid") === "button-mobile-menu",
    );
    console.log(`[responsive-shell] ✓ ${width}px: drawer, dock, foco e Escape`);
  } finally {
    await context.close();
  }
}

async function verifyDesktopBoundary(width = 1024) {
  const { context, page } = await openShell(width);
  try {
    const menu = page.getByTestId("button-mobile-menu");
    const dock = page.getByTestId("mobile-primary-dock");
    const sidebar = page.locator('aside[aria-label="Menu de navegação"]');

    assert.equal(await menu.isVisible(), false, `${width}px deve usar shell com sidebar fixa`);
    assert.equal(await dock.isVisible(), false, `${width}px não deve exibir dock mobile`);
    assert.equal(await sidebar.isVisible(), true, `${width}px deve exibir sidebar fixa`);
    assert.equal(await sidebar.getAttribute("aria-hidden"), null, "sidebar desktop não pode ficar oculta");
    console.log(`[responsive-shell] ✓ ${width}px: sidebar fixa presente`);
  } finally {
    await context.close();
  }
}

async function verifyPrintIsolation() {
  // Impressão testada num viewport de CELULAR (o único que ainda usa o shell
  // mobile depois que a sidebar fixa voltou a valer a partir de 768px).
  const { context, page } = await openShell(640);
  try {
    await page.emulateMedia({ media: "print" });
    const styles = await page.evaluate(() => {
      const main = document.querySelector("#main-content");
      const header = document.querySelector("header");
      const dock = document.querySelector('[data-testid="mobile-primary-dock"]');
      if (!(main instanceof HTMLElement) || !(header instanceof HTMLElement) || !(dock instanceof HTMLElement)) {
        throw new Error("shell incompleto durante teste de impressão");
      }
      return {
        mainPaddingTop: Number.parseFloat(getComputedStyle(main).paddingTop) || 0,
        bodyPaddingBottom: Number.parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
        headerDisplay: getComputedStyle(header).display,
        dockDisplay: getComputedStyle(dock).display,
      };
    });

    assert.ok(styles.mainPaddingTop <= 1, `impressão não pode herdar topo mobile: ${styles.mainPaddingTop}px`);
    assert.ok(styles.bodyPaddingBottom <= 1, `impressão não pode herdar rodapé mobile: ${styles.bodyPaddingBottom}px`);
    assert.equal(styles.headerDisplay, "none", "header mobile deve ficar fora da impressão");
    assert.equal(styles.dockDisplay, "none", "dock mobile deve ficar fora da impressão");
    console.log("[responsive-shell] ✓ impressão: sem espaços fantasmas do shell mobile");
  } finally {
    await context.close();
  }
}

try {
  // Contrato 2026-08-12 (pedido do Dr. Jadson): sidebar FIXA a partir de 768px
  // — iPad retrato (834) e paisagem voltam a ter sidebar; drawer+dock só no
  // celular (<768px).
  for (const width of [390, 640, 767]) await verifyTablet(width);
  for (const width of [768, 834, 1024]) await verifyDesktopBoundary(width);
  await verifyPrintIsolation();
  console.log("[responsive-shell] ✓ contrato responsivo aprovado.");
} finally {
  await browser.close();
  await server.close();
}
