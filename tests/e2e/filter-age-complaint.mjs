import assert from "node:assert/strict";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
const server = await startStaticServer(ensureClientBuild(process.cwd()), 0);
const browser = await chromium.launch(auditBrowserLaunchOptions());
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(storage => {
        for(const [key,value] of Object.entries(storage)) localStorage.setItem(key,value);
      }, ACCEPTED_FIRST_VISIT_STORAGE);
      await page.goto(`${server.origin}/#/filtro`, {waitUntil:"domcontentloaded"});
      await page.getByTestId("filter-age-years").waitFor({state:"visible",timeout:30000});
      const years = page.getByTestId("filter-age-years"), months = page.getByTestId("filter-age-months");
      const complaintSearch = page.getByTestId("filter-complaint-search");
      const options = page.getByTestId("filter-complaint-options");
      const status = page.getByTestId("filter-age-status");
      const cards = page.getByTestId("filter-result-card");
      const clear = () => page.getByRole("button",{name:"Limpar sintomas selecionados",exact:true}).click();
      async function assertAge(age) {
        await page.waitForFunction(age => {
          const nodes = [...document.querySelectorAll('[data-testid="filter-result-card"]')];
          return nodes.length > 0 && nodes.every(node => Number(node.getAttribute("data-age-min")) <= age && Number(node.getAttribute("data-age-max")) >= age);
        }, age, {timeout:15000});
        assert.ok(await cards.count() > 0, "não aprovar conjunto vazio");
      }
      await complaintSearch.fill("cefal");
      assert.equal(await options.getByRole("button").count(),1);
      await options.getByRole("button",{name:/Dor \/ Cefaleia/}).click();
      await complaintSearch.fill("sono");
      assert.equal(await options.getByRole("button",{name:/Dor \/ Cefaleia/}).getAttribute("aria-pressed"),"true","queixa marcada não desaparece");
      await options.getByRole("button",{name:/Sono/}).click();
      assert.equal(await options.locator('[aria-pressed="true"]').count(),2,"múltiplas queixas mantidas");
      assert.equal(await page.getByTestId("input-search").inputValue(),"","busca de queixas não altera busca de instrumentos");
      await years.fill("5"); await months.fill("6");
      await page.waitForFunction(()=>document.getElementById("filter-age-status")?.textContent?.includes("5 anos e 6 meses"));
      await assertAge(66);
      await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem("np_filtro_session_v1")||"{}").exactAge?.months === "6");
      await page.reload({waitUntil:"domcontentloaded"});
      await years.waitFor({state:"visible",timeout:30000});
      assert.equal(await years.inputValue(),"5"); assert.equal(await months.inputValue(),"6");
      await assertAge(66);
      await months.fill("12");
      await page.waitForFunction(()=>document.getElementById("filter-age-months")?.getAttribute("aria-invalid")==="true" && document.querySelectorAll('[data-testid="filter-result-card"]').length===0);
      assert.equal(await page.getByTestId("direct-tests-recommendations").count(),0);
      assert.equal(await page.getByTestId("parent-tests-recommendations").count(),0);
      await page.reload({waitUntil:"domcontentloaded"});
      await months.waitFor({state:"visible",timeout:30000});
      assert.equal(await months.inputValue(),"12","erro persiste sem ampliar catálogo");
      assert.equal(await cards.count(),0);
      await clear();
      assert.equal(await years.inputValue(),""); assert.equal(await months.inputValue(),"");
      assert.equal(await options.locator('[aria-pressed="true"]').count(),0);
      for (const range of ["5 a 6 meses, sono", "dos 5 aos 12 meses, sono", "dos 5 aos 6 anos, sono"]) {
        await page.getByTestId("input-search").fill(range);
        await page.waitForFunction(()=>document.getElementById("filter-age-years")?.getAttribute("aria-invalid")==="true" && document.querySelectorAll('[data-testid="filter-result-card"]').length===0);
        assert.match(await status.innerText(),/faixa ou idade ambígua/);
        assert.equal(await page.getByTestId("direct-tests-recommendations").count(),0);
        assert.equal(await page.getByTestId("parent-tests-recommendations").count(),0);
      }
      await page.getByTestId("input-search").fill("5 anos e 6 meses, sono");
      await assertAge(66);
      assert.match(await status.innerText(),/5 anos e 6 meses/);
      await page.getByRole("button",{name:"Faixa etária 2–4 anos",exact:true}).click();
      await page.waitForFunction(()=>document.querySelectorAll('[data-testid="filter-result-card"]').length===0);
      assert.match(await status.innerText(),/não pertence/);
      await years.fill("5"); await months.fill("6");
      await assertAge(66);
      assert.equal(await page.getByRole("button",{name:"Faixa etária 2–4 anos",exact:true}).getAttribute("aria-pressed"),"false");
      const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1);
      assert.equal(overflow,false,`${width}px: sem overflow horizontal`);
      assert.deepEqual(errors,[],"sem erros de execução no navegador");
      console.log(`[filter-age-complaint-browser] ${width}px: idade composta, duas queixas, sessão, erro fechado, conflito e limpeza aprovados.`);
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await server.close();
}
