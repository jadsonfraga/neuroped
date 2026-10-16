// E2E: registro de uso de IA (CFM 2.454/2026) + privacidade (retenção, trilha, pedidos do titular). Dados fictícios.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.LGPD_ARTIFACT_DIR || "/tmp/lgpd-registro-ia";
await mkdir(dir, { recursive: true });
const PATIENT = "paciente-sintetico-alfa";
const browser = await chromium.launch(auditBrowserLaunchOptions());
const errors = [];
const outbound = [];
const servers = [];

async function open(scenario, hash) {
  const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated", ...scenario }) });
  servers.push(server);
  const context = await browser.newContext({ viewport: { width: 1280, height: 1800 }, reducedMotion: "reduce" });
  await context.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => { if (!r.url().startsWith(server.origin) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) outbound.push(r.url()); });
  await page.goto(`${server.origin}/#${hash}`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  return { page, server, context };
}
const tab = (pg, name) => pg.getByTestId("configuracoes-shell").getByText(name, { exact: true });

try {
  // ---------- Registro de IA no cockpit do paciente ----------
  const o = await open({}, `/paciente/${PATIENT}`);
  const page = o.page;
  await page.getByTestId("ai-use-panel").waitFor({ timeout: 25000 });
  assert.match(await page.getByTestId("ai-use-panel").innerText(), /CFM 2\.454\/2026/);
  await page.getByTestId("ai-empty").waitFor();
  assert.equal(await page.getByTestId("ai-register").isDisabled(), true, "sem ferramenta, não registra");

  await page.getByTestId("ai-tool").fill("Assistente de redação fictício");
  await page.getByTestId("ai-purpose").selectOption("redacao_documento");
  await page.getByTestId("ai-sharing").selectOption("pseudonimizado");
  await page.getByTestId("ai-reviewed").check();
  await Promise.all([
    page.waitForResponse((r) => /\/api\/live\/ai-use/.test(r.url()) && r.request().method() === "POST"),
    page.getByTestId("ai-register").click(),
  ]);
  await page.getByTestId("ai-record").waitFor();
  const line = await page.getByTestId("ai-chart-line").innerText();
  assert.match(line, /Assistente de redação fictício/);
  assert.match(line, /não substitui a decisão médica/);
  assert.match(line, /Ciência da família ainda não registrada/);
  assert.doesNotMatch(line, /nível|corte|classifica|escore|pontuaç/i, "regra do médico: sem nível/corte/classificação");
  assert.match(await page.getByTestId("ai-family-status").innerText(), /ainda não informada/);

  // ciência da família
  await Promise.all([
    page.waitForResponse((r) => /\/api\/live\/ai-use/.test(r.url()) && r.request().method() === "PATCH"),
    page.getByTestId("ai-family-informed").click(),
  ]);
  await page.waitForFunction(() => /Família informada/.test(document.querySelector('[data-testid="ai-family-status"]')?.textContent ?? ""));
  assert.equal(await page.getByTestId("ai-family-informed").count(), 0, "ciência só pode ser marcada uma vez");
  assert.match(await page.getByTestId("ai-chart-line").innerText(), /Família informada sobre o uso de IA/);
  await page.screenshot({ path: `${dir}/registro-ia.png`, fullPage: true });

  // ---------- Privacidade e IA (gestor) ----------
  await page.goto(`${o.server.origin}/#/configuracoes`);
  await page.getByTestId("configuracoes-shell").waitFor();
  await tab(page, "Privacidade e IA").click();
  await page.getByTestId("privacy-section").waitFor();

  // retenção: abaixo do piso de 20 anos é recusado no cliente; acima é aceito
  await page.getByTestId("retention-input-clinical_record").fill("3650");
  await page.getByTestId("retention-save-clinical_record").click();
  assert.match(await page.getByTestId("retention-error-clinical_record").innerText(), /mínimo legal.*7300/);
  await page.getByTestId("retention-input-clinical_record").fill("9125");
  await Promise.all([
    page.waitForResponse((r) => /governance\/retention/.test(r.url()) && r.request().method() === "PUT"),
    page.getByTestId("retention-save-clinical_record").click(),
  ]);
  assert.equal(await page.getByTestId("retention-error-clinical_record").count(), 0);

  // pedidos do titular: eliminação dentro do prazo é negada com base legal; fora do prazo, pendente de decisão
  assert.equal(await page.getByTestId("subject-outcome").getAttribute("data-decision"), "deny_with_reason");
  assert.match(await page.getByTestId("subject-outcome").innerText(), /art\. 16, I/);
  await page.getByTestId("subject-within").uncheck();
  assert.equal(await page.getByTestId("subject-outcome").getAttribute("data-decision"), "pending_legal_decision");
  await page.getByTestId("subject-type").selectOption("access");
  assert.equal(await page.getByTestId("subject-outcome").getAttribute("data-decision"), "attend");

  // trilha consultável com filtro
  await page.getByTestId("audit-consult").click();
  await page.getByTestId("audit-row").first().waitFor();
  assert.ok((await page.getByTestId("audit-row").count()) >= 2);
  await page.getByTestId("audit-action").fill("family_status");
  await page.getByTestId("audit-consult").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="audit-row"]').length === 1);
  assert.match(await page.getByTestId("audit-list").innerText(), /ai_use_family_status/);

  // pendências jurídicas visíveis
  assert.ok((await page.getByTestId("pending-decisions").locator("li").count()) >= 5);
  await page.screenshot({ path: `${dir}/privacidade.png`, fullPage: true });

  // ---------- Secretaria: sem Privacidade e IA e sem painel clínico ----------
  const s = await open({ primaryRole: "assistant", userRole: "operator" }, "/configuracoes");
  await s.page.getByTestId("configuracoes-shell").waitFor({ timeout: 25000 });
  assert.equal(await tab(s.page, "Privacidade e IA").count(), 0);
  await s.page.goto(`${s.server.origin}/#/paciente/${PATIENT}`);
  await s.page.getByRole("heading", { name: "Acesso não autorizado" }).waitFor({ timeout: 15000 });
  assert.equal(await s.page.getByTestId("ai-use-panel").count(), 0);

  assert.deepEqual(outbound, [], "nenhuma chamada externa");
  assert.deepEqual(errors, [], "sem erros de página");
  console.log("e2e lgpd-registro-ia: OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  for (const sv of servers) await sv.close?.();
}
