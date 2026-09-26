import assert from "node:assert/strict";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE, ensureClientBuild, startStaticServer } from "/home/user/neuroped/scripts/lib/browser-audit-runtime.mjs";
const server = await startStaticServer(ensureClientBuild("/home/user/neuroped"), 0);
const browser = await chromium.launch(auditBrowserLaunchOptions());
const shots = "/tmp/claude-0/-home-user-neuroped/d25f1e1d-14c9-5dc3-af7e-f920247a48de/scratchpad";
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);

  // 1. Deep-link abre a busca pronta
  await page.goto(`${server.origin}/#/filtro?idade=5a6m&queixas=tea&resp=pais`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("filter-age-years").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="filter-result-card"]').length > 0, null, { timeout: 20000 });
  assert.equal(await page.getByTestId("filter-age-years").inputValue(), "5");
  assert.equal(await page.getByTestId("filter-age-months").inputValue(), "6");
  assert.equal(await page.getByRole("button", { name: "Respondente: pais ou cuidador" }).getAttribute("aria-pressed"), "true");
  const chips = await page.getByTestId("filter-applied-chips").innerText();
  console.log("applied chips:", chips.replace(/\n/g, " | "));
  await page.screenshot({ path: `${shots}/smoke-1-deeplink.png`, fullPage: false });

  // 2. Busca por sigla sem pontuação + realce + explicação
  await page.getByTestId("input-search").fill("mchat");
  await page.getByTestId("filter-search-unmatched").waitFor({ state: "visible", timeout: 15000 });
  console.log("unmatched notice:", await page.getByTestId("filter-search-unmatched").innerText());
  assert.equal(await page.getByTestId("filter-search-suggestions").count(), 0, "termo conhecido não recebe 'quis dizer'");
  await page.getByRole("button", { name: "Remover filtro Responde: pais/cuidador" }).click();
  await page.getByTestId("input-search").fill("cars 2");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="filter-match-reason"]').length > 0, null, { timeout: 15000 });
  const reason = await page.getByTestId("filter-match-reason").first().innerText();
  console.log("match reason:", reason);
  assert.match(reason, /CARS/i);
  const marks = await page.locator("mark").count();
  assert.ok(marks > 0, "realce presente");
  const url1 = page.url();
  console.log("url after search:", url1);
  assert.match(url1, /q=cars/);
  assert.match(url1, /idade=5a6m/);

  // 3. Intent chips: respondente e tempo
  await page.getByTestId("input-search").fill("cars professor 10 min");
  await page.getByTestId("filter-query-intents").waitFor({ state: "visible", timeout: 10000 });
  const intents = await page.getByTestId("filter-query-intents").innerText();
  console.log("intents:", intents.replace(/\n/g, " | "));
  assert.match(intents, /Professor/);
  assert.match(intents, /10 min/);
  await page.getByRole("button", { name: "Aplicar tudo" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="filter-time-budget"] [aria-pressed="true"]') !== null);
  assert.equal(await page.getByRole("button", { name: "Respondente: professor ou escola" }).getAttribute("aria-pressed"), "true");
  await page.screenshot({ path: `${shots}/smoke-2-intents.png` });

  // 4. Facet counts visíveis
  const respBtn = await page.getByRole("button", { name: "Respondente: pais ou cuidador" }).innerText();
  console.log("pais button text:", JSON.stringify(respBtn));
  assert.match(respBtn, /\d/);

  // 5. Zero resultado com diagnóstico: TEA 5a6m professor + "Direto" impossível? Use tempo 5 min + sinais
  await page.getByTestId("input-search").fill("");
  await page.getByRole("button", { name: "Tempo disponível: ≤ 5 min" }).click(); // toggles off 10 → set 5
  await page.waitForTimeout(300);
  const emptyDiag = await page.getByTestId("filter-empty-diagnosis").count();
  const cards = await page.getByTestId("filter-result-card").count();
  console.log("cards:", cards, "diagnosis present:", emptyDiag);
  if (emptyDiag) {
    console.log("diagnosis:", (await page.getByTestId("filter-empty-diagnosis").innerText()).replace(/\n/g, " | "));
    await page.screenshot({ path: `${shots}/smoke-3-empty.png` });
  }

  // 6. "Você quis dizer" com termo errado
  await page.getByRole("button", { name: "Limpar sintomas selecionados", exact: true }).click();
  await page.getByTestId("input-search").fill("vanderbild");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="filter-match-reason"]').length > 0, null, { timeout: 15000 });
  console.log("fuzzy reason:", await page.getByTestId("filter-match-reason").first().innerText());
  await page.getByTestId("input-search").fill("xptoz");
  await page.waitForTimeout(400);
  const sugg = await page.getByTestId("filter-search-suggestions").count();
  console.log("suggestions for xptoz:", sugg ? await page.getByTestId("filter-search-suggestions").innerText() : "(none)");
  await page.getByTestId("input-search").fill("ansiedad");
  await page.waitForTimeout(400);
  console.log("cards for 'ansiedad':", await page.getByTestId("filter-result-card").count());

  // 7. Atalho "/" foca busca; Esc limpa
  await page.getByTestId("input-search").fill("snap");
  await page.keyboard.press("Escape");
  assert.equal(await page.getByTestId("input-search").inputValue(), "");
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("/");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "input-search");

  // 8. Ordenação
  await page.getByTestId("input-search").fill("sono");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="filter-result-card"]').length > 0, null, { timeout: 15000 });
  await page.getByTestId("filter-sort-mode").selectOption("rapidas");
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${shots}/smoke-4-sort.png`, fullPage: true });

  // 9. Modo flash não escreve URL
  await page.goto(`${server.origin}/#/filtro-escalas`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("input-search").waitFor({ state: "visible", timeout: 30000 });
  await page.getByTestId("input-search").fill("mchat");
  await page.waitForTimeout(300);
  assert.ok(!page.url().includes("q="), "flash não vaza busca na URL: " + page.url());

  console.log("page errors:", errors);
  assert.equal(errors.filter((e) => !/favicon|manifest|404/.test(e)).length, 0, "sem erros de página");
  console.log("SMOKE OK");
} finally {
  await browser.close();
  await server.close();
}
