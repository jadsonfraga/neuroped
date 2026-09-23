import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.OBS10_AGREEMENT_ARTIFACT_DIR || "/tmp/obs10-agreement";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, acceptDownloads: true });
await context.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage(); const errors = []; const screens = [];
page.on("pageerror", (e) => errors.push(e.message)); page.on("dialog", (d) => d.accept());
const w = page.getByTestId("obs10-tablet");
const b = (name) => w.getByRole("button", { name, exact: true });
const phase = (name) => page.locator(`[data-testid=obs10-tablet][data-phase=${name}]`).waitFor();
const panel = page.getByTestId("obs10-agreement");
async function screen(name) {
  const audit = await new AxeBuilder({ page }).include("[data-testid=obs10-agreement]").analyze();
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(audit.violations, null, 2));
  assert.deepEqual(audit.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], name);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }); screens.push(name);
}
/** One short synthetic tablet session: same institutional code, categories chosen by the caller. */
async function codeSession(code, categories, file) {
  await page.getByRole("button", { name: "Abrir modo tablet · experimental", exact: true }).click();
  await phase("setup");
  await w.getByLabel("Código institucional, sem nome", { exact: true }).fill(code);
  await w.getByLabel("Anos completos", { exact: true }).fill("1");
  await w.getByLabel("Meses adicionais", { exact: true }).fill("6");
  for (const box of await w.locator('.ot-check input[type="checkbox"]').all()) await box.check();
  await b("Continuar para a câmera").click(); await phase("camera");
  await w.getByLabel("Outra câmera institucional", { exact: true }).check();
  await w.getByLabel("A outra câmera está pronta e será iniciada antes da coleta.", { exact: true }).check();
  await w.getByLabel("Conferi enquadramento e captação de voz no equipamento. Tenho espaço para salvar.", { exact: true }).check();
  await b("Continuar para o ensaio").click(); await phase("rehearsal");
  await b("Experimentar a tela da criança").click(); await b("Terminei o ensaio · voltar às instruções").click();
  await b("Entendi · revisar preparação").click(); await phase("ready");
  await b("Iniciar observação de até 10 minutos").click(); await phase("cue");
  for (const category of categories) {
    await b("Iniciar esta interação").click(); await phase("child");
    await b("Terminar tentativa · registrar").click(); await phase("response");
    await b(category).click();
    await w.getByLabel("O que você viu ou ouviu? Inclua ajuda e limitações.", { exact: true }).fill("Codificação sintética para o estudo de confiabilidade.");
    await b("Salvar resposta e continuar").click();
  }
  await b("Encerrar coleta").click(); await phase("review");
  await b("Continuar para guardar os arquivos").click(); await phase("delivery");
  await w.getByLabel("Não há vídeo utilizável; informarei essa limitação ao médico.", { exact: true }).check();
  const pending = page.waitForEvent("download"); await b("Salvar registro JSON").click();
  await (await pending).saveAs(`${dir}/${file}`);
  await w.getByLabel("Conferi os arquivos atuais no armazenamento institucional. Entrega ao médico segue o fluxo da clínica.", { exact: true }).check();
  await b("Concluir e voltar ao OBS-10").click(); await w.waitFor({ state: "detached" });
}
try {
  await page.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email); await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click(); await page.getByTestId("obs10-workspace").waitFor();
  // Two observers code the same synthetic session: they agree on the first card and diverge on the second.
  await codeSession("PAR-01", ["Na proposta inicial", "Após repetição"], "observador-a.json");
  await codeSession("PAR-01", ["Na proposta inicial", "Com apoio habitual"], "observador-b.json");
  await codeSession("PAR-02", ["Na proposta inicial"], "outra-sessao.json");

  await page.getByText("Estudo de confiabilidade: comparar dois observadores", { exact: true }).click();
  await panel.waitFor();
  await panel.getByLabel("Identificação do par, para sua planilha do estudo", { exact: true }).fill("par 01");
  await panel.getByLabel("Registro do primeiro observador", { exact: true }).setInputFiles(`${dir}/observador-a.json`);
  await panel.getByLabel("Registro do segundo observador", { exact: true }).setInputFiles(`${dir}/outra-sessao.json`);
  await panel.getByRole("button", { name: "Comparar as duas codificações", exact: true }).click();
  await panel.getByText(/Código institucional ausente ou diferente/).waitFor();
  assert.equal(await page.getByTestId("obs10-agreement-report").count(), 0, "a refused pair must not show a number");

  await panel.getByLabel("Registro do segundo observador", { exact: true }).setInputFiles(`${dir}/observador-b.json`);
  await panel.getByRole("button", { name: "Comparar as duas codificações", exact: true }).click();
  const report = page.getByTestId("obs10-agreement-report");
  await report.waitFor();
  assert.match(await report.textContent(), /Concordância exata: 1 de 2 \(50\.0%\)/);
  assert.match(await report.textContent(), /Categorizadas só pelo primeiro: 0/);
  assert.match(await report.textContent(), /por nenhum: 4/, "cards nobody coded stay opportunities, not matches");
  assert.match(await report.textContent(), /amostra pequena/, "two tasks must be flagged as unstable");
  assert.match(await report.textContent(), /m18:caregiver: primeiro Após repetição, segundo Com apoio habitual/);
  await screen("01-concordancia");

  const exported = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Exportar comparação (JSON)", exact: true }).click();
  await (await exported).saveAs(`${dir}/comparacao.json`);
  const raw = await readFile(`${dir}/comparacao.json`, "utf8");
  const comparison = JSON.parse(raw);
  assert.equal(comparison.schema, "obs10-observer-agreement-1");
  assert.equal(comparison.exactMatches, 1);
  assert.equal(comparison.comparable, 2);
  assert.equal(comparison.pairLabel, "par 01");
  assert.ok(!raw.includes("PAR-01"), "the institutional code never reaches the study export");
  assert.ok(!/sessionId|tablet-[0-9a-f]{8}/.test(raw), "no session identifier reaches the study export");
  assert.ok(!raw.includes("Codificação sintética"), "no written description reaches the study export");
  assert.match(raw, /não o desempenho da criança/);

  assert.deepEqual(errors, []);
  await writeFile(`${dir}/result.json`, JSON.stringify({ passed: true, screens, errors, scope: "Synthetic account and synthetic codings only. Measures agreement between two codings, never clinical validity." }, null, 2));
  console.log("OBS-10 observer agreement: real records, fail-closed pairing and metadata-only export passed.");
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: false }); await writeFile(`${dir}/failure.txt`, String(error.stack || error)); throw error;
} finally { await context.close(); await browser.close(); await server.close(); }
