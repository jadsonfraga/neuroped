// Browser -> actual Pages Functions -> disposable local D1. No API intercepts.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.LIVE_DISCOVERY_URL ?? "http://127.0.0.1:8794");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
const email = process.env.LIVE_DISCOVERY_EMAIL;
const password = process.env.LIVE_DISCOVERY_PASSWORD;
assert.ok(email?.endsWith("@example.test") && password);
const name = "Paciente Remoto Sintético Distante";
const patientId = "audit-patient-000";
const browser = await chromium.launch(auditBrowserLaunchOptions());
const hasPath = (response, path, method) => new URL(response.url()).pathname === path && response.request().method() === method;

async function signIn() {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.addInitScript(items => {
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  await page.goto(new URL("/?next=%2Fpacientes#/login", base).href);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  const login = page.waitForResponse(r => hasPath(r, "/api/auth/login", "POST"));
  await page.getByTestId("login-form").locator('button[type="submit"]').click();
  const response = await login;
  assert.equal(response.status(), 200);
  const { accessToken } = await response.json();
  assert.ok(accessToken);
  await page.waitForURL(u => u.hash === "#/pacientes");
  return { context, page, accessToken };
}

try {
  const { context, page } = await signIn();
  const clinicSearch = page.waitForResponse(r => hasPath(r, "/api/live/patients/search", "POST"));
  await page.getByTestId("input-search-patients").fill(name);
  const firstSearch = await clinicSearch;
  assert.equal(firstSearch.status(), 200);
  const { clinicId } = firstSearch.request().postDataJSON();
  await page.getByRole("button", { name: "Continuar busca" }).click();
  await page.getByRole("heading", { name, exact: true }).waitFor();

  await page.goto(new URL("/#/gad7", base).href);
  const groups = page.getByRole("radiogroup");
  await groups.first().waitFor();
  assert.equal(await groups.count(), 7);
  for (const group of await groups.all()) await group.locator("label").first().click();
  await page.getByTestId("button-submit").click();
  const picker = page.getByTestId("select-patient");
  await picker.waitFor();
  await picker.click();
  await page.getByRole("option", { name: "Paciente fictício 155", exact: true }).waitFor();
  assert.equal(await page.getByRole("option", { name, exact: true }).count(), 0, "fixture: alvo deve estar fora da página inicial");
  await page.keyboard.press("Escape");

  const search = page.getByTestId("input-scale-patient-search");
  assert.equal(await search.count(), 1, "seletor de escalas LIVE precisa permitir descoberta além da primeira página");
  const privateSearch = page.waitForResponse(r => hasPath(r, "/api/live/patients/search", "POST"));
  await search.fill(name);
  const first = await privateSearch;
  assert.equal(first.status(), 200);
  assert.equal(new URL(first.url()).search, "", "nome não vai na URL");
  const more = page.getByRole("button", { name: "Continuar busca", exact: true });
  await more.click();
  await picker.click();
  await page.getByRole("option", { name, exact: true }).click();
  const createCalls = [];
  page.on("request", req => {
    if (new URL(req.url()).pathname === "/api/live/patients" && req.method() === "POST") createCalls.push(req);
  });
  const assessmentWrite = page.waitForResponse(r => hasPath(r, "/api/live/assessments", "POST"));
  const documentWrite = page.waitForResponse(r => hasPath(r, "/api/live/documents", "POST"));
  await page.getByTestId("button-save-to-patient").click();
  const [assessmentResponse, documentResponse] = await Promise.all([assessmentWrite, documentWrite]);
  assert.equal(assessmentResponse.status(), 201);
  assert.equal(documentResponse.status(), 201);
  const assessment = await assessmentResponse.json();
  const doc = await documentResponse.json();
  assert.equal(assessment.patientId, patientId);
  assert.equal(doc.patientId, patientId);
  assert.equal(createCalls.length, 0, "nenhum cadastro duplicado");
  await page.getByText("Respostas salvas com sucesso!", { exact: true }).waitFor();
  await context.close();

  const freshSession = await signIn();
  const query = new URLSearchParams({ clinicId, patientId });
  const readAssessment = freshSession.page.waitForResponse(r => hasPath(r, "/api/live/assessments", "GET"));
  await freshSession.page.goto(new URL(`/#/paciente/${patientId}`, base).href);
  assert.equal((await readAssessment).status(), 200);
  await freshSession.page.getByRole("heading", { name, exact: true }).waitFor();
  await freshSession.page.getByText("1 avaliação", { exact: true }).waitFor();
  for (const [entity, id] of [["assessments", assessment.id], ["documents", doc.id]]) {
    const read = await freshSession.context.request.get(new URL(`/api/live/${entity}?${query}`, base).href, {
      headers: { Authorization: `Bearer ${freshSession.accessToken}` },
    });
    assert.equal(read.status(), 200);
    const payload = await read.json();
    const rows = Array.isArray(payload) ? payload : payload.data ?? payload[entity];
    assert.ok(Array.isArray(rows));
    assert.equal(rows.length, 1);
    const [row] = rows;
    assert.equal(row.id, id);
    assert.equal(row.patientId, patientId);
    if (entity === "documents") {
      assert.equal(row.familyVisibility, false);
      assert.equal(row.version.content.assessmentId, assessment.id);
      assert.deepEqual(row.version.content.responses, assessment.responses);
    } else {
      assert.equal(row.responses.length, 7);
      assert.deepEqual(row.responses, assessment.responses);
    }
  }
  assert.equal(documentResponse.request().postDataJSON()?.content?.assessmentId, assessment.id);
  console.log("GAD-7 LIVE: paciente além da primeira página, busca privada, gravação e releitura em nova sessão comprovadas.");
} finally {
  await browser.close();
}
