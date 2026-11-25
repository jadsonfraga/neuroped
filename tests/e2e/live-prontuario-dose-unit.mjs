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
  await page.goto(new URL(`/?patientId=${patient}#/prontuario`, base).href);
  const medTab = () => page.getByRole("tab", { name: /Medicações/ }).click();
  await medTab();

  const examples = [
    { name: "Registro sintético volume", dose: "5 mL", weight: "20 lb", mg: undefined },
    { name: "Registro sintético faixa", dose: "10–20 mg", weight: "20", mg: undefined },
    { name: "Registro sintético concentração", dose: "5 mg/mL", weight: "20", mg: undefined },
    { name: "Registro sintético massa", dose: "0,5 mg", weight: "20", mg: 0.5 },
  ];
  for (const [i, { name, dose, weight }] of examples.entries()) {
    await page.getByRole("button", { name: "Adicionar medicação", exact: true }).click();
    await page.getByRole("textbox", { name: "Nome da medicação" }).nth(i).fill(name);
    await page.getByRole("textbox", { name: "Dose", exact: true }).nth(i).fill(dose);
    await page.getByPlaceholder("Ex: 18,5", { exact: true }).nth(i).fill(weight);
  }

  const responses = [];
  page.on("response", response => {
    if (["POST", "PATCH"].includes(response.request().method()) && new URL(response.url()).pathname.startsWith("/api/live/")) responses.push(response);
  });
  await page.getByRole("button", { name: "Salvar prontuário", exact: true }).click();
  const verdict = page.getByText(/^(Prontuário salvo|Não foi possível salvar o prontuário)$/).first();
  await verdict.waitFor({ timeout: 25000 });
  const rejected = await Promise.all(responses.filter(r => !r.ok()).map(async r => ({ status: r.status(), body: await r.json() })));
  assert.deepEqual(rejected, [], "gravação de medicações no backend canônico");
  assert.match(await verdict.innerText(), /^Prontuário salvo$/);

  const eventsUrl = new URL("/api/live/events", base);
  for (const [k, v] of Object.entries({ clinicId: clinic, patientId: patient, limit: "100" })) eventsUrl.searchParams.set(k, v);
  const result = await fetch(eventsUrl, { headers: { Authorization: "Bearer " + accessToken } });
  assert.equal(result.status, 200);
  const stored = (await result.json()).data.filter(event => event.eventType === "medication" && event.status === "active");
  for (const { name, dose, mg } of examples) {
    const item = stored.find(event => event.payload.genericName === name);
    assert.ok(item, name);
    assert.equal(JSON.parse(item.payload.reason).item.dose, dose, "preserva texto literal");
    assert.equal(item.payload.doseMg, mg, name + ": não inventa unidade ou quantidade");
  }

  await page.reload();
  await medTab();
  const inputs = page.getByRole("textbox", { name: "Dose", exact: true });
  const ratios = page.getByText(/^mg\/kg:/);
  assert.equal(await ratios.count(), 1, "só uma massa inequívoca pode aparecer como mg/kg");
  assert.match(await ratios.first().innerText(), /0[.,]025/);
  const restored = await inputs.evaluateAll(nodes => nodes.map(input => input.value));
  assert.deepEqual(restored.sort(), examples.map(item => item.dose).sort(), "texto original volta após recarga");
  const preview = await page.getByRole("region", { name: "Prévia do relatório completo" }).innerText();
  assert.equal((preview.match(/mg\/kg:/g) ?? []).length, 1, "prévia não propaga cálculo indevido");
  assert.match(preview, /Peso: 20 lb(?:\s|$)/);
  assert.doesNotMatch(preview, /lb kg/);
  await page.evaluate(() => {
    const open = window.open.bind(window);
    window.open = (...args) => {
      const popup = open(...args);
      if (popup) popup.print = () => {};
      return popup;
    };
  });
  const opened = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Gerar relatório em PDF", exact: true }).click();
  const print = await opened;
  const cards = print.locator(".med-card");
  await cards.first().waitFor();
  const submitted = (await cards.allTextContents()).join("\n");
  assert.equal((submitted.match(/mg\/kg:/g) ?? []).length, 1, "visualização de impressão mantém a mesma regra");
  assert.doesNotMatch(submitted, /lb kg/);
  await print.close();
  console.log("Medicações: texto original preservado no D1; volume, faixa e concentração não são tratados como massa.");
} finally { await browser.close(); }
