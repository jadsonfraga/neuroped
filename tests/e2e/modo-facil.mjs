// Modo Fácil (joguinho) nas quatro aplicações diretas: informar a idade, tocar em
// Começar, marcar Acertou / Não acertou / Pular e chegar ao resultado, sem nenhuma
// outra decisão. No Reconhecimento Visual a criança toca na figura e o jogo passa
// sozinho. Cada tela também prova que o modo guiado continua sendo o padrão.
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

try {
  // Sonda Dez
  await open("testes-diretos", "sonda-track-tabs");
  assert.equal(await tab("^Guia de primeira aplicação").getAttribute("aria-selected"), "true", "guiado continua padrão");
  await page.getByTestId("sonda-easy-tab").click();
  await page.getByTestId("sonda-easy-start").waitFor();
  assert.equal(await page.getByTestId("sonda-easy-step").count(), 0, "sem idade não há passo");
  await page.getByLabel("Idade em anos").fill("4");
  await page.getByLabel("Meses adicionais").fill("0");
  await page.getByTestId("sonda-easy-step").waitFor();
  assert.equal(await page.getByTestId("sonda-easy-tab").isDisabled(), false, "aba livre antes do primeiro passo");
  await screen("sonda-facil-passo", '[data-testid="sonda-digital"]');
  await page.getByTestId("sonda-easy-acertou").click();
  assert.equal(await page.getByTestId("sonda-easy-tab").isDisabled(), true, "aba trava depois do primeiro passo");
  await page.getByRole("button", { name: "Voltar um passo" }).click();
  assert.match(await page.getByTestId("sonda-easy-progress").innerText(), /^1 \//, "voltar um passo funciona");
  const sonda = await playEasy("sonda-easy");
  assert.ok(sonda.steps >= 10, `Sonda 3-4a tem passos suficientes (${sonda.steps})`);
  assert.equal(sonda.acertou + sonda.nao + sonda.pulou, sonda.steps);
  const sondaReport = await page.getByLabel("Resultado do jogo").inputValue();
  assert.match(sondaReport, /Sonda Dez · Modo Fácil/);
  assert.match(sondaReport, /NÃO É ESCORE, PERCENTIL NEM DIAGNÓSTICO/);
  await screen("sonda-facil-resultado", '[data-testid="sonda-digital"]');

  // OBS-10
  await open("avaliacao-pre-consulta-faixa-etaria", "obs10-track-tabs");
  assert.equal(await tab("^Guia da assistente").getAttribute("aria-selected"), "true", "guiado continua padrão");
  await page.getByTestId("obs10-easy-tab").click();
  await page.getByTestId("obs10-easy-start").waitFor();
  assert.equal(await page.getByTestId("obs10-first-time").count(), 0, "sem guia de primeira vez");
  assert.equal(await page.locator(".obs10-checklist").count(), 0, "sem checklist");
  await page.getByLabel("Anos completos", { exact: true }).fill("4");
  await page.getByLabel("Meses adicionais", { exact: true }).fill("0");
  await page.getByTestId("obs10-easy-step").waitFor();
  await screen("obs10-facil-passo", ".obs10");
  const obs = await playEasy("obs10-easy");
  assert.ok(obs.steps >= 6, `OBS-10 4 anos tem tarefas (${obs.steps})`);
  const obsReport = await page.getByLabel("Resultado do jogo").inputValue();
  assert.match(obsReport, /OBS-10 · Modo Fácil/);
  assert.match(obsReport, /Modo Fácil: sem filmagem integrada/);
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
  assert.match(rvReport, /\(toque da criança na tela\)/, "desfecho automático fica declarado no resultado");
  assert.match(rvReport, /Pulou: 1/);
  await screen("rv-facil-resultado", ".rv-workspace");

  // Testes Cognitivos: quatro mundos em sequência e resultado
  await page.goto(`${server.origin}/#/testes-cognitivos`);
  await page.getByRole("heading", { name: "Testes Cognitivos por Faixa Etária" }).waitFor({ timeout: 20000 });
  assert.equal(await tab("^Guiado").getAttribute("aria-selected"), "true", "guiado continua padrão");
  await page.getByTestId("cognitive-easy-tab").click();
  await page.getByLabel("Idade da criança (anos)").fill("7");
  await button("Iniciar aventura").click();
  assert.equal(await page.getByText("Escolha seu herói").count(), 0, "sem escolha de herói");
  assert.equal(await page.getByText("Para onde vamos agora?").count(), 0, "sem mapa");
  await screen("cognitivo-facil-mundo", "main");
  for (let world = 0; world < 4; world += 1) {
    const next = page.getByTestId("cognitive-easy-next");
    let guard = 0;
    while (!(await next.count())) {
      assert.ok(guard++ < 80, "mundo termina");
      const answer = page.locator('section[aria-labelledby^="world-"] button[aria-pressed]:not([disabled])').first();
      const finishObs = page.locator('section[aria-labelledby^="world-"]').getByRole("button", { name: "Concluir missão" });
      if (await finishObs.count()) {
        await finishObs.click();
        continue;
      }
      if (await answer.count()) await answer.click();
      const advance = page.locator('section[aria-labelledby^="world-"]').getByRole("button", { name: /Próxima fase|Concluir mundo/ });
      if (await advance.count()) {
        const before = (await page.locator('section[aria-labelledby^="world-"]').getByText(/^Fase \d+ de \d+$/).allInnerTexts()).join();
        await advance.click();
        // Espera a fase mudar ou o mundo fechar: o painel antigo sai com pointer-events:none.
        const settled = () => page.evaluate(([prev]) => {
          const sec = document.querySelector('section[aria-labelledby^="world-"]');
          const badge = [...(sec?.querySelectorAll("*") ?? [])].map((el) => el.textContent?.trim()).filter((t) => /^Fase \d+ de \d+$/.test(t ?? "")).join();
          return { badge, prev, next: Boolean(document.querySelector('[data-testid="cognitive-easy-next"]')), active: `${document.activeElement?.tagName}:${(document.activeElement?.textContent ?? "").trim().slice(0, 24)}`, sectionText: (sec?.textContent ?? "").slice(0, 160) };
        }, [before]);
        try {
          await page.waitForFunction(([prev]) => {
            const sec = document.querySelector('section[aria-labelledby^="world-"]');
            const badge = [...(sec?.querySelectorAll("*") ?? [])].map((el) => el.textContent?.trim()).filter((t) => /^Fase \d+ de \d+$/.test(t ?? "")).join();
            return badge !== prev || Boolean(document.querySelector('[data-testid="cognitive-easy-next"]'));
          }, [before], { timeout: 10000 });
        } catch (error) {
          console.log("MODO_FACIL_DEBUG", JSON.stringify({ world, guard, ...(await settled()) }));
          throw error;
        }
      }
    }
    await next.click();
  }
  await page.getByTestId("cognitive-easy-results").waitFor();
  const cogReport = await page.getByLabel("Resultado do Modo Fácil").inputValue();
  assert.match(cogReport, /Mundos concluídos: 4 de 4/);
  assert.match(cogReport, /NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO/);
  await screen("cognitivo-facil-resultado", "main");

  assert.deepEqual(errors, [], "sem erros de página");
  console.log(`Modo Fácil: quatro joguinhos jogados até o resultado (Sonda ${sonda.steps} passos, OBS-10 ${obs.steps} passos, Reconhecimento com toque automático, Cognitivo 4 mundos).`);
} finally {
  await browser.close();
  await server.close();
}
