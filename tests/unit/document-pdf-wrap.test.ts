import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { wrapPdfText } from "../../client/src/lib/documentPdf.ts";

const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
const size = 10;
const maxWidth = 180;

const longToken = `https://neuroped.example/verificar/${"a".repeat(240)}`;
const wrappedToken = wrapPdfText(longToken, font, size, maxWidth);
assert.ok(wrappedToken.length > 1, "URL sem espaços precisa quebrar em mais de uma linha");
assert.equal(wrappedToken.join(""), longToken, "quebra de URL não pode perder caracteres");
for (const line of wrappedToken) {
  assert.ok(
    font.widthOfTextAtSize(line, size) <= maxWidth + 0.001,
    `linha excedeu a largura do PDF: ${font.widthOfTextAtSize(line, size)} > ${maxWidth}`,
  );
}

const hash = "f".repeat(512);
const wrappedHash = wrapPdfText(hash, font, size, 120);
assert.equal(wrappedHash.join(""), hash, "hash longo deve ser preservado integralmente");
for (const line of wrappedHash) {
  assert.ok(font.widthOfTextAtSize(line, size) <= 120 + 0.001);
}

const sentence = "Paciente em acompanhamento neuropediátrico com retorno programado.";
const safeSentence = sentence.replace("á", "a");
const normal = wrapPdfText(safeSentence, font, size, maxWidth);
assert.equal(normal.join(" "), safeSentence, "texto normal não deve ser corrompido");

console.log("[document-pdf-wrap] ✓ URLs, hashes e texto normal respeitam a largura sem truncamento.");
