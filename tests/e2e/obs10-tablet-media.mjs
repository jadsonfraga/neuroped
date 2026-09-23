import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
const dir = process.env.OBS10_TABLET_ARTIFACT_DIR || "/tmp/obs10-tablet";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] }));
const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, acceptDownloads: true, permissions: ["camera", "microphone"] });
await context.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message)); page.on("dialog", (d) => d.accept());
const w = page.getByTestId("obs10-tablet");
const b = (name) => w.getByRole("button", { name, exact: true });
const phase = (name) => page.locator(`[data-testid=obs10-tablet][data-phase=${name}]`).waitFor();
async function prepare(integrated) {
  await page.getByRole("button", { name: "Abrir modo tablet · experimental", exact: true }).click(); await phase("setup");
  await w.getByLabel("Código institucional, sem nome", { exact: true }).fill("MIDIA-FICTICIA");
  await w.getByLabel("Anos completos", { exact: true }).fill("3"); await w.getByLabel("Meses adicionais", { exact: true }).fill("0");
  for (const box of await w.locator('.ot-check input[type="checkbox"]').all()) await box.check();
  await b("Continuar para a câmera").click(); await phase("camera");
  if (integrated) {
    // Media behavior is browser fixture only. The application and recorder are real.
    await page.evaluate(() => {
      window.__tabletOriginalMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("synthetic denial", "NotAllowedError"));
    });
    await b("Testar câmera do tablet").click(); await w.getByText(/Não foi possível acessar câmera e microfone/).waitFor();
    assert.equal(await b("Continuar para o ensaio").isDisabled(), true);
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async (constraints) => {
      window.__tabletConstraints = constraints;
      const stream = await window.__tabletOriginalMedia(constraints); window.__tabletStream = stream; return stream;
    }; });
    await b("Testar câmera do tablet").click(); await w.getByLabel("Prévia da câmera do modo tablet").waitFor();
    assert.equal(await page.evaluate(() => window.__tabletConstraints.video.facingMode.ideal), "user");
  } else {
    await w.getByLabel("Outra câmera institucional", { exact: true }).check();
    await w.getByLabel("A outra câmera está pronta e será iniciada antes da coleta.", { exact: true }).check();
  }
  await w.getByLabel("Conferi enquadramento e captação de voz no equipamento. Tenho espaço para salvar.", { exact: true }).check();
  await b("Continuar para o ensaio").click(); await phase("rehearsal");
  if (integrated) assert.equal(await page.evaluate(() => window.__tabletStream.getTracks().every((t) => t.readyState === "ended")), true, "preview must release camera before rehearsal");
  await b("Experimentar a tela da criança").click(); await b("Terminei o ensaio · voltar às instruções").click();
  await b("Entendi · revisar preparação").click(); await phase("ready");
}
async function exportRecord(name) {
  const pending = page.waitForEvent("download"); await b("Salvar registro JSON").click(); const file = await pending;
  await file.saveAs(`${dir}/${name}.json`); return JSON.parse(await readFile(`${dir}/${name}.json`, "utf8"));
}
async function confirmAndExit() {
  await w.getByLabel("Conferi os arquivos atuais no armazenamento institucional. Entrega ao médico segue o fluxo da clínica.", { exact: true }).check();
  await b("Concluir e voltar ao OBS-10").click(); await w.waitFor({ state: "detached" });
}
try {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email); await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click(); await page.getByTestId("obs10-workspace").waitFor();
  await prepare(true);
  await b("Iniciar observação de até 10 minutos").click(); await phase("cue");
  await w.getByText("Câmera gravando", { exact: true }).waitFor(); await page.waitForTimeout(1600);
  await b("Iniciar esta interação").click(); await phase("child");
  await page.evaluate(() => { window.__tabletStream.getVideoTracks()[0].dispatchEvent(new Event("ended")); });
  await phase("review"); assert.match(await w.textContent(), /Interrupção técnica/);
  assert.equal(await page.evaluate(() => window.__tabletStream.getTracks().every((t) => t.readyState === "ended")), true);
  await b("Continuar para guardar os arquivos").click(); await phase("delivery");
  await w.getByRole("link", { name: "Salvar vídeo no tablet", exact: true }).waitFor();
  assert.equal(await w.getByLabel("O vídeo apareceu no destino institucional; conferi som e imagem.", { exact: true }).isDisabled(), true);
  const videoPending = page.waitForEvent("download"); await w.getByRole("link", { name: "Salvar vídeo no tablet", exact: true }).click();
  const video = await videoPending; await video.saveAs(`${dir}/video-sintetico.webm`);
  assert.ok((await readFile(`${dir}/video-sintetico.webm`)).length > 1000, "actual media bytes generated, not a pretend saved state");
  await w.getByLabel("O vídeo apareceu no destino institucional; conferi som e imagem.", { exact: true }).check();
  const recorded = await exportRecord("tablet-camera-parcial"); assert.equal(recorded.camera, "integrated"); await confirmAndExit();

  await prepare(false); await b("Iniciar observação de até 10 minutos").click(); await phase("cue");
  await b("Iniciar esta interação").click(); await phase("child");
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await phase("review"); assert.match(await w.textContent(), /sair da aba ou bloquear a tela/);
  await page.evaluate(() => { delete document.hidden; });
  await b("Continuar para guardar os arquivos").click();
  await w.getByLabel("Não há vídeo utilizável; informarei essa limitação ao médico.", { exact: true }).check();
  await exportRecord("tablet-aba-oculta"); await confirmAndExit();

  await prepare(false);
  // The browser clock advances; the production reducer and deadline checks are unchanged.
  await page.clock.install();
  await b("Iniciar observação de até 10 minutos").click(); await phase("cue");
  await page.clock.fastForward(601000); await phase("review");
  await b("Continuar para guardar os arquivos").click();
  await w.getByLabel("Não há vídeo utilizável; informarei essa limitação ao médico.", { exact: true }).check();
  const timed = await exportRecord("tablet-limite-dez-minutos"); assert.equal(timed.durationSeconds, 600);
  assert.equal(timed.observations.length, 0, "timeout must not invent results for unopened activities"); await confirmAndExit();
  assert.deepEqual(errors, []);
  await writeFile(`${dir}/media-result.json`, JSON.stringify({ passed: true, checks: ["denied camera permission", "front camera request", "rehearsal releases preview", "unexpected track stop", "real video download", "hidden tab", "absolute 600-second cap"], errors, scope: "Real UI/recorder and browser media fixtures, no patients or clinical validation." }, null, 2));
  console.log("OBS-10 Tablet camera, interruption and deadline checks passed.");
} catch (error) {
  await page.screenshot({ path: `${dir}/media-failure.png`, fullPage: true }); await writeFile(`${dir}/media-failure.txt`, String(error.stack || error)); throw error;
} finally { await context.close(); await browser.close(); await server.close(); }
