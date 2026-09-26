import assert from "node:assert/strict";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE, ensureClientBuild, startStaticServer } from "/home/user/neuroped/scripts/lib/browser-audit-runtime.mjs";
const server = await startStaticServer(ensureClientBuild("/home/user/neuroped"), 0);
const browser = await chromium.launch(auditBrowserLaunchOptions());
const shots = "/tmp/claude-0/-home-user-neuroped/d25f1e1d-14c9-5dc3-af7e-f920247a48de/scratchpad";
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
    await page.goto(`${server.origin}/#/filtro`, { waitUntil: "domcontentloaded" });
    const input = page.getByTestId("input-search");
    await input.waitFor({ state: "visible", timeout: 30000 });
    // 1. Linguagem de família → queixa inferida + chip de sinal
    await input.fill("2 anos não olha nos olhos e não aponta");
    await page.keyboard.press("Escape");
    await page.getByTestId("filter-query-intents").waitFor({ state: "visible", timeout: 15000 });
    const intents = await page.getByTestId("filter-query-intents").innerText();
    console.log(`[${width}] intents:`, intents.replace(/\n/g, " | "));
    assert.match(intents, /Sinal: Não aponta/);
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="filter-result-card"]').length > 0, null, { timeout: 15000 });
    const cardIds = await page.getByTestId("filter-result-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-scale-id")));
    console.log(`[${width}] podium:`, cardIds.join(","));
    assert.ok(cardIds.includes("mchat"), "M-CHAT no pódio para 2 anos TEA (queixa inferida do texto)");
    await page.getByRole("button", { name: /\+ Sinal: Não aponta/ }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="filter-complaint-options"] [aria-pressed="true"]').length >= 1);
    const pressed = await page.locator('[data-testid="filter-complaint-options"] [aria-pressed="true"]').allInnerTexts();
    assert.ok(pressed.some((t) => /Autismo/.test(t)), "queixa-mãe marcada junto com o sinal");
    const url = page.url();
    assert.match(url, /sinais=tea-nao-aponta/, "sinal no deep-link: " + url);
    await page.screenshot({ path: `${shots}/smoke-r3-${width}-signal.png` });
    // 2. Motivos nos cards compactos
    await page.getByTestId("filter-compact-reasons").first().waitFor({ state: "visible", timeout: 10000 });
    // 3. Favoritos: estrela no card compacto, seção na tela inicial, ordenação
    const star = page.getByTestId("filter-favorite-toggle").first();
    const starName = (await star.getAttribute("aria-label")) ?? "";
    await star.click();
    assert.equal(await page.getByTestId("filter-favorite-toggle").first().getAttribute("aria-pressed"), "true");
    const stored = await page.evaluate(() => localStorage.getItem("np_filtro_favoritos_v1"));
    assert.ok(stored && /^\[".+"\]$/.test(stored) && !/idade|queixa|anos/.test(stored), "favoritos só com ids: " + stored);
    await page.getByTestId("filter-sort-mode").selectOption("favoritos");
    await page.getByRole("button", { name: "Limpar sintomas selecionados", exact: true }).click();
    await page.getByTestId("filter-favorites").waitFor({ state: "visible", timeout: 10000 });
    console.log(`[${width}] favorites:`, (await page.getByTestId("filter-favorites").innerText()).replace(/\n/g, " | "), "| star:", starName);
    // 4. Modo efêmero: sem favoritos nem estrela
    await page.goto(`${server.origin}/#/filtro-escalas`, { waitUntil: "domcontentloaded" });
    await input.waitFor({ state: "visible", timeout: 30000 });
    assert.equal(await page.getByTestId("filter-favorites").count(), 0);
    await input.fill("tdah 8 anos");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="filter-result-card"]').length > 0, null, { timeout: 15000 });
    assert.equal(await page.getByTestId("filter-favorite-toggle").count(), 0, "modo efêmero sem estrela");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, "sem overflow horizontal");
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("SMOKE-R3 OK");
} finally {
  await browser.close();
  await server.close();
}
