// Agenda clínica no navegador com Pages Functions + D1 local, sem mock.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.LIVE_DISCOVERY_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
const email = process.env.LIVE_DISCOVERY_EMAIL;
const password = process.env.LIVE_DISCOVERY_PASSWORD;
assert.ok(email?.endsWith("@example.test") && password);
const day = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10);
const name = "Criança fictícia da agenda";
const rejectedName = "Horário em conflito fictício";
const patientId = "audit-patient-155";
const browser = await chromium.launch(auditBrowserLaunchOptions());
const matches = (r, path, method) => new URL(r.url()).pathname === path && r.request().method() === method;

async function signIn() {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.addInitScript(st => {
    for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.goto(new URL("/?next=%2Fpacientes#/login", base).href);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  const login = page.waitForResponse(r => matches(r, "/api/auth/login", "POST"));
  await page.getByTestId("login-form").locator('button[type="submit"]').click();
  const response = await login;
  assert.equal(response.status(), 200);
  const { accessToken } = await response.json();
  await page.waitForURL(u => u.hash === "#/pacientes");
  return { page, context, accessToken };
}

try {
  const { page, context, accessToken } = await signIn();
  const setup = await context.request.post(new URL("/api/operations", base).href, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { action: "create_service", name: "Consulta sintética", durationMinutes: 60, priceCents: 0 },
  });
  assert.equal(setup.status(), 200, "preparar serviço pela API real");
  const config = await setup.json();
  const service = config.services.find(item => item.name === "Consulta sintética");
  assert.ok(service?.id);

  await page.goto(new URL("/#/agenda", base).href);
  await page.getByTestId("agenda-shell").waitFor();
  const manual = page.getByText("Novo agendamento manual", { exact: true }).locator("../..");
  const input = manual.locator('input[type="datetime-local"]');
  const add = manual.getByRole("button", { name: "Adicionar", exact: true });
  const selectPatient = manual.getByRole("combobox", { name: "Selecionar paciente para vínculo clínico" });
  await selectPatient.locator(`option[value="${patientId}"]`).waitFor({ state: "attached" });
  const matchWrite = (action) => page.waitForResponse(r => matches(r, "/api/operations", "POST") &&
    r.request().postDataJSON()?.action === action);
  await manual.locator(`select:has(option[value="${service.id}"])`).selectOption(service.id);
  await selectPatient.selectOption(patientId);
  await manual.getByPlaceholder("Nome", { exact: true }).fill(name);
  await input.fill(`${day}T08:00`);
  const creation = matchWrite("create_appointment");
  await add.click();
  assert.equal((await creation).status(), 200);
  const reloadAgenda = async () => {
    const result = await context.request.get(new URL("/api/operations", base).href, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.equal(result.status(), 200);
    return (await result.json()).appointments;
  };
  const created = (await reloadAgenda()).find(apt => apt.patientName === name);
  assert.ok(created?.id);
  assert.equal(created.patientId, patientId);
  assert.equal(created.startsAtLocal, `${day}T08:00`);
  assert.equal(created.endsAtLocal, `${day}T09:00`);
  await page.getByText("Consulta adicionada à agenda.", { exact: true }).waitFor();

  const upcoming = page.getByText("Próximas consultas", { exact: true }).locator("../..");
  const appointment = upcoming.getByText(name, { exact: true }).locator("../../../..");
  await appointment.getByRole("button", { name: "Remarcar", exact: true }).waitFor();
  await input.fill(`${day}T08:30`);
  await manual.getByPlaceholder("Nome", { exact: true }).fill(rejectedName);
  const conflict = matchWrite("create_appointment");
  await add.click();
  const denied = await conflict;
  assert.equal(denied.status(), 409);
  await page.getByText(/SLOT_CONFLICT|SCHEDULE_CONFLICT/).waitFor();
  await page.getByText("Não foi possível concluir.", { exact: true }).waitFor();
  assert.equal(await upcoming.getByText(rejectedName, { exact: true }).count(), 0);

  await appointment.getByRole("button", { name: "Remarcar", exact: true }).click();
  const form = page.getByTestId("reschedule-form");
  await form.locator('input[type="datetime-local"]').fill(`${day}T10:00`);
  const reschedule = matchWrite("appointment_reschedule");
  await form.getByRole("button", { name: "Confirmar remarcação", exact: true }).click();
  const moved = await reschedule;
  assert.equal(moved.status(), 200);
  const updated = (await reloadAgenda()).find(apt => apt.id === created.id);
  assert.equal(updated.startsAtLocal, `${day}T10:00`);
  assert.equal(updated.endsAtLocal, `${day}T11:00`);
  assert.equal(updated.patientId, patientId);
  await page.getByText("Consulta remarcada.", { exact: true }).waitFor();
  await context.close();

  const fresh = await signIn();
  await fresh.page.goto(new URL("/#/agenda", base).href);
  await fresh.page.getByTestId("agenda-shell").waitFor();
  const persisted = await fresh.context.request.get(new URL("/api/operations", base).href, {
    headers: { Authorization: `Bearer ${fresh.accessToken}` },
  });
  assert.equal(persisted.status(), 200);
  const { appointments } = await persisted.json();
  assert.equal(appointments.length, 1);
  assert.equal(appointments[0].id, created.id);
  assert.equal(appointments[0].patientId, patientId);
  await fresh.page.getByText(name, { exact: true }).waitFor();
  assert.equal(await fresh.page.getByText(rejectedName, { exact: true }).count(), 0);
  await fresh.page.locator("#agenda-date").fill(day);
  const grade = fresh.page.getByRole("group", { name: "Grade de horários da agenda" });
  await grade.getByRole("button", { name: /10:00.*Criança fictícia da agenda/ }).waitFor();
  await grade.getByRole("button", { name: /08:00.*Horário livre/ }).waitFor();
  console.log("Agenda LIVE: criação, conflito recusado, remarcação e releitura com horário anterior livre.");
} catch (error) {
  console.error(error);
  throw error;
} finally {
  await browser.close();
}
