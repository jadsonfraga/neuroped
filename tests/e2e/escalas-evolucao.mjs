// E2E: evolução de escalas (gráfico, alertas, pendentes, limiar). Dados fictícios.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.EVOLUCAO_ARTIFACT_DIR || "/tmp/escalas-evolucao";
await mkdir(dir, { recursive: true });
const PATIENT = "paciente-sintetico-alfa";
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: "reduce" });
await context.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const outbound = [];
page.on("request", (r) => { if (!r.url().startsWith(server.origin) && !r.url().startsWith("data:")) outbound.push(r.url()); });

await page.route(`**/api/patients/${PATIENT}/results**`, (route) => route.fulfill({
  status: 200, contentType: "application/json",
  body: JSON.stringify({ data: [
    { id: "a1", scaleName: "PHQ-A", totalScore: 4, createdAt: "2026-03-01T12:00:00.000Z" },
    { id: "a2", scaleName: "PHQ-A", totalScore: 8, createdAt: "2026-05-01T12:00:00.000Z" },
    { id: "a3", scaleName: "PHQ-A", totalScore: 16, createdAt: "2026-07-01T12:00:00.000Z" },
    { id: "b1", scaleName: "M-CHAT-R/F", totalScore: 9, createdAt: "2026-04-01T12:00:00.000Z" },
    { id: "c1", scaleName: "SNAP-IV", totalScore: 20, createdAt: "2026-04-01T12:00:00.000Z" },
    { id: "c2", scaleName: "SNAP-IV", totalScore: 40, createdAt: "2026-06-01T12:00:00.000Z" },
  ], total: 6, page: 1, limit: 200, hasMore: false }),
}));

try {
  await page.goto(`${server.origin}/#/evolucao-escalas?patientId=${PATIENT}`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId("evolucao-panel").waitFor({ timeout: 20000 });

  assert.match(await page.getByTestId("evolucao-aviso-apoio").innerText(), /Não substituem o julgamento do médico/);
  assert.match(await page.getByTestId("evolucao-paciente").innerText(), /Paciente Sintético Alfa/);

  // PHQ-A: gráfico, tabela e alertas de piora de faixa e variação expressiva.
  await page.getByTestId("evolucao-grafico-phqa").waitFor();
  assert.ok(await page.locator('[data-testid="evolucao-grafico-phqa"] svg.recharts-surface').count() > 0, "gráfico renderizado");
  const linhas = page.getByTestId("evolucao-tabela-phqa").locator("tbody tr");
  assert.equal(await linhas.count(), 3);
  assert.match(await linhas.nth(2).innerText(), /01\/07\/2026\s+16\s+Moderada-Grave\s+\+8/);
  const alertas = page.getByTestId("evolucao-alertas-phqa");
  assert.ok(await alertas.locator('[data-codigo="piora-de-faixa"]').count() >= 2);
  assert.match(await alertas.innerText(), /não validado psicometricamente/);

  // M-CHAT com uma só aplicação: sem gráfico, sem alerta inventado.
  await page.getByTestId("evolucao-sem-grafico-mchat").waitFor();
  assert.equal(await page.getByTestId("evolucao-alertas-mchat").count(), 0);

  // SNAP-IV não tem regra validada: pendente, sem gráfico nem alerta.
  const pend = page.getByTestId("evolucao-pendente");
  assert.equal(await pend.count(), 1);
  assert.match(await pend.innerText(), /SNAP-IV/);
  assert.match(await page.getByTestId("evolucao-pendentes").innerText(), /sem gráfico nem alerta/);
  assert.equal(await page.getByTestId("evolucao-serie-snap").count(), 0);

  // Limiar configurável: subir para 80% remove a variação expressiva, mantém mudança de faixa.
  await page.getByTestId("evolucao-limiar").fill("80");
  assert.equal(await alertas.locator('[data-codigo="variacao-expressiva"]').count(), 0);
  assert.ok(await alertas.locator('[data-codigo="piora-de-faixa"]').count() >= 2);
  await page.screenshot({ path: `${dir}/evolucao.png`, fullPage: true });

  assert.deepEqual(outbound, [], "nenhuma chamada externa");
  assert.deepEqual(errors, [], "sem erros de página");
  console.log("Evolução de escalas: gráfico, tabela, alertas, pendentes e limiar verificados.");
} finally {
  await browser.close();
  await server.close();
}
