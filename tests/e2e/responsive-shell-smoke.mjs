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
    (desktop) => window.matchMedia("(min-width: 1024px)").matches === desktop,
    width >= 1024,
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
  // Impressão testada em viewport do shell compacto; celular e tablet usam
  // drawer+dock até 1023px e a impressão não pode herdar esses espaços.
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

async function verifyTouchPerformanceProfile(width = 1280) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);

  try {
    await page.goto(`${server.origin}/#/filtro`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 15000 });
    await page.locator(".container-filtro").waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "TDAH · 6–12 anos", exact: true }).click();
    await page.locator(".filter-260-card").first().waitFor({ state: "visible", timeout: 15000 });

    const contract = await page.evaluate(() => {
      const root = document.querySelector("#root");
      const sidebar = document.querySelector('aside[aria-label="Menu de navegação"]');
      const wrapper = document.querySelector(".container-filtro");
      const grid = document.querySelector(".filter-260-grid");
      const card = document.querySelector(".filter-260-card");
      const scroller = document.querySelector(".container-filtro .overflow-x-auto");
      const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "";

      if (
        !(root instanceof HTMLElement) ||
        !(sidebar instanceof HTMLElement) ||
        !(wrapper instanceof HTMLElement) ||
        !(grid instanceof HTMLElement) ||
        !(card instanceof HTMLElement) ||
        !(scroller instanceof HTMLElement)
      ) {
        throw new Error("Filtro incompleto durante o teste touch");
      }

      // Torna o overflow determinístico inclusive em viewports largos/DeX.
      scroller.style.width = "280px";
      scroller.style.maxWidth = "280px";
      const beforeHorizontal = scroller.scrollLeft;
      scroller.scrollLeft = Math.min(120, scroller.scrollWidth - scroller.clientWidth);
      const horizontalDelta = scroller.scrollLeft - beforeHorizontal;
      scroller.scrollLeft = beforeHorizontal;

      const beforeVertical = window.scrollY;
      const verticalTarget = Math.min(
        600,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      window.scrollTo(0, verticalTarget);
      const verticalDelta = window.scrollY - beforeVertical;
      window.scrollTo(0, beforeVertical);

      const sidebarStyle = getComputedStyle(sidebar);
      return {
        anyCoarse: window.matchMedia("(any-pointer: coarse)").matches,
        profileMatches: window.matchMedia(
          "(any-pointer: coarse) and (min-width: 768px) and (max-width: 1366px)",
        ).matches,
        bodyBackgroundAttachment: getComputedStyle(document.body).backgroundAttachment,
        rootBeforeDisplay: getComputedStyle(root, "::before").display,
        rootAfterDisplay: getComputedStyle(root, "::after").display,
        sidebarBackdrop:
          sidebarStyle.backdropFilter ||
          sidebarStyle.getPropertyValue("-webkit-backdrop-filter"),
        wrapperTouchAction: getComputedStyle(wrapper).touchAction,
        gridTouchAction: getComputedStyle(grid).touchAction,
        cardTouchAction: getComputedStyle(card).touchAction,
        scrollerTouchAction: getComputedStyle(scroller).touchAction,
        scrollerOverflowX: getComputedStyle(scroller).overflowX,
        horizontalDelta,
        verticalDelta,
        viewport,
      };
    });

    assert.equal(contract.anyCoarse, true, "Chromium deve expor capacidade touch coarse");
    assert.equal(
      contract.profileMatches,
      true,
      `${width}px touch deve ativar o perfil ampliado até 1366px`,
    );
    assert.ok(
      contract.bodyBackgroundAttachment
        .split(",")
        .every((attachment) => attachment.trim() === "scroll"),
      `tablet touch não pode manter background fixed: ${contract.bodyBackgroundAttachment}`,
    );
    assert.equal(contract.rootBeforeDisplay, "none", "glow fixo ::before deve ser removido");
    assert.equal(contract.rootAfterDisplay, "none", "glow fixo ::after deve ser removido");
    assert.equal(contract.sidebarBackdrop, "none", "blur do shell deve ser removido");
    assert.match(contract.cardTouchAction, /pan-y/, "card deve priorizar pan vertical");
    assert.match(contract.cardTouchAction, /pinch-zoom/, "card deve preservar pinch-zoom");
    assert.match(
      contract.wrapperTouchAction,
      /^(auto|manipulation|.*pan-x.*)$/,
      "wrapper não pode bloquear pan horizontal descendente",
    );
    assert.match(
      contract.gridTouchAction,
      /^(auto|manipulation|.*pan-x.*)$/,
      "grid não pode bloquear pan horizontal descendente",
    );
    assert.match(
      contract.scrollerTouchAction,
      /^(auto|manipulation|.*pan-x.*)$/,
      "scroller deve aceitar gesto horizontal",
    );
    assert.equal(contract.scrollerOverflowX, "auto", "linha do filtro deve manter overflow-x");
    assert.ok(contract.horizontalDelta > 0, "linha do filtro deve continuar rolável na horizontal");
    assert.ok(contract.verticalDelta > 0, "página do filtro deve continuar rolável na vertical");
    assert.doesNotMatch(
      contract.viewport,
      /maximum-scale\s*=|user-scalable\s*=\s*(?:no|0)/i,
      "viewport não pode bloquear zoom manual",
    );
    console.log(
      `[responsive-shell] ✓ ${width}px touch: perfil leve, pan vertical/horizontal e zoom preservados`,
    );
  } finally {
    await context.close();
  }
}

try {
  // Contrato visual 9,9: shell compacto em celular/tablet até 1023px; a
  // sidebar fixa começa em 1024px. Os dois lados da fronteira são testados.
  for (const width of [390, 640, 767, 768, 834, 1023]) await verifyTablet(width);
  for (const width of [1024, 1280]) await verifyDesktopBoundary(width);
  await verifyTouchPerformanceProfile();
  await verifyPrintIsolation();
  console.log("[responsive-shell] ✓ contrato responsivo aprovado.");
} finally {
  await browser.close();
  await server.close();
}
