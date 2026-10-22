/** Login de visitante no build real: abre só as escalas.
 * Servidor sintético espelha o portão deny-by-default do middleware; a prova de
 * servidor está em tests/unit/visitor-login.test.ts. Aqui: a UI não oferece nem
 * dispara nada fora das escalas. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import {
  startStaticServer,
  auditBrowserLaunchOptions,
  ACCEPTED_FIRST_VISIT_STORAGE,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../../scripts/lib/synthetic-clinical-api.mjs";

const server = await startStaticServer("dist/public", {
  port: 0,
  apiHandler: createSyntheticClinicalApi({ patients: "empty", userRole: "visitor" }),
});
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
await context.addInitScript((storage) => {
  for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
}, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const pageErrors = [];
const apiCalls = [];
const denied = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("response", (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith("/api/")) return;
  apiCalls.push(`${response.request().method()} ${url.pathname} ${response.status()}`);
  if (response.status() === 403 || response.status() === 401) denied.push(`${url.pathname} ${response.status()}`);
});

const hash = () => new URL(page.url()).hash;
const ALLOWED_ROUTE = /^#\/(biblioteca-instrumentos|instrumentos-padronizados|filtro|filtro-escalas|escalas-neuropsiquiatria|inventarios-auto|generic-scale\/[^/?]+|mchat|cars|snap|denver|sdq|scared|conners|cdi2|phqa|cssrs|crafft|cbcl|vanderbilt|brief2|abc|asq3|pedsql|gmfcs|cshq|ygtss|tea|tea-comportamentos|bateria-jadson|emdi|eaf|ecsm|ips|ecar-si|edi|eai|easi|ems|etare|eaah|pac|ahsd-tea|tde2|psc17|gad7|aq10|aq50|ballard|pdae|eusm10|vineland|vineland-completo|wisc5|bayley|leiter3|raven|wppsi|nepsy2|griffiths|masc2|rcads|tde|confias|pedicat|portage|cbcl-interativo)(\?.*)?$/;

try {
  await page.goto(`${server.origin}/#/login`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();

  // Cai direto no catálogo de escalas, não na home clínica.
  await page.waitForFunction(() => location.hash.startsWith("#/biblioteca-instrumentos"), null, { timeout: 20000 });
  await page.locator("main, [role='main']").first().waitFor({ timeout: 20000 });
  // A tela de login sai de cena com a transição de rota; só então os links valem.
  await page.locator('[data-testid="login-form"]').waitFor({ state: "detached", timeout: 15000 });

  // Todo link de navegação oferecido (menu lateral, dock, conteúdo) é de escala.
  await page.waitForFunction(() => document.querySelectorAll("a[href='/biblioteca-instrumentos'], a[href='#/biblioteca-instrumentos']").length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(500);
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((href) => href && !href.startsWith("#main-content"))
      .map((href) => (href.startsWith("#") ? href : `#${href}`)));
  assert.ok(links.length > 0, "o catálogo precisa oferecer links");
  const foreign = links.filter((href) => !ALLOWED_ROUTE.test(href) && !/^#\/(login|sessao-expirada)$/.test(href));
  assert.deepEqual(foreign, [], `links fora das escalas visíveis ao visitante: ${foreign.join(", ")}`);

  // Rotas fora das escalas voltam ao catálogo (clínicas, conta e páginas públicas).
  for (const target of ["/pacientes", "/", "/configuracoes", "/documentos", "/receita-c1", "/agenda", "/familia", "/planos", "/onboarding", "/prontuario"]) {
    await page.evaluate((route) => { location.hash = `#${route}`; }, target);
    await page.waitForFunction(() => location.hash.startsWith("#/biblioteca-instrumentos"), null, { timeout: 15000 });
  }

  // Uma escala continua abrindo normalmente.
  await page.evaluate(() => { location.hash = "#/mchat"; });
  await page.waitForTimeout(1200);
  // /mchat é redirecionamento legado para a superfície canônica /generic-scale/:id.
  assert.ok(ALLOWED_ROUTE.test(hash()) && !hash().startsWith("#/biblioteca-instrumentos"),
    `escala permitida não pode ser devolvida ao catálogo (hash=${hash()})`);
  assert.equal(await page.getByRole("alert").filter({ hasText: "Acesso não autorizado" }).count(), 0);

  // O visitante não dispara chamadas que o servidor recusaria.
  assert.deepEqual(denied, [], `chamadas recusadas pelo servidor: ${denied.join(", ")}`);
  const forbiddenCalls = apiCalls.filter((c) => /\/api\/(tenants|me\/|patients|live|billing|consents|documents)/.test(c));
  assert.deepEqual(forbiddenCalls, [], `chamadas de clínica/perfil feitas pelo visitante: ${forbiddenCalls.join(", ")}`);
  assert.deepEqual(pageErrors, [], `erros de página: ${pageErrors.join(" | ")}`);

  console.log("✓ visitante (build real): login cai nas escalas, só links de escala, rotas fora voltam ao catálogo, nenhuma chamada recusada");
} finally {
  await browser.close();
  await server.close?.();
}
