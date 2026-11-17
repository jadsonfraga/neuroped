// OBS-10 · modo Fases na rota real construída (dist/public), com API sintética e dados 100% fictícios.
// Cobre: padrão da rota, preparo em uma tela, um toque por cartão, transições de fase, encerramento,
// entrega TXT/JSON, reabertura no Guia da assistente, omissão de prono, saída da aba e emergência.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.OBS10_FASES_ARTIFACT_DIR || "/tmp/obs10-fases";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [], screens = [], writes = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
page.on("request", (r) => { if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()) && /\/api\//.test(r.url()) && !/\/api\/auth\//.test(r.url())) writes.push(r.url()); });
const button = (name) => page.getByRole("button", { name, exact: true });
const tab = (pattern) => page.getByRole("tab", { name: pattern });
async function screen(name) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${name}`);
  const axe = await new AxeBuilder({ page }).include(".obs10").analyze();
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(axe.violations, null, 2));
  assert.deepEqual(axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  screens.push(name);
}
async function download(name, label) {
  const pending = page.waitForEvent("download"); await button(label).click();
  const file = await pending; await file.saveAs(`${dir}/${name}`);
  return readFile(`${dir}/${name}`, "utf8");
}
async function prepare(years, months) {
  await page.getByLabel("Anos completos", { exact: true }).fill(years);
  await page.getByLabel("Meses adicionais", { exact: true }).fill(months);
  await page.getByRole("button", { name: /^Criança bem/ }).click();
  await page.getByRole("button", { name: /^Sala segura e kit separado/ }).click();
  await page.getByRole("button", { name: /^Celular de apoio filmando/ }).click();
}
/** Respeita o intervalo anti-toque-duplo da interface (350 ms), como uma aplicadora que lê o cartão seguinte. */
async function tap(label) { await button(label).click(); await page.waitForTimeout(400); }
async function focusedHeading() {
  await page.waitForFunction(() => document.activeElement?.tagName === "H2", null, { timeout: 5000 });
}
try {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await page.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
  await page.waitForFunction(() => { let n = document.querySelector('[data-testid="obs10-workspace"]'); while (n) { if (Number(getComputedStyle(n).opacity) < .99) return false; n = n.parentElement; } return true; });

  // 1. Fases é o padrão; nada inicia sem idade, duas confirmações e a forma de filmagem.
  assert.equal(await tab(/^🗺️ Fases/).getAttribute("aria-selected"), "true", "Fases é o padrão da rota");
  await page.getByTestId("obs10-fases-start").waitFor();
  const go = button("Começar · 10 minutos");
  assert.equal(await go.isDisabled(), true);
  assert.match(await page.locator(".fases-missing").textContent(), /idade · criança bem · sala e kit · filmagem/);
  await page.getByLabel("Anos completos", { exact: true }).fill("4");
  assert.match(await page.locator(".obs10-band-selected").textContent(), /Ficha: 4 anos/);
  assert.ok(await page.locator(".fases-kit li").count() > 2, "kit ilustrado da ficha");
  assert.equal(await go.isDisabled(), true, "idade sozinha não inicia");
  await page.getByRole("button", { name: /^Criança bem/ }).click();
  await page.getByRole("button", { name: /^Sala segura e kit separado/ }).click();
  await page.getByRole("button", { name: /^Celular de apoio filmando/ }).click();
  assert.equal(await go.isDisabled(), false);
  await screen("01-preparo-desktop");
  await page.setViewportSize({ width: 390, height: 844 }); await screen("02-preparo-celular");
  await page.setViewportSize({ width: 1440, height: 1000 });

  // 2. Coleta: um toque por cartão, avanço automático, transição entre fases.
  await go.click();
  await page.getByTestId("obs10-fases-card").waitFor();
  await page.getByTestId("obs10-track-tabs").waitFor({ state: "detached", timeout: 2000 }); // abas ocultas durante a coleta
  assert.match(await page.getByTestId("obs10-fases-clock").textContent(), /^00:0\d$/);
  await focusedHeading();
  await screen("03-cartao-desktop");
  const firstId = await page.getByTestId("obs10-fases-card").getAttribute("data-task-id");
  await page.getByLabel("Nota rápida (opcional): o que fez ou falou", { exact: true }).fill("entrou de mãos dadas e sentou");
  await tap("Fez sem ajuda extra");
  let marks = 1, interludes = 0, doubleTapped = false;
  for (let guard = 0; guard < 60; guard++) {
    if (await page.getByTestId("obs10-fases-interlude").count()) {
      const final = await button("Encerrar e ver resumo").count();
      if (interludes === 0) { await focusedHeading(); await screen("04-fase-concluida"); }
      interludes++;
      if (final) break;
      await page.getByRole("button", { name: /^Começar a fase \d$/ }).click();
      await page.getByTestId("obs10-fases-card").waitFor();
      continue;
    }
    const card = page.getByTestId("obs10-fases-card");
    assert.notEqual(await card.getAttribute("data-task-id"), firstId, "o cartão marcado não volta sozinho");
    if (await card.getByText("Esta tarefa não se aplica agora.").count()) { await tap("Registrar e seguir"); marks++; continue; }
    const kind = marks % 4;
    if (!doubleTapped && kind === 3) {
      // Toque duplo acidental: só o primeiro clique marca; o segundo não pode atingir o cartão seguinte.
      await page.evaluate(() => { const b = [...document.querySelectorAll('[data-testid="obs10-fases-choices"] button')].find((x) => x.textContent.includes("Não quis")); b.click(); b.click(); });
      doubleTapped = true; marks++; await page.waitForTimeout(450); continue;
    }
    if (kind === 1) {
      await button("Fez com ajuda…").click();
      await page.waitForFunction(() => document.activeElement?.textContent === "Que ajuda você deu?");
      if (marks === 1) await screen("05-ajuda");
      await tap("Repeti o pedido");
    } else if (kind === 2) {
      await button("Pular…").click(); await tap("Sem tempo.");
    } else if (kind === 3) await tap("Não quis");
    else await tap("Não fez agora");
    marks++;
  }
  assert.ok(doubleTapped, "cenário de toque duplo exercitado");
  assert.ok(interludes >= 6, `uma transição por fase (${interludes})`);
  await screen("06-todas-as-fases");
  await button("Encerrar e ver resumo").click();

  // 3. Entrega: resumo, notas opcionais, código, TXT/JSON.
  await page.getByTestId("obs10-fases-end").waitFor();
  await focusedHeading();
  assert.match(await page.getByTestId("obs10-fases-end").textContent(), /Todas as fases percorridas; encerrado pela aplicadora\./);
  await page.getByLabel("Código do registro, sem nome (opcional)", { exact: true }).fill("OBS-FASES-FICTICIO");
  const notes = page.locator(".fases-notes textarea");
  assert.ok(await notes.count() > 0, "notas opcionais para cartões marcados");
  await notes.last().fill("olhou para a mãe e sorriu");
  await screen("07-entrega-desktop");
  await page.setViewportSize({ width: 390, height: 844 }); await screen("08-entrega-celular");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const txt = await download("registro-fases.txt", "Baixar resumo (TXT)");
  assert.match(txt, /REGISTRO OBSERVACIONAL PARA REVISÃO MÉDICA — NÃO É LAUDO NEM DIAGNÓSTICO/);
  assert.match(txt, /Preparação: modo Fases/);
  assert.match(txt, /Código: OBS-FASES-FICTICIO/);
  assert.match(txt, /Fato\/resposta literal: entrou de mãos dadas e sentou/);
  assert.match(txt, /Fato\/resposta literal: olhou para a mãe e sorriu/);
  assert.match(txt, /Ajuda\/adaptação\/motivo da não aplicação: Sem tempo\./);
  assert.match(txt, /Captação: Filmagem externa declarada pela aplicadora/);
  assert.doesNotMatch(txt, /acertou|errou|pontos|estrela/i);
  const raw = await download("registro-fases.json", "Baixar arquivo para reabrir (JSON)");
  const record = JSON.parse(raw);
  assert.equal(record.context.preparation, "fases");
  assert.equal(record.context.bandId, "y04");
  assert.equal(record.observations.length, marks, "exatamente um registro por marcação; o toque duplo não marcou outro cartão");
  assert.ok(record.observations.every((o) => o.id.startsWith("guided-") && o.applicationSecond <= record.durationSeconds));
  await notes.last().fill("olhou para a mãe, sorriu e acenou");
  await page.getByText("Você mudou algo depois do último download.", { exact: false }).waitFor();

  // 4. Nova avaliação libera as abas; o JSON reabre na revisão completa do Guia.
  await button("Nova avaliação").click();
  await page.getByTestId("obs10-fases-start").waitFor();
  await tab(/^Guia da assistente/).click();
  await page.getByLabel("Arquivo JSON para revisão", { exact: true }).setInputFiles({ name: "OBS10-FASES.json", mimeType: "application/json", buffer: Buffer.from(raw) });
  await button("Abrir somente para revisão").click();
  await page.getByText("Registro reaberto apenas para revisão.", { exact: false }).waitFor();
  assert.match(await page.locator(".obs10-summary pre").textContent(), /Preparação: modo Fases/);
  await button("Nova aplicação · limpar esta sessão").click();
  await tab(/^🗺️ Fases/).click();

  // 5. Bebê de 3 meses sem autorização de prono, no celular: cartão de omissão com um toque; encerrar antes.
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare("0", "3");
  assert.equal(await page.getByLabel("O médico autorizou colocar de bruços (prono)", { exact: true }).isChecked(), false);
  await button("Começar · 10 minutos").click();
  for (let guard = 0; guard < 20; guard++) {
    if (await page.getByText("Esta tarefa não se aplica agora.", { exact: true }).count()) break;
    if (await page.getByTestId("obs10-fases-interlude").count()) { await page.getByRole("button", { name: /^Começar a fase \d$/ }).click(); continue; }
    await tap("Não quis");
  }
  assert.match(await page.locator(".fases-omit").textContent(), /Sem autorização para prono/);
  await screen("09-omissao-prono-celular");
  await tap("Registrar e seguir");
  await button("Encerrar").click();
  await page.getByTestId("obs10-fases-end").waitFor();
  assert.match(await page.getByTestId("obs10-fases-end").textContent(), /Encerramento antecipado pela aplicadora/);
  const infant = JSON.parse(await download("bebe.json", "Baixar arquivo para reabrir (JSON)"));
  assert.equal(infant.context.proneAllowed, false);
  assert.ok(infant.observations.some((o) => o.outcome === "NA" && /prono/.test(o.assistance)), "omissão registrada com o motivo da regra");
  await button("Nova avaliação").click();
  await page.setViewportSize({ width: 1440, height: 1000 });

  // 6. Sair da aba encerra a coleta; emergência encerra e mostra o fluxo de segurança.
  await prepare("9", "0");
  await button("Começar · 10 minutos").click();
  await page.getByTestId("obs10-fases-card").waitFor();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.getByTestId("obs10-fases-end").waitFor();
  assert.match(await page.getByTestId("obs10-fases-end").textContent(), /Coleta encerrada ao sair da aba/);
  await page.evaluate(() => { delete document.hidden; });
  await button("Nova avaliação").click();
  await prepare("12", "0");
  await button("Começar · 10 minutos").click();
  await button("Parar e chamar médico").click();
  await page.getByRole("alert").getByText("Pare a avaliação. Chame o médico agora.").waitFor();
  assert.match(await page.getByTestId("obs10-fases-end").textContent(), /Interrompido por segurança/);
  await screen("10-emergencia");

  assert.deepEqual(errors, [], "sem erros de página");
  assert.deepEqual(writes, [], "nenhuma escrita clínica no servidor");
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, screens, marks, interludes, exceptions: errors, scope: "Rota construída, API sintética, dados fictícios" }, null, 2));
  console.log(`✓ OBS-10 Fases: ${marks} cartões, ${interludes} transições, ${screens.length} telas auditadas`);
} catch (error) {
  await page.screenshot({ path: `${dir}/falha.png`, fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
  await server.close();
}
