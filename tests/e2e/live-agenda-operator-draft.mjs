// Testa o papel operador no Chromium com Pages Functions + D1 locais reais.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.LIVE_DISCOVERY_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
const ownerEmail = process.env.LIVE_DISCOVERY_EMAIL;
const password = process.env.LIVE_DISCOVERY_PASSWORD;
const operatorEmail = "sec-a@example.test";
assert.ok(ownerEmail?.endsWith("@example.test") && password);
const day = new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10);
const browser = await chromium.launch(auditBrowserLaunchOptions());
const matches = (r, path, method) => new URL(r.url()).pathname === path && r.request().method() === method;

async function signIn(email, next) {
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 768, height: 1024 } });
  await context.addInitScript(st => {
    for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.goto(new URL("/?next=" + encodeURIComponent(next) + "#/login", base).href);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  const login = page.waitForResponse(r => matches(r, "/api/auth/login", "POST"));
  await page.getByTestId("login-form").locator('button[type="submit"]').click();
  const response = await login;
  assert.equal(response.status(), 200);
  const { accessToken } = await response.json();
  await page.waitForURL(u => u.hash === "#" + next);
  const headers = { Authorization: `Bearer ${accessToken}` };
  return { page, context, headers };
}

try {
  const owner = await signIn(ownerEmail, "/pacientes");
  const ops = new URL("/api/operations", base).href;
  const setup = await owner.context.request.post(ops, {
    headers: owner.headers,
    data: { action: "create_service", name: "Consulta sintética", durationMinutes: 60, priceCents: 0 },
  });
  assert.equal(setup.status(), 200);
  const service = (await setup.json()).services.find(item => item.name === "Consulta sintética");
  assert.ok(service?.id);
  const linked = await owner.context.request.post(ops, {
    headers: owner.headers, data: { action: "staff_link", email: operatorEmail },
  });
  assert.equal(linked.status(), 200, "vínculo de recepção autorizado pelo profissional");
  await owner.context.close();

  const { page, context, headers } = await signIn(operatorEmail, "/agenda");
  await page.getByTestId("agenda-shell").waitFor();
  await page.getByTestId("agenda-provider-label").waitFor();
  assert.equal((await context.request.get(new URL("/api/live/patients?clinicId=clinica-alfa-sintetica", base).href, { headers })).status(), 403);
  assert.equal(await page.getByRole("combobox", { name: "Selecionar paciente para vínculo clínico" }).count(), 0);

  const form = page.getByText("Novo agendamento manual", { exact: true }).locator("../..");
  const serviceField = form.getByRole("combobox", { name: "Serviço" });
  const start = form.getByLabel("Data e horário", { exact: true });
  const child = form.getByLabel("Criança", { exact: true });
  const guardian = form.getByLabel("Responsável", { exact: true });
  const phone = form.getByLabel("Telefone", { exact: true });
  const email = form.getByLabel("E-mail", { exact: true });
  const add = form.getByRole("button", { name: "Adicionar", exact: true });
  async function submit() {
    const response = page.waitForResponse(r => matches(r, "/api/operations", "POST") &&
      r.request().postDataJSON()?.action === "create_appointment");
    await add.click();
    return response;
  }

  await serviceField.selectOption(service.id);
  await start.fill(`${day}T08:00`);
  await child.fill("Criança sintética 1");
  await guardian.fill("Responsável fictício 1");
  await phone.fill("87999990031");
  await email.fill("primeiro@example.test");
  assert.equal((await submit()).status(), 200);
  await page.getByText("Consulta adicionada à agenda.", { exact: true }).waitFor();
  assert.equal(await serviceField.inputValue(), service.id, "serviço não pessoal é mantido");
  for (const field of [phone, email, guardian, child, start]) {
    assert.equal(await field.inputValue(), "", "confirmar gravação não pode deixar dados do caso anterior");
  }

  await start.fill(`${day}T08:30`);
  await child.fill("Criança sintética 2");
  await guardian.fill("Responsável fictício 2");
  await email.fill("segundo@example.test");
  assert.equal((await submit()).status(), 409);
  await page.getByText("Não foi possível concluir.", { exact: true }).waitFor();
  assert.equal(await child.inputValue(), "Criança sintética 2");
  assert.equal(await guardian.inputValue(), "Responsável fictício 2");
  assert.equal(await email.inputValue(), "segundo@example.test");
  assert.equal(await phone.inputValue(), "", "telefone do caso anterior não é herdado");
  assert.equal(await start.inputValue(), `${day}T08:30`, "erro preserva o rascunho");
  await start.fill(`${day}T10:00`);
  assert.equal((await submit()).status(), 200);
  await page.getByText("Criança sintética 2", { exact: true }).first().waitFor();
  await page.waitForFunction(input => input.value === "", await email.elementHandle(), { timeout: 8_000 });
  await context.close();
  console.log("Chromium: recepção autorizada, duas famílias isoladas, conflito preserva rascunho.");
} finally {
  await browser.close();
}
