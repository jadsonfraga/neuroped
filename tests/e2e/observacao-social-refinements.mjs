/** Navegador real; autenticação de teste e WebM preto sintético, sem dado clínico. */
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  auditBrowserLaunchOptions,
  ensureClientBuild,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const videoFile = fileURLToPath(new URL("../fixtures/observacao-video-sintetico.webm", import.meta.url));
const server = await startStaticServer(ensureClientBuild(process.cwd(), "authenticated"), {
  port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }),
});
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions({ args: ["--no-zygote", "--single-process"] }));
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true });
  await ctx.addInitScript((storage) => {
    for (const [key, val] of Object.entries(storage)) localStorage.setItem(key, val);
    const revoked = [];
    Object.defineProperty(window, "__revokedObservationUrls", { value: revoked });
    const original = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url) => { revoked.push(url); original(url); };
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await ctx.newPage();
  await page.goto(server.origin + "/#/testes-diretos");
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  const button = (name) => page.getByRole("button", { name, exact: true });
  await button("Observação social").click();
  const step = page.getByRole("group", { name: "Trilha da sessão" }).locator('[aria-current="step"]');
  assert.match(await step.textContent(), /Escolher/);
  const age = page.getByRole("combobox", { name: "Idade na data da observação" });
  await page.setViewportSize({ width: 390, height: 844 });
  await age.selectOption({ label: "8 anos" });
  assert.equal(await button("Mostrar cartão de chegada").count(), 0);
  assert.equal(await page.getByRole("group", { name: "Trilha da sessão" }).getByRole("listitem").count(), 1);
  await page.locator("summary").filter({ hasText: /^Acolhimento opcional$/ }).tap();
  await page.getByRole("button", { name: "Mostrar cartão de chegada" }).tap();
  const welcome = page.getByRole("dialog", { name: "Estação de chegada" });
  await welcome.waitFor();
  const bounds = await welcome.boundingBox();
  assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390, "acolhimento cabe na tela estreita");
  await welcome.getByRole("button", { name: "Fechar acolhimento" }).tap();
  await welcome.waitFor({ state: "hidden" });
  assert.match(await step.textContent(), /Escolher/);
  assert.equal(await age.isDisabled(), false);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.getByRole("button", { name: /Dica para o colega/ }).click();
  assert.match(await step.textContent(), /Preparar/);
  const teaching = page.getByTestId("exam-teaching-aid");
  assert.equal(await teaching.getByRole("img").count(), 0);
  await teaching.locator("summary").click();
  await teaching.getByText(/Pediu mais uma opção/).waitFor();
  await button("Apresentar no tablet").click();
  const stimulus = page.getByRole("dialog");
  await stimulus.waitFor();
  assert.equal(await stimulus.getByText(/Trilha da sessão|Revisar|Exemplo fictício/).count(), 0);
  await page.keyboard.press("Escape");
  await stimulus.waitFor({ state: "hidden" });
  await page.getByRole("heading", { name: "Registrar o que aconteceu" }).waitFor();
  assert.match(await step.textContent(), /Registrar/);
  assert.equal(await page.locator("#social-record input:checked").count(), 0);
  await button("Voltar às atividades").click();
  await age.selectOption({ label: "12–17 meses" });
  assert.equal(await button("Mostrar cartão de chegada").count(), 0);
  await page.getByRole("button", { name: /Cesto de figuras/ }).click();
  assert.equal(await button("Apresentar no tablet").count(), 0);
  assert.equal(await page.getByRole("list", { name: "Prévia dos cartões" }).count(), 0);
  await button("Registrar sem usar a tela").click();
  assert.equal(await button("Reapresentar situação").count(), 0);
  await page.getByText("Somente para revisão do profissional", { exact: true }).waitFor();
  const toggle = page.locator("summary").filter({ hasText: "Revisar vídeo local" });
  const clip = page.locator("#social-record video");
  const loadClip = async () => {
    await page.getByLabel("Selecionar vídeo").setInputFiles(videoFile);
    await clip.waitFor({ state: "visible" });
    const url = await clip.getAttribute("src");
    assert.match(url, /^blob:/);
    return url;
  };
  const waitRevocation = async (url) =>
    page.waitForFunction((value) => window.__revokedObservationUrls.includes(value), url, { timeout: 3500 });
  const note = page.getByRole("textbox", { name: "O que se vê ou ouve no vídeo?" });
  await toggle.click();
  const first = await loadClip();
  await note.fill("Observação exclusivamente sintética");
  await toggle.click();
  await waitRevocation(first);
  await clip.waitFor({ state: "detached", timeout: 3500 });
  await toggle.click();
  assert.equal(await note.inputValue(), "Observação exclusivamente sintética");
  const second = await loadClip();
  const third = await loadClip();
  assert.notEqual(second, third);
  await waitRevocation(second);
  await button("Sonda 10").click();
  await waitRevocation(third);
  await button("Observação social").click();
  assert.equal(await clip.count(), 0);
  await toggle.click();
  assert.equal(await note.inputValue(), "Observação exclusivamente sintética");
  await button("Voltar às atividades").click();
  assert.equal(await page.getByRole("region", { name: "Acolhimento opcional" }).count(), 0);
  await page.getByRole("button", { name: /Cesto de figuras/ }).click();
  assert.equal(await button("Oportunidade insuficiente").count(), 0, "atalho não sobrescreve atividade que já tem anotação");
  await button("Voltar às atividades").click();
  await page.getByRole("button", { name: /Ritmos em dupla/ }).click();
  await button("Oportunidade insuficiente").click();
  assert.equal(await page.getByRole("radio", { name: "Oportunidade insuficiente" }).isChecked(), true);
  assert.equal(await page.getByRole("textbox", { name: "O que você observou presencialmente?" }).inputValue(), "");
  await button("Voltar às atividades").click();
  await page.getByRole("button", { name: /Dois caminhos/ }).click();
  await button("Participante preferiu parar").click();
  await page.getByRole("button", { name: /Revisar sessão \(3 registros\)/ }).click();
  assert.match(await step.textContent(), /Revisar/);
  const review = page.getByText(/Observação em vídeo: Observação exclusivamente sintética/);
  await review.waitFor();
  await page.getByText(/Oportunidade insuficiente/).waitFor();
  await page.getByText(/Participante preferiu parar/).waitFor();
  assert.equal(await page.getByText(/Observação direta:/).count(), 0);
  console.log("Observação Social: Chromium tablet, Blob revogado ao recolher/substituir/alternar, nota preservada e registro explícito sem simular resposta.");
} finally {
  await browser?.close();
  await server.close();
}
