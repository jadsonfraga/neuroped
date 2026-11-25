import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.LIVE_DISCOVERY_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
assert.ok(process.env.LIVE_DISCOVERY_EMAIL?.endsWith("@example.test"));
const clinic = "clinica-alfa-sintetica";
const patient = "audit-patient-000";
const browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--no-zygote", "--single-process"] }));
try {
  const ctx = await browser.newContext({ serviceWorkers: "block" });
  await ctx.addInitScript(data => {
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await ctx.newPage();
  await page.route("**/*", route => route.request().url().startsWith(base.origin + "/") ? route.continue() : route.abort());
  await page.goto(new URL("/?next=%2Fpacientes#/login", base).href);
  await page.locator("#login-email").fill(process.env.LIVE_DISCOVERY_EMAIL);
  await page.locator("#login-password").fill(process.env.LIVE_DISCOVERY_PASSWORD);
  const loggedIn = page.waitForResponse(r => new URL(r.url()).pathname === "/api/auth/login" && r.request().method() === "POST");
  await page.getByTestId("login-form").locator("button[type=submit]").click();
  const login = await loggedIn;
  assert.equal(login.status(), 200);
  const { accessToken } = await login.json();
  await page.waitForURL(url => url.hash === "#/pacientes");
  const operation = async data => {
    const result = await fetch(new URL("/api/operations", base), {
      method: "POST", headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, clinicId: clinic }),
    });
    assert.equal(result.status, 200);
    return result.json();
  };
  const serviceName = "Consulta fictícia vínculo clínico";
  const schedule = await operation({ action: "create_service", name: serviceName, durationMinutes: 60, priceCents: 0 });
  const service = schedule.services.find(item => item.name === serviceName);
  assert.ok(service?.id);
  const day = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10);
  const appointmentName = "Paciente fictício vinculado pela Agenda";
  const booked = await operation({ action: "create_appointment", serviceId: service.id, startsAtLocal: day + "T09:00", patientId: patient, patientName: appointmentName });
  const appointment = booked.appointments.find(item => item.patientName === appointmentName);
  assert.ok(appointment?.id);
  assert.equal(appointment.patientId, patient);
  const savedForm = page.getByRole("button", { name: "Salvar prontuário", exact: true });
  const symptom = page.getByPlaceholder("Descreva a queixa principal e história da doença atual...");
  const anamnese = () => page.getByRole("tab", { name: /Anamnese/ }).click();
  await page.goto(new URL("/#/agenda", base).href);
  const appointmentCard = page.getByText(appointmentName, { exact: true }).locator("../../../..");
  await appointmentCard.getByRole("link", { name: "Prontuário", exact: true }).click();
  await page.waitForURL(url => url.href.includes("/prontuario") && url.href.includes(appointment.id));
  await anamnese();
  const history = page.getByPlaceholder("Pré-natal, intercorrências, uso de medicações, infecções, TORCH...");
  assert.equal(await history.inputValue(), "Registro gestacional sintético legado.");
  await symptom.fill("Queixa fictícia, primeira versão de teste.");
  const responses = [];
  page.on("response", response => {
    if (["POST", "PATCH"].includes(response.request().method()) && new URL(response.url()).pathname.startsWith("/api/live/")) responses.push(response);
  });
  const saving = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/live/events");
  await savedForm.click();
  await saving;
  // Observe both success and failure so a backend rejection fails fast with its code.
  const verdict = page.getByText(/^(Prontuário salvo|Não foi possível salvar o prontuário)$/).first();
  await verdict.waitFor({ timeout: 25000 });
  const failures = await Promise.all(responses.filter(r => !r.ok()).map(async r => ({ status: r.status(), body: await r.json() })));
  assert.deepEqual(failures, [], "todos os eventos clínicos devem ser aceitos pelo backend real");
  if (process.env.PRONTUARIO_FAULT_LOST_RESPONSE === "create") {
    await page.getByText("Não foi possível salvar o prontuário", { exact: true }).first().waitFor();
    assert.equal(await symptom.inputValue(), "Queixa fictícia, primeira versão de teste.");
    await savedForm.click();
    await page.getByText("Prontuário salvo", { exact: true }).first().waitFor({ timeout: 25000 });
  } else {
    assert.match(await verdict.innerText(), /^Prontuário salvo$/);
  }
  await page.reload();
  await anamnese();
  assert.equal(await symptom.inputValue(), "Queixa fictícia, primeira versão de teste.");
  await symptom.fill("Queixa fictícia, versão corrigida de teste.");
  const beforeCorrection = responses.length;
  await savedForm.click();
  await verdict.waitFor({ timeout: 25000 });
  const lostCorrection = process.env.PRONTUARIO_FAULT_LOST_RESPONSE === "correct";
  if (lostCorrection) {
    await page.getByText("Não foi possível salvar o prontuário", { exact: true }).first().waitFor();
    assert.equal(await symptom.inputValue(), "Queixa fictícia, versão corrigida de teste.");
    await savedForm.click();
    await page.getByText("Prontuário salvo", { exact: true }).first().waitFor({ timeout: 25000 });
  }
  const rejected = await Promise.all(responses.slice(beforeCorrection).filter(r => !r.ok()).map(async r => ({ status: r.status(), body: await r.json(), section: r.request().postDataJSON()?.encounterId })));
  assert.deepEqual(rejected, [], "a correção deve passar pelo backend real");
  if (!lostCorrection) assert.match(await verdict.innerText(), /^Prontuário salvo$/);
  const postedSections = responses.slice(beforeCorrection).filter(r => r.request().method() === "POST")
    .map(r => r.request().postDataJSON()?.encounterId);
  assert.deepEqual(postedSections, lostCorrection
    ? ["encounter", "nppr-v1-anamnese-queixaPrincipal", "nppr-v1-anamnese-queixaPrincipal"]
    : ["encounter", "nppr-v1-anamnese-queixaPrincipal"]);
  if (lostCorrection) {
    const correctionResponses = responses.slice(beforeCorrection).filter(r => r.request().postDataJSON()?.encounterId === "nppr-v1-anamnese-queixaPrincipal");
    const [sent, resumed] = correctionResponses;
    assert.equal(sent.request().postDataJSON().sourceRecordReference, resumed.request().postDataJSON().sourceRecordReference);
    assert.equal(resumed.status(), 200);
  }
  await page.reload();
  await anamnese();
  assert.equal(await symptom.inputValue(), "Queixa fictícia, versão corrigida de teste.");

  const eventsUrl = new URL("/api/live/events", base);
  for (const [k, v] of Object.entries({ clinicId: clinic, patientId: patient, limit: "100" })) eventsUrl.searchParams.set(k, v);
  const response = await fetch(eventsUrl, { headers: { Authorization: "Bearer " + accessToken } });
  assert.equal(response.status, 200);
  const records = (await response.json()).data;
  const old = records.find(e => e.payload?.valueText === "Queixa fictícia, primeira versão de teste.");
  const current = records.find(e => e.payload?.valueText === "Queixa fictícia, versão corrigida de teste.");
  assert.equal(records.filter(e => e.payload?.valueText === "Queixa fictícia, primeira versão de teste.").length, 1,
    "retry após resposta perdida não deve gravar duas cópias clínicas");
  assert.equal(old?.status, "corrected");
  assert.equal(current?.status, "active");
  assert.equal(records.filter(e => e.payload?.valueText === "Queixa fictícia, versão corrigida de teste.").length, 1);
  assert.equal(current?.supersedesEventId, old.id);
  const encounter = records.find(e => e.status === "active" && e.encounterId === "encounter");
  assert.equal(encounter?.payload?.appointmentId, appointment.id, "consulta da agenda fica vinculada ao atendimento gravado");
  assert.equal(await history.inputValue(), "Registro gestacional sintético legado.");
  assert.equal(records.find(e => e.id === "prontuario-legado-ficticio")?.status, "corrected");
  assert.equal(records.filter(e => e.status === "active" && e.encounterId === "nppr-v1-anamnese-gestacional").length, 1);
  assert.ok(!records.some(e => /(?:regressao|crises)$/i.test(e.encounterId ?? "") && e.payload?.valueText === "Não"),
    "não gravar ausência de crise/regressão que ninguém informou");
  const beforeNoChange = responses.length;
  await savedForm.click();
  await verdict.waitFor({ timeout: 25000 });
  assert.match(await verdict.innerText(), /^Prontuário salvo$/);
  assert.equal(responses.slice(beforeNoChange).filter(r => r.request().method() === "POST").length, 0,
    "salvar sem alteração não deve criar outra versão clínica");
  await page.reload();
  await anamnese();
  await symptom.fill("");
  await savedForm.click();
  await verdict.waitFor({ timeout: 25000 });
  assert.match(await verdict.innerText(), /^Prontuário salvo$/);
  await page.reload();
  await anamnese();
  assert.equal(await symptom.inputValue(), "");
  const clearedResponse = await fetch(eventsUrl, { headers: { Authorization: "Bearer " + accessToken } });
  assert.equal(clearedResponse.status, 200);
  const cleared = (await clearedResponse.json()).data.find(e => e.status === "active" && e.encounterId === current.encounterId);
  assert.equal(cleared?.payload?.findingStatus, "not_assessed");
  assert.equal(cleared?.supersedesEventId, current.id);
  console.log("Agenda → Prontuário LIVE: vínculo, gravação, recarga, correção, reenvio sem mudanças e limpeza explícita com trilha no D1; sem achado padrão inventado.");
} finally { await browser.close(); }
