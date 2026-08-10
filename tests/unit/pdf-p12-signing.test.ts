import assert from "node:assert/strict";
import forge from "node-forge";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  assertSignedPdfIntegrity,
  readP12Info,
  signPdfWithP12,
} from "../../client/src/lib/icpSign.ts";

const PASSWORD = "neuroped-test-only";

function makeEphemeralP12(): ArrayBuffer {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
  cert.validity.notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const attrs = [
    { name: "commonName", value: "NeuroPed Test Signer" },
    { name: "organizationName", value: "NeuroPed SDG Test" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey,
    [cert],
    PASSWORD,
    { algorithm: "3des", friendlyName: "NeuroPed Test Signer" },
  );
  const der = forge.asn1.toDer(p12Asn1).getBytes();
  return Uint8Array.from(der, (char) => char.charCodeAt(0)).buffer;
}

async function makePdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([595.28, 841.89]);
  page.drawText("NeuroPed - teste automatizado de assinatura PFX/P12", {
    x: 50,
    y: 780,
    size: 12,
    font,
  });
  return pdf.save({ useObjectStreams: false });
}

const p12 = makeEphemeralP12();
const certInfo = readP12Info(p12, PASSWORD);
assert.equal(certInfo.commonName, "NeuroPed Test Signer");
assert.equal(certInfo.hasPrivateKey, true);

const originalPdf = await makePdf();
const signedPdf = await signPdfWithP12(originalPdf, p12, PASSWORD, {
  reason: "Teste automatizado NeuroPed",
  name: certInfo.commonName,
  location: "Petrolina-PE",
});

assert.ok(signedPdf.length > originalPdf.length, "PDF assinado deve conter o bloco adicional de assinatura");
await assertSignedPdfIntegrity(signedPdf, 1);

const raw = Buffer.from(signedPdf).toString("latin1");
assert.match(raw, /\/ByteRange\s*\[/, "assinatura deve conter /ByteRange");
assert.match(raw, /\/Contents\s*</, "assinatura deve conter /Contents");
assert.match(raw, /\/SubFilter\s*\/ETSI\.CAdES\.detached/, "assinatura deve usar CAdES detached");

const parsed = await PDFDocument.load(signedPdf);
assert.equal(parsed.getPageCount(), 1, "assinatura não pode perder ou acrescentar páginas");

console.log("[pdf-p12-signing] ✓ PDF real assinado com PFX/P12 efêmero e reaberto com integridade estrutural.");
