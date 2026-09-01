/**
 * Gate P0 de continuidade da rolagem.
 *
 * Usa o scroller real do documento e entradas nativas (touch via CDP e wheel),
 * cobre o primeiro gesto após uma trava órfã e prova que overlays legítimos
 * mantêm ownership sem restaurar o lock de outro componente.
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

const VIEWPORT_HEIGHT = 900;
const WIDTHS = [390, 767, 768, 834, 1280, 1366];

function touchPoint(x, y) {
  return {
    x: Math.round(x),
    y: Math.round(y),
    radiusX: 3,
    radiusY: 3,
    force: 1,
    id: 1,
  };
}

async function settleFrames(page, count = 4) {
  await page.evaluate(async (frames) => {
    for (let index = 0; index < frames; index += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }, count);
}

async function rootState(page) {
  return page.evaluate(() => {
    const root = document.scrollingElement;
    if (!(root instanceof HTMLElement))
      throw new Error("document.scrollingElement ausente");
    return {
      top: root.scrollTop,
      max: root.scrollHeight - root.clientHeight,
      tag: root.tagName,
      overscrollY: getComputedStyle(document.documentElement)
        .overscrollBehaviorY,
    };
  });
}

async function resetRoot(page) {
  await page.evaluate(() => {
    const root = document.scrollingElement;
    if (!(root instanceof HTMLElement))
      throw new Error("document.scrollingElement ausente");
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.scrollBehavior = "auto";
    root.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => (document.scrollingElement?.scrollTop ?? -1) <= 1,
  );
  await settleFrames(page);
}

async function realWheel(page, deltaY = 480) {
  const before = (await rootState(page)).top;
  const viewport = page.viewportSize();
  assert.ok(viewport, "viewport ausente");
  await page.mouse.move(
    Math.floor(viewport.width / 2),
    Math.floor(viewport.height / 2),
  );
  await page.mouse.wheel(0, deltaY);
  await page.waitForFunction(
    (start) => (document.scrollingElement?.scrollTop ?? 0) > start + 20,
    before,
    { timeout: 3000 },
  );
  return { before, after: (await rootState(page)).top };
}

async function assertWheelBlocked(page, label) {
  const before = (await rootState(page)).top;
  await page.mouse.wheel(0, 480);
  await settleFrames(page, 6);
  const after = (await rootState(page)).top;
  assert.ok(
    after <= before + 2,
    `${label}: lock injetado não bloqueou wheel (${before} -> ${after})`,
  );
}

async function beginTouch(session, x, y) {
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(x, y)],
  });
}

async function continueTouch(page, session, from, to, steps = 6) {
  for (let index = 1; index <= steps; index += 1) {
    const ratio = index / steps;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        touchPoint(
          from.x + (to.x - from.x) * ratio,
          from.y + (to.y - from.y) * ratio,
        ),
      ],
    });
    await settleFrames(page, 1);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}

async function endTouch(session) {
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}

async function swipeLocator(page, session, locator, deltaX, deltaY) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(box && viewport, "alvo touch sem geometria");
  const start = {
    x: Math.max(12, Math.min(box.x + box.width * 0.72, viewport.width - 12)),
    y: Math.max(80, Math.min(box.y + box.height * 0.68, viewport.height - 80)),
  };
  const end = {
    x: Math.max(12, Math.min(start.x + deltaX, viewport.width - 12)),
    y: Math.max(50, Math.min(start.y + deltaY, viewport.height - 50)),
  };
  await beginTouch(session, start.x, start.y);
  await continueTouch(page, session, start, end);
}

async function injectOrphanedLock(page) {
  await page.evaluate(() => {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overflowY = "hidden";
    document.documentElement.setAttribute("data-scroll-locked", "1");
    document.body.style.overflow = "hidden";
    document.body.style.overflowY = "hidden";
    document.body.style.pointerEvents = "none";
    document.body.setAttribute("data-scroll-locked", "1");
  });
}

async function readLock(page) {
  return page.evaluate(() => ({
    rootOverflow: document.documentElement.style.overflow,
    rootOverflowY: document.documentElement.style.overflowY,
    rootPointerEvents: document.documentElement.style.pointerEvents,
    rootComputedOverflowY: getComputedStyle(document.documentElement).overflowY,
    rootDataLocked: document.documentElement.hasAttribute("data-scroll-locked"),
    rootDrawerOwner: document.documentElement.classList.contains(
      "np-mobile-drawer-open",
    ),
    rootLegalOwner:
      document.documentElement.classList.contains("np-legal-gate-open"),
    overflow: document.body.style.overflow,
    overflowY: document.body.style.overflowY,
    pointerEvents: document.body.style.pointerEvents,
    computedOverflowY: getComputedStyle(document.body).overflowY,
    dataLocked: document.body.hasAttribute("data-scroll-locked"),
    drawerOwner: document.body.classList.contains("np-mobile-drawer-open"),
    legalOwner: document.body.classList.contains("np-legal-gate-open"),
  }));
}

function assertUnlocked(lock, label) {
  assert.equal(
    lock.rootOverflow,
    "",
    `${label}: overflow inline do root permaneceu`,
  );
  assert.equal(
    lock.rootOverflowY,
    "",
    `${label}: overflow-y inline do root permaneceu`,
  );
  assert.equal(
    lock.rootPointerEvents,
    "",
    `${label}: pointer-events do root permaneceu`,
  );
  assert.equal(
    lock.rootDataLocked,
    false,
    `${label}: data-scroll-locked do root permaneceu`,
  );
  assert.notEqual(
    lock.rootComputedOverflowY,
    "hidden",
    `${label}: scroller raiz continuou travado`,
  );
  assert.equal(lock.overflow, "", `${label}: overflow inline permaneceu`);
  assert.equal(lock.overflowY, "", `${label}: overflow-y inline permaneceu`);
  assert.equal(lock.pointerEvents, "", `${label}: pointer-events permaneceu`);
  assert.equal(
    lock.dataLocked,
    false,
    `${label}: data-scroll-locked permaneceu`,
  );
  assert.notEqual(
    lock.computedOverflowY,
    "hidden",
    `${label}: body continuou travado`,
  );
  assert.equal(
    lock.rootDrawerOwner,
    false,
    `${label}: classe raiz órfã do drawer permaneceu`,
  );
  assert.equal(
    lock.rootLegalOwner,
    false,
    `${label}: classe raiz órfã do aviso permaneceu`,
  );
  assert.equal(
    lock.drawerOwner,
    false,
    `${label}: classe órfã do drawer permaneceu`,
  );
  assert.equal(
    lock.legalOwner,
    false,
    `${label}: classe órfã do aviso permaneceu`,
  );
}

async function openFilter(width, selectQuickStart = true) {
  const context = await browser.newContext({
    viewport: { width, height: VIEWPORT_HEIGHT },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage))
      localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  await page.goto(`${server.origin}/#/filtro`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByTestId("splash-screen")
    .waitFor({ state: "detached", timeout: 15000 });
  await page
    .locator("#main-content")
    .waitFor({ state: "visible", timeout: 15000 });
  const filterOpenButton = page.getByTestId("button-open-filter");
  await filterOpenButton.waitFor({ state: "visible", timeout: 15000 });
  await filterOpenButton.click();
  if (selectQuickStart) {
    await page
      .getByRole("button", { name: "TDAH · 6–12 anos", exact: true })
      .click();
    await page
      .locator(".filter-260-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  }
  await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!(main instanceof HTMLElement))
      throw new Error("#main-content ausente");
    const sentinel = document.createElement("div");
    sentinel.setAttribute("data-testid", "scroll-sentinel");
    sentinel.style.height = "2400px";
    sentinel.style.pointerEvents = "none";
    main.append(sentinel);
  });
  await settleFrames(page);
  return { context, page };
}

async function proveNativeScroll(width) {
  const { context, page } = await openFilter(width);
  const session = await context.newCDPSession(page);
  try {
    const initial = await rootState(page);
    assert.equal(
      initial.tag,
      "HTML",
      `${width}px: scroller raiz deve ser HTML`,
    );
    assert.ok(
      initial.max > 1200,
      `${width}px: página sem overflow vertical suficiente (${initial.max})`,
    );
    assert.equal(
      initial.overscrollY,
      "contain",
      `${width}px: overscroll deve estar no scroller raiz`,
    );

    await resetRoot(page);
    await realWheel(page);
    await resetRoot(page);

    const card = page.locator(".filter-260-card").first();
    await card.scrollIntoViewIfNeeded();
    const beforeTouch = (await rootState(page)).top;
    await swipeLocator(page, session, card, 0, -260);
    await page.waitForFunction(
      (start) => (document.scrollingElement?.scrollTop ?? 0) > start + 20,
      beforeTouch,
      { timeout: 3000 },
    );

    const scroller = page.locator(".container-filtro .overflow-x-auto").first();
    await scroller.evaluate((element) => {
      element.style.width = "240px";
      element.style.maxWidth = "240px";
      element.scrollLeft = 0;
    });
    const horizontalContract = await scroller.evaluate((element) => {
      const actions = [];
      let current = element;
      while (current instanceof HTMLElement) {
        actions.push({
          tag: current.tagName,
          className: current.className,
          value: getComputedStyle(current).touchAction,
        });
        if (current.classList.contains("container-filtro")) break;
        current = current.parentElement;
      }
      return {
        max: element.scrollWidth - element.clientWidth,
        overflowX: getComputedStyle(element).overflowX,
        actions,
      };
    });
    assert.ok(
      horizontalContract.max > 40,
      `${width}px: scroller horizontal sem overflow`,
    );
    assert.equal(
      horizontalContract.overflowX,
      "auto",
      `${width}px: overflow-x deixou de ser auto`,
    );
    for (const action of horizontalContract.actions) {
      assert.match(
        action.value,
        /^(auto|manipulation|.*pan-x.*)$/,
        `${width}px: ancestral bloqueia pan-x (${action.tag}.${action.className}: ${action.value})`,
      );
    }
    await swipeLocator(page, session, scroller, -170, 0);
    await page.waitForFunction(
      () => {
        const element = document.querySelector(
          ".container-filtro .overflow-x-auto",
        );
        return element instanceof HTMLElement && element.scrollLeft > 20;
      },
      undefined,
      { timeout: 3000 },
    );

    await resetRoot(page);
    await injectOrphanedLock(page);
    await assertWheelBlocked(page, `${width}px`);
    const viewport = page.viewportSize();
    assert.ok(viewport, "viewport ausente");
    const start = {
      x: Math.round(viewport.width / 2),
      y: Math.min(650, viewport.height - 100),
    };
    const end = { x: start.x, y: Math.max(120, start.y - 360) };
    await beginTouch(session, start.x, start.y);
    assertUnlocked(await readLock(page), `${width}px primeiro contato`);
    const beforeRecovery = (await rootState(page)).top;
    await continueTouch(page, session, start, end);
    await page.waitForFunction(
      (startTop) => (document.scrollingElement?.scrollTop ?? 0) > startTop + 20,
      beforeRecovery,
      { timeout: 3000 },
    );

    console.log(
      `[scroll-continuity] ✓ ${width}px: wheel, touch, pan-x e recuperação no primeiro gesto`,
    );
  } finally {
    await session.detach();
    await context.close();
  }
}

async function proveSafeResultsReachability(width) {
  const { context, page } = await openFilter(width, false);
  const session = await context.newCDPSession(page);
  try {
    const quickStart = page.getByRole("button", { name: /TEA.*2.*4 anos/i });
    await quickStart.waitFor({ state: "visible", timeout: 10000 });
    await quickStart.scrollIntoViewIfNeeded();
    await settleFrames(page);
    const beforeSelection = (await rootState(page)).top;
    await quickStart.click();

    const symptomPicker = page.getByTestId("popular-symptom-picker");
    const safeResults = page.getByTestId("filter-safe-results-summary");
    await symptomPicker.waitFor({ state: "visible", timeout: 15000 });
    await safeResults.waitFor({ state: "visible", timeout: 15000 });
    await settleFrames(page);
    const afterSelection = (await rootState(page)).top;
    assert.ok(
      Math.abs(afterSelection - beforeSelection) <= 2,
      `${width}px: exibir resultados não pode sequestrar a rolagem (${beforeSelection} -> ${afterSelection})`,
    );
    await resetRoot(page);

    const ownership = await safeResults.evaluate((element) => {
      for (
        let current = element.parentElement;
        current instanceof HTMLElement;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        if (
          /auto|scroll|overlay/.test(style.overflowY) &&
          current.scrollHeight > current.clientHeight + 8
        ) {
          return {
            tag: current.tagName,
            isDocument: current === document.scrollingElement,
          };
        }
      }
      const root = document.scrollingElement;
      if (!(root instanceof HTMLElement))
        throw new Error("document.scrollingElement ausente");
      return { tag: root.tagName, isDocument: true };
    });
    assert.deepEqual(
      ownership,
      { tag: "HTML", isDocument: true },
      `${width}px: resultados seguros devem pertencer ao scroller global, não à coluna lateral`,
    );

    const lockState = await page.evaluate(() => ({
      rootOverflowY: getComputedStyle(document.documentElement).overflowY,
      bodyOverflowY: getComputedStyle(document.body).overflowY,
      bodyInlineOverflow: document.body.style.overflow,
      bodyInlineOverflowY: document.body.style.overflowY,
      rootDataLocked:
        document.documentElement.hasAttribute("data-scroll-locked"),
      bodyDataLocked: document.body.hasAttribute("data-scroll-locked"),
    }));
    assert.notEqual(
      lockState.rootOverflowY,
      "hidden",
      `${width}px: scroller raiz iniciou travado`,
    );
    assert.notEqual(
      lockState.bodyOverflowY,
      "hidden",
      `${width}px: body iniciou travado`,
    );
    assert.equal(
      lockState.bodyInlineOverflow,
      "",
      `${width}px: overflow inline órfão no body`,
    );
    assert.equal(
      lockState.bodyInlineOverflowY,
      "",
      `${width}px: overflow-y inline órfão no body`,
    );
    assert.equal(
      lockState.rootDataLocked,
      false,
      `${width}px: lock órfão no root`,
    );
    assert.equal(
      lockState.bodyDataLocked,
      false,
      `${width}px: lock órfão no body`,
    );

    if (width < 1024) {
      await symptomPicker.scrollIntoViewIfNeeded();
      await settleFrames(page);
      const beforeSymptoms = (await rootState(page)).top;
      await swipeLocator(page, session, symptomPicker, 0, -280);
      await page.waitForFunction(
        (startTop) =>
          (document.scrollingElement?.scrollTop ?? 0) > startTop + 20,
        beforeSymptoms,
        { timeout: 3000 },
      );
    }

    await safeResults.scrollIntoViewIfNeeded();
    await settleFrames(page);

    const beforeTouch = (await rootState(page)).top;
    await swipeLocator(page, session, safeResults, 0, -320);
    await page.waitForFunction(
      (startTop) => (document.scrollingElement?.scrollTop ?? 0) > startTop + 20,
      beforeTouch,
      { timeout: 3000 },
    );

    const viewport = page.viewportSize();
    assert.ok(viewport, "viewport ausente");
    await safeResults.scrollIntoViewIfNeeded();
    await settleFrames(page);
    const beforeWheel = (await rootState(page)).top;
    const resultsBox = await safeResults.boundingBox();
    assert.ok(resultsBox, "síntese segura sem geometria");
    await page.mouse.move(
      Math.max(
        20,
        Math.min(resultsBox.x + resultsBox.width * 0.75, viewport.width - 20),
      ),
      Math.max(
        80,
        Math.min(
          resultsBox.y + Math.min(resultsBox.height * 0.4, 320),
          viewport.height - 80,
        ),
      ),
    );
    await page.mouse.wheel(0, 420);
    await page.waitForFunction(
      (startTop) => (document.scrollingElement?.scrollTop ?? 0) > startTop + 20,
      beforeWheel,
      { timeout: 3000 },
    );

    console.log(
      `[scroll-continuity] ✓ ${width}px: resultados seguros respondem a touch e wheel no scroller global`,
    );
  } finally {
    await session.detach();
    await context.close();
  }
}

async function proveOrphanedOwnerClasses() {
  const { context, page } = await openFilter(390);
  const session = await context.newCDPSession(page);
  try {
    await page.evaluate(() => {
      const hiddenMenu = document.createElement("div");
      hiddenMenu.setAttribute("role", "menu");
      hiddenMenu.setAttribute("data-testid", "closed-overlay-decoy");
      hiddenMenu.dataset.state = "closed";
      hiddenMenu.style.display = "none";
      document.body.append(hiddenMenu);
    });

    const viewport = page.viewportSize();
    assert.ok(viewport, "viewport ausente");
    const start = { x: Math.round(viewport.width / 2), y: 620 };
    const end = { x: start.x, y: 240 };

    for (const className of ["np-mobile-drawer-open", "np-legal-gate-open"]) {
      await resetRoot(page);
      await page.evaluate((ownerClass) => {
        document.documentElement.classList.add(ownerClass);
        document.body.classList.add(ownerClass);
      }, className);
      await page.waitForFunction(
        () => getComputedStyle(document.documentElement).overflowY === "hidden",
      );
      // O estilo computado já reporta "hidden" assim que o main thread aplica a
      // classe, mas o compositor leva alguns frames extras para commitar a
      // scroll-blocking region. Sem essa folga, um wheel disparado logo depois
      // do waitForFunction pode escapar antes do bloqueio real existir — flake
      // observado especificamente na 2ª iteração, quando o compositor ainda
      // está processando os touchmoves da iteração anterior.
      await settleFrames(page, 4);
      await assertWheelBlocked(page, `${className} órfã`);
      await beginTouch(session, start.x, start.y);
      assertUnlocked(
        await readLock(page),
        `${className} órfã no primeiro contato`,
      );
      const before = (await rootState(page)).top;
      await continueTouch(page, session, start, end);
      await page.waitForFunction(
        (startTop) =>
          (document.scrollingElement?.scrollTop ?? 0) > startTop + 20,
        before,
        { timeout: 3000 },
      );
    }
    console.log(
      "[scroll-continuity] ✓ classes órfãs: owner vivo exigido e primeiro gesto recuperado",
    );
  } finally {
    await session.detach();
    await context.close();
  }
}

async function proveDialogOwnership() {
  const { context, page } = await openFilter(834);
  const session = await context.newCDPSession(page);
  try {
    // Em 834 px o shell é compacto e a sidebar permanece em drawer fechado.
    // Abre a mesma paleta pelo contrato global, sem depender de um gatilho
    // visual deliberadamente fora do viewport.
    await page.keyboard.press("Control+K");
    const dialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator("[cmdk-root]") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    assert.equal(
      await dialog.getAttribute("data-state"),
      "open",
      "Command Dialog deve estar realmente aberto",
    );
    await resetRoot(page);
    await injectOrphanedLock(page);
    await assertWheelBlocked(page, "dialog real");

    const viewport = page.viewportSize();
    assert.ok(viewport, "viewport ausente");
    await beginTouch(session, Math.round(viewport.width / 2), 300);
    let lock = await readLock(page);
    assert.equal(
      lock.rootDataLocked,
      true,
      "watchdog removeu lock raiz durante dialog real",
    );
    assert.equal(
      lock.dataLocked,
      true,
      "watchdog removeu lock durante dialog real",
    );
    await endTouch(session);

    await page.keyboard.press("Escape");
    // Presence mantém o portal durante a animação de saída. Só depois da
    // desmontagem completa qualquer lock residual passa a ser órfão.
    await dialog.waitFor({ state: "detached", timeout: 10000 });
    await beginTouch(session, Math.round(viewport.width / 2), 300);
    lock = await readLock(page);
    assertUnlocked(lock, "após desmontar dialog real");
    await endTouch(session);
    console.log(
      "[scroll-continuity] ✓ dialog real: lock legítimo preservado e resíduo recuperado",
    );
  } finally {
    await session.detach();
    await context.close();
  }
}

async function proveDrawerOwnership() {
  const { context, page } = await openFilter(390);
  const session = await context.newCDPSession(page);
  try {
    const menu = page.getByTestId("button-mobile-menu");
    await menu.click();
    await page.waitForFunction(() =>
      document.body.classList.contains("np-mobile-drawer-open"),
    );
    let lock = await readLock(page);
    assert.equal(lock.drawerOwner, true, "drawer não adquiriu ownership");
    assert.equal(
      lock.rootDrawerOwner,
      true,
      "drawer não adquiriu ownership no scroller raiz",
    );
    assert.equal(
      lock.rootComputedOverflowY,
      "hidden",
      "drawer não travou o scroller raiz",
    );

    await injectOrphanedLock(page);
    const viewport = page.viewportSize();
    assert.ok(viewport, "viewport ausente");
    await beginTouch(session, Math.round(viewport.width / 2), 300);
    lock = await readLock(page);
    assert.equal(
      lock.drawerOwner,
      true,
      "touchStart removeu owner legítimo do drawer",
    );
    assert.equal(
      lock.rootDrawerOwner,
      true,
      "touchStart removeu owner raiz do drawer",
    );
    assert.equal(
      lock.dataLocked,
      true,
      "watchdog removeu lock durante drawer legítimo",
    );
    assert.equal(
      lock.rootDataLocked,
      true,
      "watchdog removeu lock raiz durante drawer legítimo",
    );
    await endTouch(session);

    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.body.classList.contains("np-mobile-drawer-open"),
    );
    await beginTouch(session, Math.round(viewport.width / 2), 300);
    assertUnlocked(await readLock(page), "após fechar drawer");
    await endTouch(session);
    console.log(
      "[scroll-continuity] ✓ drawer: ownership preservado e liberação sem restauração cruzada",
    );
  } finally {
    await session.detach();
    await context.close();
  }
}

async function proveLegalGateOwnership() {
  const context = await browser.newContext({
    viewport: { width: 834, height: VIEWPORT_HEIGHT },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const storage = { ...ACCEPTED_FIRST_VISIT_STORAGE };
  delete storage["neuroped:aviso-educativo-aceito-v1"];
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries))
      localStorage.setItem(key, value);
    localStorage.removeItem("neuroped:aviso-educativo-aceito-v1");
  }, storage);
  try {
    await page.goto(`${server.origin}/#/filtro`, {
      waitUntil: "domcontentloaded",
    });
    const accept = page.getByTestId("button-aviso-aceitar");
    await accept.waitFor({ state: "visible", timeout: 15000 });
    await page.waitForFunction(() =>
      document.body.classList.contains("np-legal-gate-open"),
    );
    const locked = await readLock(page);
    assert.equal(locked.legalOwner, true, "aviso legal não adquiriu ownership");
    assert.equal(
      locked.rootLegalOwner,
      true,
      "aviso legal não adquiriu ownership no root",
    );
    assert.equal(
      locked.rootComputedOverflowY,
      "hidden",
      "aviso legal não travou o scroller raiz",
    );
    assert.equal(
      locked.overflow,
      "",
      "aviso legal voltou a usar lock inline compartilhado",
    );

    await accept.click();
    await page.waitForFunction(
      () => !document.body.classList.contains("np-legal-gate-open"),
    );
    assertUnlocked(await readLock(page), "após aceitar aviso legal");
    console.log(
      "[scroll-continuity] ✓ aviso legal: ownership isolado e cleanup definitivo",
    );
  } finally {
    await context.close();
  }
}

try {
  for (const width of WIDTHS) await proveNativeScroll(width);
  for (const width of [390, 834, 1280])
    await proveSafeResultsReachability(width);
  await proveDrawerOwnership();
  await proveLegalGateOwnership();
  await proveOrphanedOwnerClasses();
  await proveDialogOwnership();
  console.log("[scroll-continuity] ✓ contrato completo aprovado.");
} finally {
  await browser.close();
  await server.close();
}
