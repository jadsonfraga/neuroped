import { testCard } from "../fixtures/owner-pdf-test-card.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import { buildDocumentPdf, type DocSpec } from "../../client/src/lib/documentPdf";

function lastPageResourceCount(doc: PDFDocument): number {
  const last = doc.getPages().at(-1)!;
  return last.node.Resources()?.lookupMaybe(PDFName.of("XObject"), PDFDict)?.keys().length ?? 0;
}

test("o gerador compartilhado carimba o rodapé da última página e falha fechado se a imagem faltar", async () => {
  const envFetch = globalThis.fetch;
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const storage = new Map([["neuroped:access", "synthetic-token"], ["neuroped:active-clinic-id", "synthetic-clinic"]]);
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (k: string) => storage.get(k) } });
  let asset = testCard("jpeg");
  let media = "image/jpeg";
  const spec: DocSpec = { title: "Laudo fictício", brand: null, validationUrl: "https://example.test/check",
    credentials: ["Titular fictício"],
    sections: [{ heading: "Nota fictícia", body: Array.from({length: 450}, () => "Linha de teste").join("\n") }],
    footer: "Rodapé fictício.", };
  let code = 200;
  let calls = 0;
  globalThis.fetch = async (request, params) => {
    calls++;
    assert.equal(request, "/api/me/pdf-facsimile");
    const headers = new Headers(params?.headers);
    assert.equal(headers.get("Authorization"), "Bearer synthetic-token");
    assert.equal(headers.get("X-Tenant-Id"), "synthetic-clinic");
    return new Response(code === 200 ? new Uint8Array(asset) : null, { status: code, headers: { "content-type": media } });
  };
  try {
    const withStamp = await PDFDocument.load(await buildDocumentPdf(spec));
    assert.ok(withStamp.getPageCount() > 1);
    assert.equal(lastPageResourceCount(withStamp), 2, "QR e fac-símile coexistem no rodapé");
    asset = testCard();
    media = "image/png";
    const withTransparentStamp = await PDFDocument.load(await buildDocumentPdf(spec));
    assert.equal(lastPageResourceCount(withTransparentStamp), 2, "PNG e QR coexistem");
    code = 204;
    const withoutStamp = await PDFDocument.load(await buildDocumentPdf(spec));
    assert.equal(lastPageResourceCount(withoutStamp), 1);
    code = 503;
    await assert.rejects(() => buildDocumentPdf(spec), /imagem manuscrita/);
    const notOptedIn = await PDFDocument.load(await buildDocumentPdf({ ...spec, includeOwnerFacsimile: false }));
    assert.equal(lastPageResourceCount(notOptedIn), 1);
    assert.equal(calls, 4);
  } finally {
    globalThis.fetch = envFetch;
    if (originalDescriptor) Object.defineProperty(globalThis, "sessionStorage", originalDescriptor);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("impressão inclui fac-símile sem afirmar assinatura digital e rejeita HTML arbitrário", async () => {
  const { ownerFacsimilePrintMarkup } = await import("../../client/src/lib/ownerPdfFacsimile");
  const template = await import("../../client/src/lib/laudo/pantPrintTemplate");
  const image = "data:image/jpeg;base64," + testCard("jpeg").toString("base64");
  const spec = { texto: "Laudo fictício", paciente: "Paciente fictício", medico: { nome: "Titular fictício" },
    assetBase: "https://example.test/", protocoloPadrao: "teste", emitidoEm: "25 novembro 2026" };
  assert.equal(ownerFacsimilePrintMarkup(null), "");
  assert.throws(() => ownerFacsimilePrintMarkup('data:image/jpeg;base64,a" onerror="alert(1)'), /inválida/);
  const unsigned = template.buildLaudoPantPrintHtml(spec as Parameters<typeof template.buildLaudoPantPrintHtml>[0]);
  assert.ok(!unsigned.includes("data-owner-facsimile"));
  const printed = template.buildLaudoPantPrintHtml({ ...spec, facsimile: image } as Parameters<typeof template.buildLaudoPantPrintHtml>[0]);
  assert.equal(printed.split("data-owner-facsimile").length, 2);
  assert.match(printed, /Imagem manuscrita · não é assinatura digital/);
});

test("a imagem em trânsito é descartada ao trocar clínica ou sessão", async () => {
  const { loadOwnerPdfFacsimile } = await import("../../client/src/lib/ownerPdfFacsimile");
  const { clearAuth } = await import("../../client/src/lib/authClient");
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const originalFetch = globalThis.fetch;
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
    getItem: (k: string) => storage.get(k), removeItem: (k: string) => storage.delete(k),
  } });
  const image = testCard("jpeg");
  try {
    for (const switchScope of [
      () => storage.set("neuroped:active-clinic-id", "other-clinic"),
      () => { clearAuth(); storage.set("neuroped:access", "synthetic-operator"); },
    ]) {
      storage.set("neuroped:access", "synthetic-owner");
      storage.set("neuroped:active-clinic-id", "synthetic-clinic");
      let finish!: (r: Response) => void;
      globalThis.fetch = () => new Promise<Response>(resolve => { finish = resolve; });
      const attempt = loadOwnerPdfFacsimile();
      switchScope();
      finish(new Response(new Uint8Array(image), { headers: { "content-type": "image/jpeg" } }));
      await assert.rejects(attempt, /sessão ou a clínica mudou/);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("recepção, leitura e visitante podem exportar sem solicitar o PNG do titular", async () => {
  const { loadOwnerPdfFacsimile } = await import("../../client/src/lib/ownerPdfFacsimile");
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const originalFetch = globalThis.fetch;
  let role = "operator";
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (name: string) =>
    name === "neuroped:user" ? JSON.stringify({ role }) : name === "neuroped:access" ? "fixture" : "" } });
  globalThis.fetch = async () => { throw new Error("o perfil não deve consultar a imagem do titular"); };
  try {
    for (role of ["operator", "reader", "visitor"]) assert.equal(await loadOwnerPdfFacsimile(), null);
  } finally {
    globalThis.fetch = originalFetch;
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
