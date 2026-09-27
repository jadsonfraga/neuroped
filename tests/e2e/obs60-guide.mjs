import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

// One second of a flat gray frame, generated with FFmpeg/libx264. No person,
// patient, voice or clinical behavior. Actual decodable MP4, not a header stub.
const MP4 = await readFile(new URL("../fixtures/obs60-gray.mp4.base64", import.meta.url), "utf8");
const dir = process.env.OBS60_ARTIFACT_DIR || "/tmp/obs60-proof";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const options = auditBrowserLaunchOptions();
const browser = await chromium.launch({ ...options, args: [...(options.args || []), "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
await context.grantPermissions(["camera", "microphone"], { origin: server.origin });
await context.addInitScript(storage => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
let sends = 0;
let acceptDiscard = false;
page.on("pageerror", error => errors.push(error.message));
page.on("dialog", dialog => acceptDiscard ? dialog.accept() : dialog.dismiss());
// Only capability/auth fixtures. The built React UI and browser media APIs are
// real. This test does not claim production authentication or provider proof.
await page.route("**/api/integrations/obs60", async route => {
  if (route.request().method() === "POST") sends++;
  await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Synthetic unavailable provider", code: "VIDEO_AI_UNAVAILABLE" }) });
});
const panel = () => page.getByTestId("obs60-panel");
const button = name => panel().getByRole("button", { name, exact: true });
const consent = () => panel().getByLabel(/^A gravação está autorizada/);
async function open() {
  await page.getByTestId("obs60-launcher").getByRole("button").click();
  await panel().waitFor();
  await panel().getByText(/IA indisponível nesta sessão/).waitFor();
}
async function screenshot(name) {
  assert.equal(await panel().evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `dialog overflow: ${name}`);
  const violations = (await new AxeBuilder({ page }).include('[data-testid="obs60-panel"]').analyze()).violations;
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(violations, null, 2));
  assert.deepEqual(violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}
try {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await page.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
  await open();
  assert.equal(await button("Gravar 60 segundos").isDisabled(), true);
  assert.equal(await panel().locator('input[type="file"]').isDisabled(), true);
  for (const age of [24, 35, 36, 47, 48, 59]) {
    await panel().getByLabel("Idade exata em meses completos").selectOption(String(age));
    assert.equal(await panel().locator(".obs60-step").count(), 4);
    assert.equal(await panel().locator(".obs60-step blockquote").nth(1).textContent(), age < 36 ? "Coloque a bola na caixa." : "Coloque a bola na caixa e me dê a caixa.");
  }
  assert.equal(await panel().locator("select option").count(), 37, "only supported ages plus the empty option");
  await screenshot("01-desktop-guide");
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot("02-mobile-guide");
  await page.setViewportSize({ width: 1280, height: 1000 });
  await consent().check();
  await button("Preparar câmera").click();
  await page.waitForFunction(() => {
    const video = document.querySelector('video[aria-label="Prévia local da câmera"]');
    return video?.srcObject?.getVideoTracks().some(track => track.readyState === "live");
  });
  await page.evaluate(() => { window.__obs60SyntheticTracks = document.querySelector('video[aria-label="Prévia local da câmera"]').srcObject.getTracks(); });
  await button("Gravar 60 segundos").click();
  await page.waitForFunction(() => /0[1-9] \/ 60 segundos/.test(document.querySelector('[aria-label="Tempo gravado"]')?.textContent || ""));
  await button("Fechar observação de 60 segundos").click();
  await panel().getByText(/Encerre a gravação antes de sair/).waitFor();
  await button("Encerrar antes").click();
  await panel().getByLabel("Vídeo anexado para análise").waitFor();
  assert.equal(await button("Analisar vídeo e preencher registros").isDisabled(), true);
  assert.equal(await page.getByTestId("obs60-results").count(), 0);
  const downloading = page.waitForEvent("download");
  await button("Baixar vídeo separado").click();
  const download = await downloading;
  await download.saveAs(`${dir}/synthetic-recording.webm`);
  assert.ok((await readFile(`${dir}/synthetic-recording.webm`)).byteLength > 100, "actual MediaRecorder bytes exported");
  await page.keyboard.press("Escape");
  assert.equal(await panel().count(), 1, "declined discard preserves the clip");
  assert.equal(await panel().getByLabel("Vídeo anexado para análise").count(), 1);
  acceptDiscard = true;
  await button("Fechar observação de 60 segundos").click();
  await page.waitForFunction(() => !document.querySelector('[data-testid="obs60-panel"]'));
  assert.equal(await page.evaluate(() => window.__obs60SyntheticTracks.every(track => track.readyState === "ended")), true);
  assert.equal(await page.getByTestId("obs10-first-time").count(), 1, "OBS10 remains intact");
  await open();
  await panel().getByLabel("Idade exata em meses completos").selectOption("36");
  await consent().check();
  await panel().locator('input[type="file"]').setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("synthetic invalid media") });
  await panel().getByText(/Formato não aceito/).waitFor();
  await panel().locator('input[type="file"]').setInputFiles({ name: "oversize.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(12 * 1024 * 1024 + 1) });
  await panel().getByText("Selecione vídeo MP4/WebM de até 12 MB.", { exact: true }).waitFor();
  await panel().locator('input[type="file"]').setInputFiles({ name: "synthetic-gray.mp4", mimeType: "video/mp4", buffer: Buffer.from(MP4, "base64") });
  await panel().getByLabel("Vídeo anexado para análise").waitFor();
  await page.waitForFunction(() => {
    const video = document.querySelector('video[aria-label="Vídeo anexado para análise"]');
    return video && Number.isFinite(video.duration) && video.duration > 0;
  });
  assert.equal(await button("Analisar vídeo e preencher registros").isDisabled(), true);
  assert.equal(sends, 0, "no automatic upload on prepare/record/import/download");
  assert.equal(await page.getByTestId("obs60-results").count(), 0, "no simulated clinical result");
  await screenshot("03-imported-with-provider-off");
  await button("Nova gravação / limpar").click();
  assert.equal(await panel().getByLabel("Vídeo anexado para análise").count(), 0);
  assert.deepEqual(errors, []);
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, ages: [24,35,36,47,48,59], mediaRecorder: "real Chromium API with synthetic camera", mp4Import: true, consentAndDiscardGuards: true, providerPosts: sends, exceptions: errors, scope: "Real production-built UI; synthetic auth and unavailable capability; no real patient, provider inference, clinical accuracy or production tenant proof." }, null, 2));
  console.log("OBS60: built guide, age bands, accessibility, real browser recording, MP4 import, discard/consent guards and zero provider sends passed.");
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: true });
  await writeFile(`${dir}/failure.txt`, String(error.stack || error));
  throw error;
} finally { await context.close(); await browser.close(); await server.close(); }
