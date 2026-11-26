/** Route and role regression in Chromium; this guide must not write clinical data. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const realUrl = process.env.NEUROPED_ASSISTANT_D1_URL;
const local = realUrl ? new URL(realUrl) : null;
if (local) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(local.hostname));
const dist = local ? null : ensureClientBuild(process.cwd(), "authenticated");
const GUIDE = "/exame-via-assistente";
const MEDICAL = "/exame-neurologico-mental";
const path = (origin, hash) => origin + "/#" + hash;
const browser = await chromium.launch(auditBrowserLaunchOptions());
const servers = [];
const operatorEmail = process.env.NEUROPED_ASSISTANT_OPERATOR_EMAIL;
const professionalEmail = process.env.NEUROPED_ASSISTANT_PROFESSIONAL_EMAIL;
const realPassword = process.env.NEUROPED_ASSISTANT_PASSWORD;
if (local) {
  assert.ok(operatorEmail?.endsWith("@example.test") && professionalEmail?.endsWith("@example.test") && realPassword,
    "use somente credenciais sintéticas");
}

async function scenario(userRole) {
  const server = local ? { origin: local.origin } : await startStaticServer(dist, {
    port: 0, apiHandler: createSyntheticClinicalApi({
      patients: "empty", userRole, primaryRole: userRole === "operator" ? "assistant" : "owner",
    }),
  });
  if (!local) servers.push(server);
  const context = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true, serviceWorkers: "block" });
  await context.addInitScript(storage => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.route("**/*", route => route.request().url().startsWith(server.origin + "/") ? route.continue() : route.abort());
  return { context, page, origin: server.origin };
}

async function signIn(page, origin, role, target) {
  await page.goto(origin + "/?next=" + encodeURIComponent(target) + "#/login");
  const credential = local
    ? { email: role === "operator" ? operatorEmail : professionalEmail, password: realPassword }
    : SYNTHETIC_CREDENTIALS;
  await page.locator("#login-email").fill(credential.email);
  await page.locator("#login-password").fill(credential.password);
  const auth = page.waitForResponse(response => new URL(response.url()).pathname === "/api/auth/login" && response.request().method() === "POST");
  await page.getByTestId("login-form").locator("button[type=submit]").click();
  assert.equal((await auth).status(), 200);
  await page.waitForURL(url => url.hash === "#" + target);
}

try {
  const anon = await scenario("operator");
  for (const target of [GUIDE, MEDICAL, "/prontuario"]) {
    await anon.page.goto(path(anon.origin, target));
    await anon.page.waitForURL(url => url.hash.startsWith("#/login"));
    assert.equal(await anon.page.getByTestId("assistant-exam-guide").count(), 0);
    assert.equal(await anon.page.getByText("Abrir ficha médica completa", { exact: true }).count(), 0);
  }
  await anon.context.close();

  const { context, page, origin } = await scenario("operator");
  await signIn(page, origin, "operator", "/recepcao");
  const button = name => page.getByRole("button", { name, exact: true });
  const writes = [];
  const clinicalReads = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(url.pathname);
    if (/^\/api\/(?:live\/|clinical-core\/|patients(?:\/|$)|prontuario)/.test(url.pathname)) clinicalReads.push(url.pathname);
  });
  await page.getByTestId("assistant-exam-reception-link").click();
  const guide = page.getByTestId("assistant-exam-guide");
  await guide.getByRole("heading", { name: "Exame via assistente", exact: true }).waitFor();
  const age = guide.getByLabel("Faixa etária", { exact: true });
  assert.equal(await age.locator("option").count(), 18, "17 faixas e opção vazia");
  await age.selectOption({ label: "Nascimento a 27 dias" });
  assert.equal(await guide.getByRole("button", { name: "Mostrar cartão de chegada" }).count(), 0);
  await guide.getByText(/sem apresentar uma tela/).waitFor();
  await guide.getByText("Rosto conhecido", { exact: true }).click();
  assert.equal(await button("Mostrar convite na tela").count(), 0);
  assert.equal(await button("Abrir recurso da atividade").count(), 0);
  await age.selectOption({ label: "12 a 14 meses" });
  await guide.getByText("Conferir materiais das atividades guiadas", { exact: true }).click();
  await guide.getByRole("checkbox", { name: /cesto ou pote grande/i }).check();
  assert.equal(await age.isDisabled(), false, "preparo não é anotação");
  await age.selectOption({ label: "3 anos" });
  const welcome = button("Mostrar cartão de chegada");
  assert.equal(await welcome.count(), 0, "o cartão é opcional e começa recolhido");
  await guide.locator("summary").filter({ hasText: /^Acolhimento opcional$/ }).press("Enter");
  await welcome.press("Enter");
  const arrival = page.getByRole("dialog", { name: "Cantinho de chegada" });
  await arrival.waitFor();
  assert.equal(await arrival.locator("input,textarea,video,audio").count(), 0);
  await page.keyboard.press("Escape");
  await arrival.waitFor({ state: "hidden" });
  assert.equal(await welcome.evaluate(el => document.activeElement === el), true);
  assert.equal(await age.isDisabled(), false);
  assert.match(await guide.locator("#assistant-exam-review + p").textContent(), /Nenhuma observação/);
  await guide.locator("summary").filter({ hasText: "Copiar um risco" }).click();
  assert.equal(await guide.getByRole("heading", { name: "3. Registre" }).count(), 1);
  const teaching = guide.getByTestId("exam-teaching-aid").filter({ visible: true });
  assert.equal(await teaching.getByRole("img").count(), 0, "material de equipe não abre por padrão");
  await teaching.locator("summary").press("Enter");
  await teaching.getByRole("img", { name: "Uma folha e um giz grosso sobre uma mesa" }).waitFor();
  await teaching.getByText(/Fez uma marca com giz/).waitFor();
  assert.equal(await guide.getByLabel("O que aconteceu · Copiar um risco", { exact: true }).inputValue(), "");
  await teaching.locator("summary").press("Enter");
  assert.equal(await button("Abrir recurso da atividade").count(), 0, "somente o preparo essencial abre no cartão");
  await guide.getByText("Materiais e recurso desta atividade", { exact: true }).filter({ visible: true }).click();
  await guide.getByText("Acrescentar proposta e apoio", { exact: true }).filter({ visible: true }).click();
  const contextNote = guide.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Copiar um risco" }) }).locator("textarea").last();
  await contextNote.fill("Contexto fictício antes da classificação");
  const assistantMissingWithNote = await button("Registrar falta de material").isVisible();
  await contextNote.clear();
  await button("Registrar falta de material").click();
  assert.match(await guide.getByRole("list", { name: "Observações temporárias" }).innerText(), /Não aplicado: faltou material/);
  assert.equal(await guide.getByLabel("O que aconteceu · Copiar um risco", { exact: true }).isDisabled(), true);
  await button("Retirar marcação").click();
  assert.equal(await age.isDisabled(), false);
  await button("Abrir recurso da atividade").press("Enter");
  const kit = page.getByRole("dialog", { name: "Modelo de um traço" });
  await kit.getByRole("img", { name: "Traço reto" }).waitFor();
  const board = kit.getByTestId("exam-drawing-board");
  const box = await board.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + 15, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 62, { steps: 5 });
  await page.mouse.up();
  assert.equal(await board.locator("path").count(), 1);
  await page.keyboard.press("Escape");
  await kit.waitFor({ state: "hidden" });
  await button("Abrir recurso da atividade").press("Enter");
  assert.equal(await board.locator("path").count(), 0, "prancha não reaparece");
  await kit.getByRole("button", { name: "Fechar recurso", exact: true }).click();
  await button("Mostrar convite na tela").press("Enter");
  const dialog = page.getByRole("dialog", { name: "Copiar um risco" });
  await dialog.waitFor();
  assert.equal(await dialog.getByTestId("exam-teaching-aid").count(), 0);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  const trail = guide.getByRole("navigation", { name: "Trilha da sessão" });
  await trail.getByRole("button", { name: "Revisar", exact: true }).press("Enter");
  assert.equal(await page.locator(":focus").textContent(), "Revisar e encerrar");
  assert.match(await guide.locator("#assistant-exam-review + p").textContent(), /Nenhuma observação/);
  await trail.getByRole("button", { name: "Atividades", exact: true }).press("Enter");
  assert.equal(await page.locator(":focus").getAttribute("id"), "assistant-exam-activities");
  const sentinel = "Registro fictício do ensaio isolado 82715";
  const note = guide.getByLabel("O que aconteceu · Copiar um risco", { exact: true });
  await note.fill(sentinel);
  await guide.getByRole("button", { name: "Preferiu parar", exact: true }).click();
  assert.match(await guide.getByRole("list", { name: "Observações temporárias" }).innerText(), /Preferiu parar/);
  assert.equal(await note.inputValue(), sentinel, "marcar a recusa não substitui o que foi observado");
  assert.equal(await welcome.count(), 0);
  await trail.getByRole("button", { name: "Revisar", exact: true }).press("Enter");
  assert.equal(await note.inputValue(), sentinel, "navegação não apaga o registro");
  assert.match(await guide.getByRole("list", { name: "Observações temporárias" }).innerText(), /Observação direta: Registro fictício/);
  assert.equal(await age.isDisabled(), true);
  await guide.getByText(/Você pode abrir outra atividade desta faixa/).waitFor();
  await guide.locator("summary").filter({ hasText: "Passeio do boneco" }).click();
  assert.equal(await note.inputValue(), sentinel, "a segunda atividade mantém a nota da primeira");
  assert.equal(await page.getByText("Abrir ficha médica completa", { exact: true }).count(), 0);
  const persisted = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]));
  assert.ok(!persisted.includes(sentinel));
  assert.deepEqual(writes, []);
  assert.deepEqual(clinicalReads, []);

  page.once("dialog", event => event.dismiss());
  await button("Encerrar e limpar").click();
  assert.equal(await age.isDisabled(), true, "cancelar limpeza preserva rascunho");
  page.once("dialog", event => event.accept());
  await button("Encerrar e limpar").click();
  assert.equal(await age.inputValue(), "");
  await age.selectOption({ label: "3 anos" });
  await guide.locator("summary").filter({ hasText: "Copiar um risco" }).click();
  assert.equal(await note.inputValue(), "");
  await note.fill(sentinel);
  await page.reload();
  await guide.getByRole("heading", { name: "Exame via assistente", exact: true }).waitFor();
  assert.equal(await age.inputValue(), "");
  assert.equal(await guide.getByText(sentinel, { exact: true }).count(), 0);
  await guide.getByRole("link", { name: "Abrir Observação Social", exact: true }).click();
  await page.getByRole("heading", { name: "Escolher atividade" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Observação social", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("combobox", { name: "Idade na data da observação" }).selectOption({ label: "18–23 meses" });
  await page.getByRole("button", { name: /Janela do quintal/ }).click();
  assert.equal(await button("Apresentar no tablet").count(), 0);
  await button("Registrar sem usar a tela").click();
  assert.equal(await page.getByText("Somente para revisão do profissional", { exact: true }).count(), 0);
  await page.getByRole("textbox", { name: "O que você observou presencialmente?" }).fill("Observação objetiva sintética");
  await page.getByRole("button", { name: /^Revisar sessão/ }).click();
  await page.getByText(/Observação direta: Observação objetiva sintética/).waitFor();
  for (const target of [MEDICAL, "/prontuario"]) {
    await page.goto(path(origin, target));
    await page.getByRole("heading", { name: "Acesso não autorizado" }).waitFor();
    assert.equal(await page.getByText("Abrir ficha médica completa", { exact: true }).count(), 0);
  }
  await context.close();

  const professional = await scenario("professional");
  await signIn(professional.page, professional.origin, "professional", GUIDE);
  await professional.page.getByTestId("assistant-exam-guide").waitFor();
  await professional.page.goto(path(professional.origin, MEDICAL));
  await professional.page.getByRole("heading", { name: "Exame neurológico e mental", exact: true }).waitFor();
  const medicalAge = professional.page.getByLabel("Faixa etária", { exact: true });
  await medicalAge.selectOption({ label: "12 a 14 anos" });
  await professional.page.locator("summary").filter({ hasText: /^Acolhimento opcional$/ }).click();
  await professional.page.getByRole("button", { name: "Mostrar cartão de chegada" }).click();
  const adolescent = professional.page.getByRole("dialog", { name: "Antes de começar" });
  await adolescent.waitFor();
  await adolescent.getByRole("button", { name: "Fechar acolhimento" }).click();
  await adolescent.waitFor({ state: "hidden" });
  assert.equal(await medicalAge.isDisabled(), false);
  await medicalAge.selectOption({ label: "3 anos" });
  const medicalTrail = professional.page.getByRole("navigation", { name: "Trilha da sessão" });
  await medicalTrail.getByRole("button", { name: "Revisar", exact: true }).press("Enter");
  assert.equal(await professional.page.locator(":focus").getAttribute("id"), "exam-review");
  assert.equal(await professional.page.getByRole("list", { name: "Registros do exame" }).count(), 0);
  await professional.page.getByText("Abrir ficha médica completa", { exact: true }).click();
  const medicalAid = professional.page.getByTestId("exam-teaching-aid").filter({ visible: true });
  await medicalAid.locator("summary").click();
  await medicalAid.getByRole("img").waitFor();
  await medicalAid.getByText(/Repetiu o traço após rever o modelo/).waitFor();
  assert.equal(await professional.page.getByRole("list", { name: "Registros do exame" }).count(), 0);
  await medicalAid.locator("summary").click();
  await professional.page.getByText("Conferir materiais da ficha médica", { exact: true }).click();
  await professional.page.getByRole("checkbox", { name: "Martelo de reflexos" }).waitFor();
  const medical = professional.page.getByRole("list", { name: "Materiais · Olhos, face e comunicação" });
  await medical.getByText("Copo grande e leve", { exact: true }).waitFor();
  const firstMedical = professional.page.locator("details").filter({ has: medical }).last();
  const medicalMissing = firstMedical.getByRole("button", { name: "Registrar falta de material", exact: true });
  const medicalNote = firstMedical.locator("textarea");
  await medicalNote.fill("Observação fictícia sem classificação");
  const medicalMissingWithNote = await medicalMissing.isVisible();
  await medicalNote.clear();
  await firstMedical.getByRole("button", { name: "Registrar falta de material", exact: true }).click();
  assert.match(await professional.page.getByRole("list", { name: "Registros do exame" }).innerText(), /Não aplicado por falta de material/);
  const medicalResource = firstMedical.getByRole("button", { name: "Abrir recurso da atividade", exact: true });
  assert.equal(await medicalResource.count(), 0, "o recurso não abre com item marcado como não aplicado");
  await firstMedical.getByLabel("Como foi avaliado · Olhos, face e comunicação", { exact: true }).selectOption("");
  await medicalResource.click();
  const staticTarget = professional.page.getByRole("dialog", { name: "Alvo visual estático, sem brilho" });
  await staticTarget.getByRole("img", { name: "Bola" }).waitFor();
  await staticTarget.getByRole("button", { name: "Fechar recurso", exact: true }).click();
  await professional.context.close();
  assert.deepEqual({ assistantMissingWithNote, medicalMissingWithNote },
    { assistantMissingWithNote: false, medicalMissingWithNote: false },
    "O atalho não deve reclassificar um item com anotação preexistente");
  console.log("Exame via assistente: Chromium tablet, anônimo bloqueado, operador só no guia, profissional preservado, dados voláteis e cartões sem escrita clínica.");
} finally {
  await browser.close();
  for (const server of servers) await server.close();
}
