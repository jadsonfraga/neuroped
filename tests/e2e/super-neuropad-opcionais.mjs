// Super NeuroPad — extensão opcional (50 desafios disponíveis por idade), ponta a ponta no navegador.
// Cobre: 50 = bateria principal + opcionais em todas as 16 idades; bateria principal inalterada; registro
// próprio (toque e fala), pausa, troca de idade sem perder registros, cópia que só conta o retrato copiado,
// painel nos resultados, "Nova partida" que pergunta antes de apagar opcionais não copiados, nenhum controle
// desabilitado no painel, axe e largura em celular. Dados sintéticos; sem câmera; sem rede clínica.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.SUPER_NEUROPAD_ARTIFACT_DIR || "/tmp/super-neuropad-opcionais";
// Mesma guarda de toque duplo do jogo (300 ms entre registros aceitos), com margem.
const MANUAL_TAP_GAP_MS = 320;
const MAIN = { 2: 18, 3: 24, 4: 24, 5: 24, 6: 30, 7: 30 };
const mainFor = (age) => MAIN[age] ?? 36;

const panelOf = (page) => page.getByTestId("super-neuropad-optional");
const countOf = async (page) => (await panelOf(page).getByTestId("super-neuropad-optional-count").innerText()).trim();

async function newPage(browser, viewport, collected) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (error) => collected.pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") collected.consoleErrors.push(message.text()); });
  return { context, page };
}

async function openGame(page, origin) {
  await page.goto(`${origin}/#/super-neuropad-game`);
  await page.waitForLoadState("networkidle");
  if (await page.locator("#login-email").count()) {
    await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId("super-neuropad-game").waitFor({ timeout: 20000 });
}

async function setAge(page, age) {
  await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: String(age), exact: true }).click();
  await panelOf(page).waitFor();
  await page.waitForFunction((wanted) => document.querySelector('[data-testid="super-neuropad-optional"] h2')?.textContent?.includes(`${wanted} anos`), age);
}

/** Vai ao opcional pelo seletor, pelo texto do enunciado. */
async function goTo(page, predicate, label) {
  const select = panelOf(page).getByLabel("Ir para o desafio opcional");
  const texts = await select.evaluate((element) => Array.from(element.options).map((option) => option.text));
  const index = texts.findIndex(predicate);
  assert.ok(index >= 0, `opcional encontrado (${label})`);
  await select.selectOption({ index });
}

async function main() {
  await mkdir(dir, { recursive: true });
  const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
  const browser = await chromium.launch(auditBrowserLaunchOptions());
  const collected = { pageErrors: [], consoleErrors: [] };
  const observations = {};
  try {
    const { context, page } = await newPage(browser, { width: 1180, height: 900 }, collected);
    const dialogs = [];
    let acceptDialog = () => true;
    page.on("dialog", (dialog) => { dialogs.push(dialog.message()); return acceptDialog(dialog.message()) ? dialog.accept() : dialog.dismiss(); });
    try {
      await openGame(page, server.origin);
      assert.match(await page.getByTestId("super-neuropad-game").innerText(), /50 disponíveis por idade com os opcionais/i);

      // 1. As 16 idades: 50 disponíveis; a bateria principal continua com a contagem de antes.
      for (let age = 2; age <= 17; age++) {
        await setAge(page, age);
        const estimate = await page.getByTestId("super-neuropad-estimate").innerText();
        assert.match(estimate, new RegExp(`${mainFor(age)} desafios em 6 mundos`), `${age} anos: bateria principal inalterada`);
        assert.match(await panelOf(page).innerText(), new RegExp(`50 disponíveis: ${mainFor(age)} na bateria principal \\+ ${50 - mainFor(age)} opcionais`), `${age} anos: 50 disponíveis`);
        assert.match(await countOf(page), new RegExp(`^0 de ${50 - mainFor(age)} registrados$`, "i"));
      }
      observations.idadesVerificadas = 16;

      // 2. Aos 2 anos: abrir, registrar por toque e por fala, pausar e retomar.
      await setAge(page, 2);
      const panel = panelOf(page);
      assert.equal(await panel.getByTestId("super-neuropad-optional-stage").count(), 0, "recolhido por padrão");
      await panel.getByRole("button", { name: "Abrir opcionais" }).click();
      const stage = panel.getByTestId("super-neuropad-optional-stage");
      await stage.waitFor();
      assert.match(await stage.innerText(), /Opcional 1 de 32/i);
      assert.equal(await panel.locator("button:disabled, select:disabled").count(), 0, "nenhum controle desabilitado no painel");
      await page.waitForTimeout(MANUAL_TAP_GAP_MS);
      await stage.getByRole("group", { name: "Opções" }).getByRole("button").first().click();
      await page.waitForFunction(() => /^1 de 32/i.test(document.querySelector('[data-testid="super-neuropad-optional-count"]')?.textContent?.trim() ?? ""));
      assert.match(await stage.innerText(), /Opcional 2 de 32/i, "segue para o próximo pendente");
      assert.match(await panel.getByTestId("super-neuropad-optional-status").innerText(), /1 registro\(s\) opcional\(is\) ainda não copiado/);

      await panel.getByRole("button", { name: "Pausar opcionais" }).click();
      assert.equal(await panel.getByTestId("super-neuropad-optional-stage").count(), 0, "pausa esconde o desafio");
      await panel.getByText(/Opcionais em pausa/).waitFor();
      await panel.getByRole("button", { name: "Retomar opcionais" }).click();
      await stage.waitFor();

      // 2b. Auditoria 21/10/2026: aviso de idade só no item de letra aos 2 anos; troca de aba pausa os opcionais.
      await goTo(page, (text) => /Toque na LETRA/.test(text), "letra aos 2 anos");
      const note = stage.getByTestId("super-neuropad-optional-age-note");
      await note.waitFor();
      assert.match(await note.innerText(), /Aviso de idade: reconhecer letras ou números não é marco universal aos 2 anos/);
      assert.equal(await panel.locator("button:disabled, select:disabled").count(), 0, "aviso não desabilita nada");
      await goTo(page, (text) => /Toque no cachorro|Toque no olho|Toque no sapato/.test(text) && text.startsWith("○"), "figura sem aviso");
      assert.equal(await stage.getByTestId("super-neuropad-optional-age-note").count(), 0, "item de figura não leva aviso");
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await panel.getByText(/Opcionais em pausa/).waitFor();
      assert.equal(await panel.getByTestId("super-neuropad-optional-stage").count(), 0, "troca de aba pausa os opcionais");
      await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); });
      await panel.getByRole("button", { name: "Retomar opcionais" }).click();
      await stage.waitFor();
      observations.avisoDeIdadeAos2Anos = true;
      observations.pausaPorTrocaDeAba = true;

      await goTo(page, (text) => text.startsWith("○") && /O que é isto|Como|nome|Diga|Fale/i.test(text), "fala pendente");
      const judged = stage.getByRole("button", { name: "Acertou", exact: true });
      if (await judged.count()) {
        await page.waitForTimeout(MANUAL_TAP_GAP_MS);
        await judged.click();
      } else {
        await page.waitForTimeout(MANUAL_TAP_GAP_MS);
        await stage.getByRole("group", { name: "Opções" }).getByRole("button").first().click();
      }
      await page.waitForFunction(() => /^2 de 32/i.test(document.querySelector('[data-testid="super-neuropad-optional-count"]')?.textContent?.trim() ?? ""));
      const axe = await new AxeBuilder({ page }).include('[data-testid="super-neuropad-optional"]').analyze();
      await writeFile(`${dir}/axe-opcionais.json`, JSON.stringify(axe.violations, null, 2));
      assert.deepEqual(axe.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })), [], "axe sem violações no painel aberto");
      await page.screenshot({ path: `${dir}/opcionais-2-anos.png`, fullPage: true });

      // 2c. Aos 3 anos "cor vermelha" e "vermelho" não aparecem as duas vezes no seletor.
      await setAge(page, 3);
      await panelOf(page).getByRole("button", { name: "Abrir opcionais" }).click();
      const textos3 = await panelOf(page).getByLabel("Ir para o desafio opcional").evaluate((element) => Array.from(element.options).map((option) => option.text));
      assert.ok(!(textos3.some((text) => /Toque na cor VERMELHA/.test(text)) && textos3.some((text) => /Toque no vermelho/.test(text))), "3 anos: cor repetida");
      assert.equal(textos3.length, 26, "3 anos: continuam 26 opcionais (24 + 26 = 50)");
      await setAge(page, 2);
      await panelOf(page).getByRole("button", { name: "Abrir opcionais" }).click(); // o painel é recriado por idade
      await stage.waitFor();

      // 3. Cópia: o texto traz os 2 registros e o status passa a copiado; um registro novo volta a ficar pendente.
      await panel.getByRole("button", { name: "Copiar registro dos opcionais" }).click();
      await panel.getByTestId("super-neuropad-optional-status").getByText("Registro dos opcionais copiado.").waitFor();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.match(copied, /DESAFIOS OPCIONAIS/);
      assert.match(copied, /50 desafios \(18 na bateria principal \+ 32 opcionais\)/);
      assert.match(copied, /Opcionais registrados: 2 de 32\./);
      assert.doesNotMatch(copied, /\bnível|\bcortes?\b|percentil|escore|pontuação|alerta|triagem|esperado para/i);
      await page.waitForTimeout(MANUAL_TAP_GAP_MS);
      await goTo(page, (text) => text.startsWith("○"), "primeiro pendente");
      const touch = stage.getByRole("group", { name: "Opções" });
      if (await touch.count()) await touch.getByRole("button").first().click();
      else await stage.getByRole("button", { name: "Acertou", exact: true }).click();
      await panel.getByTestId("super-neuropad-optional-status").getByText(/1 registro\(s\) opcional\(is\) ainda não copiado/).waitFor();
      assert.match(await countOf(page), /^3 de 32/i);

      // 4. Trocar a idade não apaga: 9 anos começa do zero; voltar a 2 anos mantém os 3 registros.
      await setAge(page, 9);
      assert.match(await countOf(page), /^0 de 14 registrados$/i);
      await setAge(page, 2);
      assert.match(await countOf(page), /^3 de 32 registrados$/i);
      observations.registrosMantidosNaTrocaDeIdade = 3;

      // 5. Partida principal intacta; o painel aparece nos resultados com os mesmos registros da idade.
      await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
      await page.getByRole("button", { name: "Começar a aventura", exact: true }).click();
      await page.getByRole("button", { name: /Entrar na fase/ }).click();
      assert.equal(await panelOf(page).count(), 0, "painel opcional fora da partida");
      await page.getByText("Desafio 1 de 3").waitFor();
      await page.waitForTimeout(MANUAL_TAP_GAP_MS);
      const mainTouch = page.getByRole("group", { name: "Opções" });
      if (await mainTouch.count()) await page.getByRole("button", { name: "Aplicadora: não respondeu · pular", exact: true }).click();
      else await page.getByRole("button", { name: "Não respondeu", exact: true }).click();
      await page.getByRole("button", { name: "Encerrar", exact: true }).click();
      await page.locator('[data-testid="super-neuropad-game"][data-screen="results"]').waitFor();
      await page.getByTestId("super-neuropad-incomplete").getByText(/partida incompleta \(1 de 18 itens\)/).waitFor();
      assert.match(await countOf(page), /^3 de 32 registrados$/i, "resultados mostram os opcionais da idade");

      // 6. "Nova partida" pergunta antes de apagar opcionais não copiados; recusar mantém tudo.
      // Aceita o aviso do resultado principal e recusa só o dos opcionais.
      acceptDialog = (message) => !/opcional/.test(message);
      await page.getByRole("button", { name: "Nova partida", exact: true }).click();
      assert.ok(dialogs.some((message) => /opcional\(is\) registrado\(s\) ainda não foram copiados/.test(message)), "aviso dos opcionais");
      assert.match(await countOf(page), /^3 de 32/i);
      assert.equal(await page.getByTestId("super-neuropad-game").getAttribute("data-screen"), "results", "recusar mantém o resultado e os opcionais");
      acceptDialog = () => true;
      await page.getByRole("button", { name: "Nova partida", exact: true }).click();
      await page.locator('[data-testid="super-neuropad-game"][data-screen="setup"]').waitFor();
      await setAge(page, 2);
      assert.match(await countOf(page), /^0 de 32 registrados$/i, "nova criança começa sem opcionais");
      const storage = await page.evaluate(() => Object.keys(localStorage).filter((key) => /neuropad|super|opcion/i.test(key)));
      assert.deepEqual(storage, [], "nada dos opcionais persistido no navegador");
    } finally {
      await context.close();
    }

    // 7. Celular: o painel aberto cabe em 390 px sem rolagem horizontal.
    const mobile = await newPage(browser, { width: 390, height: 844 }, collected);
    try {
      await openGame(mobile.page, server.origin);
      await setAge(mobile.page, 14);
      await panelOf(mobile.page).getByRole("button", { name: "Abrir opcionais" }).click();
      await panelOf(mobile.page).getByTestId("super-neuropad-optional-stage").waitFor();
      const overflow = await panelOf(mobile.page).evaluate((element) => element.scrollWidth - element.clientWidth);
      assert.ok(overflow <= 1, `painel sem rolagem horizontal em 390 px (excesso ${overflow}px)`);
      observations.paginaInteiraEmCelularExcessoPx = await mobile.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(observations.paginaInteiraEmCelularExcessoPx <= 1, "página sem rolagem horizontal em 390 px");
      assert.equal(await mobile.page.getByTestId("super-neuropad-game").getAttribute("data-age-style"), "adolescente", "apresentação sóbria a partir de 13 anos");
      await mobile.page.screenshot({ path: `${dir}/opcionais-celular.png`, fullPage: true });

      // 7b. Auditoria 21/10/2026: durante a partida no celular a barra do app e o botão de ajuda saem do caminho e
      // os botões de resposta ficam livres; fora da partida a barra volta.
      mobile.page.on("dialog", (dialog) => dialog.accept());
      const dock = mobile.page.getByTestId("mobile-primary-dock");
      await dock.waitFor();
      await mobile.page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
      await mobile.page.getByRole("button", { name: "Começar a aventura", exact: true }).click();
      await mobile.page.getByRole("button", { name: /Entrar na fase/ }).click();
      await mobile.page.getByText(/Desafio 1 de/).waitFor();
      assert.equal(await dock.isVisible(), false, "barra inferior escondida durante a partida");
      assert.equal(await mobile.page.getByTestId("button-floating-help").isVisible(), false, "botão de ajuda escondido durante a partida");
      const answer = mobile.page.locator('[data-testid="super-neuropad-game"] button:has-text("Acertou"), [data-testid="super-neuropad-game"] [role="group"][aria-label="Opções"] button').first();
      await answer.scrollIntoViewIfNeeded();
      const covered = await answer.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + box.width / 2, Math.min(box.top + box.height / 2, window.innerHeight - 2));
        return !(top && (top === element || element.contains(top)));
      });
      assert.equal(covered, false, "nenhum elemento fixo cobre o botão de resposta");
      await mobile.page.screenshot({ path: `${dir}/partida-celular-14-anos.png` });
      await mobile.page.waitForTimeout(MANUAL_TAP_GAP_MS);
      const skip = mobile.page.getByRole("button", { name: "Não respondeu", exact: true });
      if (await skip.count()) await skip.click();
      else await mobile.page.getByRole("button", { name: "Aplicadora: não respondeu · pular", exact: true }).click();
      await mobile.page.getByRole("button", { name: "Encerrar", exact: true }).click();
      await mobile.page.locator('[data-testid="super-neuropad-game"][data-screen="results"]').waitFor();
      await dock.waitFor();
      assert.equal(await dock.isVisible(), true, "barra inferior volta fora da partida");
      observations.barraEscondidaNaPartidaNoCelular = true;
    } finally {
      await mobile.context.close();
    }

    assert.deepEqual(collected.pageErrors, [], "nenhum erro não tratado na página");
    observations.errosDeConsole = collected.consoleErrors.length;
    await writeFile(`${dir}/opcionais-e2e.json`, JSON.stringify({ observations }, null, 2));
    console.log(`[super-neuropad-opcionais] ✓ 16 idades com 50 disponíveis, registro, pausa, cópia, troca de idade, resultados, nova partida, axe e celular · artefatos em ${dir}`);
    console.log(JSON.stringify(observations, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
}

await main();
