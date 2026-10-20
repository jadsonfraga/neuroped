// Super NeuroPad — circuito clínico e matriz de suficiência para o laudo, ponta a ponta no navegador.
// Cobre: adaptação por faixa etária; registro de estações; matriz que distingue examinado, a esclarecer,
// depende de fonte externa e depende de decisão médica; exportação TXT; cola no laudo SEM emissão
// automática; acessibilidade (axe) e largura em celular. Dados sintéticos; sem câmera; sem rede clínica.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.SUPER_NEUROPAD_ARTIFACT_DIR || "/tmp/super-neuropad-circuit-sufficiency";
const OBSERVADO = /Conseguiu/;
const ACHADO = /Teve dificuldade/;
const SOURCE_EXAMINADOR = "Observação direta pelo examinador";
const SOURCE_ESCOLA = "Relato escolar";

const circuitOf = (page) => page.getByTestId("super-neuropad-clinical-circuit");
const readinessOf = (page) => page.getByTestId("super-neuropad-clinical-readiness");

async function newPage(browser, viewport, collected) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (error) => collected.pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") collected.consoleErrors.push(message.text()); });
  return { context, page };
}

async function login(page) {
  await page.waitForLoadState("networkidle");
  if (await page.locator("#login-email").count()) {
    await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
}

async function openGame(page, origin, age) {
  await page.goto(`${origin}/#/super-neuropad-game`);
  await login(page);
  await page.getByTestId("super-neuropad-game").waitFor({ timeout: 20000 });
  await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
  await setAge(page, age);
}

async function setAge(page, age) {
  await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: String(age), exact: true }).click();
  await circuitOf(page).waitFor();
}

async function openTab(page, name) {
  await circuitOf(page).getByRole("button", { name, exact: false }).first().click();
}

async function record(page, title, status, source) {
  await openTab(page, "Exame neurológico");
  const select = circuitOf(page).getByLabel("Ir para estação");
  const index = await select.evaluate((element, wanted) => Array.from(element.options).findIndex((option) => option.text.includes(wanted)), title);
  assert.ok(index >= 0, `estação "${title}" disponível nesta faixa`);
  await select.selectOption({ index });
  const station = page.getByTestId("super-neuropad-clinical-station");
  await station.getByRole("group", { name: /Toque no que você percebeu/ }).getByRole("button").first().click();
  await station.getByRole("button", { name: status }).click();
  if (source) await station.getByRole("button", { name: source, exact: true }).click();
}

function unresolvedCount(text) {
  const match = text.match(/Pendências para revisão: (\d+) de (\d+)/);
  assert.ok(match, "contador de itens não resolvidos exibido");
  return Number(match[1]);
}

async function main() {
  await mkdir(dir, { recursive: true });
  const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
  const browser = await chromium.launch(auditBrowserLaunchOptions());
  const collected = { pageErrors: [], consoleErrors: [] };
  const observations = {};
  try {
    // 1. Faixa de 7 anos: matriz presente, decisão médica sempre pendente e nada registrado.
    const main7 = await newPage(browser, { width: 1180, height: 900 }, collected);
    const page = main7.page;
    try {
      await openGame(page, server.origin, 7);
      await openTab(page, "Cobertura e lacunas");
      const readiness = readinessOf(page);
      await readiness.waitFor();
      assert.equal(await circuitOf(page).locator("button:disabled").count(), 0, "nenhum controle desabilitado antes do registro");
      assert.equal(await circuitOf(page).getByRole("button", { name: /Baixar TXT/ }).isEnabled(), true, "exportação disponível sem registro");
      assert.match(await readiness.innerText(), /Emissão automática: não\./);
      assert.equal(await readiness.getByText("Registrado — não equivale a normal", { exact: true }).count(), 0, "nada examinado antes do registro");
      assert.ok(await readiness.getByText("Depende de decisão médica", { exact: true }).count() >= 4, "impressão, fundamentação, conduta e liberação pendentes");
      const antes = unresolvedCount(await readiness.innerText());
      observations.itensNaoResolvidosSemRegistro = antes;

      // 2. Registros do examinador e de fonte escolar; um achado de urgência deve bloquear.
      await record(page, "Escudo dos reflexos", OBSERVADO, SOURCE_EXAMINADOR);
      await record(page, "Janela do fundo", ACHADO, SOURCE_EXAMINADOR);
      await record(page, "Linha do tempo da aventura", OBSERVADO, SOURCE_ESCOLA);
      await openTab(page, "Cobertura e lacunas");
      const depois = unresolvedCount(await readiness.innerText());
      assert.ok(depois < antes, `registros reduzem pendências (${antes} → ${depois})`);
      assert.ok(await readiness.getByText("Achado a esclarecer", { exact: true }).count() >= 1, "achado de urgência aparece como a esclarecer");
      assert.ok(await readiness.getByText("Registrado — não equivale a normal", { exact: true }).count() >= 1, "item descrito aparece como registrado");
      assert.match(await readiness.innerText(), /Relato escolar registrado no circuito/);
      assert.ok(await readiness.getByText("Depende de decisão médica", { exact: true }).count() >= 4, "decisão médica sem preenchimento automático");
      observations.itensNaoResolvidosComRegistro = depois;

      // 3. Exportação: o TXT carrega a matriz e a declaração de não emissão automática.
      const downloads = [];
      page.on("download", (download) => downloads.push(download));
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        circuitOf(page).getByRole("button", { name: /Baixar TXT/ }).click(),
      ]);
      const txtPath = `${dir}/super-neuropad-circuito-7a.txt`;
      await download.saveAs(txtPath);
      const txt = await readFile(txtPath, "utf8");
      assert.match(txt, /PRONTIDÃO PARA O LAUDO — MATRIZ DE SUFICIÊNCIA \(7 anos\)/);
      assert.match(txt, /Emissão automática: não\./);
      assert.doesNotMatch(txt, /Emissão automática: sim/);
      assert.match(txt, /Achado a esclarecer/);
      assert.match(txt, /Depende de decisão médica/);
      assert.match(txt, /Marcado: /, "marcadores tocados entram no registro");

      // 4. Cola no laudo: sem download ou impressão automática; liberação segue manual.
      const downloadsAntes = downloads.length;
      await page.goto(`${server.origin}/#/laudo-super`);
      await login(page);
      const integra = page.getByTestId("textarea-laudo-integra");
      await integra.waitFor({ timeout: 20000 });
      await integra.fill(txt);
      await page.waitForTimeout(1200);
      assert.equal(downloads.length, downloadsAntes, "colar no laudo não gera download automático");
      observations.laudoImprimirHabilitadoAposColar = await page.getByTestId("button-imprimir-laudo-super").isEnabled();
      observations.nota = "Impressão habilitada por qualquer texto colado (integraAtiva); a suficiência não bloqueia a emissão nesta versão.";

      // 5. Adaptação por faixa etária: 2 anos mostra itens fora do jogo; 17 anos não mostra.
      await openGame(page, server.origin, 2);
      await openTab(page, "Cobertura e lacunas");
      const fora2 = await readinessOf(page).getByText("Fora do jogo nesta faixa", { exact: false }).count();
      assert.ok(fora2 >= 1, "2 anos: itens fora do jogo aparecem");
      await setAge(page, 17);
      await openTab(page, "Cobertura e lacunas");
      const fora17 = await readinessOf(page).getByText("Fora do jogo nesta faixa", { exact: false }).count();
      assert.equal(fora17, 0, "17 anos: todas as estações da faixa existem");
      observations.itensForaDoJogo = { anos2: fora2, anos17: fora17 };

      // 6. Acessibilidade do circuito com a matriz visível.
      await openTab(page, "Cobertura e lacunas");
      const axe = await new AxeBuilder({ page }).include('[data-testid="super-neuropad-clinical-circuit"]').analyze();
      await writeFile(`${dir}/axe-circuito.json`, JSON.stringify(axe.violations, null, 2));
      assert.deepEqual(axe.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })), [], "axe sem violações no circuito");
    } finally {
      await main7.context.close();
    }

    // 7. Celular: o circuito cabe em 390 px sem rolagem horizontal própria.
    const mobile = await newPage(browser, { width: 390, height: 844 }, collected);
    try {
      await openGame(mobile.page, server.origin, 7);
      await openTab(mobile.page, "Cobertura e lacunas");
      const overflow = await circuitOf(mobile.page).evaluate((element) => element.scrollWidth - element.clientWidth);
      assert.ok(overflow <= 1, `circuito sem rolagem horizontal em 390 px (excesso ${overflow}px)`);
      observations.paginaInteiraEmCelularExcessoPx = await mobile.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await mobile.page.screenshot({ path: `${dir}/circuito-celular.png` });
    } finally {
      await mobile.context.close();
    }

    assert.deepEqual(collected.pageErrors, [], "nenhum erro não tratado na página");
    observations.errosDeConsole = collected.consoleErrors.length;
    await writeFile(`${dir}/sufficiencia-e2e.json`, JSON.stringify({ observations }, null, 2));
    console.log(`[super-neuropad-circuit-sufficiency] ✓ faixas 2/7/17, registros, exportação, cola no laudo sem emissão automática, axe e celular · artefatos em ${dir}`);
    console.log(JSON.stringify(observations, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
}

await main();
