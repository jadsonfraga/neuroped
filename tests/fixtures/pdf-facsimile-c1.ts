import { testCard } from "./owner-pdf-test-card.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { buildReceitaC1SignedPdfBytes } from "../../client/src/pages/receita-c1";
import { buildC1TemplatePdfBytes } from "../../client/src/pages/receita-c1-express";
import { loadIssuer } from "../../client/src/lib/issuer";

test("as duas vias internas C1 incluem PNG e QR antes da assinatura digital", async () => {
  const issuer = { ...await loadIssuer(), doctorName: "Profissional ficticio", credentialsLine: "Registro de teste",
    clinicName: "Clinica de teste", addressLine2: "Cidade - PE" };
  const noop = "Amostra sem substancia";
  const routes = [
    () => buildReceitaC1SignedPdfBytes({ pac: "Registro ficticio", cpf: "TESTE SEM CPF", numeroVisaLocal: "", idadePaciente: "fixture",
      dosesPorDia: "fixture", end: "", med: noop, qtd: "fixture", qtde: "fixture", poso: "Teste do layout; nao dispensar.", data: "25/11/2026" }, issuer),
    () => buildC1TemplatePdfBytes({ paciente: "Registro ficticio", cpf: "TESTE SEM CPF", idadePaciente: "fixture",
      dosesPorDia: "fixture", dataNasc: "", endereco: "", municipio: "", cep: "", medicamento: noop,
      concentracao: "", forma: "", quantidade: "fixture", quantidadeExtenso: "fixture", instrucoes: "Teste do layout; nao dispensar.", cid: "" }, issuer),
  ];
  const oldFetch = globalThis.fetch;
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
    getItem: (key: string) => key === "neuroped:access" ? "synthetic-test-token" : "synthetic-clinic",
  } });
  const fixture = new Uint8Array(testCard());
  try {
    for (const render of routes) {
      for (const status of [200, 204]) {
        globalThis.fetch = async () => new Response(status === 200 ? fixture : null, { status, headers: { "content-type": "image/png" } });
        const artifact = await PDFDocument.load(await render());
        assert.equal(artifact.getPageCount(), 2);
        for (const page of artifact.getPages()) {
          const dict = page.node.Resources()?.lookupMaybe(PDFName.of("XObject"), PDFDict);
          assert.equal(dict?.keys().length, status === 200 ? 2 : 1, "PNG só na conta habilitada; QR permanece");
        }
        assert.ok(!artifact.context.enumerateIndirectObjects().some(([, dict]) =>
          dict instanceof PDFDict && ["Type", "FT"].some(key => dict.get(PDFName.of(key))?.toString() === "/Sig")));
      }
      globalThis.fetch = async () => new Response(null, { status: 503 });
      await assert.rejects(render, /imagem manuscrita/);
    }
  } finally {
    globalThis.fetch = oldFetch;
    if (storageDescriptor) Object.defineProperty(globalThis, "sessionStorage", storageDescriptor);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
