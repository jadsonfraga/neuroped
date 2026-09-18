/** Journey map, readiness list, printed script and external-analysis dossier on the real build; synthetic login only. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
const dir = process.env.OBS10_DOSSIER_ARTIFACT_DIR || "/tmp/obs10-dossier";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
await context.addInitScript((storage) => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [], writes = [], screens = [];
page.on("dialog", (dialog) => dialog.accept());
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => { if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) && /\/api\//.test(request.url()) && !/\/api\/auth\//.test(request.url())) writes.push(request.url()); });
const button = (name) => page.getByRole("button", { name, exact: true });
const field = (name) => page.getByLabel(name, { exact: true });
const okItems = () => page.locator(".obs10-ready li.is-ok");
async function screen(name) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name);
  const result = await new AxeBuilder({ page }).include(".obs10").analyze();
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  screens.push(name);
}
try {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await page.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
  await page.waitForFunction(() => { let n = document.querySelector('[data-testid="obs10-workspace"]'); while (n) { if (Number(getComputedStyle(n).opacity) < .99) return false; n = n.parentElement; } return true; });
  // Journey map and readiness list explain what blocks the start before anything is filled.
  assert.equal(await page.getByTestId("obs10-journey").locator("li").count(), 4);
  assert.match(await page.getByTestId("obs10-journey").locator('[aria-current="step"]').textContent(), /Preparar/);
  assert.equal(await okItems().count(), 0);
  assert.match(await page.getByTestId("obs10-readiness").textContent(), /pendente/);
  assert.equal(await button("Imprimir roteiro completo da ficha").isDisabled(), true);
  await field("Anos completos").fill("7"); await field("Meses adicionais").fill("2");
  await field("Código institucional, sem nome").fill("OBS14-SINTETICO");
  await field("Escolaridade (sem nome da escola)").fill("2 ano ficticio");
  assert.equal(await okItems().count(), 2, "age and sheet ready; kit, device and checks pending");
  // The printed script is a separate plain-text document with every proposal of the sheet.
  const popupPromise = page.waitForEvent("popup"); await button("Imprimir roteiro completo da ficha").click(); const popup = await popupPromise;
  await popup.locator("pre#report").waitFor();
  const script = await popup.locator("pre#report").textContent();
  assert.match(script, /ROTEIRO COMPLETO DA FICHA 6–8 ANOS/);
  assert.match(script, /Apresente as três palavras/); assert.match(script, /DIGA \/ FAÇA:/); assert.match(script, /KIT, ALÉM DO DISPOSITIVO/);
  assert.equal(await popup.locator("nav, .obs10-toolbar").count(), 0);
  await popup.close();
  assert.equal(await page.getByTestId("obs10-journey").locator('[aria-current="step"]').count(), 1, "printing never started the collection");
  await button("Separei o kit completo").click();
  for (const box of await page.locator(".obs10-checklist input").all()) await box.check();
  assert.equal(await okItems().count(), await page.locator(".obs10-ready li").count());
  assert.match(await page.getByTestId("obs10-readiness").textContent(), /Tudo conferido/);
  assert.ok(await page.getByTestId("obs10-readiness").evaluate((el) => el.getBoundingClientRect().bottom <= document.querySelector('button.obs10-primary.obs10-wide').getBoundingClientRect().top), "readiness is read before the start button");
  await screen("01-prontidao-desktop");
  await page.clock.install();
  await button("Iniciar aplicação · 10 minutos").click();
  assert.match(await page.getByTestId("obs10-journey").locator('[aria-current="step"]').textContent(), /Aplicar/);
  await page.clock.runFor(150000);
  await page.getByRole("button", { name: /3\. Linguagem e raciocínio/ }).click();
  await page.getByRole("group", { name: "Registro rápido desta tarefa", exact: true }).getByRole("button", { name: "Após repetição", exact: true }).click();
  await button("Encerrar antes").click();
  assert.match(await page.getByTestId("obs10-journey").locator('[aria-current="step"]').textContent(), /Revisar/);
  await page.getByRole("button", { name: /3\. Linguagem e raciocínio/ }).click();
  await page.getByLabel("O que fez ou falou? Descreva literalmente").first().fill("Repetiu as tres palavras na segunda apresentacao.");
  // Dossier: download and clipboard carry the same text, with the literal fact, the prose category and explicit gaps.
  const downloadPromise = page.waitForEvent("download"); await button("Baixar dossiê (.md)").click();
  const download = await downloadPromise; await download.saveAs(`${dir}/dossie.md`);
  const dossier = await readFile(`${dir}/dossie.md`, "utf8");
  assert.ok(download.suggestedFilename().startsWith("OBS10-OBS14-SINTETICO") && download.suggestedFilename().endsWith(".md"));
  assert.match(dossier, /lei PRÉ/); assert.match(dossier, /7 anos e 2 meses \(86 meses\)/); assert.match(dossier, /2 ano ficticio/);
  assert.match(dossier, /realizou após ouvir o comando novamente/); assert.match(dossier, /«Repetiu as tres palavras na segunda apresentacao\.»/);
  assert.match(dossier, /Sem observação registrada no bloco 1/); assert.match(dossier, /## 6\. Pendências/);
  assert.ok(!/Fachetária/.test(dossier));
  await button("Copiar dossiê").click();
  await page.getByTestId("obs10-dossier").getByRole("status").filter({ hasText: /copiado/ }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), dossier);
  await page.getByText("Ver o dossiê completo").click();
  assert.equal(await page.getByTestId("obs10-dossier-text").textContent(), dossier);
  await screen("02-dossie-desktop");
  await page.setViewportSize({ width: 390, height: 844 }); await screen("03-dossie-celular");
  await page.setViewportSize({ width: 1440, height: 1080 });
  // Pilot metrics: the exported whitelist file feeds the local consolidator; duplicates and clinical JSON are refused or counted once.
  await page.getByTestId("obs13-pilot").locator("summary").first().click();
  const metricsPromise = page.waitForEvent("download"); await button("Exportar métricas sem textos clínicos").click();
  const metricsDownload = await metricsPromise; await metricsDownload.saveAs(`${dir}/metricas.json`);
  assert.match(metricsDownload.suggestedFilename(), /^OBS10-metricas-operacionais-[0-9a-f]{8}\.json$/, "no timestamp in the metrics file name");
  const metrics = JSON.parse(await readFile(`${dir}/metricas.json`, "utf8"));
  assert.equal(metrics.manualPausesOrInterruptions, 0);
  assert.ok(!JSON.stringify(metrics).includes("OBS14-SINTETICO") && !JSON.stringify(metrics).includes("Repetiu as tres"));
  const other = { ...metrics, ageBand: "m12", collectionSeconds: 600, workSecondsRecorded: { ...metrics.workSecondsRecorded, "Preparação": 90 } };
  const clinical = { ...metrics, code: "OBS14-SINTETICO" };
  await page.getByLabel("Arquivos de métricas para consolidar", { exact: true }).setInputFiles([
    { name: "a.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(metrics)) },
    { name: "a-copia.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(metrics)) },
    { name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(other)) },
    { name: "clinico.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(clinical)) },
    { name: "registro.json", mimeType: "application/json", buffer: Buffer.from(dossier) },
  ]);
  await page.getByTestId("obs13-consolidation-text").waitFor();
  const summary = await page.getByTestId("obs13-consolidation-text").textContent();
  assert.match(summary, /2 aplicação\(ões\) distintas em 3 arquivo\(s\) válido\(s\); 1 duplicado\(s\)/);
  assert.match(summary, /Amostra pequena/); assert.match(summary, /grupo pequeno/); assert.match(summary, /Preparação: 1 medida\(s\)/);
  assert.equal(await page.locator(".obs13-files li.is-ok").count(), 3);
  assert.equal(await page.locator(".obs13-files li:not(.is-ok)").count(), 2);
  assert.ok(!summary.includes("OBS14-SINTETICO"));
  const aggPromise = page.waitForEvent("download"); await button("Baixar agregado (.json)").click();
  const aggDownload = await aggPromise; await aggDownload.saveAs(`${dir}/consolidado.json`);
  const agg = JSON.parse(await readFile(`${dir}/consolidado.json`, "utf8"));
  assert.equal(agg.sessions, 2); assert.equal(agg.duplicatesIgnored, 1); assert.equal(agg.reachedLimit, 1);
  await screen("04-consolidacao-desktop");
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, screens, errors, clinicalWrites: writes, coverage: ["journey-map", "readiness-list", "printed-script-isolated", "dossier-download", "dossier-clipboard", "dossier-preview", "no-fabricated-finding", "metrics-file-without-timestamp", "local-metrics-consolidation", "duplicate-counted-once", "clinical-json-refused"] }, null, 2));
  console.log("OBS-10 v1.5: journey, readiness, printed script, dossier and local pilot consolidation passed; no clinical API writes.");
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: true });
  await writeFile(`${dir}/failure.txt`, String(error.stack || error)); throw error;
} finally { await context.close(); await browser.close(); await server.close(); }
