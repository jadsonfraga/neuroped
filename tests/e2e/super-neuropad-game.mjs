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
const localMode = process.env.SUPER_NEUROPAD_TEST_MODE === "local";
// O motor agora trava um segundo registro em < 300 ms do último aceito (mesma
// guarda do EasyGame, por event.timeStamp). Toque deliberado do teste respeita
// o intervalo antes de cada registro (opção de toque, Acertou/Errou/Não
// respondeu e o pular da aplicadora); margem de 20 ms sobre o limite real.
const MANUAL_TAP_GAP_MS = 320;
const pace = () => page.waitForTimeout(MANUAL_TAP_GAP_MS);
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1180, height: 900 }, acceptDownloads: true });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let acceptDialogs = true;
const dialogs = [];
page.on("dialog", (dialog) => {
  dialogs.push(dialog.message());
  return acceptDialogs ? dialog.accept() : dialog.dismiss();
});
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
        await page.getByRole("timer").waitFor();
        // O mesmo componente deve sobreviver à pausa: não reapresentar estímulo nem reiniciar contagem.
        const preview = root.locator('[aria-label^="Figuras mostradas:"]');
        const before = await page.getByRole("timer").textContent();
        await button("Pausa").click();
        assert.equal(await preview.isVisible(), false);
        await page.waitForTimeout(1200); // ultrapassa um tick para provar que a pausa congela a exposição
        await page.getByRole("button", { name: "Continuar", exact: true }).first().click();
        assert.equal(await page.getByRole("timer").textContent(), before);
        await button("Já olhou · esconder").click();
        await page.getByRole("group", { name: "Opções" }).waitFor();
        await button("Pausa").click();
        await page.getByRole("button", { name: "Continuar", exact: true }).first().click();
        assert.equal(await preview.count(), 0, "retomar não reapresenta figuras já ocultadas");
        await page.getByRole("group", { name: "Opções" }).waitFor();
      }
      if (phase === 3 && item === 1) {
        // Tela bloqueada/troca de app no meio do desafio: pausa sozinho, sem inflar o tempo do item.
        await page.evaluate(() => {
          Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
          document.dispatchEvent(new Event("visibilitychange"));
        });
        await page.getByText("Pausado sozinho: a tela saiu de foco.").waitFor();
        await page.evaluate(() => { delete document.hidden; });
        await page.getByRole("button", { name: "Continuar", exact: true }).first().click();
      }
      if (phase === 1 && item === 2) await button("Repeti o comando").click(); // fica no registro como "comando repetido 1x"
      const options = page.getByRole("group", { name: "Opções" }).getByRole("button");
      await pace();
      if (await options.count()) {
        // Alterna índices, não acerto/erro: as opções são embaralhadas pelo jogo.
        await options.nth(registered % 2).click();
      } else {
        if (phase === 5 && item === 3) await screen("04-play-fazer");
        if (phase === 5 && item === 4) {
          // Atalho da aplicadora em item julgado: tecla 1 = Acertou (mesma guarda de toque duplo).
          const before = await page.getByText("Desafio 4 de 4").count();
          assert.equal(before, 1);
          await page.keyboard.press("1");
        } else {
          await button(registered % 3 === 2 ? "Errou" : "Acertou").click();
        }
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
  // A fase "esperado" nasce recolhida; as opções embaralhadas podem fazê-la
  // alternar entre aberta/fechada. O texto também pode aparecer na lista de
  // erros. Prove o registro exato (fase 1, item 2), abrindo pela UI, não por
  // .first(), alteração do DOM, espera fixa ou presença de texto oculto.
  const repeatedPhase = root.locator("details").filter({ has: page.locator("summary", { hasText: /Fase 1 ·/ }) });
  assert.equal(await repeatedPhase.count(), 1, "fase do comando repetido identificada sem ambiguidade");
  const repeatedRecord = repeatedPhase.locator("ol > li").nth(1).getByText("comando repetido 1x");
  assert.equal(await repeatedPhase.getByText("comando repetido 1x").count(), 1, "uma repetição na fase correta");
  // Exercita o caso recolhido em TODA execução, mesmo quando a pontuação
  // desta partida abriu a fase automaticamente. Só cliques reais no summary.
  if (await repeatedPhase.evaluate((details) => details.open)) await repeatedPhase.locator("summary").click();
  assert.equal(await repeatedPhase.evaluate((details) => details.open), false, "fase recolhida antes de consultar o registro");
  assert.equal(await repeatedRecord.count(), 1, "o segundo registro existe mesmo recolhido");
  await repeatedRecord.waitFor({ state: "hidden" });
  await repeatedPhase.locator("summary").click();
  await repeatedRecord.waitFor({ state: "visible" });
  assert.equal(await repeatedPhase.evaluate((details) => details.open), true, "summary abre o registro para a aplicadora");
  const unsavedRecords = await root.locator("details li").allTextContents();
  await root.getByText(/Itens para checar na consulta · \d+/).waitFor();
  await button("Copiar resumo para o prontuário").waitFor();
  const plan = page.getByTestId("super-neuropad-plan");
  await plan.getByText("Roteiro sugerido para a consulta").waitFor();
  assert.ok((await plan.getByRole("link").count()) >= 1, "links diretos para as abas de origem");
  const firstLink = await plan.getByRole("link").first().getAttribute("href");
  assert.match(firstLink ?? "", /^#?\/(testes-diretos|testes-reconhecimento|testes-cognitivos|avaliacao-pre-consulta-faixa-etaria)$/, `rota interna válida: ${firstLink}`);
  const drilldown = plan.getByRole("link").first();
  assert.equal(await drilldown.getAttribute("target"), "_blank");
  const [deeper] = await Promise.all([context.waitForEvent("page"), drilldown.click()]);
  await deeper.waitForLoadState("domcontentloaded");
  await deeper.close();
  await waitScreen("results");
  assert.equal(await root.locator("details li").count(), 20, "aprofundar preserva os vinte registros");
  assert.deepEqual(await root.locator("details li").allTextContents(), unsavedRecords, "aprofundar não altera conteúdo, ordem ou repetição dos registros");
  // Navegação interna não dispara beforeunload. Recusá-la precisa manter
  // a mesma partida em memória, inclusive via alteração do hash/voltar.
  acceptDialogs = false;
  const heldUrl = page.url();
  const beforeDialogs = dialogs.length;
  const warning = page.waitForEvent("dialog");
  await page.evaluate(() => { window.location.hash = "#/filtro"; });
  await warning;
  await page.waitForURL(heldUrl);
  await waitScreen("results");
  assert.equal(dialogs.length, beforeDialogs + 1, "uma confirmação por tentativa de sair");
  assert.match(dialogs.at(-1), /registros desta partida/);
  assert.equal(await root.locator("details li").count(), 20, "cancelar saída mantém todos os registros");
  assert.deepEqual(await root.locator("details li").allTextContents(), unsavedRecords, "cancelar saída mantém cada registro, não apenas a contagem");
  const loginWarning = page.waitForEvent("dialog");
  await page.evaluate(() => { window.location.hash = "#/login"; });
  await loginWarning;
  await page.waitForURL(heldUrl);
  await waitScreen("results");
  assert.equal(await root.locator("details li").count(), 20, "login voluntário também protege sessão local ou remota válida");
  assert.equal(dialogs.length, beforeDialogs + 2, "login voluntário também exige uma única confirmação");
  assert.match(dialogs.at(-1), /registros desta partida/);
  assert.deepEqual(await root.locator("details li").allTextContents(), unsavedRecords, "cancelar login mantém conteúdo, ordem e comando repetido");
  console.log(`[super-neuropad-game] ✓ ${localMode ? "local" : "remote"}: fase recolhida aberta pela UI; 20 registros idênticos após aprofundar e cancelar filtro/login`);
  acceptDialogs = true;
  await root.getByText(/pausa\(s\) · ↩ 1 desfeito\(s\)/).waitFor(); // proveniência: 1 pausa e 1 desfazer nesta jornada
  await page.getByTestId("super-neuropad-when").getByText(/6 anos \(faixa 6 a 7 anos\) · sessão de/).waitFor();
  await page.getByTestId("super-neuropad-save").getByText("Salvar no prontuário do paciente").waitFor();
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

  // Encerramento antecipado precisa entregar observações, nunca classificar uma bateria parcial.
  // PDF já baixado: "Nova partida" não pergunta e limpa idade/herói para a próxima criança.
  const dialogsBeforeNew = dialogs.length;
  await button("Nova partida").click();
  await waitScreen("setup");
  assert.equal(dialogs.length, dialogsBeforeNew, "resultado já guardado: nova partida sem confirmação");
  assert.equal(await button("Começar a aventura").isDisabled(), true, "idade e herói da criança anterior não são herdados");
  await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "6", exact: true }).click();
  await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
  await button("Começar a aventura").click();
  await page.getByRole("button", { name: /Entrar na fase/ }).click();
  await pace();
  await page.getByRole("group", { name: "Opções" }).getByRole("button").first().click();
  // Recomeço rápido com a mesma criança: confirma e volta direto ao mundo 1, sem passar pela preparação.
  await button("Reiniciar").click();
  await waitScreen("intro");
  await page.getByText("Fase 1 de 5").waitFor();
  assert.match(dialogs.at(-1), /Recomeçar do mundo 1/);
  await page.getByRole("button", { name: /Entrar na fase/ }).click();
  await pace();
  await page.getByRole("group", { name: "Opções" }).getByRole("button").first().click();
  await button("Encerrar").click();
  await waitScreen("results");
  // Resultado ainda não guardado: "Nova partida" pede confirmação; recusar mantém o resultado.
  acceptDialogs = false;
  await button("Nova partida").click();
  await waitScreen("results");
  assert.match(dialogs.at(-1), /ainda não foi copiado, baixado nem salvo/);
  acceptDialogs = true;
  await page.getByTestId("super-neuropad-incomplete").getByText(/1 de 20 itens registrados/).waitFor();
  assert.equal(await page.getByTestId("super-neuropad-reading").count(), 0);
  assert.equal(await root.locator("details li").count(), 1);
  assert.doesNotMatch(await root.innerText(), /sinal de alerta|dentro do esperado|ritmo estável|ritmo regular|\d+ de 20 acertos/i);
  await screen("07-incomplete");
  const [partialPdf] = await Promise.all([page.waitForEvent("download"), button("Baixar PDF detalhado").click()]);
  await partialPdf.saveAs(`${dir}/partial.pdf`);

  const storage = await page.evaluate(() => Object.keys(localStorage).filter((key) => /neuropad|super/i.test(key)));
  assert.deepEqual(storage, [], "nada do jogo persistido no navegador");
  assert.deepEqual(errors, [], "sem erros de página");
  const leaving = page.waitForEvent("dialog");
  await page.evaluate(() => { window.location.hash = "#/filtro"; });
  await leaving;
  await page.waitForURL(/#\/filtro$/);
  await root.waitFor({ state: "detached" });
  if (!localMode) {
    await page.goto(`${server.origin}/#/super-neuropad-game`);
    await waitScreen("setup");
    await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "6", exact: true }).click();
    await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
    await button("Começar a aventura").click();
    await page.getByRole("button", { name: /Entrar na fase/ }).click();
    await pace();
    await page.getByRole("group", { name: "Opções" }).getByRole("button").first().click();
    await button("Encerrar").click();
    await waitScreen("results");
    const beforeForcedRedirect = dialogs.length;
    acceptDialogs = false; // uma guarda obsoleta restauraria a rota sem conteúdo
    await page.evaluate(() => {
      for (const key of ["neuroped:access", "neuroped:refresh", "neuroped:user"]) sessionStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent("auth:expired"));
    });
    await page.locator("#login-email").waitFor({ timeout: 15000 });
    assert.equal(dialogs.length, beforeForcedRedirect, "sessão expirada redireciona sem prompt obsoleto");
    assert.equal(await root.count(), 0);
    await page.screenshot({ path: `${dir}/08-session-expired.png`, fullPage: true });
  }
  assert.deepEqual(errors, [], "nenhum erro após navegação e expiração");
  console.log(`[super-neuropad-game] ✓ jornada completa, 20 desafios, resultado e PDF (${bytes.length} bytes) · artefatos em ${dir}`);
} finally {
  await browser.close();
  await server.close();
}
