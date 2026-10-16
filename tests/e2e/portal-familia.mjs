// E2E: portal da família (página pública + painel do médico). Dados fictícios; API interceptada; sem envio real.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.PORTAL_ARTIFACT_DIR || "/tmp/portal-familia";
await mkdir(dir, { recursive: true });
const PATIENT = "paciente-sintetico-alfa";
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const errors = [];
const outbound = [];

const TOKEN = `portal-sintetico-1.${"a".repeat(43)}`;
const QTOKEN = `convite-sintetico.${"b".repeat(43)}`;
const CONSENT_VERSION = "family-portal-lgpd-2026-10";
const contentFor = () => ({
  orientacoes: [{ titulo: "Como se preparar para a consulta", texto: "Leve os documentos e anote as dúvidas." }],
  lembretes: [{ tipo: "consulta", titulo: "Consulta de retorno", quando: "2026-11-10T14:00:00-03:00", texto: "Chegar 10 minutos antes." }],
  documentos: [{ documentId: "doc-1", titulo: "Relatório fictício", tipo: "report", emitidoEm: "2026-10-01T10:00:00.000Z", texto: "Texto do documento fictício liberado pelo médico." }],
  questionarios: [{ titulo: "Pré-consulta", token: QTOKEN }],
  avaliacoesProprias: [{ instrumento: "super-neuropad-game", nome: "Super NeuroPad Game", data: "2026-10-01", comoFoiFeita: "Atividade aplicada como parte da preparação para a consulta. Esta página não mostra nota, nível, classificação nem conclusão; a leitura do resultado é feita pelo médico na consulta.", comoRespondeu: "Participou com interesse e pediu uma pausa." }],
});

/** Simula o servidor: GET sem consumir, POST exige consentimento e consome. */
function installPortalApi(page, { maxViews }) {
  const state = { views: 0, gets: 0, posts: 0, auth: [] };
  return page.route(/\/api\/public-family-portal/, async (route) => {
    const req = route.request();
    state.auth.push(req.headers()["authorization"] || "");
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (req.headers()["authorization"] !== `Portal ${TOKEN}`) return json(404, { error: "Link inválido.", code: "PORTAL_INVALID" });
    if (req.method() === "GET") {
      state.gets += 1;
      if (state.views >= maxViews) return json(429, { error: "Este link atingiu o número máximo de aberturas. Peça um novo link à clínica." });
      return json(200, { clinicName: "Clínica Fictícia", expiresAt: "2099-01-01T12:00:00.000Z", remainingViews: maxViews - state.views, consent: { version: CONSENT_VERSION, notice: "Li e autorizo a abertura deste conteúdo (LGPD)." }, supportNotice: "Este espaço não faz diagnóstico e não substitui a consulta. Em emergência, ligue 192." });
    }
    state.posts += 1;
    const body = JSON.parse(req.postData() || "{}");
    if (body.consentAccepted !== true || body.consentVersion !== CONSENT_VERSION) return json(400, { error: "É necessário aceitar o consentimento.", code: "CONSENT_REQUIRED" });
    if (state.views >= maxViews) return json(429, { error: "Este link atingiu o número máximo de aberturas. Peça um novo link à clínica." });
    state.views += 1;
    return json(200, { clinicName: "Clínica Fictícia", expiresAt: "2099-01-01T12:00:00.000Z", remainingViews: maxViews - state.views, supportNotice: "Este espaço não faz diagnóstico e não substitui a consulta. Em emergência, ligue 192.", content: contentFor() });
  }).then(() => state);
}

async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1000, height: 1200 }, reducedMotion: "reduce", acceptDownloads: true, ...options });
  await context.addInitScript((st) => { try { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); } catch {} }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => { if (!r.url().startsWith(server.origin) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) outbound.push(r.url()); });
  return page;
}

try {
  // ---------- Página pública da família ----------
  const fam = await newPage();
  const open = async (hash) => { await fam.goto("about:blank"); await fam.goto(`${server.origin}/portal.html${hash}`); };
  const api = await installPortalApi(fam, { maxViews: 2 });
  await fam.goto(`${server.origin}/portal.html#token=${TOKEN}`);
  await fam.locator("#consent-card:not(.hidden)").waitFor({ timeout: 15000 });
  // token sai da barra de endereço e nada de conteúdo antes do consentimento
  assert.equal(new URL(fam.url()).hash, "", "token removido da URL");
  assert.equal(await fam.locator("#content.hidden").count(), 1);
  assert.equal(api.posts, 0, "nenhum POST antes do consentimento");
  assert.match(await fam.locator("#support-notice").innerText(), /não faz diagnóstico/);
  assert.match(await fam.locator("#views-info").innerText(), /mais 2 vez/);

  // sem marcar o consentimento: não abre
  await fam.locator("#open-button").click();
  assert.match(await fam.locator("#consent-error").innerText(), /Marque a autorização/);
  assert.equal(api.posts, 0);

  await fam.locator("#consent").check();
  await fam.locator("#open-button").click();
  await fam.locator("#content:not(.hidden)").waitFor();
  assert.equal(api.posts, 1);
  assert.equal(api.auth.every((a) => a === `Portal ${TOKEN}`), true);

  const texto = await fam.locator("#content").innerText();
  assert.match(texto, /Como se preparar para a consulta/);
  assert.match(texto, /Consulta de retorno/);
  assert.match(texto, /Relatório fictício/);
  assert.match(texto, /Texto do documento fictício/);
  assert.match(texto, /Super NeuroPad Game/);
  assert.match(texto, /Esta página não mostra nota, nível, classificação nem conclusão/);
  assert.match(texto, /Participou com interesse/);
  assert.match(texto, /Aberturas restantes deste link: 1/);
  // Regra do médico: nenhum corte/nível/classificação/escore nas avaliações próprias
  const avaliacoes = (await fam.locator("#sec-avaliacoes").innerText()).replace(/Esta página não mostra nota, nível, classificação nem conclusão/, "");
  assert.doesNotMatch(avaliacoes, /\b(risco|n[ií]vel|classifica|escore|pontos?|percentil|alerta|esperado)\b/i);
  // questionário aponta para a página segura existente
  assert.equal(await fam.locator('#list-questionarios a').getAttribute("href"), `/intake.html#token=${encodeURIComponent(QTOKEN)}`);
  // lembretes: .ics com horário correto
  const [download] = await Promise.all([fam.waitForEvent("download"), fam.locator("#ics-button").click()]);
  assert.equal(download.suggestedFilename(), "lembretes-consulta.ics");
  const ics = await (await import("node:fs/promises")).readFile(await download.path(), "utf8");
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:20261110T170000Z/);
  assert.match(ics, /SUMMARY:Consulta de retorno/);
  await fam.screenshot({ path: `${dir}/familia.png`, fullPage: true });

  // nada fica no armazenamento do navegador
  const stored = await fam.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  assert.doesNotMatch(stored, /Relatório fictício|Participou|portal-sintetico/);

  // segunda abertura consome a última; terceira é recusada (uso limitado)
  await open(`#token=${TOKEN}`);
  await fam.locator("#consent-card:not(.hidden)").waitFor();
  await fam.locator("#consent").check();
  await fam.locator("#open-button").click();
  await fam.locator("#content:not(.hidden)").waitFor();
  assert.match(await fam.locator("#content-views").innerText(), /restantes deste link: 0/);
  await open(`#token=${TOKEN}`);
  await fam.locator("#error:not(.hidden)").waitFor();
  assert.match(await fam.locator("#error-message").innerText(), /máximo de aberturas/);

  // link inválido e link sem token
  await open(`#token=${"x".repeat(5)}`);
  await fam.locator("#error:not(.hidden)").waitFor();
  await open("");
  await fam.locator("#error:not(.hidden)").waitFor();
  assert.match(await fam.locator("#error-message").innerText(), /exatamente como foi enviado/);

  // ---------- Painel do médico ----------
  const doc = await newPage({ viewport: { width: 1280, height: 1800 } });
  await doc.goto(`${server.origin}/#/paciente/${PATIENT}`);
  await doc.waitForLoadState("networkidle");
  const login = doc.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await doc.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await doc.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await doc.getByTestId("family-portal-panel").waitFor({ timeout: 25000 });
  const created = [];
  await doc.route(/\/api\/live\/family-portal(\?|$)/, async (route) => {
    const req = route.request();
    if (req.method() === "POST") {
      created.push(JSON.parse(req.postData() || "{}"));
      const body = created.at(-1);
      if (JSON.stringify(body.content).match(/TDAH/)) return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "Orientação: o texto contém \"tdah\"." }) });
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "portal-sintetico-1", token: TOKEN, expiresAt: "2026-11-01T15:00:00.000Z", maxViews: body.maxViews }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "s-old", status: "active", expiresAt: "2099-01-01T00:00:00.000Z", maxViews: 3, viewCount: 1, consentedAt: "2026-10-10T12:00:00.000Z", createdAt: "2026-10-10T11:00:00.000Z" }] }) });
  });
  await doc.reload();
  await doc.getByTestId("family-portal-panel").waitFor();
  await doc.getByTestId("portal-historico").getByText(/1\/3 aberturas/).waitFor();

  // botão bloqueado até revisar
  assert.equal(await doc.getByTestId("portal-gerar").isDisabled(), true);
  await doc.getByTestId("portal-modelo-preparar-consulta").check();
  await doc.getByTestId("portal-lem-titulo").fill("Consulta de retorno");
  await doc.getByTestId("portal-lem-quando").fill("2026-11-10T14:00");
  await doc.getByTestId("portal-lem-add").click();
  await doc.getByTestId("portal-q-token").fill(QTOKEN);
  await doc.getByTestId("portal-q-add").click();
  await doc.getByTestId("portal-av-data").fill("2026-10-01");
  await doc.getByTestId("portal-av-texto").fill("Participou com interesse.");
  await doc.getByTestId("portal-av-add").click();
  await doc.getByTestId("portal-aberturas").fill("1");
  await doc.getByTestId("portal-revisado").check();
  await doc.getByTestId("portal-gerar").click();
  await doc.getByTestId("portal-rascunho").waitFor();
  const msg = await doc.getByTestId("portal-mensagem").inputValue();
  assert.match(msg, /portal\.html#token=portal-sintetico-1/);
  assert.match(msg, /até 1 vez/);
  assert.match(msg, /LGPD/);
  assert.match(await doc.getByTestId("portal-rascunho").innerText(), /nada foi enviado/i);
  const payload = created.at(-1);
  assert.equal(payload.doctorReviewed, true);
  assert.equal(payload.maxViews, 1);
  assert.equal(payload.content.lembretes.length, 1);
  assert.equal(payload.content.questionarios[0].token, QTOKEN);
  assert.deepEqual(Object.keys(payload.content.avaliacoesProprias[0]).sort(), ["comoRespondeu", "data", "instrumento"]);
  await doc.screenshot({ path: `${dir}/medico.png`, fullPage: true });

  // erro do servidor (diagnóstico) aparece para o médico
  await doc.getByTestId("portal-orient-titulo").fill("TDAH");
  await doc.getByTestId("portal-orient-texto").fill("x");
  await doc.getByTestId("portal-gerar").click();
  await doc.getByTestId("portal-erro").waitFor();
  assert.match(await doc.getByTestId("portal-erro").innerText(), /tdah/i);

  assert.deepEqual(outbound, [], "nenhuma chamada externa");
  assert.deepEqual(errors, [], "sem erros de página");
  console.log("e2e portal-familia: OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.close?.();
}
