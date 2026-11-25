// Browser -> actual Pages Functions -> disposable local D1. No API intercepts.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.LIVE_DISCOVERY_URL ?? "http://127.0.0.1:8794");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
const email = process.env.LIVE_DISCOVERY_EMAIL;
const password = process.env.LIVE_DISCOVERY_PASSWORD;
assert.ok(email?.endsWith("@example.test") && password);
const createNew = process.env.SCALE_RETRY_NEW_PATIENT === "1";
const name = createNew ? "Paciente novo fictício para recuperação" : "Paciente fictício 155";
let patientId = createNew ? undefined : "audit-patient-155";
const fault = process.env.SCALE_RETRY_FAULT;
assert.ok(["db", "response", undefined].includes(fault));
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
  await page.goto(new URL("/#/gad7", base).href);
  const groups = page.getByRole("radiogroup");
  await groups.first().waitFor();
  assert.equal(await groups.count(), 7);
  for (const group of await groups.all()) await group.locator("label").first().click();
  await page.getByTestId("button-submit").click();
  const picker = page.getByTestId("select-patient");
  await picker.waitFor();
  await picker.click();
  if (createNew) {
    await page.getByRole("option", { name: "+ Criar novo paciente", exact: true }).click();
    await page.getByTestId("input-new-patient-name").fill(name);
  } else {
    await page.getByRole("option", { name, exact: true }).click();
  }
  const calls = { patients: 0, assessments: 0, documents: 0 };
  page.on("request", req => {
    const entity = new URL(req.url()).pathname.match(/^\/api\/live\/(patients|assessments|documents)$/)?.[1];
    if (entity && req.method() === "POST") calls[entity]++;
  });
  const create = createNew ? page.waitForResponse(r => hasPath(r, "/api/live/patients", "POST")) : null;
  const assessmentWrite = page.waitForResponse(r => hasPath(r, "/api/live/assessments", "POST"));
  const documentAttempt = page.waitForResponse(r => hasPath(r, "/api/live/documents", "POST"));
  const saveButton = page.getByTestId("button-save-to-patient");
  await saveButton.click();
  if (create) {
    const response = await create;
    assert.equal(response.status(), 201);
    patientId = (await response.json()).id;
    assert.ok(patientId);
  }
  const assessmentResponse = await assessmentWrite;
  assert.equal(assessmentResponse.status(), 201);
  const assessment = await assessmentResponse.json();
  const { clinicId } = assessment;
  assert.equal(assessment.patientId, patientId);
  const firstAttempt = await documentAttempt;
  assert.equal(firstAttempt.status(), fault === "db" ? 500 : 201);
  if (fault === "response") await assert.rejects(firstAttempt.json());
  if (fault) {
    // Either the server rejected the second write, or the transport lost its
    // response after the server successfully committed. Neither should repeat
    // the assessment. The error must be visible before the second click.
    await page.getByRole("alert").filter({hasText: /não foi possível|avaliação.*salv/i}).waitFor();
    await saveButton.click();
  }
  await page.getByText("Respostas salvas com sucesso!", { exact: true }).waitFor();
  assert.equal(calls.patients, createNew ? 1 : 0, "recuperação não recria o cadastro");
  assert.equal(calls.assessments, 1, "repetir o salvamento não pode recriar a avaliação já confirmada");
  assert.equal(calls.documents, fault === "db" ? 2 : 1, "um documento já confirmado não é escrito novamente");
  await context.close();

  const freshSession = await signIn();
  const query = new URLSearchParams({ clinicId, patientId });
  const readAssessment = freshSession.page.waitForResponse(r => hasPath(r, "/api/live/assessments", "GET"));
  await freshSession.page.goto(new URL(`/#/paciente/${patientId}`, base).href);
  assert.equal((await readAssessment).status(), 200);
  await freshSession.page.getByRole("heading", { name, exact: true }).waitFor();
  await freshSession.page.getByText("1 avaliação", { exact: true }).waitFor();
  for (const entity of ["assessments", "documents"]) {
    const read = await freshSession.context.request.get(new URL(`/api/live/${entity}?${query}`, base).href, {
      headers: { Authorization: `Bearer ${freshSession.accessToken}` },
    });
    assert.equal(read.status(), 200);
    const payload = await read.json();
    const rows = Array.isArray(payload) ? payload : payload.data ?? payload[entity];
    assert.ok(Array.isArray(rows));
    assert.equal(rows.length, 1);
    const [row] = rows;
    assert.ok(row.id);
    assert.equal(row.patientId, patientId);
    if (entity === "documents") {
      assert.equal(row.familyVisibility, false);
      assert.equal(row.version.content.assessmentId, assessment.id);
      assert.deepEqual(row.version.content.responses, assessment.responses);
    } else {
      assert.equal(row.id, assessment.id);
      assert.equal(row.responses.length, 7);
      assert.deepEqual(row.responses, assessment.responses);
    }
  }
  console.log("GAD-7 LIVE: avaliação única e documento vinculado, conferidos em nova sessão.");
} finally {
  await browser.close();
}
