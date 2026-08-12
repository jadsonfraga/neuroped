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

  // O shell usa o documento (window/body) como superfície vertical de scroll.
  // Acrescentamos altura apenas para tornar a prova independente da quantidade
  // de resultados clínicos exibidos pelo filtro em cada build.
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

/**
 * Diagnóstico opcional de compositor. Em Chrome headless, Input.dispatchTouchEvent
 * entrega os eventos DOM reais, mas algumas versões não transformam a sequência
 * em scroll de compositor. Por isso a capacidade é medida ANTES do cenário P0:
 * quando existir no runner, ela também vira requisito pós-recuperação; quando não
 * existir, o gate continua exigindo touch real para desbloquear + wheel real para
 * provar que o documento voltou a aceitar entrada de rolagem.
 */
async function tryRealTouchSwipe(page, width) {
  const session = await page.context().newCDPSession(page);
  const x = Math.round(width / 2);
  const startY = Math.round(HEIGHT * 0.78);
  const endY = Math.round(HEIGHT * 0.24);
  const before = await page.evaluate(() => window.scrollY);

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(x, startY)],
  });
  const frames = 12;
  for (let frame = 1; frame <= frames; frame += 1) {
    const progress = frame / frames;
    const y = Math.round(startY + (endY - startY) * progress);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [touchPoint(x, y)],
    });
    await page.waitForTimeout(14);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
  await page.waitForTimeout(180);

  const after = await page.evaluate(() => window.scrollY);
  return { before, after, moved: after > before + 20 };
}

async function proveWheelScroll(page, width, label) {
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(140);
  const after = await page.evaluate(() => window.scrollY);
  assert.ok(after > before + 20, `${width}px ${label}: documento não rolou (${before} -> ${after})`);
  return { before, after };
}

async function verifyRecovery(width) {
  const { context, page } = await openScrollableApp(width);
  try {
    const x = Math.round(width / 2);
    const y = Math.round(HEIGHT / 2);

    // Mede primeiro a capacidade específica do compositor headless. Se o próprio
    // runner não converte touchMove em scroll, não confundimos limitação do harness
    // com regressão do app.
    const baselineTouch = await tryRealTouchSwipe(page, width);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Caso P0 real: touchstart NATIVO deve remover todas as formas do lock órfão.
    await injectOrphanedLock(page);
    await dispatchRealTouchStart(page, x, y);
    await page.waitForFunction(() =>
      document.body.style.overflow !== "hidden" &&
      document.body.style.overflowY !== "hidden" &&
      document.body.style.pointerEvents !== "none" &&
      !document.body.hasAttribute("data-scroll-locked"),
    );
    assertUnlocked(await readLock(page), `${width}px touch recovery`);

    // Sem qualquer pointerdown adicional: o wheel precisa funcionar logo após o
    // touch que fez a autocura. Assim provamos que foi o caminho TOUCH que liberou
    // o body/documento, e não um segundo mecanismo de recuperação.
    const afterTouchWheel = await proveWheelScroll(page, width, "após touch recovery");

    // Se esta versão do Chromium oferece scroll de compositor para CDP touch,
    // exige também que ele continue funcionando depois da autocura.
    let recoveredTouch = null;
    if (baselineTouch.moved) {
      await page.evaluate(() => window.scrollTo(0, 0));
      recoveredTouch = await tryRealTouchSwipe(page, width);
      assert.ok(
        recoveredTouch.moved,
        `${width}px: compositor suportava touch-scroll antes do lock, mas não depois da recuperação`,
      );
    }

    // Caminho secundário pointerdown: precisa remover o lock órfão. Não usamos
    // wheel como requisito aqui porque Chromium headless pode preservar o hit-test
    // do cursor criado enquanto body tinha pointer-events:none; a prova de scroll
    // real pertence ao caminho touch acima, que reproduz o defeito do tablet.
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

    // Segurança: lock legítimo de modal NÃO pode ser removido pelo autocurador.
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

    // Fechado o modal, o primeiro toque seguinte precisa liberar tudo de novo.
    await page.evaluate(() => document.querySelector('[data-scroll-recovery-dialog="true"]')?.remove());
    await dispatchRealTouchStart(page, x, y);
    await page.waitForFunction(() => !document.body.hasAttribute("data-scroll-locked"));
    assertUnlocked(await readLock(page), `${width}px post-modal recovery`);
    // O mouse do runner pode conservar o alvo anterior enquanto o modal/body estava
    // bloqueado. Um movimento SEM pointerdown apenas renova o hit-test do wheel;
    // não aciona nenhum listener de recuperação e, portanto, não mascara o P0.
    await page.mouse.move(x + 2, y + 2);
    const afterModalWheel = await proveWheelScroll(page, width, "após fechamento do modal");

    const compositor = baselineTouch.moved
      ? `touch-scroll ${baselineTouch.before}->${baselineTouch.after} / pós-lock ${recoveredTouch.before}->${recoveredTouch.after}`
      : "touch DOM validado; compositor touch-scroll indisponível neste Chrome headless";
    console.log(
      `[scroll-lock-recovery] ✓ ${width}px: ${compositor}; wheel pós-touch ${afterTouchWheel.before}->${afterTouchWheel.after}; ` +
      `pointer unlock validado; pós-modal ${afterModalWheel.before}->${afterModalWheel.after}`,
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
