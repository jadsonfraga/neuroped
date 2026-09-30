// Super NeuroPad Game (pré-consulta integrada): jornada completa da aplicadora no
// navegador — bloqueio de menores de 2 anos, idade em anos com tempo estimado,
// personagem, seis mundos com 30 desafios aos 7 anos vindos das quatro abas de
// origem (Sonda 10, OBS-10, Reconhecimento Visual e Avaliação Cognitiva): toque e
// montagem conferidos pelo jogo; fala/ação conferidas pela aplicadora, com
// "Recusou" separado de "Errou"; desenho com o dedo; observações; resultado por
// domínio e por instrumento; PDF detalhado gerado localmente; mundo pulado vira
// "não aplicado"; 3 anos com menos desafios e acerto por gesto.
// Sem câmera, sem persistência, sem rede clínica. Acessibilidade via axe em cada tela.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
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
const PER_WORLD = 5; // 6 anos ou mais: 5 desafios por mundo (jornada principal aos 7 anos, que inclui montar palavra)
const WORLDS = 6;
const TOTAL = PER_WORLD * WORLDS;
/** Tipo do desafio visível: toque (opções), montar (letras) ou julgado (fala/ação). */
async function currentKind() {
  if (await page.getByRole("group", { name: "Opções" }).count()) return "toque";
  if (await page.getByRole("group", { name: "Letras" }).count()) return "montar";
  return "julgado";
}
/** Registra o desafio atual como "não respondeu" (qualquer tipo), para partidas curtas. */
async function skipCurrent() {
  await pace();
  const kind = await currentKind();
  if (kind === "julgado") await button("Não respondeu").click();
  else await page.getByRole("button", { name: "Aplicadora: não respondeu · pular", exact: true }).click();
}
/** Texto do PDF, quando o poppler existir na máquina (CI local/box); senão só bytes. */
function pdfText(path) {
  try { return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" }); } catch { return null; }
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
  // Menos de 2 anos: o jogo não é aplicado; orienta OBS-10/Sonda 10 e não deixa começar.
  await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
  await page.getByRole("button", { name: /Menos de 2 anos/ }).click();
  const underTwo = page.getByTestId("super-neuropad-under-two");
  await underTwo.waitFor();
  assert.match(await underTwo.innerText(), /menos de 2 anos/i);
  assert.equal(await button("Começar a aventura").isDisabled(), true, "menor de 2 anos bloqueado");
  await screen("00-menor-de-2");
  await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "7", exact: true }).click();
  assert.equal(await underTwo.count(), 0, "escolher a idade tira o bloqueio");
  const estimate = page.getByTestId("super-neuropad-estimate");
  const minutes = Number((await estimate.innerText()).match(/cerca de (\d+) minutos/)?.[1]);
  assert.ok(minutes > 0 && minutes <= 20, `tempo estimado dentro de 20 min (${minutes})`);
  assert.match(await estimate.innerText(), /30 desafios/);
  await button("Música ligada").click(); // silencia no headless
  const steps = page.getByRole("list", { name: "Passos da preparação" });
  await steps.getByText(/Idade, concluído/).waitFor(); // idade 7 já escolhida
  await steps.getByText(/Herói, concluído/).waitFor();
  await screen("01-setup");
  await button("Começar a aventura").click();

  let registered = 0;
  let undone = false;
  let pausedOnce = false;
  let refused = false;
  let built = false;
  let drew = false;
  let shotTouch = false;
  const seenKinds = new Set();
  for (let phase = 1; phase <= WORLDS; phase++) {
    await waitScreen("intro");
    await page.getByText(`Mundo ${phase} de ${WORLDS}`).waitFor();
    if (phase === 1) {
      await screen("02-intro");
      assert.equal(await button("Desfazer último").isDisabled(), true, "nada a desfazer antes do primeiro registro");
    }
    await page.getByRole("button", { name: /Entrar na fase/ }).click();
    for (let item = 1; item <= PER_WORLD; item++) {
      await waitScreen("play");
      await page.getByText(`Desafio ${item} de ${PER_WORLD}`).waitFor();
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
      const kind = await currentKind();
      seenKinds.add(kind);
      await pace();
      if (kind === "toque") {
        if (!shotTouch) { await screen("03-play-toque"); shotTouch = true; }
        // Alterna índices, não acerto/erro: as opções são embaralhadas pelo jogo.
        await options.nth(registered % 2).click();
      } else if (kind === "montar") {
        // Montagem de palavra (Avaliação Cognitiva · escrita): letras grandes, "Pronto" só com letra posta.
        assert.equal(await button("Pronto").isDisabled(), true, "montar vazio não registra");
        const reveal = page.getByRole("button", { name: "Aplicadora: ver a palavra para ditar", exact: true });
        if (await reveal.count()) { await reveal.click(); await page.getByRole("button", { name: /Ditar: [A-ZÇÃÕÁÉÍÓÚÂÊÔ]+/ }).waitFor(); }
        await page.getByRole("group", { name: "Letras" }).getByRole("button").first().click();
        if (!built) await screen("04b-play-montar");
        await pace();
        await button("Pronto").click();
        built = true;
      } else {
        const pad = root.locator("canvas.snp-drawpad");
        if (await pad.count()) {
          // Cópia/desenho com o dedo na própria tela (nada é exportado): um traço simples.
          const box = await pad.boundingBox();
          await page.mouse.move(box.x + 20, box.y + 20);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
          await page.mouse.up();
          if (!drew) await screen("04c-play-desenho");
          drew = true;
        }
        if (phase === 5 && !refused) await screen("04-play-fazer");
        if (phase === WORLDS && item === 1) {
          // Atalho da aplicadora em item julgado: tecla 1 = Acertou (mesma guarda de toque duplo).
          assert.equal(await page.getByText(`Desafio 1 de ${PER_WORLD}`).count(), 1);
          await page.keyboard.press("1");
        } else if (phase >= 2 && !refused) {
          // Criança que diz não/empurra: "Recusou" fica separado de "Errou" e de "Não respondeu".
          await button("Recusou").click();
          refused = true;
        } else {
          await button(registered % 3 === 2 ? "Errou" : "Acertou").click();
        }
      }
      registered += 1;
      if (phase === 1 && item === 3 && !undone) {
        // Toque errado da aplicadora: desfazer volta exatamente ao mesmo desafio e apaga o registro.
        await page.getByText(`Desafio 4 de ${PER_WORLD}`).waitFor();
        await button("Desfazer último").click();
        await page.getByText(`Desafio 3 de ${PER_WORLD}`).waitFor();
        registered -= 1;
        undone = true;
        item -= 1;
      }
    }
    if (phase < WORLDS) {
      await waitScreen("phase-done");
      if (phase === 1) await screen("05-phase-done");
      await page.getByRole("button", { name: /Próximo mundo/ }).click();
    }
  }
  assert.ok(refused && built && drew, "jornada passou por recusa, montagem e desenho");
  assert.deepEqual([...seenKinds].sort(), ["julgado", "montar", "toque"], "os três tipos de desafio apareceram");
  await waitScreen("results");
  await page.getByText("Aventura concluída!").waitFor();
  await page.getByText(new RegExp(`de ${TOTAL} acertos`)).waitFor();
  assert.equal(registered, TOTAL, `${TOTAL} desafios registrados`);
  const cards = await root.locator("details").count();
  assert.equal(cards, WORLDS, "seis mundos detalhados");
  const badges = await root.locator("details li").count();
  assert.equal(badges, TOTAL, "cada desafio listado com resultado");
  assert.equal(await root.locator("details li").filter({ hasText: /Recusou/ }).count(), 1, "recusa registrada como tal");
  // Resposta da criança: negrito + azul (acertou) / vermelho (errou) / cinza (não respondeu, recusou); rótulo continua ao lado.
  const toneColor = async (tone) => root.locator(`details li [data-answer-tone="${tone}"]`).first().evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).fontWeight]);
  const refusedCard = root.locator("details li").filter({ hasText: /Recusou/ });
  assert.equal(await refusedCard.locator('[data-answer-tone="neutral"]').count(), 1, "recusa em cinza neutro, não vermelho");
  assert.deepEqual(await toneColor("correct"), ["rgb(29, 78, 216)", "900"], "acerto em azul e negrito");
  if (await root.locator('details li [data-answer-tone="wrong"]').count()) assert.deepEqual(await toneColor("wrong"), ["rgb(185, 28, 28)", "900"], "erro em vermelho e negrito");
  assert.deepEqual(await toneColor("neutral"), ["rgb(75, 85, 99)", "900"]);
  // Desempenho por domínio x esperado e o que veio de cada instrumento de origem.
  const domains = page.getByTestId("super-neuropad-domains");
  assert.equal(await domains.getByText(/Esperado para a idade: \d+ ou mais de 5/).count(), WORLDS, "cada domínio mostra o esperado para a idade");
  const origins = page.getByTestId("super-neuropad-origins");
  for (const label of ["Sonda 10", "Observa 10 (OBS-10)", "Reconhecimento visual", "Avaliação cognitiva infantil"]) {
    await origins.getByText(label, { exact: false }).first().waitFor();
  }
  // Observações da aplicadora: chip + texto livre; vão para PDF/registro, nunca para o navegador.
  const observationsBox = page.getByTestId("super-neuropad-observations");
  await observationsBox.getByRole("button").first().click();
  await page.locator("#snp-observations").fill("Colaborou bem. Pediu água no mundo 3.");
  const reading = page.getByTestId("super-neuropad-reading");
  await reading.getByText("Leitura para a consulta").waitFor();
  assert.ok((await reading.locator("ul li").count()) >= 2, "leitura traz frases descritivas para a consulta");
  await reading.getByText(/Mediana \d+(\.\d)? s por item/).waitFor();
  // A fase "esperado" nasce recolhida; as opções embaralhadas podem fazê-la
  // alternar entre aberta/fechada. O texto também pode aparecer na lista de
  // erros. Prove o registro exato (fase 1, item 2), abrindo pela UI, não por
  // .first(), alteração do DOM, espera fixa ou presença de texto oculto.
  const repeatedPhase = root.locator("details").filter({ has: page.locator("summary", { hasText: /Mundo 1 ·/ }) });
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
  assert.equal(await root.locator("details li").count(), TOTAL, "aprofundar preserva os trinta registros");
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
  assert.equal(await root.locator("details li").count(), TOTAL, "cancelar saída mantém todos os registros");
  assert.deepEqual(await root.locator("details li").allTextContents(), unsavedRecords, "cancelar saída mantém cada registro, não apenas a contagem");
  const loginWarning = page.waitForEvent("dialog");
  await page.evaluate(() => { window.location.hash = "#/login"; });
  await loginWarning;
  await page.waitForURL(heldUrl);
  await waitScreen("results");
  assert.equal(await root.locator("details li").count(), TOTAL, "login voluntário também protege sessão local ou remota válida");
  assert.equal(dialogs.length, beforeDialogs + 2, "login voluntário também exige uma única confirmação");
  assert.match(dialogs.at(-1), /registros desta partida/);
  assert.deepEqual(await root.locator("details li").allTextContents(), unsavedRecords, "cancelar login mantém conteúdo, ordem e comando repetido");
  console.log(`[super-neuropad-game] ✓ ${localMode ? "local" : "remote"}: mundo recolhido aberto pela UI; ${TOTAL} registros idênticos após aprofundar e cancelar filtro/login`);
  acceptDialogs = true;
  await root.getByText(/pausa\(s\) · ↩ 1 desfeito\(s\)/).waitFor(); // proveniência: 1 pausa e 1 desfazer nesta jornada
  await page.getByTestId("super-neuropad-when").getByText(/ · 7 anos \(faixa anual\) · sessão de/).waitFor();
  await page.getByTestId("super-neuropad-save").getByText("Salvar no prontuário do paciente").waitFor();
  await screen("06-results");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    button("Baixar PDF detalhado").click(),
  ]);
  assert.match(download.suggestedFilename(), /^super-neuropad-game-7-\d{4}-\d{2}-\d{2}\.pdf$/, "nome do PDF");
  const pdfPath = `${dir}/${download.suggestedFilename()}`;
  await download.saveAs(pdfPath);
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(pdfPath);
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", "PDF válido");
  assert.ok(bytes.length > 5000, "PDF com conteúdo");
  const text = pdfText(pdfPath);
  if (text) {
    const flat = text.replace(/\s+/g, " ");
    const upper = flat.toLocaleUpperCase("pt-BR");
    for (const heading of ["Identificação da sessão", "O que foi testado por instrumento de origem", "Desempenho por domínio x esperado para a idade", "Observações da aplicadora", "DADOS ESTRUTURADOS"]) {
      assert.ok(upper.includes(heading.toLocaleUpperCase("pt-BR")), `PDF: seção ${heading}`);
    }
    for (const label of ["Sonda 10", "OBS-10", "Reconhecimento visual", "Avaliação cognitiva infantil"]) assert.ok(flat.includes(label), `PDF: origem ${label}`);
    assert.match(flat, /Resposta esperada/);
    assert.match(flat, /Resposta da criança/);
    assert.match(flat, /Recusou/);
    assert.match(flat, /Pediu água no mundo 3/);
    assert.match(flat, /SESSAO \{/);
    console.log("[super-neuropad-game] ✓ PDF: seções, quatro origens, item a item, observações e bloco estruturado");
  } else {
    console.log("[super-neuropad-game] (pdftotext ausente: conteúdo do PDF coberto pelos testes unitários)");
  }

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
  await skipCurrent();
  // Recomeço rápido com a mesma criança: confirma e volta direto ao mundo 1, sem passar pela preparação.
  await button("Reiniciar").click();
  await waitScreen("intro");
  await page.getByText(`Mundo 1 de ${WORLDS}`).waitFor();
  assert.match(dialogs.at(-1), /Recomeçar do mundo 1/);
  // Mundo que não deu para aplicar: pular com motivo; vira "não aplicado" só naquele domínio.
  await page.getByRole("button", { name: /Pular este mundo/ }).click();
  const skipPanel = page.getByTestId("super-neuropad-skip");
  await skipPanel.waitFor();
  await screen("02b-pular-mundo");
  const reason = ((await skipPanel.getByRole("button").first().textContent()) ?? "").trim();
  await skipPanel.getByRole("button").first().click();
  await waitScreen("intro");
  await page.getByText(`Mundo 2 de ${WORLDS}`).waitFor();
  await page.getByRole("button", { name: /Entrar na fase/ }).click();
  await skipCurrent();
  await button("Encerrar").click();
  await waitScreen("results");
  // Resultado ainda não guardado: "Nova partida" pede confirmação; recusar mantém o resultado.
  acceptDialogs = false;
  await button("Nova partida").click();
  await waitScreen("results");
  assert.match(dialogs.at(-1), /ainda não foi copiado, baixado nem salvo/);
  acceptDialogs = true;
  await page.getByTestId("super-neuropad-incomplete").getByText(new RegExp(`1 de ${TOTAL} itens registrados`)).waitFor();
  assert.equal(await page.getByTestId("super-neuropad-reading").count(), 0);
  assert.equal(await root.locator("details li").count(), 1);
  assert.doesNotMatch(await root.innerText(), new RegExp(`sinal de alerta|dentro do esperado|ritmo estável|ritmo regular|\\d+ de ${TOTAL} acertos`, "i"));
  const skippedDomain = page.getByTestId("super-neuropad-domains");
  await skippedDomain.getByText(/Não aplicado — /).first().waitFor();
  assert.ok(((await skippedDomain.textContent()) ?? "").includes(reason), "motivo do mundo pulado aparece no domínio");
  await screen("07-incomplete");
  const [partialPdf] = await Promise.all([page.waitForEvent("download"), button("Baixar PDF detalhado").click()]);
  await partialPdf.saveAs(`${dir}/partial.pdf`);
  const partialText = pdfText(`${dir}/partial.pdf`);
  if (partialText) assert.match(partialText.replace(/\s+/g, " "), /não aplicado/i, "PDF parcial informa o mundo não aplicado");

  // 3 anos: menos desafios (4 por mundo) e fala que aceita apontar/gesto como acerto.
  await button("Nova partida").click();
  await waitScreen("setup");
  await page.getByRole("group", { name: "Idade em anos" }).getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("group", { name: "Personagens" }).getByRole("button", { name: /Robô Guerreiro/ }).click();
  assert.match(await page.getByTestId("super-neuropad-estimate").innerText(), /24 desafios/);
  await button("Começar a aventura").click();
  await page.getByRole("button", { name: /Entrar na fase/ }).click();
  let gestureDone = false;
  for (let item = 1; item <= 4 && !gestureDone; item++) {
    await page.getByText(`Desafio ${item} de 4`).waitFor();
    const gesture = page.getByRole("button", { name: /Acertou por gesto/ });
    if (await gesture.count()) {
      await page.getByText(/Alternativa aceita/).first().waitFor();
      await screen("09-tres-anos-gesto");
      await pace();
      await gesture.click();
      gestureDone = true;
    } else {
      await skipCurrent();
    }
  }
  assert.ok(gestureDone, "3 anos: há fala com alternativa por gesto no primeiro mundo");
  await button("Encerrar").click();
  await waitScreen("results");
  await root.locator("details li").filter({ hasText: /por gesto\/apontar/ }).first().waitFor({ state: "attached" });

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
    await skipCurrent();
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
  console.log(`[super-neuropad-game] ✓ jornada completa, ${TOTAL} desafios, resultado e PDF (${bytes.length} bytes) · artefatos em ${dir}`);
} finally {
  await browser.close();
  await server.close();
}
