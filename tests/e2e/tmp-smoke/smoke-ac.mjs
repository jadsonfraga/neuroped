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
    await page.goto(`${server.origin}/#/filtro?queixas=tdah&faixa=6-12a`, { waitUntil: "domcontentloaded" });
    const input = page.getByTestId("input-search");
    await input.waitFor({ state: "visible", timeout: 30000 });
    // 1. Autocomplete abre ao digitar, com opções seguras primeiro
    await input.click();
    await input.fill("van");
    await page.getByTestId("filter-autocomplete").waitFor({ state: "visible", timeout: 10000 });
    const opts = page.getByTestId("filter-autocomplete-option");
    const n = await opts.count();
    assert.ok(n > 0 && n <= 8, `opções: ${n}`);
    const kinds = await opts.evaluateAll((els) => els.map((e) => e.getAttribute("data-kind")));
    console.log(`[${width}] kinds:`, kinds.join(","));
    assert.equal(await input.getAttribute("aria-expanded"), "true");
    // 2. Teclado: ArrowDown seleciona, Enter aplica
    await page.keyboard.press("ArrowDown");
    assert.match((await input.getAttribute("aria-activedescendant")) ?? "", /filter-ac-option-0/);
    assert.equal(await opts.first().getAttribute("aria-selected"), "true");
    const label = (await opts.first().innerText()).split("\n")[0];
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector('[data-testid="filter-autocomplete"]') === null);
    const val = await input.inputValue();
    console.log(`[${width}] after Enter: "${val}" (label "${label}")`);
    assert.ok(val.length > 3 && label.includes(val), "Enter preencheu o nome do instrumento");
    await page.screenshot({ path: `${shots}/smoke-ac-${width}.png` });
    // 3. Escape fecha a lista, segundo Escape limpa
    await input.fill("sna");
    await page.getByTestId("filter-autocomplete").waitFor({ state: "visible", timeout: 10000 });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector('[data-testid="filter-autocomplete"]') === null);
    assert.equal(await input.inputValue(), "sna");
    await page.keyboard.press("Escape");
    assert.equal(await input.inputValue(), "");
    // 4. Queixa via autocomplete
    await input.fill("ansied");
    await page.getByTestId("filter-autocomplete").waitFor({ state: "visible", timeout: 10000 });
    const queixaOpt = page.locator('[data-testid="filter-autocomplete-option"][data-kind="queixa"]').first();
    if (await queixaOpt.count()) {
      await queixaOpt.dispatchEvent("mousedown");
      await page.waitForFunction(() => document.querySelector('[data-testid="filter-complaint-options"] [aria-pressed="true"]')?.textContent?.includes("Ansiedade") || document.querySelectorAll('[data-testid="filter-complaint-options"] [aria-pressed="true"]').length >= 2);
      assert.equal(await input.inputValue(), "", "marcar queixa limpa a busca");
      console.log(`[${width}] queixa via autocomplete OK`);
    }
    // 5. Sair do campo fecha a lista; a lista não excede a largura da tela
    await input.fill("cars");
    await page.getByTestId("filter-autocomplete").waitFor({ state: "visible", timeout: 10000 });
    const box = await page.getByTestId("filter-autocomplete").boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1, `lista dentro da tela: ${JSON.stringify(box)}`);
    await input.evaluate((el) => el.blur());
    await page.waitForFunction(() => document.querySelector('[data-testid="filter-autocomplete"]') === null);
    await page.getByTestId("filter-age-years").click();
    // 6. Recentes: abrir instrumento a partir do card compacto e voltar
    await page.getByRole("button", { name: "Limpar sintomas selecionados", exact: true }).click();
    await page.getByRole("button", { name: "TDAH · 6–12 anos", exact: true }).click();
    const card = page.locator(".filter-260-card.compact").first();
    await card.waitFor({ state: "visible", timeout: 15000 });
    const openedName = (await card.locator(".filter-260-title").innerText()).trim();
    await card.click();
    await page.waitForFunction(() => !location.hash.startsWith("#/filtro"), null, { timeout: 15000 });
    await page.goto(`${server.origin}/#/filtro`, { waitUntil: "domcontentloaded" });
    await input.waitFor({ state: "visible", timeout: 30000 });
    await page.getByRole("button", { name: "Limpar sintomas selecionados", exact: true }).click().catch(() => {});
    await page.getByTestId("filter-recents").waitFor({ state: "visible", timeout: 10000 });
    const recentsText = await page.getByTestId("filter-recents").innerText();
    console.log(`[${width}] recents:`, recentsText.replace(/\n/g, " | "));
    assert.ok(recentsText.includes(openedName.slice(0, 8)), "instrumento aberto aparece nos recentes");
    const stored = await page.evaluate(() => localStorage.getItem("np_filtro_recentes_v1"));
    assert.ok(stored && !/idade|queixa|paciente/i.test(stored), "recentes sem dados clínicos");
    // 7. Modo efêmero não mostra recentes
    await page.goto(`${server.origin}/#/filtro-escalas`, { waitUntil: "domcontentloaded" });
    await input.waitFor({ state: "visible", timeout: 30000 });
    assert.equal(await page.getByTestId("filter-recents").count(), 0, "modo efêmero sem recentes");
    // 8. Overflow horizontal ausente no celular
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, "sem overflow horizontal");
    assert.deepEqual(errors, [], "sem erros de página");
    await context.close();
  }
  console.log("SMOKE-AC OK");
} finally {
  await browser.close();
  await server.close();
}
