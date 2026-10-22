// Super NeuroPad — circuito clínico e matriz de suficiência para o laudo, ponta a ponta no navegador.
// Cobre: adaptação por faixa etária; registro de estações; matriz que distingue examinado, a esclarecer,
// depende de fonte externa e depende de decisão médica; exportação TXT; cola no laudo SEM emissão
// automática; acessibilidade (axe) e largura em celular. Estrutura obrigatória: toda missão exige resultado,
// quem informou e marcador ou descrição (descrição do achado em "Teve dificuldade") e a síntese final; o circuito
// é declarado COMPLETO ou INCOMPLETO sem desabilitar nenhum controle. Dados sintéticos; sem câmera; sem rede clínica.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.SUPER_NEUROPAD_ARTIFACT_DIR || "/tmp/super-neuropad-circuit-sufficiency";
const OBSERVADO = /Conseguiu/;
const ACHADO = /^🤔 Teve dificuldade/;
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
  // O padrão agora é pré-consulta; este E2E examina o percurso reservado ao médico.
  await circuitOf(page).getByRole("button", { name: /Avaliação médica/ }).click();
}

async function openTab(page, name) {
  await circuitOf(page).getByRole("button", { name, exact: false }).first().click();
}

async function record(page, title, status, source, nota = "") {
  await openTab(page, "Exame neurológico");
  const select = circuitOf(page).getByLabel("Ir para estação");
  const index = await select.evaluate((element, wanted) => Array.from(element.options).findIndex((option) => option.text.includes(wanted)), title);
  assert.ok(index >= 0, `estação "${title}" disponível nesta faixa`);
  await select.selectOption({ index });
  const station = page.getByTestId("super-neuropad-clinical-station");
  await station.getByRole("group", { name: /Toque no que você percebeu/ }).getByRole("button").first().click();
  await station.getByRole("button", { name: status }).click();
  if (source) await station.getByRole("button", { name: source, exact: true }).click();
  if (nota) {
    const toggle = station.getByRole("button", { name: /Anotação livre/ });
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await station.locator("textarea").fill(nota);
  }
}

/** Conclui uma missão pelo caminho real da interface: marcador, resultado, quem informou (e descrição se não gamificada). */
async function concluirMissao(page, aba, indice) {
  await openTab(page, aba);
  await circuitOf(page).getByLabel("Ir para estação").selectOption({ index: indice });
  const station = page.getByTestId("super-neuropad-clinical-station");
  const marcadores = station.getByRole("group", { name: /Toque no que você percebeu/ });
  if (await marcadores.count()) {
    const primeiro = marcadores.getByRole("button").first();
    if ((await primeiro.getAttribute("aria-pressed")) !== "true") await primeiro.click();
    await station.getByRole("button", { name: OBSERVADO }).click();
  } else {
    await station.getByRole("button", { name: /^Realizado — registrar descrição/ }).click();
    await station.locator("textarea").fill("Descrição sintética de teste da entrevista profissional.");
  }
  await station.getByRole("button", { name: SOURCE_EXAMINADOR, exact: true }).click();
  assert.match(await station.getByTestId("super-neuropad-mission-status").innerText(), /Missão concluída/, `missão ${indice} da aba "${aba}" concluída`);
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
      // Percurso real de pré-consulta: acesso simples e atos médicos fora do roteiro da assistente.
      await circuitOf(page).getByRole("button", { name: /Pré-consulta · assistente/ }).click();
      await circuitOf(page).getByTestId("super-neuropad-preconsulta-help").waitFor();
      const preOptions = await circuitOf(page).getByLabel("Ir para estação").locator("option").allTextContents();
      assert.ok(preOptions.some((item) => item.includes("Portal do encontro")), "começa pelo acolhimento");
      assert.ok(!preOptions.some((item) => /Escudo dos reflexos|Janela do fundo|Nuca em alerta/.test(item)), "procedimentos médicos ocultos para assistente");
      const preStation = circuitOf(page).getByTestId("super-neuropad-clinical-station");
      assert.match(await preStation.innerText(), /3 passos fáceis/);
      assert.match(await preStation.innerText(), /Observação direta pela assistente na pré-consulta/);
      await circuitOf(page).getByRole("button", { name: /Avaliação médica/ }).click();
      const unexpectedDownloads = [];
      page.on("download", (download) => unexpectedDownloads.push(download));
      await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("permission denied"); } } }));
      await circuitOf(page).getByRole("button", { name: /Copiar registro clínico/ }).click();
      await circuitOf(page).getByText(/nenhum arquivo foi criado automaticamente/i).waitFor();
      assert.equal(unexpectedDownloads.length, 0, "falha ao copiar não deve baixar arquivo sem pedido");
      const idade7 = circuitOf(page).getByTestId("super-neuropad-age-profile");
      assert.match(await idade7.innerText(), /Roteiro de 7 anos · Detetives do cotidiano/);
      await openTab(page, "Exame neurológico");
      assert.match(await circuitOf(page).getByTestId("super-neuropad-age-station-guidance").innerText(), /Adaptação para 7 anos/);
      await openTab(page, "Cobertura e lacunas");
      const readiness = readinessOf(page);
      await readiness.waitFor();
      assert.equal(await circuitOf(page).locator("button:disabled").count(), 0, "nenhum controle desabilitado antes do registro");
      assert.equal(await circuitOf(page).getByRole("button", { name: /Baixar TXT/ }).isEnabled(), true, "exportação disponível sem registro");
      assert.match(await readiness.innerText(), /Emissão automática: não\./);
      assert.equal(await readiness.getByText("Registrado — não equivale a normal", { exact: true }).count(), 0, "nada examinado antes do registro");
      assert.ok(await readiness.getByText("Depende de decisão médica", { exact: true }).count() >= 4, "impressão, fundamentação, conduta e liberação pendentes");
      const antes = unresolvedCount(await readiness.innerText());
      assert.equal(await readiness.getByText(/ATENÇÃO CLÍNICA:/).count(), 0, "item pendente não emite alerta sem achado");
      observations.itensNaoResolvidosSemRegistro = antes;

      // 2. Registros do examinador e de fonte escolar; um achado de urgência deve bloquear.
      await record(page, "Escudo dos reflexos", OBSERVADO, SOURCE_EXAMINADOR);
      await openTab(page, "Exame neurológico");
      const selectReflex = circuitOf(page).getByLabel("Ir para estação");
      const indexReflex = await selectReflex.evaluate((el) => Array.from(el.options).findIndex((option) => option.text.includes("Escudo dos reflexos")));
      await selectReflex.selectOption({ index: indexReflex });
      const reflexStation = page.getByTestId("super-neuropad-clinical-station");
      await reflexStation.getByRole("button", { name: /Não deu para fazer/ }).click();
      assert.equal(await reflexStation.getByRole("group", { name: /Toque no que você percebeu/ }).getByRole("button", { pressed: true }).count(), 0, "marcadores removidos após não realização");
      const [refusalDownload] = await Promise.all([
        page.waitForEvent("download"),
        circuitOf(page).getByRole("button", { name: /Baixar TXT/ }).click(),
      ]);
      const refusalPath = `${dir}/recusa-sem-marcadores.txt`;
      await refusalDownload.saveAs(refusalPath);
      const refusalText = await readFile(refusalPath, "utf8");
      assert.match(refusalText, /Escudo dos reflexos[^\n]*Não realizado/);
      assert.doesNotMatch(refusalText, /Marcado:/, "tarefa não executada não exporta marcadores");
      await reflexStation.getByRole("button", { name: OBSERVADO }).click();
      await reflexStation.getByRole("group", { name: /Toque no que você percebeu/ }).getByRole("button").first().click();
      await record(page, "Janela do fundo", ACHADO, SOURCE_EXAMINADOR);
      // Obrigatório: "Teve dificuldade" sem descrição do achado deixa a missão pendente, sem desabilitar nada.
      const fundusStation = page.getByTestId("super-neuropad-clinical-station");
      assert.match(await fundusStation.getByTestId("super-neuropad-mission-status").innerText(), /Obrigatório ainda pendente.*descrição do achado/);
      assert.equal(await circuitOf(page).locator("button:disabled").count(), 0, "pendência obrigatória não desabilita controles");
      const axeEstacao = await new AxeBuilder({ page }).include('[data-testid="super-neuropad-clinical-station"]').analyze();
      await writeFile(`${dir}/axe-estacao-pendente.json`, JSON.stringify(axeEstacao.violations, null, 2));
      assert.deepEqual(axeEstacao.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })), [], "axe sem violações na missão com pendência obrigatória");
      await fundusStation.locator("textarea").fill("Achado sintético de teste descrito pelo examinador em frase completa.");
      assert.match(await fundusStation.getByTestId("super-neuropad-mission-status").innerText(), /Missão concluída/);
      await record(page, "Linha do tempo da aventura", OBSERVADO, SOURCE_ESCOLA, "Relatório da escola descreve leitura e escrita adequadas à série e atenção oscilante em atividades longas.");
      await openTab(page, "Cobertura e lacunas");
      const depois = unresolvedCount(await readiness.innerText());
      assert.ok(depois < antes, `registros reduzem pendências (${antes} → ${depois})`);
      assert.ok(await readiness.getByText("Achado a esclarecer", { exact: true }).count() >= 1, "achado de urgência aparece como a esclarecer");
      assert.ok(await readiness.getByText("Registrado — não equivale a normal", { exact: true }).count() >= 1, "item descrito aparece como registrado");
      assert.match(await readiness.innerText(), /Relato escolar com descrição do funcionamento registrado no circuito/);
      assert.ok(await readiness.getByText("Depende de decisão médica", { exact: true }).count() >= 4, "decisão médica sem preenchimento automático");
      observations.itensNaoResolvidosComRegistro = depois;
      const chipConcluidas = (await circuitOf(page).innerText()).match(/(\d+)\/(\d+) missões concluídas/i);
      assert.ok(chipConcluidas, "contador de missões concluídas exibido");
      assert.equal(chipConcluidas[1], "3", `reflexos, fundo de olho e marcos concluídos; as demais seguem pendentes (exibido ${chipConcluidas[0]})`);

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
      assert.match(txt, /ATENÇÃO CLÍNICA:/, "achado a esclarecer aparece em aviso clínico, não como pendência de checklist");
      assert.match(txt, /Depende de decisão médica/);
      assert.match(txt, /Marcado: /, "marcadores tocados entram no registro");
      assert.match(txt, /CIRCUITO CLÍNICO OBRIGATÓRIO: INCOMPLETO — 3 de \d+ missões concluídas; síntese do examinador pendente\./);
      assert.match(txt, /Síntese final do examinador: falta registrar\./);
      assert.match(txt, /Obrigatório não trava a interface nem libera documento/);

      // 3b. Estrutura obrigatória de ponta a ponta (9 anos, inclui a entrevista de segurança não gamificada):
      // só fica COMPLETO com todas as missões concluídas e a síntese final; nenhum controle é desabilitado.
      await openGame(page, server.origin, 9);
      const aviso = page.getByTestId("super-neuropad-circuit-required");
      // A troca de idade remonta o circuito e zera os registros; aguarda o contador refletir isso antes de afirmar.
      await page.waitForFunction(() => /0\/\d+ missões concluídas/i.test(document.querySelector('[data-testid="super-neuropad-circuit-required"]')?.textContent ?? ""));
      assert.match(await aviso.innerText(), /0\/\d+ missões concluídas · incompleto — abrir/i);
      assert.match(await page.getByRole("list", { name: "Passos da preparação" }).innerText(), /Circuito clínico 0\/\d+/i);
      let totalMissoes = 0;
      for (const aba of ["Exame neurológico", "Estado mental"]) {
        await openTab(page, aba);
        const total = await circuitOf(page).getByLabel("Ir para estação").locator("option").count();
        totalMissoes += total;
        for (let indice = 0; indice < total; indice++) await concluirMissao(page, aba, indice);
      }
      assert.match(await circuitOf(page).innerText(), new RegExp(`${totalMissoes}/${totalMissoes} missões concluídas`, "i"));
      await openTab(page, "Cobertura e lacunas");
      const obrigatorios = circuitOf(page).getByTestId("super-neuropad-clinical-mandatory");
      assert.match(await obrigatorios.innerText(), /Todas as missões obrigatórias estão concluídas/i);
      assert.match(await obrigatorios.innerText(), /Falta a síntese final do examinador/i);
      assert.match(await aviso.innerText(), /incompleto — abrir/i, "sem a síntese final o circuito segue incompleto");
      await circuitOf(page).getByLabel(/Síntese final do examinador/).fill("Síntese sintética de teste, sem dados reais.");
      // O aviso da página é atualizado por um efeito do React, um instante depois do preenchimento: espera refletir antes de afirmar.
      await page.waitForFunction((total) => new RegExp(`${total}/${total} missões concluídas · completo — abrir`, "i")
        .test(document.querySelector('[data-testid="super-neuropad-circuit-required"]')?.textContent ?? ""), totalMissoes);
      assert.match(await aviso.innerText(), new RegExp(`${totalMissoes}/${totalMissoes} missões concluídas · completo — abrir`, "i"));
      assert.equal(await circuitOf(page).locator("button:disabled").count(), 0, "nenhum controle desabilitado com a estrutura completa");
      const [downloadCompleto] = await Promise.all([page.waitForEvent("download"), circuitOf(page).getByRole("button", { name: /Baixar TXT/ }).click()]);
      const caminhoCompleto = `${dir}/circuito-obrigatorio-completo-9a.txt`;
      await downloadCompleto.saveAs(caminhoCompleto);
      const txtCompleto = await readFile(caminhoCompleto, "utf8");
      assert.match(txtCompleto, new RegExp(`CIRCUITO CLÍNICO OBRIGATÓRIO: COMPLETO — ${totalMissoes} de ${totalMissoes} missões concluídas; síntese do examinador registrada\\.`));
      assert.doesNotMatch(txtCompleto, /INCOMPLETO/);
      observations.circuitoObrigatorioCompleto9Anos = totalMissoes;

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
      assert.match(await circuitOf(page).getByTestId("super-neuropad-age-profile").innerText(), /Roteiro de 2 anos · Pequenas descobertas/);
      await openTab(page, "Cobertura e lacunas");
      const fora2 = await readinessOf(page).getByText("Fora do jogo nesta faixa", { exact: false }).count();
      assert.ok(fora2 >= 1, "2 anos: itens fora do jogo aparecem");
      await setAge(page, 17);
      assert.match(await circuitOf(page).getByTestId("super-neuropad-age-profile").innerText(), /Roteiro de 17 anos · Transição de cuidados/);
      await openTab(page, "Cobertura e lacunas");
      const fora17 = await readinessOf(page).getByText("Fora do jogo nesta faixa", { exact: false }).count();
      assert.equal(fora17, 0, "17 anos: todas as estações da faixa existem");
      observations.itensForaDoJogo = { anos2: fora2, anos17: fora17 };

      // 5b. Todas as faixas de 2 a 17: matriz presente, nenhum controle desabilitado e guias de hipótese conforme a faixa.
  for (let age = 2; age <= 17; age++) {
    await setAge(page, age);
    await openTab(page, "Cobertura e lacunas");
    const readinessAge = readinessOf(page);
    await readinessAge.waitFor();
    assert.equal(await page.getByTestId("super-neuropad-clinical-circuit").count(), 1, `faixa ${age}: apenas um circuito`);
    assert.match(await circuitOf(page).getByTestId("super-neuropad-age-profile").innerText(), new RegExp(`Roteiro de ${age} anos`));
    assert.match(await circuitOf(page).innerText(), /0\/\d+ missões concluídas/i, `faixa ${age}: dados de outra idade não podem migrar`);
    assert.match(await readinessAge.innerText(), /Emissão automática: não\./, `faixa ${age}: sem emissão automática`);
    assert.equal(await circuitOf(page).locator("button:disabled").count(), 0, `faixa ${age}: nenhum controle desabilitado`);
    const guias = await circuitOf(page).getByTestId("super-neuropad-clinical-hypotheses").locator("article").count();
    assert.equal(guias, age <= 5 ? 1 : age <= 11 ? 1 : 2, `faixa ${age}: guias de hipótese conforme a faixa`);
  }
  observations.faixasVerificadas = 16;

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
