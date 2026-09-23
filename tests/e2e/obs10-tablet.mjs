import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
const dir = process.env.OBS10_TABLET_ARTIFACT_DIR || "/tmp/obs10-tablet";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] }));
const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, acceptDownloads: true, permissions: ["camera", "microphone"] });
await context.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage(); const errors = []; const screens = [];
page.on("pageerror", (e) => errors.push(e.message)); page.on("dialog", (d) => d.accept());
const w = page.getByTestId("obs10-tablet");
const b = (name) => w.getByRole("button", { name, exact: true });
const phase = (name) => page.locator(`[data-testid=obs10-tablet][data-phase=${name}]`).waitFor();
async function open() { await page.getByRole("button", { name: "Abrir modo tablet · experimental", exact: true }).click(); await phase("setup"); }
async function setup(years, months = 0, integrated = false) {
  await w.getByLabel("Código institucional, sem nome", { exact: true }).fill("TABLET-SINTETICO");
  await w.getByLabel("Anos completos", { exact: true }).fill(String(years));
  await w.getByLabel("Meses adicionais", { exact: true }).fill(String(months));
  for (const box of await w.locator('.ot-check input[type="checkbox"]').all()) await box.check();
  await b("Continuar para a câmera").click(); await phase("camera");
  if (integrated) { await b("Testar câmera do tablet").click(); await w.getByLabel("Prévia da câmera do modo tablet").waitFor(); }
  else { await w.getByLabel("Outra câmera institucional", { exact: true }).check(); await w.getByLabel("A outra câmera está pronta e será iniciada antes da coleta.", { exact: true }).check(); }
  await w.getByLabel("Conferi enquadramento e captação de voz no equipamento. Tenho espaço para salvar.", { exact: true }).check();
  await b("Continuar para o ensaio").click(); await phase("rehearsal");
  assert.equal(await b("Entendi · revisar preparação").isDisabled(), true);
  await b("Experimentar a tela da criança").click(); await b("Terminei o ensaio · voltar às instruções").click();
  await b("Entendi · revisar preparação").click(); await phase("ready");
  await b("Iniciar observação de até 10 minutos").click(); await phase("cue");
}
async function screen(name) {
  assert.equal(await page.locator(".ot-dialog").evaluate((d) => d.scrollWidth > d.clientWidth), false, `${name}: no clipped horizontal layout`);
  const audit = await new AxeBuilder({ page }).include(".ot-dialog").analyze();
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(audit.violations, null, 2));
  assert.deepEqual(audit.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], name);
  // A fixed modal is viewport-sized: full-height element capture can include unrelated background beyond it.
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }); screens.push(name);
}
async function saveAndClose(name) {
  await b("Continuar para guardar os arquivos").click(); await phase("delivery");
  await w.getByLabel("Não há vídeo utilizável; informarei essa limitação ao médico.", { exact: true }).check();
  const pending = page.waitForEvent("download"); await b("Salvar registro JSON").click();
  const download = await pending; await download.saveAs(`${dir}/${name}.json`);
  const record = JSON.parse(await readFile(`${dir}/${name}.json`, "utf8"));
  await w.getByLabel("Conferi os arquivos atuais no armazenamento institucional. Entrega ao médico segue o fluxo da clínica.", { exact: true }).check();
  await b("Concluir e voltar ao OBS-10").click(); await w.waitFor({ state: "detached" }); return record;
}
async function runTask(i, opts = {}) {
  await phase("cue");
  assert.equal(await w.getByTestId("obs10-station-journey").count(), 1, "adult cue keeps the station world map visible");
  assert.equal(await w.getByTestId("obs10-mission-map").count(), 0, "live collection uses a compact station HUD instead of a full task map");
  assert.match(await w.getByTestId("obs10-station-checkpoint").textContent(), new RegExp(`ESTAÇÃO\\s*${i + 1}`, "iu"), "checkpoint announces current station");
  const title = await w.locator("h1").textContent();
  if (opts.capture && title.includes("cena")) await screen("02-cena-orientacao");
  assert.match(await w.locator(".ot-pacing").first().textContent(), /Sugestão de ritmo: até \d+s/, "every activity carries its pacing guidance");
  if (title.includes("quatro movimentos")) {
    // Movement is observed by the camera: four spoken steps for the adult, nothing on the child surface.
    assert.equal(await w.locator(".ot-steps li").count(), 4);
    assert.match(await w.getByTestId("tablet-cue").textContent(), /vire e volte/);
    assert.match(await w.getByTestId("tablet-cue").textContent(), /Omita qualquer movimento inseguro/);
    if (opts.capture) await screen("06-movimento-pela-camera");
  }
  if (title.includes("regra simples")) assert.ok(await w.locator(".ot-steps li").count() >= 3);
  const openActivity = w.getByRole("button", { name: /^(Iniciar esta interação|Abrir estação para a criança)$/ });
  await openActivity.click(); await phase("child");
  assert.equal(await w.getByTestId("tablet-cue").count(), 0, "adult instructions are unmounted from child screen");
  assert.equal(await w.getByTestId("obs10-station-journey").count(), 0, "child surface has no station map");
  assert.equal(await w.getByTestId("obs10-station-checkpoint").count(), 0, "child surface has no adult checkpoint");
  if (title.includes("palavras")) assert.ok(!/casa, gato, pão/i.test(await w.textContent()), "no memory answers in child DOM");
  if (title.includes("regra simples") || title.includes("quatro movimentos")) {
    assert.ok(!/SOL|LUA|vire e volte|nariz/.test(await w.textContent()), "spoken proposals never leak to the child screen");
    assert.equal(await w.locator(".ot-child svg").count(), 0);
  }
  if (await w.getByTestId("tablet-drawing").count()) {
    const draw = w.getByLabel("Área para desenhar com o dedo", { exact: true }); await draw.scrollIntoViewIfNeeded();
    const box = await draw.boundingBox(); await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down();
    await page.mouse.move(box.x + box.width * .55, box.y + box.height * .5, { steps: 8 });
    await draw.dispatchEvent("pointerup", { pointerId: 987, pointerType: "touch", isPrimary: false });
    await page.mouse.move(box.x + box.width * .8, box.y + box.height * .6, { steps: 4 }); await page.mouse.up();
    if (opts.capture) await screen(`03-desenho-na-tela-${i}`);
  }
  if (await w.getByRole("button", { name: "Escolher círculo", exact: true }).count()) { await b("Escolher círculo").click(); await b("Escolher círculo").click(); }
  if (await w.getByTestId("tablet-reading").count()) {
    assert.match(await w.getByTestId("tablet-reading").textContent(), /O gato dorme na cadeira/);
    await page.setViewportSize({ width: 390, height: 844 }); await screen("04-leitura-celular"); await page.setViewportSize({ width: 1280, height: 960 });
  }
  await b("Terminar tentativa · registrar").click(); await phase("response");
  await b("Na proposta inicial").click();
  const noteText = `Tentativa fictícia ${i + 1}: registro específico da ação observada.`;
  await w.getByLabel("O que você viu ou ouviu? Inclua ajuda e limitações.", { exact: true }).fill(noteText);
  await b("Salvar resposta e continuar").click();
  if (!opts.last) {
    const transition = w.getByTestId("tablet-transition"); await transition.waitFor();
    const savedNote = transition.getByLabel("Completar descrição factual da estação encerrada", { exact: true });
    assert.equal(await savedNote.inputValue(), noteText, "transition reads the description already persisted for the closed station");
    assert.match(await w.locator(".ot-live-bar").textContent(), /Entre estações · próxima:/, "live bar identifies the pause and the next station");
    if (i === 0) await savedNote.fill(`${noteText} Complemento factual na transição.`);
    await b("Continuar para a próxima estação").click();
  }
}
try {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email); await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click(); await page.getByTestId("obs10-workspace").waitFor();
  await open(); await screen("01-preparacao-tablet");
  assert.equal(await w.getByTestId("obs10-station-journey").count(), 1);
  assert.equal(await w.getByTestId("obs10-station-journey").locator('[data-station-state="current"]').first().getAttribute("aria-current"), "step");
  await b("Letras maiores").focus(); await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest(".ot-dialog"))), true, "keyboard stays in the active dialog");
  for (const control of await w.getByRole("button").all()) if (await control.isVisible()) assert.ok((await control.boundingBox()).height >= 59, "tablet touch targets remain at least 60 CSS pixels, allowing subpixel rounding");
  await b("Letras maiores").click(); await page.setViewportSize({ width: 390, height: 844 }); await screen("01b-preparacao-letras-maiores"); await b("Letras maiores").click(); await page.setViewportSize({ width: 1280, height: 960 });
  await setup(3, 6);
  for (let i = 0; i < 8; i++) await runTask(i, { capture: true, last: i === 7 });
  await phase("review"); await screen("05-revisao");
  assert.equal(await w.getByTestId("obs10-mission-map").locator("li").count(), 8);
  assert.equal(await w.getByTestId("obs10-mission-map").locator('[data-station-state="done"]').count(), 8, "review map reports eight factual records, not pass/fail");
  assert.equal(await w.getByTestId("obs10-mission-map").locator('[data-station-state="current"]').count(), 0);
  assert.match(await w.getByTestId("obs10-mission-map").textContent(), /Percurso desta sessão/, "review never claims the whole route was completed");
  const record = await saveAndClose("registro-completo");
  assert.equal(record.protocol, "obs10-tablet/1.0.0"); assert.equal(record.observations.length, 8);
  const strokes = record.events.filter((e) => e.type === "stroke");
  assert.ok(strokes.length > 0); assert.ok(strokes.every((e) => e.value.at(-1).x > .75), "secondary pointer cannot prematurely terminate the active trace");
  assert.equal(record.events.filter((e) => e.type === "select").length, 2);
  assert.ok(record.observations.every((o) => o.note.includes("fictícia")));
  assert.match(record.observations[0].note, /Complemento factual na transição/, "typing during the transition preserves and extends the saved description");
  await open(); await setup(7);
  assert.match(await w.locator(".ot-live-bar").textContent(), /Estação 1 de 10/, "school-age band gains the camera-observed movement and the oral rule");
  for (let i = 0; i < 10; i++) await runTask(i, { capture: i === 6, last: i === 9 });
  await phase("review"); const escolar = await saveAndClose("registro-escolar");
  assert.equal(escolar.observations.length, 10);
  const ids = escolar.observations.map((o) => o.taskId);
  assert.ok(ids.includes("y06:movement") && ids.includes("y06:rule"), "camera-observed movement and the oral rule are recorded");
  assert.ok(ids.indexOf("y06:movement") > ids.indexOf("y06:encoding") && ids.indexOf("y06:movement") < ids.indexOf("y06:recall"), "movement fills the retention interval");
  await open(); await w.getByText("Reabrir um registro tablet já salvo", { exact: true }).click();
  await w.getByLabel("JSON do modo tablet", { exact: true }).setInputFiles({ name: "invalido.json", mimeType: "application/json", buffer: Buffer.from('{"version":"1.6.1"}') });
  await w.getByText(/Não foi possível abrir:/).waitFor(); await phase("setup");
  await w.getByLabel("JSON do modo tablet", { exact: true }).setInputFiles(`${dir}/registro-completo.json`); await phase("review");
  assert.equal(await w.getByRole("button", { name: "Iniciar observação de até 10 minutos", exact: true }).count(), 0);
  await b("Continuar para guardar os arquivos").click(); await phase("delivery");
  await w.getByLabel("Não há vídeo utilizável; informarei essa limitação ao médico.", { exact: true }).check();
  const exported = page.waitForEvent("download"); await b("Salvar registro JSON").click(); await exported;
  await b("Voltar e revisar").click();
  await w.locator(".ot-review-item summary").first().click(); await w.locator(".ot-review-item textarea").first().fill("Complemento fictício após encerramento.");
  await b("Continuar para guardar os arquivos").click();
  assert.equal(await b("Concluir e voltar ao OBS-10").isDisabled(), true, "editing invalidates the saved artifact");
  await b("Voltar e revisar").click(); await saveAndClose("registro-reaberto");
  await open(); await setup(0, 6);
  await b("Iniciar esta interação").click(); await phase("child"); assert.equal(await w.locator(".ot-child svg").count(), 0);
  await b("Terminar tentativa · registrar").click(); await phase("response");
  await w.getByLabel("O que você viu ou ouviu? Inclua ajuda e limitações.", { exact: true }).fill("Nota fictícia antes de interromper.");
  await b("Encerrar e completar depois").click(); await phase("review");
  const partial = await saveAndClose("registro-parcial");
  assert.equal(partial.observations[0].note, "Nota fictícia antes de interromper.", "typed facts cannot disappear on early end");
  assert.equal(partial.observations[0].outcome, null);
  // Category during collection, description in review: the pending item is surfaced, never invented.
  await open(); await setup(1, 6);
  await b("Iniciar esta interação").click(); await phase("child");
  await b("Terminar tentativa · registrar").click(); await phase("response");
  await b("Após repetição").click();
  await b("Marcar categoria e continuar · detalhar depois").click(); await phase("cue");
  await b("Encerrar coleta").click(); await phase("review");
  assert.match(await w.getByTestId("tablet-pending").textContent(), /1 estação com categoria marcada e descrição pendente/);
  assert.match(await w.locator(".ot-review-item summary").first().textContent(), /descrição pendente/);
  assert.equal(await w.getByTestId("obs10-mission-map").locator('[data-station-state="partial"]').count(), 1, "station review surfaces a pending description without calling it failure");
  await screen("07-descricao-pendente");
  const deferred = await saveAndClose("registro-categoria-sem-descricao");
  assert.equal(deferred.observations[0].outcome, "V");
  assert.equal(deferred.observations[0].note, "", "no description is fabricated for the doctor");
  assert.match(await readFile(`${dir}/registro-categoria-sem-descricao.json`, "utf8"), /"note": ""/);
  assert.deepEqual(errors, []);
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, screens, errors, scope: "Real built route, synthetic account and clinical data only. Browser checks are not human usability or clinical validation." }, null, 2));
  console.log("OBS-10 Tablet real browser journey passed.");
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: false }); await writeFile(`${dir}/failure.txt`, String(error.stack || error)); throw error;
} finally { await context.close(); await browser.close(); await server.close(); }
