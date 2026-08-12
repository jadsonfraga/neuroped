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

const WIDTHS = [390, 767, 768, 834];
const HEIGHT = 720;

async function openScrollableApp(width) {
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  await page.goto(`${server.origin}/#/filtro`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 15000 });
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 15000 });

  // Torna o contrato de rolagem determinístico sem depender da quantidade de
  // resultados clínicos exibida pelo filtro naquele build. O alvo continua sendo
  // o documento real do app e o mesmo body que Radix/react-remove-scroll bloqueia.
  await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!(main instanceof HTMLElement)) throw new Error("#main-content ausente");
    const spacer = document.createElement("div");
    spacer.dataset.scrollRecoverySentinel = "true";
    spacer.style.height = "2400px";
    spacer.style.width = "1px";
    spacer.style.pointerEvents = "none";
    main.appendChild(spacer);
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => document.documentElement.scrollHeight > window.innerHeight + 1200);
  return { context, page };
}

async function injectOrphanedLock(page) {
  await page.evaluate(() => {
    const body = document.body;
    body.style.overflow = "hidden";
    body.style.overflowY = "hidden";
    body.style.pointerEvents = "none";
    body.setAttribute("data-scroll-locked", "1");
  });
  const lock = await readLock(page);
  assert.equal(lock.overflow, "hidden");
  assert.equal(lock.overflowY, "hidden");
  assert.equal(lock.pointerEvents, "none");
  assert.equal(lock.dataScrollLocked, true);
}

async function readLock(page) {
  return page.evaluate(() => ({
    overflow: document.body.style.overflow,
    overflowY: document.body.style.overflowY,
    pointerEvents: document.body.style.pointerEvents,
    dataScrollLocked: document.body.hasAttribute("data-scroll-locked"),
  }));
}

function assertUnlocked(lock, label) {
  assert.notEqual(lock.overflow, "hidden", `${label}: overflow ficou travado`);
  assert.notEqual(lock.overflowY, "hidden", `${label}: overflow-y ficou travado`);
  assert.notEqual(lock.pointerEvents, "none", `${label}: pointer-events ficou travado`);
  assert.equal(lock.dataScrollLocked, false, `${label}: data-scroll-locked ficou órfão`);
}

async function dispatchRealTouchStart(page, x, y) {
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
}

async function synthesizeTouchScroll(page, width) {
  const session = await page.context().newCDPSession(page);
  const before = await page.evaluate(() => window.scrollY);
  const payload = {
    x: Math.round(width / 2),
    y: Math.round(HEIGHT * 0.72),
    yDistance: -420,
    speed: 900,
    gestureSourceType: "touch",
  };
  await session.send("Input.synthesizeScrollGesture", payload);
  await page.waitForTimeout(180);
  let after = await page.evaluate(() => window.scrollY);
  if (after <= before + 20) {
    await session.send("Input.synthesizeScrollGesture", { ...payload, yDistance: 420 });
    await page.waitForTimeout(180);
    after = await page.evaluate(() => window.scrollY);
  }
  await session.detach();
  assert.ok(after > before + 20, `${width}px: gesto touch não alterou scrollY (${before} -> ${after})`);
}

async function verifyRecovery(width) {
  const { context, page } = await openScrollableApp(width);
  try {
    const x = Math.round(width / 2);
    const y = Math.round(HEIGHT / 2);

    // Caso real do P0: lock órfão completo. Um touchStart nativo precisa curar
    // a trava antes que o gesto de rolagem continue.
    await injectOrphanedLock(page);
    await dispatchRealTouchStart(page, x, y);
    await page.waitForFunction(() =>
      document.body.style.overflow !== "hidden" &&
      document.body.style.overflowY !== "hidden" &&
      document.body.style.pointerEvents !== "none" &&
      !document.body.hasAttribute("data-scroll-locked"),
    );
    assertUnlocked(await readLock(page), `${width}px touch recovery`);
    await synthesizeTouchScroll(page, width);

    // O caminho pointerdown também precisa se autocurar, porque mouse/trackpad e
    // canetas podem ser a primeira interação depois de retornar ao PWA.
    await page.evaluate(() => window.scrollTo(0, 0));
    await injectOrphanedLock(page);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForFunction(() =>
      document.body.style.overflow !== "hidden" &&
      document.body.style.pointerEvents !== "none" &&
      !document.body.hasAttribute("data-scroll-locked"),
    );
    assertUnlocked(await readLock(page), `${width}px pointer recovery`);
    const wheelBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(120);
    const wheelAfter = await page.evaluate(() => window.scrollY);
    assert.ok(wheelAfter > wheelBefore + 20, `${width}px: wheel não rolou (${wheelBefore} -> ${wheelAfter})`);

    // Segurança: nunca remover lock enquanto um modal legítimo estiver aberto.
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const dialog = document.createElement("div");
      dialog.dataset.scrollRecoveryDialog = "true";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      document.body.appendChild(dialog);
    });
    await injectOrphanedLock(page);
    await dispatchRealTouchStart(page, x, y);
    const protectedLock = await readLock(page);
    assert.equal(protectedLock.dataScrollLocked, true, `${width}px: lock legítimo de modal foi removido`);
    assert.equal(protectedLock.overflow, "hidden", `${width}px: overflow de modal foi removido`);

    // Fechado o modal, o PRIMEIRO toque seguinte precisa liberar a página.
    await page.evaluate(() => document.querySelector('[data-scroll-recovery-dialog="true"]')?.remove());
    await dispatchRealTouchStart(page, x, y);
    await page.waitForFunction(() => !document.body.hasAttribute("data-scroll-locked"));
    assertUnlocked(await readLock(page), `${width}px post-modal recovery`);

    console.log(`[scroll-lock-recovery] ✓ ${width}px: touch + pointer + wheel + proteção de modal`);
  } finally {
    await context.close();
  }
}

try {
  for (const width of WIDTHS) await verifyRecovery(width);
  console.log("[scroll-lock-recovery] ✓ P0 blindado em 390/767/768/834px.");
} finally {
  await browser.close();
  await server.close();
}
