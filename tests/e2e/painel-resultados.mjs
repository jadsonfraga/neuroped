// E2E: painel de resultados (agregados, estimativa rotulada com premissa editável, papéis). Dados fictícios.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.PAINEL_ARTIFACT_DIR || "/tmp/painel-resultados";
await mkdir(dir, { recursive: true });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const errors = [];
const outbound = [];
const servers = [];

async function open(scenario) {
  const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated", ...scenario }) });
  servers.push(server);
  const context = await browser.newContext({ viewport: { width: 1280, height: 2200 }, reducedMotion: "reduce" });
  await context.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => { if (!r.url().startsWith(server.origin) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) outbound.push(r.url()); });
  await page.goto(`${server.origin}/#/configuracoes`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId("configuracoes-shell").waitFor({ timeout: 25000 });
  return page;
}
const tab = (pg, name) => pg.getByTestId("configuracoes-shell").getByText(name, { exact: true });

try {
  // ---------- gestor (owner) ----------
  const page = await open({ primaryRole: "owner" });
  await tab(page, "Resultados").click();
  await page.getByTestId("outcome-atendidos").waitFor({ timeout: 15000 });
  const text = await page.getByTestId("outcomes-section").innerText();
  assert.equal(await page.getByTestId("outcome-atendidos").innerText().then((t) => /11/.test(t)), true);
  assert.match(await page.getByTestId("outcome-retornos").innerText(), /6/);
  assert.match(text, /pacientes atendidos/i);
  assert.match(text, /Adesão: 80%/);
  assert.match(text, /agenda legada não entra/);
  assert.match(text, /O que este painel não mede/);
  assert.doesNotMatch(text, /ponto de corte|escore|nível de risco|classificação:/i, "regra do médico: sem corte/nível/classificação");
  // estimativa: rotulada e sem número até haver premissa
  const tempo = page.getByTestId("outcome-tempo");
  assert.match(await tempo.innerText(), /estimativa/i);
  assert.match(await page.getByTestId("outcome-tempo-total").innerText(), /Defina a premissa/);
  assert.match(await page.getByTestId("outcome-tempo-premissa").innerText(), /Não é medição de tempo/);
  // validação da premissa (fora da faixa) não envia
  await page.getByTestId("premissa-report").fill("999");
  await tempo.getByRole("button", { name: "Salvar premissa" }).first().click();
  await page.getByText(/entre 0 e 240/).first().waitFor();
  // premissa válida → 4 laudos × 20 = 80 min
  await page.getByTestId("premissa-report").fill("20");
  await Promise.all([
    page.waitForResponse((r) => /outcomes\/assumptions/.test(r.url()) && r.request().method() === "PUT" && r.status() === 200),
    tempo.getByRole("button", { name: "Salvar premissa" }).first().click(),
  ]);
  await page.getByTestId("outcome-tempo-total").getByText(/≈ 1 h 20 min/).waitFor();
  assert.match(await tempo.innerText(), /× 20 min/);
  // período
  await Promise.all([
    page.waitForResponse((r) => /outcomes\?.*days=90/.test(r.url())),
    page.getByRole("button", { name: "90 dias" }).click(),
  ]);
  await page.screenshot({ path: `${dir}/gestor.png`, fullPage: true });

  // ---------- profissional: vê os números, não edita a premissa ----------
  const prof = await open({ primaryRole: "professional" });
  await tab(prof, "Resultados").click();
  await prof.getByTestId("outcome-atendidos").waitFor({ timeout: 15000 });
  assert.equal(await prof.getByTestId("premissa-report").count(), 0);
  assert.match(await prof.getByTestId("outcomes-section").innerText(), /Somente o gestor da clínica altera a premissa/);

  // ---------- secretaria: sem aba, sem métricas clínicas ----------
  const sec = await open({ primaryRole: "assistant" });
  assert.equal(await tab(sec, "Resultados").count(), 0, "secretaria não vê a aba");
  assert.equal(await sec.getByTestId("outcomes-section").count(), 0);

  assert.deepEqual(errors, [], `erros de página: ${errors.join(" | ")}`);
  assert.deepEqual(outbound, [], `requisições externas: ${outbound.join(" | ")}`);
  console.log("painel-resultados e2e OK");
} finally {
  await browser.close();
  for (const s of servers) await s.close();
}
