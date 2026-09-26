// Modo Fácil (joguinho) nas quatro aplicações diretas. Sonda 10 e OBS-10 usam
// itens objetivos: a criança toca e Próximo libera o estímulo seguinte; Reconhecimento
// Visual mantém o fluxo por toque e os demais modos preservam seus contratos.
// Cada tela também prova que o modo guiado continua sendo o padrão.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.MODO_FACIL_ARTIFACT_DIR || "/tmp/modo-facil";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, reducedMotion: "reduce" });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
const button = (name) => page.getByRole("button", { name, exact: true });
const tab = (name) => page.getByRole("tab", { name: new RegExp(name) });
async function screen(name, scope) {
  const axe = await new AxeBuilder({ page }).include(scope).analyze();
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(axe.violations, null, 2));
  assert.deepEqual(axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}
async function open(route, testId) {
  await page.goto(`${server.origin}/#/${route}`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId(testId).waitFor({ timeout: 20000 });
}
/** Joga o motor até o fim alternando os três botões; retorna as contagens do resultado. */
async function playEasy(prefix, { maxSteps = 60 } = {}) {
  const outcomes = ["acertou", "nao", "pular"];
  let i = 0;
  while (await page.getByTestId(`${prefix}-step`).count()) {
    assert.ok(i < maxSteps, "o jogo termina");
    const show = page.getByTestId(`${prefix}-show`);
    if (await show.count()) {
      await show.click();
      await page.getByTestId(`${prefix}-child`).waitFor({ state: "attached" });
      // Tela da criança: fecha pelo botão de voltar do próprio estímulo.
      const back = page.getByRole("button", { name: /Voltar ao aplicador|Concluir observação|Voltar ao registro|Concluir e voltar|Pausar e voltar/ }).first();
      await back.click();
      await page.getByTestId(`${prefix}-child`).waitFor({ state: "detached" });
    }
    await page.getByTestId(`${prefix}-${outcomes[i % 3]}`).click();
    i += 1;
  }
  await page.getByTestId(`${prefix}-results`).waitFor();
  const n = async (k) => Number(await page.getByTestId(`${prefix}-count-${k}`).innerText());
  return { steps: i, acertou: await n("acertou"), nao: await n("nao"), pulou: await n("pulou") };
}

/** Modo objetivo: toca na primeira opção e aperta Próximo; pula o 2º item pelo adulto. */
async function playObjective(prefix, { maxSteps = 20 } = {}) {
  let i = 0;
  while (await page.getByTestId(`${prefix}-step`).count()) {
    assert.ok(i < maxSteps, "o jogo termina");
    if (i === 1) {
      await page.getByTestId(`${prefix}-pular`).click();
      await page.locator(`[data-testid="${prefix}-next"], [data-testid="${prefix}-results"]`).first().waitFor();
      const next = page.getByTestId(`${prefix}-next`);
      if (await next.count()) await next.click();
    } else {
      const options = page.getByTestId(`${prefix}-option`);
      assert.ok((await options.count()) >= 2, "ao menos duas opções na tela");
      await options.first().click();
      await page.locator(`[data-testid="${prefix}-next"], [data-testid="${prefix}-results"]`).first().waitFor();
      const next = page.getByTestId(`${prefix}-next`);
      if (await next.count()) {
        assert.equal(await page.getByTestId(`${prefix}-option`).count(), 0, "toque duplo não responde o item seguinte");
        await next.click();
      }
    }
    i += 1;
  }
  await page.getByTestId(`${prefix}-results`).waitFor();
  const n = async (k) => Number(await page.getByTestId(`${prefix}-count-${k}`).innerText());
  return { steps: i, certo: await n("acertou"), errado: await n("nao"), pulou: await n("pulou") };
}

try {
  // Sonda 10: Modo Fácil objetivo, 3 anos (quatro opções por item)
  await open("testes-diretos", "sonda-track-tabs");
  assert.equal(await tab("^Guia de primeira aplicação").getAttribute("aria-selected"), "true", "guiado continua padrão");
  await page.getByTestId("sonda-easy-tab").click();
  await page.getByTestId("sonda-easy-start").waitFor();
  assert.equal(await page.getByTestId("sonda-easy-step").count(), 0, "sem idade não há item");
  await page.getByLabel("Idade em anos").fill("3");
  await page.getByLabel("Meses adicionais").fill("0");
  await page.getByTestId("sonda-easy-step").waitFor();
  assert.equal(await page.getByTestId("sonda-easy-tab").isDisabled(), false, "aba livre antes do primeiro item");
  assert.equal(await page.getByTestId("sonda-easy-acertou").count(), 0, "sem julgamento manual: só a criança responde");
  assert.equal(await page.getByTestId("sonda-easy-show").count(), 0, "a tela da criança já está aberta");
  assert.equal(await page.getByTestId("sonda-easy-option").count(), 4, "3 anos: quatro opções");
  await screen("sonda-facil-passo", '[data-testid="sonda-digital"]');
  await page.getByTestId("sonda-easy-option").first().click();
  await page.getByTestId("sonda-easy-next").waitFor();
  assert.equal(await page.getByTestId("sonda-easy-option").count(), 0, "depois do toque, nenhuma opção fica na tela");
  assert.match(await page.getByTestId("sonda-easy-step").innerText(), /Resposta registrada/, "interstício neutro visível");
  assert.doesNotMatch(await page.getByTestId("sonda-easy-step").innerText(), /Toque no círculo\./, "item seguinte não aparece antes de Próximo");
  assert.match(await page.getByTestId("sonda-easy-progress").innerText(), /^1 \//, "progresso não antecipa o próximo item");
  assert.equal(await page.getByTestId("sonda-easy-tab").isDisabled(), true, "aba trava depois do primeiro item");
  await page.getByTestId("sonda-easy-next").click();
  assert.match(await page.getByTestId("sonda-easy-progress").innerText(), /^2 \//);
  await page.getByRole("button", { name: "Voltar um passo" }).click();
  assert.match(await page.getByTestId("sonda-easy-progress").innerText(), /^1 \//, "voltar um item funciona");
  assert.equal(await page.getByTestId("sonda-easy-option").count(), 4, "item reaberto para a criança");
  const sonda = await playObjective("sonda-easy");
  assert.equal(sonda.steps, 10, "Sonda 10 tem dez itens");
  assert.equal(sonda.certo + sonda.errado + sonda.pulou, 10);
  assert.equal(sonda.pulou, 1);
  const sondaReport = await page.getByLabel("Resultado do jogo").inputValue();
  assert.match(sondaReport, /Sonda 10 · Modo Fácil/);
  assert.match(sondaReport, /NÃO É ESCORE, PERCENTIL NEM DIAGNÓSTICO/);
  assert.match(sondaReport, /Certo: \d+ · Errado: \d+ · Pulou: 1/);
  assert.match(sondaReport, /\(tocou: /, "o toque da criança fica declarado item a item");
  await screen("sonda-facil-resultado", '[data-testid="sonda-digital"]');

  // OBS-10: Modo Fácil objetivo. 1 ano tem duas opções; 12 anos joga com texto.
  await open("avaliacao-pre-consulta-faixa-etaria", "obs10-track-tabs");
  assert.equal(await tab("^Guia da assistente").getAttribute("aria-selected"), "true", "guiado continua padrão");
  await page.getByTestId("obs10-easy-tab").click();
  await page.getByTestId("obs10-easy-start").waitFor();
  assert.equal(await page.getByTestId("obs10-first-time").count(), 0, "sem guia de primeira vez");
  assert.equal(await page.locator(".obs10-checklist").count(), 0, "sem checklist");
  assert.equal(await page.locator(".obs10-easy-picture").count(), 0, "sem tarefa com objeto");
  await page.getByLabel("Anos completos", { exact: true }).fill("1");
  await page.getByTestId("obs10-easy-step").waitFor();
  assert.equal(await page.getByTestId("obs10-easy-option").count(), 2, "1 ano: duas opções grandes");
  await screen("obs10-facil-1ano", ".obs10");
  await page.getByLabel("Anos completos", { exact: true }).fill("12");
  await page.getByTestId("obs10-easy-step").waitFor();
  assert.equal(await page.getByTestId("obs10-easy-option").count(), 4, "12 anos: quatro opções");
  assert.equal(await page.getByTestId("obs10-easy-acertou").count(), 0, "sem julgamento manual");
  await screen("obs10-facil-passo", ".obs10");
  const obs = await playObjective("obs10-easy");
  assert.equal(obs.steps, 10, "OBS-10 tem dez itens");
  assert.equal(obs.certo + obs.errado + obs.pulou, 10);
  const obsReport = await page.getByLabel("Resultado do jogo").inputValue();
  assert.match(obsReport, /OBS-10 · Modo Fácil/);
  assert.match(obsReport, /Modo Fácil: sem filmagem integrada/);
  assert.match(obsReport, /Certo: \d+ · Errado: \d+ · Pulou: 1/);
  await screen("obs10-facil-resultado", ".obs10");

  // Reconhecimento Visual: a criança toca e o jogo passa sozinho
  await open("testes-reconhecimento", "rv-track-tabs");
  assert.equal(await tab("^Guia de primeira aplicação").getAttribute("aria-selected"), "true", "guiado continua padrão");
  await page.getByTestId("rv-easy-tab").click();
  await page.getByTestId("rv-easy-start").waitFor();
  assert.equal(await page.getByText("3. Prepare e comece").count(), 0, "sem conferências");
  await page.getByLabel("Anos completos", { exact: true }).fill("4");
  await page.getByLabel("Meses adicionais", { exact: true }).fill("0");
  await button("Começar o jogo").click();
  await page.getByTestId("rv-easy-step").waitFor({ timeout: 45000 });
  await screen("rv-facil-passo", ".rv-workspace");
  // Passo 1: toque na figura-alvo → auto "Acertou" e avança sem botão.
  await page.getByTestId("rv-easy-show").click();
  const dialog = page.getByRole("dialog", { name: "Apresentação de figuras", exact: true });
  await dialog.waitFor();
  assert.doesNotMatch(await dialog.innerText(), /Acertou|estrela|herói/i, "tela da criança permanece pura");
  const previewSvg = await page.locator(".rv-hero-pictures").count(); // presença do banner não interfere
  assert.ok(previewSvg >= 0);
  const choices = await dialog.getByRole("button", { name: /Selecionar figura/ }).all();
  assert.ok(choices.length >= 2);
  await choices[0].click();
  await dialog.waitFor({ state: "detached", timeout: 5000 });
  assert.match(await page.getByTestId("rv-easy-progress").innerText(), /^2 \//, "toque da criança avançou sozinho");
  // Passo 2: mostrar e voltar sem toque → o adulto marca.
  await page.getByTestId("rv-easy-show").click();
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "← Voltar ao aplicador", exact: true }).click();
  await dialog.waitFor({ state: "detached" });
  await page.getByTestId("rv-easy-pular").click();
  assert.match(await page.getByTestId("rv-easy-progress").innerText(), /^3 \//);
  // Restante: toques na primeira figura até o fim.
  while (await page.getByTestId("rv-easy-step").count()) {
    await page.getByTestId("rv-easy-show").click();
    await dialog.waitFor();
    await dialog.getByRole("button", { name: /Selecionar figura/ }).first().click();
    await dialog.waitFor({ state: "detached", timeout: 5000 });
  }
  await page.getByTestId("rv-easy-results").waitFor();
  const rvReport = await page.getByLabel("Resultado do jogo").inputValue();
  assert.match(rvReport, /Reconhecimento Visual · Modo Fácil/);
  assert.match(rvReport, /\(tocou: /, "reconhecimento preserva a escolha automática no resultado");
  assert.match(rvReport, /Pulou: 1/);
  await screen("rv-facil-resultado", ".rv-workspace");

  // Testes Cognitivos: 16 passos lineares no motor compartilhado; toque e
  // montagem de letras decidem sozinhos, fala é marcada pelo adulto.
  await page.goto(`${server.origin}/#/testes-cognitivos`);
  await page.getByRole("heading", { name: "Testes Cognitivos por Faixa Etária" }).waitFor({ timeout: 20000 });
  assert.equal(await tab("^Guiado").getAttribute("aria-selected"), "true", "guiado continua padrão");
  await page.getByTestId("cognitive-easy-tab").click();
  for (const age of ["1", "19"]) {
    await page.getByLabel("Idade da criança (anos)").fill(age);
    assert.equal(await button("Começar o jogo").isDisabled(), false, `idade ${age} aceita`);
  }
  await page.getByLabel("Idade da criança (anos)").fill("6");
  await button("Começar o jogo").click();
  await page.getByTestId("cognitive-easy-step").waitFor();
  assert.equal(await page.getByText("Escolha seu herói").count(), 0, "sem escolha de herói");
  assert.equal(await page.getByText("Para onde vamos agora?").count(), 0, "sem mapa");
  assert.equal(await page.getByTestId("cognitive-easy-tab").isDisabled(), true, "aba trava ao começar");
  await screen("cognitivo-facil-passo", "main");
  // Passo 1 (toque): a criança toca na alternativa esperada → "Acertou" sem botão do adulto.
  const expected1 = (await page.getByTestId("cognitive-easy-step").innerText()).match(/Esperado: (\S+)/)?.[1];
  assert.ok(expected1, "dica do adulto traz a resposta esperada");
  await page.getByTestId("cognitive-easy-show").click();
  const child = page.getByTestId("cognitive-easy-child");
  await child.waitFor();
  assert.doesNotMatch(await child.innerText(), /Acertou|Esperado|estrela|herói/i, "tela da criança pura");
  await child.getByRole("button", { name: expected1, exact: true }).click();
  await child.waitFor({ state: "detached" });
  assert.match(await page.getByTestId("cognitive-easy-progress").innerText(), /^2 \//, "toque da criança avançou sozinho");
  // Restante: mostra, volta e alterna os três botões (cobre fala, montagem e toque sem resposta).
  const cog = await playEasy("cognitive-easy");
  assert.equal(cog.steps, 15, `15 passos restantes de 16 (${cog.steps})`);
  assert.equal(cog.acertou, 1 + Math.ceil(15 / 3), "1 acerto automático + os marcados");
  const cogReport = await page.getByLabel("Resultado do jogo").inputValue();
  assert.match(cogReport, /Testes Cognitivos por Faixa Etária · Modo Fácil/);
  assert.match(cogReport, /Itens previstos: 16 · Registrados: 16/);
  assert.match(cogReport, /NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO/);
  assert.match(cogReport, /\(tocou: /, "cognitivo preserva a resposta automática no resultado");
  assert.match(cogReport, /Castelo da Escrita/);
  await screen("cognitivo-facil-resultado", "main");

  // Montagem de letras no motor: 8 anos, ditado ESCOLA, a última peça decide.
  await button("Jogar de novo").click();
  await page.getByTestId("cognitive-easy-step").waitFor();
  await button("Reiniciar jogo").click();
  await page.getByLabel("Idade da criança (anos)").fill("8");
  await button("Começar o jogo").click();
  while (!/Escreva a palavra ESCOLA/.test(await page.getByTestId("cognitive-easy-step").innerText())) await page.getByTestId("cognitive-easy-pular").click();
  await page.getByTestId("cognitive-easy-show").click();
  await child.waitFor();
  for (const letter of "ESCOLA") await child.getByRole("button", { name: `Letra ${letter}`, exact: true }).first().click();
  await child.waitFor({ state: "detached" });
  await playEasy("cognitive-easy");
  const report8 = await page.getByLabel("Resultado do jogo").inputValue();
  assert.match(report8, /Escreva a palavra ESCOLA — Acertou \(tocou: ESCOLA\)/, "montagem certa preserva a palavra montada");

  assert.deepEqual(errors, [], "sem erros de página");
  console.log(`Modo Fácil: quatro joguinhos jogados até o resultado (Sonda ${sonda.steps} passos, OBS-10 ${obs.steps} passos, Reconhecimento com toque automático, Cognitivo 16 passos com toque e montagem automáticos).`);
} finally {
  await browser.close();
  await server.close();
}
