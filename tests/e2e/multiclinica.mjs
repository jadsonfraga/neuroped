// E2E: multiclínica — marca da clínica (Configurações → Marca), quadro de perfis e secretaria sem acesso clínico.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.MULTICLINICA_ARTIFACT_DIR || "/tmp/multiclinica";
await mkdir(dir, { recursive: true });
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const browser = await chromium.launch(auditBrowserLaunchOptions());
const errors = [];
const outbound = [];
const servers = [];

const tab = (pg, name) => pg.getByTestId("configuracoes-shell").getByText(name, { exact: true });

async function open(scenario, hash) {
  const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated", ...scenario }) });
  servers.push(server);
  const context = await browser.newContext({ viewport: { width: 1280, height: 1400 }, reducedMotion: "reduce" });
  await context.addInitScript((st) => { try { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); } catch {} }, ACCEPTED_FIRST_VISIT_STORAGE);
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

try {
  // ---------- Proprietário: marca ----------
  const o = await open({}, "/configuracoes?secao=marca");
  const page = o.page;
  const patches = [];
  page.on("request", (r) => { if (r.method() === "PATCH" && /\/api\/tenants\//.test(r.url())) patches.push(JSON.parse(r.postData() || "{}")); });
  await page.getByTestId("configuracoes-shell").waitFor({ timeout: 25000 });
  await tab(page, "Marca").click();
  await page.getByTestId("branding-section").waitFor({ timeout: 25000 });
  assert.equal(await tab(page, "Marca").count(), 1);

  await page.getByTestId("brand-primary").fill("#7a1f2c");
  await page.getByTestId("brand-accent").fill("#f2c14e");
  await page.getByTestId("brand-header").fill("Clínica Alfa · Neuropediatria");
  await page.getByTestId("brand-footer").fill("Rodapé institucional fictício");
  await page.getByTestId("brand-logo-input").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
  await page.getByTestId("branding-preview-logo").waitFor();
  assert.match(await page.getByTestId("branding-preview-header").innerText(), /Clínica Alfa · Neuropediatria/);
  assert.match(await page.getByTestId("branding-preview-footer").innerText(), /Rodapé institucional fictício/);
  assert.match(await page.getByTestId("branding-preview").innerText(), /não alterado pela marca/);

  // cor clara demais: aviso e botão bloqueado
  await page.getByTestId("brand-primary").fill("#ffffe0");
  await page.getByTestId("brand-warning").waitFor();
  assert.match(await page.getByTestId("brand-warning").innerText(), /clara demais/);
  assert.equal(await page.getByTestId("brand-save").isDisabled(), true);

  // SVG recusado
  await page.getByTestId("brand-logo-input").setInputFiles({ name: "logo.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>") });
  await page.getByTestId("brand-error").waitFor();
  assert.match(await page.getByTestId("brand-error").innerText(), /SVG não é aceito|inválido/);

  await page.getByTestId("brand-primary").fill("#7a1f2c");
  await Promise.all([
    page.waitForResponse((r) => /\/api\/tenants\//.test(r.url()) && r.request().method() === "PATCH"),
    page.getByTestId("brand-save").click(),
  ]);
  assert.equal(patches.length, 1);
  assert.equal(patches[0].branding.primaryColor, "#7a1f2c");
  assert.equal(patches[0].branding.headerText, "Clínica Alfa · Neuropediatria");
  assert.match(patches[0].branding.logoDataUri, /^data:image\/png;base64,/);
  assert.equal("settings" in patches[0], false, "só a marca é enviada");
  await page.screenshot({ path: `${dir}/marca.png`, fullPage: true });

  // persiste ao recarregar
  await page.reload();
  await page.getByTestId("configuracoes-shell").waitFor();
  await tab(page, "Marca").click();
  await page.getByTestId("branding-section").waitFor();
  assert.equal(await page.getByTestId("brand-primary").inputValue(), "#7a1f2c");
  await page.getByTestId("branding-preview-logo").waitFor();

  // quadro de perfis na aba Equipe
  await tab(page, "Equipe").click();
  const card = page.getByTestId("role-permissions-card");
  await card.waitFor();
  const secretaria = await page.getByTestId("role-assistant").innerText();
  assert.match(secretaria, /Secretaria/);
  assert.match(secretaria, /Pode:.*Agenda e cadastro/s);
  assert.match(secretaria, /Não pode:.*Prontuário, laudos/s);
  await o.context.close();

  // ---------- Secretaria: sem marca/equipe e sem conteúdo clínico ----------
  const s = await open({ primaryRole: "assistant", userRole: "operator" }, "/configuracoes");
  const sp = s.page;
  await sp.getByTestId("configuracoes-shell").waitFor({ timeout: 25000 });
  await tab(sp, "Perfil").waitFor();
  for (const hidden of ["Marca", "Equipe", "Plano", "Auditoria"]) assert.equal(await tab(sp, hidden).count(), 0, hidden);
  // link direto para a marca cai em Perfil
  await sp.goto(`${s.server.origin}/#/configuracoes?secao=marca`);
  await sp.reload();
  await sp.getByTestId("configuracoes-shell").waitFor();
  assert.equal(await sp.getByTestId("branding-section").count(), 0);
  // rotas clínicas barradas
  for (const route of ["/laudo-neuroped", "/laudo-um-clique", "/prontuario", "/documentos"]) {
    await sp.goto(`${s.server.origin}/#${route}`);
    await sp.getByRole("heading", { name: "Acesso não autorizado" }).waitFor({ timeout: 15000 });
  }
  // agenda continua liberada
  await sp.goto(`${s.server.origin}/#/agenda`);
  await sp.waitForLoadState("networkidle");
  assert.equal(await sp.getByRole("heading", { name: "Acesso não autorizado" }).count(), 0);
  await sp.screenshot({ path: `${dir}/secretaria.png` });
  await s.context.close();

  assert.deepEqual(outbound, [], "nenhuma chamada externa");
  assert.deepEqual(errors, [], "sem erros de página");
  console.log("e2e multiclinica: OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  for (const sv of servers) await sv.close?.();
}
