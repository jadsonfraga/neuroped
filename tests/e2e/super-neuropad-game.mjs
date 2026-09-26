// Super NeuroPad Game: jornada completa da secretária no navegador — idade em anos,
// personagem, cinco fases com 20 desafios (toque conferido pelo jogo, fala/ação
// conferidas pela aplicadora), resultado objetivo e PDF detalhado gerado localmente.
// Sem câmera, sem persistência, sem rede clínica. Acessibilidade via axe em cada tela.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.SUPER_NEUROPAD_ARTIFACT_DIR || "/tmp/super-neuropad-game";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1180, height: 900 }, acceptDownloads: true });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
const root = page.getByTestId("super-neuropad-game");
const button = (name) => page.getByRole("button", { name, exact: true });
async function screen(name) {
  const axe = await new AxeBuilder({ page }).include('[data-testid="super-neuropad-game"]').analyze();
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(axe.violations, null, 2));
  assert.deepEqual(axe.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}
async function waitScreen(value) {
  await page.locator(`[data-testid="super-neuropad-game"][data-screen="${value}"]`).waitFor({ timeout: 15000 });
}

try {
  await page.goto(`${server.origin}/#/super-neuropad-game`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await root.waitFor({ timeout: 20000 });
  await waitScreen("setup");
  assert.equal(await button("Começar a aventura").isDisabled(), true, "sem idade e personagem não inicia");
  await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "6", exact: true }).click();
  await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
  await button("Música ligada").click(); // silencia no headless
  const steps = page.getByRole("list", { name: "Passos da preparação" });
  await steps.getByText(/Idade, concluído/).waitFor(); // idade 6 já escolhida
  await steps.getByText(/Herói, concluído/).waitFor();
  await screen("01-setup");
  await button("Começar a aventura").click();

  let registered = 0;
  let undone = false;
  let pausedOnce = false;
  for (let phase = 1; phase <= 5; phase++) {
    await waitScreen("intro");
    await page.getByText(`Fase ${phase} de 5`).waitFor();
    if (phase === 1) {
      await screen("02-intro");
      assert.equal(await button("Desfazer último").isDisabled(), true, "nada a desfazer antes do primeiro registro");
    }
    await page.getByRole("button", { name: /Entrar na fase/ }).click();
    for (let item = 1; item <= 4; item++) {
      await waitScreen("play");
      await page.getByText(`Desafio ${item} de 4`).waitFor();
      if (phase === 1 && item === 1) await screen("03-play-toque");
      if (phase === 2 && item === 1 && !pausedOnce) {
        // Pausa congela o desafio: nenhuma opção fica disponível até continuar.
        await button("Pausa").click();
        await page.getByText("O tempo do desafio parou", { exact: false }).waitFor();
        assert.equal(await page.getByRole("group", { name: "Opções" }).count(), 0, "opções escondidas na pausa");
        await screen("03b-pausa");
        await page.getByRole("button", { name: "Continuar", exact: true }).first().click();
        pausedOnce = true;
      }
      if (await page.getByRole("button", { name: "Já olhou · esconder", exact: true }).count()) {
        await page.getByRole("timer").waitFor(); // contagem visível: exposição padronizada
        await button("Já olhou · esconder").click();
      }
      if (phase === 1 && item === 2) await button("Repeti o comando").click(); // fica no registro como "comando repetido 1x"
      const options = page.getByRole("group", { name: "Opções" }).getByRole("button");
      if (await options.count()) {
        // Alterna acerto/erro de forma determinística pelo índice: o jogo confere sozinho.
        await options.nth(registered % 2).click();
      } else {
        if (phase === 5 && item === 3) await screen("04-play-fazer");
        await button(registered % 3 === 2 ? "Errou" : "Acertou").click();
      }
      registered += 1;
      if (phase === 1 && item === 3 && !undone) {
        // Toque errado da aplicadora: desfazer volta exatamente ao mesmo desafio e apaga o registro.
        await page.getByText("Desafio 4 de 4").waitFor();
        await button("Desfazer último").click();
        await page.getByText("Desafio 3 de 4").waitFor();
        registered -= 1;
        undone = true;
        item -= 1;
      }
    }
    if (phase < 5) {
      await waitScreen("phase-done");
      if (phase === 1) await screen("05-phase-done");
      await page.getByRole("button", { name: /Próxima fase/ }).click();
    }
  }
  await waitScreen("results");
  await page.getByText("Aventura concluída!").waitFor();
  await page.getByText(/de 20 acertos/).waitFor();
  assert.equal(registered, 20, "20 desafios registrados");
  const cards = await root.locator("details").count();
  assert.equal(cards, 5, "cinco fases detalhadas");
  const badges = await root.locator("details li").count();
  assert.equal(badges, 20, "cada desafio listado com resultado");
  const reading = page.getByTestId("super-neuropad-reading");
  await reading.getByText("Leitura para a consulta").waitFor();
  assert.ok((await reading.locator("ul li").count()) >= 2, "leitura traz frases descritivas para a consulta");
  await reading.getByText(/Mediana \d+(\.\d)? s por item/).waitFor();
  await root.getByText("comando repetido 1x").first().waitFor();
  await root.getByText(/Itens para checar na consulta · \d+/).waitFor();
  await button("Copiar resumo para o prontuário").waitFor();
  const plan = page.getByTestId("super-neuropad-plan");
  await plan.getByText("Roteiro sugerido para a consulta").waitFor();
  assert.ok((await plan.getByRole("link").count()) >= 1, "links diretos para as abas de origem");
  const firstLink = await plan.getByRole("link").first().getAttribute("href");
  assert.match(firstLink ?? "", /^#?\/(testes-diretos|testes-reconhecimento|testes-cognitivos|avaliacao-pre-consulta-faixa-etaria)$/, `rota interna válida: ${firstLink}`);
  await root.getByText(/pausa\(s\) · ↩ 1 desfeito\(s\)/).waitFor(); // proveniência: 1 pausa e 1 desfazer nesta jornada
  await screen("06-results");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    button("Baixar PDF detalhado").click(),
  ]);
  assert.match(download.suggestedFilename(), /^super-neuropad-game-6-7-\d{4}-\d{2}-\d{2}\.pdf$/, "nome do PDF");
  const pdfPath = `${dir}/${download.suggestedFilename()}`;
  await download.saveAs(pdfPath);
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(pdfPath);
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", "PDF válido");
  assert.ok(bytes.length > 5000, "PDF com conteúdo");

  const storage = await page.evaluate(() => Object.keys(localStorage).filter((key) => /neuropad|super/i.test(key)));
  assert.deepEqual(storage, [], "nada do jogo persistido no navegador");
  assert.deepEqual(errors, [], "sem erros de página");
  console.log(`[super-neuropad-game] ✓ jornada completa, 20 desafios, resultado e PDF (${bytes.length} bytes) · artefatos em ${dir}`);
} finally {
  await browser.close();
  await server.close();
}
