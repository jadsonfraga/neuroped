/**
 * PANT renderer E2E: authenticates with a synthetic account, inserts an
 * explicit table, blocks unfinished cells, renders a draft, then releases a
 * definitive PDF after the in-product medical review confirmation.
 * Uses synthetic text only and performs no clinical writes.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  auditBrowserLaunchOptions,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../../scripts/lib/synthetic-clinical-api.mjs";

// Traço sintético de teste (não é a assinatura real).
const SYNTHETIC_SIGNATURE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAPAAAAAoCAYAAADAOHfQAAABKUlEQVR42u3aQQrCMBBA0QY8gmvP6RE8p2vvoNsiYoumYSbz/kYQdJGZRyO4LJIkSZIkSZIkSVLtzpfrc/0qZe9UCe6n9x73W7MGylqrhHYrmBVxj7/tZQMXZMXe3RKA98B9P4hfPiONftBMC7gXQJAV+VY4HeAjwcGsqFhTA957ML1wgaxoWFMCjgAJZlD//Y6j9qOBC7JyYA0POBMQmGGNMGMYQIY1AdSQgGdbfphhnR5whSUHGdbpAFddaphhTQ3YAjsHWJMBtqzOB9aEgC2m84I1GeDRf3GEGVZ1AOxpC3IvqHZlIGBwa2OGNSFgaGtChjU5YHDrYPZ7tRhgA8sLGdZCV+j1sA0uL2ZYCwM2xBqQzXlCwJoTM6xS8eu1JEmSJEmSJG32AioYHtEweQA9AAAAAElFTkSuQmCC";
const pdfImageCount = (bytes) => (bytes.toString("latin1").match(/\/Subtype \/Image/g) || []).length;
const artifactDir = process.env.PANT_RENDERIZADOR_ARTIFACT_DIR || "/tmp/pant-renderizador-e2e";
await mkdir(artifactDir, { recursive: true });
const server = await startStaticServer("dist/public", {
  port: 0,
  apiHandler: createSyntheticClinicalApi({ patients: "empty" }),
});
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ acceptDownloads: true, reducedMotion: "reduce" });
const page = await context.newPage();
const errors = [];
const clinicalWrites = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
      /\/api\//.test(request.url()) && !/\/api\/auth\//.test(request.url())) {
    clinicalWrites.push(request.method() + " " + new URL(request.url()).pathname);
  }
});

async function downloadedBytes(button) {
  const pending = page.waitForEvent("download");
  await button.click();
  const download = await pending;
  assert.ok(download.suggestedFilename().toLowerCase().endsWith(".pdf"));
  return { name: download.suggestedFilename(), bytes: await readFile(await download.path()) };
}
function pdfPages(bytes) {
  return (bytes.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
}

try {
  await page.goto(server.origin + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate((storage) => {
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  await page.goto(server.origin + "/#/renderizador", { waitUntil: "domcontentloaded" });
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await page.getByRole("heading", { name: "Renderizador" }).waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Colar ou editar texto" }).click();

  // Texto colado sem nenhum "#": deve gerar a prévia com estrutura automática.
  const plainEditor = page.getByLabel("Markdown do laudo");
  await plainEditor.fill([
    "DOCUMENTO DEMONSTRATIVO",
    "Texto sintético de demonstração colado sem marcação, apenas para teste do fluxo.",
    "Intervenção\tFrequência",
    "Exemplo\t1 h/semana",
  ].join("\n"));
  await page.locator('input[placeholder="Nome completo"]').fill("Paciente Demonstrativo");
  await page.getByRole("button", { name: "Gerar prévia PDF" }).click();
  await page.locator('iframe[title="Prévia integral do PDF"]').waitFor({ timeout: 20000 });
  await page.getByRole("status").filter({ hasText: "todas as palavras preservadas" }).waitFor();
  assert.equal(await page.getByRole("alert").count(), 0, "texto sem # não pode ser bloqueado");
  await page.getByText("Ver os 1 títulos usados no PDF").click();
  assert.equal(await page.locator(".structure-titles li").first().textContent(), "DOCUMENTO DEMONSTRATIVO",
    "a tela mostra as linhas que viraram título");

  // Prescrição em prosa é bloqueada; o quadro de terapias preenchido libera o PDF.
  const prescriptionEditor = page.getByLabel("Markdown do laudo");
  await prescriptionEditor.fill("# Documento demonstrativo\n\n## Terapias indicadas\n\nTexto sintético de prescrição em prosa.");
  await page.getByRole("button", { name: "Gerar prévia PDF" }).click();
  await page.getByRole("alert").filter({ hasText: "A prescrição precisa estar em tabela" }).waitFor();
  assert.equal(await page.locator('iframe[title="Prévia integral do PDF"]').count(), 0, "prescrição sem tabela não chega ao PDF");
  await page.getByRole("button", { name: "Inserir quadro de terapias" }).click();
  await page.getByRole("button", { name: "Gerar prévia PDF" }).click();
  await page.getByRole("alert").filter({ hasText: "Complete manualmente" }).waitFor();
  await prescriptionEditor.fill((await prescriptionEditor.inputValue()).replaceAll("[preencher]", "Exemplo sintético"));
  await page.getByRole("button", { name: "Gerar prévia PDF" }).click();
  await page.locator('iframe[title="Prévia integral do PDF"]').waitFor({ timeout: 20000 });
  assert.equal(await page.getByRole("alert").count(), 0, "quadro preenchido libera a geração");

  const markdown = [
    "# Documento demonstrativo",
    "",
    "+++Observação de teste+++ sem conteúdo clínico real.",
    "",
    "## Plano demonstrativo",
    "",
    "==Revisar manualmente== antes da liberação.",
  ].join("\n");
  const editor = page.getByLabel("Markdown do laudo");
  await editor.fill(markdown);
  await page.locator('input[placeholder="Nome completo"]').fill("Paciente Demonstrativo");

  await page.getByRole("button", { name: "Inserir estrutura de tabela" }).click();
  await page.getByRole("button", { name: "Gerar prévia PDF" }).click();
  await page.getByRole("alert").filter({ hasText: "Complete manualmente" }).waitFor();
  assert.equal(await page.locator('iframe[title="Prévia integral do PDF"]').count(), 0,
    "células de modelo não podem chegar ao PDF");
  const completed = (await editor.inputValue())
    .replaceAll("Cabeçalho 1", "Intervenção")
    .replaceAll("Cabeçalho 2", "Frequência")
    .replaceAll("Cabeçalho 3", "Objetivo")
    .replaceAll("[preencher]", "Exemplo sintético");
  await editor.fill(completed);
  await page.getByRole("button", { name: "Gerar prévia PDF" }).click();
  await page.locator('iframe[title="Prévia integral do PDF"]').waitFor({ timeout: 20000 });
  const draft = await downloadedBytes(page.getByRole("button", { name: /Baixar PDF de rascunho/ }));
  assert.ok(draft.name.includes("RASCUNHO_NAO_LIBERADO"));
  assert.equal(draft.bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdfPages(draft.bytes) >= 2, "rascunho precisa conter capa e página de conteúdo");

  // Assinatura manuscrita sintética (traço de teste), cadastrada só neste navegador.
  await page.locator('input[type="file"][accept="image/png"]').setInputFiles({
    name: "assinatura-teste.png",
    mimeType: "image/png",
    buffer: Buffer.from(SYNTHETIC_SIGNATURE_PNG, "base64"),
  });
  await page.getByRole("img", { name: /Assinatura manuscrita cadastrada/ }).waitFor();
  assert.equal(await page.locator('iframe[title="Prévia integral do PDF"]').count(), 1, "cadastrar a assinatura não descarta o rascunho");
  assert.ok((await page.evaluate(() => localStorage.getItem("neuroped.renderizador.assinatura.v1")))?.startsWith("data:image/png;base64,"));
  await page.getByRole("checkbox", { name: /com a minha assinatura manuscrita/ }).check();
  await page.getByText("Versão definitiva liberada").waitFor({ timeout: 20000 });
  const definitive = await downloadedBytes(page.getByRole("button", { name: "Baixar PDF" }));
  assert.ok(definitive.name.startsWith("PANT_"));
  assert.equal(definitive.bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdfPages(definitive.bytes) >= 2);
  assert.notDeepEqual(definitive.bytes, draft.bytes, "o PDF liberado deve ser gerado novamente após o aceite");

  const manifestPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar manifesto SHA-256" }).click();
  const manifestDownload = await manifestPending;
  const manifest = JSON.parse(await readFile(await manifestDownload.path(), "utf8"));
  assert.equal(manifest.review_confirmed, true);
  assert.equal(manifest.handwritten_signature_applied, true, "versão definitiva registra a assinatura no manifesto");
  assert.ok(pdfImageCount(definitive.bytes) > pdfImageCount(draft.bytes), "assinatura só no PDF definitivo");
  assert.equal(manifest.release_status, "definitive_after_medical_review");
  assert.ok(manifest.medical_acceptance_at);
  assert.equal(manifest.pdf_sha256, createHash("sha256").update(definitive.bytes).digest("hex"));
  assert.deepEqual(errors, [], "sem exceções JavaScript no fluxo de geração e liberação");
  assert.deepEqual(clinicalWrites, [], "geração local não grava dados clínicos no backend");

  await writeFile(artifactDir + "/result.json", JSON.stringify({
    passed: true,
    draft: { filename: draft.name, pages: pdfPages(draft.bytes) },
    definitive: { filename: definitive.name, pages: pdfPages(definitive.bytes) },
    manifest_hash_matches_final_pdf: true,
    javascript_errors: errors,
    clinical_writes: clinicalWrites,
  }, null, 2));
  console.log("✓ PANT E2E: tabela estruturada, rascunho baixável, aceite, PDF definitivo e hash do manifesto");
} catch (error) {
  await page.screenshot({ path: artifactDir + "/failure.png", fullPage: true }).catch(() => {});
  await writeFile(artifactDir + "/failure.txt", String(error.stack || error));
  throw error;
} finally {
  await context.close();
  await browser.close();
  await server.close();
}
