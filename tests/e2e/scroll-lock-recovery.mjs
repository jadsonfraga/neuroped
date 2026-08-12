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
}

async function readLock(page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return {
      overflow: document.body.style.overflow,
      overflowY: document.body.style.overflowY,
      pointerEvents: document.body.style.pointerEvents,
      computedOverflow: style.overflow,
      computedOverflowY: style.overflowY,
      computedPointerEvents: style.pointerEvents,
      dataScrollLocked: document.body.hasAttribute("data-scroll-locked"),
    };
  });
}

function assertUnlocked(lock, label) {
  assert.notEqual(lock.overflow, "hidden", `${label}: overflow inline ficou travado`);
  assert.notEqual(lock.overflowY, "hidden", `${label}: overflow-y inline ficou travado`);
  assert.notEqual(lock.pointerEvents, "none", `${label}: pointer-events inline ficou travado`);
  assert.notEqual(lock.computedOverflow, "hidden", `${label}: overflow computado ficou travado`);
  assert.notEqual(lock.computedOverflowY, "hidden", `${label}: overflow-y computado ficou travado`);
  assert.notEqual(lock.computedPointerEvents, "none", `${label}: pointer-events computado ficou travado`);
  assert.equal(lock.dataScrollLocked, false, `${label}: data-scroll-locked ficou órfão`);
}

function touchPoint(x, y) {
  return { x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 };
}

async function dispatchRealTouchStart(page, x, y) {
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(x, y)],
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
}

async function wheelDelta(page, deltaY = 500) {
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, deltaY);
  await page.waitForTimeout(160);
  const after = await page.evaluate(() => window.scrollY);
  return { before, after };
}

async function verifyRecovery(width) {
  const { context, page } = await openScrollableApp(width);
  try {
    const x = Math.round(width / 2);
    const y = Math.round(HEIGHT / 2);
    await page.mouse.move(x, y);

    // 1) Prova que o próprio harness consegue rolar este documento nesta largura.
    const baseline = await wheelDelta(page);
    assert.ok(baseline.after > baseline.before + 20, `${width}px: baseline de wheel não rolou`);
    await page.evaluate(() => window.scrollTo(0, 0));

    // 2) Injeta exatamente o estado órfão que congelava o app. Wheel não pode
    // mover a página e, por não emitir pointerdown/touchstart, não pode autocurar.
    await injectOrphanedLock(page);
    const locked = await readLock(page);
    assert.equal(locked.dataScrollLocked, true, `${width}px: lock não foi injetado`);
    const blocked = await wheelDelta(page);
    assert.ok(blocked.after <= blocked.before + 2, `${width}px: wheel rolou apesar do lock (${blocked.before}->${blocked.after})`);
    assert.equal((await readLock(page)).dataScrollLocked, true, `${width}px: wheel não pode remover o lock`);

    // 3) O toque NATIVO é o único evento de recuperação. Depois dele, sem nenhum
    // pointerdown adicional, o MESMO wheel deve voltar a mover window.scrollY.
    await dispatchRealTouchStart(page, x, y);
    await page.waitForFunction(() =>
      document.body.style.overflow !== "hidden" &&
      document.body.style.overflowY !== "hidden" &&
      document.body.style.pointerEvents !== "none" &&
      !document.body.hasAttribute("data-scroll-locked"),
    );
    assertUnlocked(await readLock(page), `${width}px touch recovery`);
    const recovered = await wheelDelta(page);
    assert.ok(
      recovered.after > recovered.before + 20,
      `${width}px: documento não voltou a rolar após touch (${recovered.before}->${recovered.after})`,
    );

    // 4) Pointerdown também precisa autocurar o lock órfão.
    await page.evaluate(() => window.scrollTo(0, 0));
    await injectOrphanedLock(page);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForFunction(() => !document.body.hasAttribute("data-scroll-locked"));
    assertUnlocked(await readLock(page), `${width}px pointer recovery`);

    // 5) Segurança: modal legítimo deve preservar o lock, e o primeiro touch
    // depois de fechar o modal deve liberar tudo novamente.
    await page.evaluate(() => {
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
    assert.equal(protectedLock.overflow, "hidden", `${width}px: overflow legítimo de modal foi removido`);

    await page.evaluate(() => document.querySelector('[data-scroll-recovery-dialog="true"]')?.remove());
    await dispatchRealTouchStart(page, x, y);
    await page.waitForFunction(() => !document.body.hasAttribute("data-scroll-locked"));
    assertUnlocked(await readLock(page), `${width}px post-modal recovery`);

    console.log(
      `[scroll-lock-recovery] ✓ ${width}px: baseline ${baseline.before}->${baseline.after}; ` +
      `bloqueado ${blocked.before}->${blocked.after}; touch recovery ${recovered.before}->${recovered.after}; ` +
      `pointer + proteção/pós-modal OK`,
    );
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
