/** Tests the actual built React route with the repository's synthetic auth server.
 * No patient data, UI-state injection, disabled assertions or clinical API replacement.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.OBS10_ARTIFACT_DIR || "/tmp/obs10-proof";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] }));
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, permissions: ["camera", "microphone"] });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
const clinicalWrites = [];
const evidence = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
page.on("request", (request) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) && /\/api\//.test(request.url()) && !/\/api\/auth\//.test(request.url())) clinicalWrites.push(`${request.method()} ${request.url()}`);
});
const button = (name) => page.getByRole("button", { name, exact: true });
const root = () => page.getByTestId("obs10-workspace");
async function prepare(years, months = 0) {
  await page.getByLabel("Anos completos", { exact: true }).fill(String(years));
  await page.getByLabel("Meses adicionais", { exact: true }).fill(String(months));
  await page.getByLabel("Código institucional, sem nome", { exact: true }).fill("OBS-SINTETICO");
  for (const checkbox of await page.locator(".obs10-checklist input").all()) await checkbox.check();
  await button("Separei o kit completo").click();
}
async function screen(label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label}: no overflow`);
  const result = await new AxeBuilder({ page }).include(".obs10").analyze();
  await writeFile(`${dir}/${label}-axe.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], `${label}: accessibility`);
  await page.screenshot({ path: `${dir}/${label}.png`, fullPage: true });
  evidence.push(label);
}
async function newSession() { await button("Nova aplicação · limpar esta sessão").click(); }
try {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.waitForLoadState("networkidle");
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await root().waitFor({ timeout: 20000 });
  await page.waitForFunction(() => {
    let node = document.querySelector('[data-testid="obs10-workspace"]');
    while (node) { if (Number(getComputedStyle(node).opacity) < .99) return false; node = node.parentElement; }
    return true;
  });
  assert.equal(await button("Iniciar aplicação · 10 minutos").isDisabled(), true);
  await page.getByText("Consultar material por faixa etária", { exact: true }).click();
  assert.equal(await page.locator(".obs10-age-tabs button").count(), 13);
  for (const card of await page.locator(".obs10-age-tabs button").all()) {
    await card.click();
    assert.ok((await page.locator(".obs10-printable-kit").textContent()).length > 200);
  }
  await page.getByText("Consultar material por faixa etária", { exact: true }).click();
  await prepare(7);
  assert.equal(await button("Iniciar aplicação · 10 minutos").isDisabled(), false);
  await page.locator(".obs10-checklist input").first().uncheck();
  assert.equal(await button("Iniciar aplicação · 10 minutos").isDisabled(), true);
  await page.locator(".obs10-checklist input").first().check();
  await screen("01-preparacao-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await screen("02-preparacao-celular");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.install();
  await button("Iniciar aplicação · 10 minutos").click();
  await page.getByTestId("obs10-clock").waitFor();
  await page.clock.runFor(125000);
  await page.getByRole("button", { name: /3\. Linguagem e raciocínio/ }).click();
  await button("Marcar registro inicial agora").click();
  const encodingText = await page.getByRole("button", { name: /^Registro marcado em/ }).textContent();
  await button("+ Registrar uma tarefa deste bloco").click();
  await page.getByLabel("Qual tarefa?", { exact: true }).fill("Comando sintético de dois passos");
  await page.getByLabel("O que fez ou falou? Descreva literalmente", { exact: true }).fill('Concluiu a segunda ação após repetição. <script>window.injetado=true</script>');
  await page.getByLabel("Como respondeu?", { exact: true }).selectOption("V");
  await page.getByLabel("Ajuda, adaptação ou motivo de não aplicação", { exact: true }).fill("Uma repetição verbal, sem demonstração.");
  await page.getByLabel("Qualidade do trecho, conferida por você", { exact: true }).selectOption("Parcial");
  await page.getByLabel("Clipe (opcional)", { exact: true }).fill("A");
  await page.getByLabel("Tempo no vídeo (conferido)", { exact: true }).fill("02:05");
  assert.equal(await page.evaluate(() => window.injetado), undefined);
  await screen("03-aplicacao-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await screen("04-aplicacao-celular");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.runFor(390000);
  await page.getByRole("button", { name: /6\. Retomar e encerrar/ }).click();
  await button("Marcar evocação agora").click();
  const recallText = await page.getByRole("button", { name: /^Evocação marcada em/ }).textContent();
  const secondsFromText = (value) => { const match = value.match(/(\d{2}):(\d{2})/); return Number(match[1]) * 60 + Number(match[2]); };
  const actualInterval = secondsFromText(recallText) - secondsFromText(encodingText);
  await page.clock.runFor(90000);
  assert.equal(await page.getByTestId("obs10-clock").textContent(), "10:00");
  assert.equal(await button("Encerrar antes").count(), 0);
  assert.ok((await page.locator(".obs10-summary pre").textContent()).includes(`${actualInterval} segundos`));
  const downloadPromise = page.waitForEvent("download");
  await button("Exportar registro TXT").click();
  const download = await downloadPromise;
  await download.saveAs(`${dir}/registro-sintetico.txt`);
  const exported = await readFile(`${dir}/registro-sintetico.txt`, "utf8");
  assert.match(exported, /Após repetição/);
  assert.match(exported, /Sem registro de aplicação/);
  assert.match(exported, /Nenhuma análise automática de vídeo/);
  await screen("05-resumo");
  await newSession();
  assert.equal(await page.getByLabel("Código institucional, sem nome", { exact: true }).inputValue(), "");
  assert.equal(await page.locator(".obs10-summary").count(), 0);
  await prepare(0, 8);
  await page.getByLabel(/Usar idade corrigida informada/).check();
  await page.getByLabel("Idade corrigida em meses completos", { exact: true }).fill("9");
  assert.equal(await button("Iniciar aplicação · 10 minutos").isDisabled(), true);
  await page.getByLabel("Idade corrigida em meses completos", { exact: true }).fill("5");
  assert.match(await page.locator(".obs10-band-selected").textContent(), /3–5 meses/);
  await button("Separei o kit completo").click();
  await button("Iniciar aplicação · 10 minutos").click();
  await page.getByRole("button", { name: /4\. Movimentar com segurança/ }).click();
  await button("Próxima tarefa").click();
  assert.match(await page.locator(".obs10-task").textContent(), /Sem autorização para prono/);
  await button("Interromper e chamar médico").click();
  assert.equal(await page.getByRole("heading", { name: "Pare a avaliação. Chame o médico agora." }).isVisible(), true);
  await button("Entendido · manter aplicação encerrada").click();
  assert.equal(await button("Encerrar antes").count(), 0);
  await newSession();
  await prepare(2, 3);
  await button("Iniciar aplicação · 10 minutos").click();
  await page.getByRole("button", { name: /4\. Movimentar com segurança/ }).click();
  await button("Próxima tarefa").click();
  await button("Próxima tarefa").click();
  assert.match(await page.locator(".obs10-task").textContent(), /Não aplicar antes de 30 meses/);
  await button("Encerrar antes").click();
  await newSession();
  await prepare(12);
  await page.getByLabel(/Usar câmera e microfone deste dispositivo/).check();
  await button("Iniciar aplicação · 10 minutos").click();
  await page.locator(".obs10-camera video").waitFor({ timeout: 15000 });
  assert.equal(await page.locator(".obs10-camera video").evaluate((el) => el.srcObject.getTracks().every((track) => track.readyState === "live")), true);
  await page.evaluate(() => { window.__obsTracks = document.querySelector(".obs10-camera video").srcObject.getTracks(); });
  await page.clock.runFor(2000);
  // Real MediaRecorder dispatch runs independently from mocked task timers.
  await page.waitForTimeout(1500);
  await button("Encerrar antes").click();
  await page.getByRole("link", { name: "Salvar vídeo no dispositivo institucional" }).waitFor({ timeout: 15000 });
  assert.equal(await page.evaluate(() => window.__obsTracks.every((track) => track.readyState === "ended")), true);
  await screen("06-video-local");
  await newSession();
  await context.clearPermissions();
  await prepare(5);
  // Permission refusal is simulated at the browser boundary, never clinical logic.
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("denied", "NotAllowedError"); }; });
  await page.getByLabel(/Usar câmera e microfone deste dispositivo/).check();
  await button("Iniciar aplicação · 10 minutos").click();
  await page.getByText(/Não foi possível acessar câmera e microfone/).waitFor();
  assert.equal(await page.getByTestId("obs10-clock").count(), 0);
  await page.getByLabel(/Usar câmera e microfone deste dispositivo/).uncheck();
  await button("Iniciar aplicação · 10 minutos").click();
  // Browser lifecycle event: a hidden page must end collection immediately.
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.locator(".obs10-summary").waitFor();
  assert.match(await page.locator(".obs10-summary").textContent(), /encerrada ao sair da aba/);
  assert.deepEqual(clinicalWrites, [], "module never writes clinical data to server");
  assert.deepEqual(errors, [], "no JavaScript exceptions");
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, screens: evidence, exceptions: errors, clinicalWrites, scope: "Real built route, synthetic auth; browser-only local camera and exports. No automated clinical video analysis." }, null, 2));
  console.log(`OBS-10 browser journey passed: ${evidence.length} responsive/accessibility screens, timer, 13 sheets, exports, clinical safety and camera.`);
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: true });
  await writeFile(`${dir}/failure.txt`, String(error.stack || error));
  throw error;
} finally {
  await context.close();
  await browser.close();
  await server.close();
}
