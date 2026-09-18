/** Real built UI. Synthetic identity/media; only browser permission/lifecycle boundaries are controlled. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
const dir = process.env.OBS10_MEDIA_ARTIFACT_DIR || "/tmp/obs10-media-regressions";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] }));
const results = [], errors = [], writes = [];
const button = (p, name) => p.getByRole("button", { name, exact: true });
const field = (p, name) => p.getByLabel(name, { exact: true });
async function runCase(name, test) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 950 }, permissions: ["camera", "microphone"], acceptDownloads: true });
  await context.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const p = await context.newPage();
  p.setDefaultTimeout(8000); p.on("dialog", (d) => d.accept()); p.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  p.on("request", (r) => { if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()) && /\/api\//.test(r.url()) && !/\/api\/auth\//.test(r.url())) writes.push(r.url()); });
  try {
    await p.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
    await p.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
    await p.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await p.locator('[data-testid="login-form"] button[type="submit"]').click();
    await p.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
    await test(p);
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: String(e.message) });
    await p.screenshot({ path: `${dir}/${name}-failure.png`, fullPage: true });
  } finally { await context.close(); }
}
async function prepare(p) {
  await field(p, "Anos completos").fill("7"); await field(p, "Meses adicionais").fill("0");
  await field(p, "Código institucional, sem nome").fill("SINTETICO-MIDIA");
  await button(p, "Separei o kit completo").click();
  for (const c of await p.locator(".obs10-checklist input").all()) await c.check();
}
async function delayPermission(p) {
  await p.evaluate(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints); window.__lateTracks = stream.getTracks();
      return new Promise((resolve) => { window.__deliverPermission = () => resolve(stream); });
    };
  });
}
async function hide(p) {
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
}
async function show(p) {
  await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
}
try {
  await runCase("late-camera-after-hide", async (p) => {
    await prepare(p); await delayPermission(p);
    await p.getByLabel(/Usar câmera e microfone deste dispositivo/).check();
    await button(p, "Iniciar aplicação · 10 minutos").click();
    await p.waitForFunction(() => typeof window.__deliverPermission === "function");
    await hide(p); await p.evaluate(() => window.__deliverPermission());
    await p.waitForTimeout(350);
    assert.equal(await p.getByTestId("obs10-clock").count(), 0, "permission delivered after hiding must not start a collection");
    assert.equal(await p.evaluate(() => window.__lateTracks.every((t) => t.readyState === "ended")), true, "late tracks must be released");
    await show(p); await p.getByLabel(/Usar câmera e microfone deste dispositivo/).uncheck();
    await button(p, "Iniciar aplicação · 10 minutos").click();
    await p.getByTestId("obs10-clock").waitFor(); await button(p, "Encerrar antes").click();
  });
  await runCase("late-audio-after-hide", async (p) => {
    await delayPermission(p); await p.getByTestId("obs13-audio").locator("summary").click();
    await button(p, "Gravar 3 segundos de teste").click();
    await p.waitForFunction(() => typeof window.__deliverPermission === "function");
    await hide(p); await p.evaluate(() => window.__deliverPermission()); await p.waitForTimeout(350);
    assert.equal(await p.evaluate(() => window.__lateTracks.every((t) => t.readyState === "ended")), true, "test microphone must not begin recording on a hidden page");
    assert.equal(await p.getByText("Gravando teste por três segundos…", { exact: false }).count(), 0);
    await show(p);
  });
  await runCase("unexpected-recorder-stop", async (p) => {
    await prepare(p);
    await p.evaluate(() => { const Native = window.MediaRecorder; window.MediaRecorder = class extends Native { constructor(...args) { super(...args); window.__nativeRecorder = this; } }; });
    await p.getByLabel(/Usar câmera e microfone deste dispositivo/).check();
    await button(p, "Iniciar aplicação · 10 minutos").click();
    await p.locator(".obs10-camera video").waitFor(); await p.waitForTimeout(500);
    await p.evaluate(() => window.__nativeRecorder.stop());
    await p.waitForFunction(() => Boolean(document.querySelector(".obs10-summary")), null, { timeout: 4000 });
    assert.match(await p.locator(".obs10-summary").textContent(), /Interrupção técnica/);
    await p.getByRole("link", { name: "Salvar vídeo no dispositivo institucional", exact: true }).waitFor();
    assert.equal(await button(p, "Encerrar antes").count(), 0);
  });
  await runCase("cross-clip-clears-old-player", async (p) => {
    const makeVideo = async (label) => {
      const bytes = await p.evaluate(async (text) => {
        const c = document.createElement("canvas"); c.width = 240; c.height = 160; const g = c.getContext("2d"); let n = 0;
        const draw = () => { g.clearRect(0, 0, 240, 160); g.fillText(text, 15, 50); g.fillRect((n++ * 3) % 200, 90, 20, 20); }; draw();
        const stream = c.captureStream(15), rec = new MediaRecorder(stream, { mimeType: "video/webm" }), chunks = [];
        return new Promise((resolve, reject) => {
          const timer = setInterval(draw, 50); rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
          rec.onerror = reject; rec.onstop = async () => { clearInterval(timer); stream.getTracks().forEach((t) => t.stop()); resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()))); };
          rec.start(); setTimeout(() => rec.stop(), 1300);
        });
      }, label);
      return { name: `${label}.webm`, mimeType: "video/webm", buffer: Buffer.from(bytes) };
    };
    const a = await makeVideo("SINTETICO-A"), b = await makeVideo("SINTETICO-B");
    const observation = { id: "manual-1", phase: 0, task: "Tarefa fictícia", response: "Registro sintético.", outcome: "E", assistance: "", quality: "Parcial", clip: "", videoTime: "", applicationSecond: 0 };
    const date = "2026-09-17T12:00:00.000Z", sessionId = "SINTETICO-MULTICLIPE";
    const fixture = {
      version: "1.3.0", sessionId,
      context: { code: "SINTETICO", chronologicalMonths: 84, correctedMonths: null, bandId: "y06", schooling: "", language: "", adaptations: "", conditions: "", familyReport: "", proneAllowed: false },
      observations: [observation], durationSeconds: 30, endReason: "Encerramento fictício", encodingSecond: null, recallSecond: null, recording: "Dados sintéticos",
      evidence: { schemaVersion: "1.0.0", clips: [a, b].map((f, i) => ({ id: `clip-${i}`, sessionId, label: `Clipe ${i + 1}`, sha256: createHash("sha256").update(f.buffer).digest("hex"), bytes: f.buffer.length, mime: "video/webm", durationSeconds: null, associatedAt: date })),
        moments: [0, 1].map((i) => ({ id: `moment-${i}`, clipId: `clip-${i}`, observationId: observation.id, startSecond: .2, endSecond: .8, sourceSnapshot: JSON.stringify([observation.id, 0, observation.task, observation.response, "E", "", "Parcial", false]), createdAt: date, method: "player-position" })), reviews: [] }
    };
    await field(p, "Arquivo JSON para revisão").setInputFiles({ name: "SINTETICO.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(fixture)) });
    await button(p, "Abrir somente para revisão").click();
    await field(p, "Clipe para carregar").selectOption("clip-0"); await field(p, "Vídeo local para esta sessão").setInputFiles(a);
    await button(p, "Conferi: este vídeo pertence a esta sessão").click();
    await button(p, "Abrir trecho 2").click();
    assert.equal(await field(p, "Clipe para carregar").inputValue(), "clip-1");
    assert.equal(await button(p, "Marcar início do trecho").isDisabled(), true, "opening another clip cannot retain marking against the previous player");
    assert.equal(await field(p, "Reprodutor de evidência local").count(), 0, "previous file must be detached when a different clip is requested");
    await field(p, "Vídeo local para esta sessão").setInputFiles(b); await button(p, "Conferi: este vídeo pertence a esta sessão").click();
    await button(p, "Abrir trecho 2").click();
    await p.waitForFunction(() => { const v = document.querySelector(".obs13-evidence video"); return v && !v.seeking && v.readyState >= 2; });
    assert.equal(await button(p, "Marcar início do trecho").isEnabled(), true);
    for (const width of [1365, 390]) {
      await p.setViewportSize({ width, height: 950 });
      const audit = await new AxeBuilder({ page: p }).include(".obs10").analyze();
      assert.deepEqual(audit.violations.map((v) => v.id), []);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await p.getByTestId("obs13-evidence").screenshot({ path: `${dir}/correct-clip-${width}.png` });
    }
  });
  const report = { passed: results.every((r) => r.passed) && !errors.length && !writes.length, results, errors, writes };
  await writeFile(`${dir}/result.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  assert.equal(report.passed, true, "OBS-10 media regressions must all pass");
} finally { await browser.close(); await server.close(); }
