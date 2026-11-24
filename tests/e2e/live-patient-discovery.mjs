// Browser → canonical Pages Functions → local D1. No intercepted or synthetic
// HTTP responses. Run against a seeded local instance with fictitious records.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.LIVE_DISCOVERY_URL ?? "http://127.0.0.1:8794");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname), "somente instância local com fixtures");
const email = process.env.LIVE_DISCOVERY_EMAIL;
const password = process.env.LIVE_DISCOVERY_PASSWORD;
assert.ok(email?.endsWith("@example.test") && password, "informe as credenciais da fixture fictícia");
const patientName = "Paciente Remoto Sintético Distante";
const browser = await chromium.launch(auditBrowserLaunchOptions());
try {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.addInitScript((items) => {
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  await page.goto(new URL("/?next=%2Fpacientes#/login", base).href);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  const login = page.waitForResponse(r => new URL(r.url()).pathname === "/api/auth/login" && r.request().method() === "POST");
  await page.getByTestId("login-form").locator('button[type="submit"]').click();
  assert.equal((await login).status(), 200);
  await page.waitForURL(url => url.hash === "#/pacientes");
  const search = page.getByTestId("input-search-patients");
  await search.waitFor();
  const privateSearch = page.waitForResponse(r => new URL(r.url()).pathname === "/api/live/patients/search" && r.request().method() === "POST");
  await search.fill(patientName);
  const initial = await privateSearch;
  assert.equal(initial.status(), 200);
  assert.equal(new URL(initial.url()).search, "", "nome nunca aparece na URL da busca");
  await page.getByText("Nenhum resultado nesta página", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Continuar busca" }).click();
  await page.getByRole("heading", { name: patientName, exact: true }).waitFor();
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await page.getByRole("button", { name: "Continuar busca" }).waitFor();
  const changed = page.waitForResponse(r => new URL(r.url()).pathname === "/api/live/patients/search" &&
    r.request().method() === "POST" && r.request().postDataJSON()?.q === "Nome fictício sem correspondência");
  await search.fill("Nome fictício sem correspondência");
  assert.equal((await changed).status(), 200);
  await page.getByRole("button", { name: "Continuar busca" }).click();
  await page.getByText("Nenhum resultado encontrado", { exact: true }).waitFor();
  await page.reload();
  await page.getByTestId("input-search-patients").waitFor();
  await page.getByRole("heading", { name: "Paciente fictício 155", exact: true }).waitFor();
  console.log("LIVE: login, busca privada, continuação, anterior, ausência final e reload comprovados no backend local");
} finally {
  await browser.close();
}
