// E2E: resumo pré-consulta (histórico, mudanças, pendências, evolução, perguntas). Dados fictícios.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.RESUMO_ARTIFACT_DIR || "/tmp/resumo-pre-consulta";
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

const T0 = "2026-06-10T12:00:00.000Z";
const mk = (eventType, key, extra = {}, occurredAt = T0, status = "active") => ({ id: `ev-${key}-${status}-${occurredAt}`, patientId: PATIENT, eventType, status, occurredAt, note: JSON.stringify({ key, ...extra }), encounterId: key, data: extra.data ?? {}, payload: extra.data ?? {} });
const obs = (key, valueText) => mk("observation", key, { data: { valueText } });
const itemEv = (type, key, item, occurredAt = T0, status = "active") => ({ ...mk(type, key, { item }, occurredAt, status), payload: { reason: JSON.stringify({ item }), successCriterion: JSON.stringify({ item }) }, data: {} });
const events = [
  mk("encounter", "encounter", { identificacao: { cid: "F90.0", hipoteseDiagnostica: "Hipótese fictícia A" } }),
  obs("anamnese:queixaPrincipal", "Queixa fictícia de desatenção."),
  obs("marcos:crises", "Sim"),
  itemEv("medication", "medicacao:m1", { id: "m1", nome: "Medicamento Alfa", dose: "10 mg", posologia: "manhã", resposta: "boa", dataInicio: "2026-05-01" }, T0, "superseded"),
  itemEv("medication", "medicacao:m1", { id: "m1", nome: "Medicamento Alfa", dose: "15 mg", posologia: "manhã", resposta: "boa", dataInicio: "2026-05-01" }, "2026-06-11T12:00:00.000Z"),
  itemEv("plan", "terapia:t1", { id: "t1", tipo: "Terapia Gama", profissional: "Prof. Fictício", frequencia: "2x/semana", evolucao: "" }),
  itemEv("plan", "exame:x1", { id: "x1", tipo: "Exame Delta", data: "2026-06-01", status: "Pendente", resultado: "" }),
];
const liveAssessments = [
  { id: "r1", instrumentId: "phq-a", instrumentVersion: "1.0", appliedAt: "2026-03-01T12:00:00.000Z", payload: { title: "PHQ-A", totalScore: 4 } },
  { id: "r2", instrumentId: "phq-a", instrumentVersion: "1.0", appliedAt: "2026-09-15T12:00:00.000Z", payload: { title: "PHQ-A", totalScore: 12 } },
  { id: "r3", instrumentId: "snap-iv", instrumentVersion: "1.0", appliedAt: "2026-09-15T12:00:00.000Z", payload: { title: "SNAP-IV", totalScore: 30 } },
];
await page.route(/\/api\/live\/assessments/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: liveAssessments }) }));
const results = [
  { id: "r1", scaleName: "PHQ-A", totalScore: 4, createdAt: "2026-03-01T12:00:00.000Z" },
  { id: "r2", scaleName: "PHQ-A", totalScore: 12, createdAt: "2026-09-15T12:00:00.000Z" },
  { id: "r3", scaleName: "SNAP-IV", totalScore: 30, createdAt: "2026-09-15T12:00:00.000Z" },
];
await page.route(/\/api\/(?:live\/events|clinical-core\/events)/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: events }) }));
await page.route(`**/api/patients/${PATIENT}/results**`, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: results, total: 3, page: 1, limit: 200, hasMore: false }) }));

try {
  await page.goto(`${server.origin}/#/resumo-pre-consulta?patientId=${PATIENT}`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId("resumo-identificacao").waitFor({ timeout: 20000 });
  assert.match(await page.getByTestId("resumo-aviso").innerText(), /apenas com dados já salvos/);
  assert.match(await page.getByTestId("resumo-identificacao").innerText(), /Paciente Sintético Alfa/);
  assert.match(await page.getByTestId("resumo-ultima-visita").innerText(), /Última consulta: 10\/06\/2026/);

  const historico = await page.getByTestId("resumo-historico").innerText();
  assert.match(historico, /Queixa fictícia de desatenção/);
  assert.match(historico, /Crises registradas/);
  assert.match(historico, /Medicamento Alfa · 15 mg/);

  assert.match(await page.getByTestId("resumo-mudancas").innerText(), /Medicamento Alfa: dose mudou de "10 mg" para "15 mg"/);
  const pend = await page.getByTestId("resumo-pendencias").innerText();
  assert.match(pend, /Exame "Exame Delta" sem resultado concluído/);
  assert.match(pend, /Terapia "Terapia Gama" sem evolução registrada/);

  // Evolução reaproveita o módulo do item 2.
  await page.getByTestId("evolucao-grafico-phqa").waitFor();
  assert.ok(await page.locator('[data-testid="resumo-evolucao"] svg.recharts-surface').count() > 0);
  assert.match(await page.getByTestId("resumo-evolucao").innerText(), /Pendentes de regra validada/);
  assert.match(await page.getByTestId("evolucao-aviso-apoio").innerText(), /Não substituem o julgamento do médico/);

  // Perguntas sempre rotuladas como sugestão.
  assert.match(await page.getByTestId("resumo-rotulo-sugestao").innerText(), /^Sugestão/);
  const perguntas = await page.getByTestId("resumo-perguntas").innerText();
  assert.match(perguntas, /uso de Medicamento Alfa/);
  assert.match(perguntas, /novas crises/);
  await page.screenshot({ path: `${dir}/resumo.png`, fullPage: true });

  assert.deepEqual(outbound, [], "nenhuma chamada externa");
  assert.deepEqual(errors, [], "sem erros de página");
  console.log("Resumo pré-consulta: histórico, mudanças, pendências, evolução reaproveitada e perguntas sugeridas verificados.");
} finally {
  await browser.close();
  await server.close();
}
