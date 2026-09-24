/** Second-round regression journey against the real build; browser/media fixtures only. */
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
const dir = process.env.OBS10_PRACTICAL_ARTIFACT_DIR || "/tmp/obs10-practical";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] }));
const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, acceptDownloads: true, permissions: ["camera", "microphone"] });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [], screens = [], dialogs = [];
page.on("pageerror", (error) => errors.push(error.message));
let dismissNext = false;
page.on("dialog", async (dialog) => {
  dialogs.push(dialog.message());
  if (dismissNext) { dismissNext = false; await dialog.dismiss(); } else await dialog.accept();
});
const b = (name) => page.getByRole("button", { name, exact: true });
async function login() {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await page.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
  await page.waitForFunction(() => {
    let el = document.querySelector('[data-testid="obs10-workspace"]');
    while (el) { if (Number(getComputedStyle(el).opacity) < .99) return false; el = el.parentElement; }
    return true;
  });
}
async function prepare(y, m = 0) {
  await page.getByLabel("Anos completos", { exact: true }).fill(String(y));
  await page.getByLabel("Meses adicionais", { exact: true }).fill(String(m));
  await page.getByLabel("Código institucional, sem nome", { exact: true }).fill("OBS11-SINTETICO");
  for (const box of await page.locator(".obs10-checklist input").all()) await box.check();
  assert.equal(await b("Iniciar aplicação · 10 minutos").isDisabled(), true, "materials must be explicitly checked");
  await b("Separei o kit completo").click();
}
async function screen(label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, label);
  const result = await new AxeBuilder({ page }).include(".obs10").analyze();
  await writeFile(`${dir}/${label}-axe.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  await page.screenshot({ path: `${dir}/${label}.png`, fullPage: true }); screens.push(label);
}
async function newSession() { await b("Nova aplicação · limpar esta sessão").click(); }
try {
  await login();
  await prepare(1, 8);
  assert.ok(await page.locator('.obs10-material svg[role="img"]').count() >= 8);
  assert.ok(await page.getByTestId("obs10-materials-first").evaluate((el) => el.getBoundingClientRect().top < document.querySelector(".obs10-setup").getBoundingClientRect().top));
  await screen("01-kit-18-meses-desktop");
  await page.setViewportSize({ width: 390, height: 844 }); await screen("02-kit-celular");
  await page.setViewportSize({ width: 1440, height: 1080 });
  // A missing device blocks filming even if all other omissions were acknowledged.
  await page.locator('[data-material="device"]').getByRole("button", { name: "Ausente", exact: true }).click();
  assert.equal(await b("Iniciar aplicação · 10 minutos").isDisabled(), true);
  await page.locator('[data-material="device"]').getByRole("button", { name: "Separado / substituído", exact: true }).click();
  await page.locator('[data-material="car"]').getByRole("button", { name: "Ausente", exact: true }).click();
  await b("Iniciar aplicação · 10 minutos").click();
  await page.getByRole("button", { name: /3\. Linguagem e raciocínio/ }).click();
  assert.match(await page.getByTestId("obs10-practical-task").textContent(), /Material ausente/);
  await b("Registrar omissão").click();
  await b("Próxima tarefa").click();
  await page.getByRole("group", { name: "Registro rápido desta tarefa", exact: true }).getByRole("button", { name: "Após gesto/modelo", exact: true }).click();
  await screen("03-comando-e-registro-rapido");
  // Cancel internal and native hash navigation, without injecting React state.
  dismissNext = true;
  await page.getByRole("link", { name: /Sonda Dez/ }).first().click();
  assert.match(page.url(), /avaliacao-pre-consulta-faixa-etaria/);
  assert.ok(await page.locator(".obs10-response-saved").count());
  dismissNext = true;
  await page.evaluate(() => { window.location.hash = "/testes-diretos"; });
  await page.waitForFunction(() => window.location.hash.includes("avaliacao-pre-consulta-faixa-etaria"));
  assert.ok(await page.locator(".obs10-response-saved").count());
  await b("Encerrar antes").click();
  const downloadPromise = page.waitForEvent("download"); await b("Exportar JSON").click();
  const download = await downloadPromise; await download.saveAs(`${dir}/registro-sintetico.json`);
  const data = JSON.parse(await readFile(`${dir}/registro-sintetico.json`, "utf8"));
  assert.equal(data.version, "1.6.1");
  assert.ok(data.sessionId && data.context.missingMaterials.includes("Carrinho grande"));
  assert.ok(data.observations.some((entry) => entry.outcome === "NA" && /Material ausente/.test(entry.assistance)));
  assert.ok(data.observations.some((entry) => entry.outcome === "M" && entry.response === ""), "category must not fabricate a clinical finding");
  assert.match(await page.locator(".obs10-summary").textContent(), /Registro incompleto/);
  // Print report in a separate document: text-only patient input cannot become HTML.
  const popupPromise = page.waitForEvent("popup"); await b("Imprimir resumo").click(); const popup = await popupPromise;
  await popup.locator("pre#report").waitFor();
  assert.match(await popup.locator("pre#report").textContent(), /OBS-10/);
  assert.equal(await popup.locator("nav, .obs10-toolbar").count(), 0);
  await popup.close();
  await newSession();
  // Pending permission cancellation + late rejection must not release the newer stream.
  await prepare(7);
  await page.getByLabel(/Usar câmera e microfone deste dispositivo/).check();
  await page.evaluate(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    let first = true;
    navigator.mediaDevices.getUserMedia = (constraints) => {
      if (first) { first = false; return new Promise((_resolve, reject) => { window.__oldMediaReject = reject; }); }
      return original(constraints);
    };
  });
  await b("Testar câmera antes de iniciar").click();
  await b("Cancelar solicitação de câmera").waitFor();
  assert.equal(await page.getByLabel("Anos completos", { exact: true }).isDisabled(), true);
  await b("Cancelar solicitação de câmera").click();
  await b("Testar câmera antes de iniciar").click();
  const preview = page.getByLabel("Teste de enquadramento antes da aplicação", { exact: true });
  await preview.waitFor();
  await page.evaluate(() => window.__oldMediaReject(new DOMException("late denial", "NotAllowedError")));
  await page.waitForTimeout(100);
  assert.equal(await preview.evaluate((el) => el.srcObject.getTracks().every((track) => track.readyState === "live")), true, "late old failure cannot close fresh preview");
  assert.equal(await page.getByTestId("obs10-clock").count(), 0, "camera preview is before timer and not a recording");
  await screen("04-previa-antes-do-cronometro");
  await b("Iniciar aplicação · 10 minutos").click();
  await page.locator(".obs10-camera video").waitFor();
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.__currentTracks = document.querySelector(".obs10-camera video").srcObject.getTracks();
    window.__currentTracks[0].dispatchEvent(new Event("ended"));
  });
  await page.locator(".obs10-summary").waitFor();
  assert.match(await page.locator(".obs10-summary").textContent(), /Interrupção técnica/);
  await page.getByRole("link", { name: "Salvar vídeo no dispositivo institucional" }).waitFor();
  assert.equal(await page.evaluate(() => window.__currentTracks.every((track) => track.readyState === "ended")), true);
  // Emergency button after completion must not discard a finalized video.
  const href = await page.getByRole("link", { name: "Salvar vídeo no dispositivo institucional" }).getAttribute("href");
  await b("Interromper e chamar médico").click(); await b("Entendido · manter aplicação encerrada").click();
  assert.equal(await page.getByRole("link", { name: "Salvar vídeo no dispositivo institucional" }).getAttribute("href"), href);
  await newSession();
  // Child-free rehearsal is descriptive and never grants medical competence.
  await page.getByText("Treinar o registro sem criança nem câmera", { exact: true }).click();
  await page.locator(".obs10-rehearsal fieldset").nth(0).getByRole("button", { name: "Após repetição", exact: true }).click();
  await page.locator(".obs10-rehearsal fieldset").nth(1).getByRole("button", { name: "Recusou", exact: true }).click();
  await page.locator(".obs10-rehearsal fieldset").nth(2).getByRole("button", { name: "Não aplicado", exact: true }).click();
  assert.equal(await page.locator(".obs10-rehearsal [role=status]").count(), 3);
  await screen("05-treinamento-operacional");
  // Inspect distinct motor illustrations on the shipped task cards.
  await prepare(5); await b("Iniciar aplicação · 10 minutos").click();
  await page.locator(".obs10-stepper button").nth(3).click();
  for (let i = 0; i < 3; i++) await b("Próxima tarefa").click();
  assert.match(await page.locator(".obs10-practical-task h3").textContent(), /Braços à frente/);
  await screen("06-bracos-a-frente");
  await b("Encerrar antes").click(); await newSession();
  await prepare(2, 6); await b("Iniciar aplicação · 10 minutos").click();
  await page.locator(".obs10-stepper button").nth(3).click();
  await b("Próxima tarefa").click(); await b("Próxima tarefa").click();
  assert.match(await page.locator(".obs10-practical-task h3").textContent(), /Pequeno salto com dois pés/);
  await screen("07-salto-dois-pes");
  await b("Encerrar antes").click(); await newSession();
  // Every age sheet and every card must be reachable, not only the screenshots.
  let inspectedCards = 0;
  for (const [years, months] of [[0,0],[0,3],[0,6],[0,9],[1,0],[1,6],[2,0],[3,0],[4,0],[5,0],[6,0],[9,0],[12,0]]) {
    await prepare(years, months); await b("Iniciar aplicação · 10 minutos").click();
    for (let phase = 0; phase < 6; phase++) {
      await page.locator(".obs10-stepper button").nth(phase).click();
      const text = await page.locator(".obs10-task-position strong").textContent();
      const count = Number(text.match(/de (\d+)/)[1]);
      assert.ok(count > 0);
      for (let card = 0; card < count; card++) {
        assert.ok((await page.locator(".obs10-practical-task h3").textContent()).trim().length > 5);
        assert.equal(await page.locator(".obs10-practical-task > svg").count(), 1);
        assert.ok((await page.locator(".obs10-practical-task > svg title").textContent()).startsWith("Guia visual:"));
        inspectedCards++;
        if (card + 1 < count) await b("Próxima tarefa").click();
      }
    }
    await b("Encerrar antes").click(); await newSession();
  }
  assert.equal(inspectedCards, 145, "all cards in all thirteen age sheets were rendered through the real interface");
  assert.deepEqual(errors, []);
  assert.ok(dialogs.filter((message) => /Sair elimina/.test(message)).length >= 2);
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, screens, inspectedCards, ageSheets: 13, exceptions: errors, scope: "Actual built route, synthetic auth/media; no clinical validity claim.", checks: ["illustrated kits", "missing equipment", "one-task instructions", "no manufactured findings", "cancel internal/hash exit", "separate printing", "late permission failure", "camera preview", "track disconnect", "video retention", "rehearsal"] }, null, 2));
  console.log("OBS-10 practical workflow and lifecycle regressions passed.");
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: true });
  await writeFile(`${dir}/failure.txt`, String(error.stack || error));
  throw error;
} finally { await context.close(); await browser.close(); await server.close(); }
