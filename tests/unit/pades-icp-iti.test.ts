import assert from "node:assert/strict";
import forge from "node-forge";
import { PDFDict, PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import { signPdfWithP12 } from "../../client/src/lib/icpSign.ts";
import { parseCrmCredential } from "../../client/src/lib/padesIcp.ts";
import {
  electronicRceBlockReason,
  isUnintegratedElectronicRceAllowed,
} from "../../client/src/lib/sncrTransition.ts";

const PASSWORD = "neuroped-test-only";

function makeChainP12(): ArrayBuffer {
  const caKeys = forge.pki.rsa.generateKeyPair(1024);
  const ca = forge.pki.createCertificate();
  ca.publicKey = caKeys.publicKey;
  ca.serialNumber = "0a";
  ca.validity.notBefore = new Date(Date.now() - 864e5);
  ca.validity.notAfter = new Date(Date.now() + 365 * 864e5);
  const caName = [{ name: "commonName", value: "AC FICTICIA DE TESTE" }];
  ca.setSubject(caName);
  ca.setIssuer(caName);
  ca.setExtensions([{ name: "basicConstraints", cA: true }]);
  ca.sign(caKeys.privateKey, forge.md.sha256.create());

  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "8f01";
  cert.validity.notBefore = ca.validity.notBefore;
  cert.validity.notAfter = new Date(Date.now() + 180 * 864e5);
  cert.setSubject([{ name: "commonName", value: "MEDICO FICTICIO:00000000000" }]);
  cert.setIssuer(caName);
  cert.sign(caKeys.privateKey, forge.md.sha256.create());

  // CA antes do signatário: o assinador deve reordenar a cadeia.
  const der = forge.asn1.toDer(
    forge.pkcs12.toPkcs12Asn1(keys.privateKey, [ca, cert], PASSWORD, { algorithm: "3des" }),
  ).getBytes();
  return Uint8Array.from(der, (c) => c.charCodeAt(0)).buffer;
}

async function makePdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage([419.53, 595.28]).drawText("RECEITA FICTICIA - TESTE", { x: 40, y: 500, size: 12, font });
  pdf.addPage([419.53, 595.28]).drawText("2a via", { x: 40, y: 500, size: 12, font });
  return pdf.save({ useObjectStreams: false });
}

const signed = await signPdfWithP12(await makePdf(), makeChainP12(), PASSWORD, {
  name: "MEDICO FICTICIO",
  widgetRect: [218, 44, 394, 110],
  healthDocument: { kind: "prescricao", credentialsLine: "CRM-PE 12345 · RQE 678" },
});
const latin1 = Buffer.from(signed).toString("latin1");

// 1) CMS: signing-certificate-v2 presente, signing-time ausente (PAdES), cadeia completa.
const hex = latin1.match(/\/Contents\s*<([0-9A-Fa-f]+)>/)?.[1] ?? "";
const cmsDer = forge.util.hexToBytes(hex.replace(/(00)+$/, ""));
const contentInfo = forge.asn1.fromDer(cmsDer, { parseAllBytes: false });
const signedData = (contentInfo.value[1] as forge.asn1.Asn1).value[0] as forge.asn1.Asn1;
const sdParts = signedData.value as forge.asn1.Asn1[];
const certificates = sdParts.find((n) => n.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && n.type === 0)!;
assert.equal((certificates.value as forge.asn1.Asn1[]).length, 2, "cadeia (signatário + AC) embutida");
const signerInfo = ((sdParts[sdParts.length - 1].value as forge.asn1.Asn1[])[0].value) as forge.asn1.Asn1[];
const signedAttrs = signerInfo.find((n) => n.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && n.type === 0)!;
const attrOids = (signedAttrs.value as forge.asn1.Asn1[]).map((attr) =>
  forge.asn1.derToOid((attr.value as forge.asn1.Asn1[])[0].value as string),
);
assert.ok(attrOids.includes("1.2.840.113549.1.9.16.2.47"), "signing-certificate-v2 ausente");
assert.ok(attrOids.includes("1.2.840.113549.1.9.4"), "message-digest ausente");
assert.ok(!attrOids.includes("1.2.840.113549.1.9.5"), "signing-time não deve ir no CMS PAdES");

// 2) Assinatura RSA confere com a chave pública do signatário sobre os atributos.
const signerCert = forge.pki.certificateFromAsn1((certificates.value as forge.asn1.Asn1[]).find((c) =>
  forge.pki.certificateFromAsn1(c).subject.getField("CN")?.value === "MEDICO FICTICIO:00000000000",
)!);
const attrsSet = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, signedAttrs.value as forge.asn1.Asn1[]);
const md = forge.md.sha256.create().update(forge.asn1.toDer(attrsSet).getBytes());
const sigValue = signerInfo[signerInfo.length - 1].value as string;
assert.ok((signerCert.publicKey as forge.pki.rsa.PublicKey).verify(md.digest().getBytes(), sigValue));

// 3) message-digest = SHA-256 do ByteRange.
const br = latin1.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/)!.slice(1).map(Number);
const covered = Buffer.concat([Buffer.from(signed).subarray(br[0], br[0] + br[1]), Buffer.from(signed).subarray(br[2], br[2] + br[3])]);
const mdAttr = (signedAttrs.value as forge.asn1.Asn1[]).find((attr) =>
  forge.asn1.derToOid((attr.value as forge.asn1.Asn1[])[0].value as string) === "1.2.840.113549.1.9.4",
)!;
const digestValue = ((mdAttr.value as forge.asn1.Asn1[])[1].value as forge.asn1.Asn1[])[0].value as string;
assert.equal(forge.util.bytesToHex(digestValue), forge.md.sha256.create().update(covered.toString("binary")).digest().toHex());
assert.equal(br[2] + br[3], signed.length, "ByteRange cobre o arquivo inteiro");

// 4) DocMDP (ITI) e metadados de documento de saúde.
assert.match(latin1, /\/TransformMethod\s*\/DocMDP/);
assert.match(latin1, /\/Perms\s*<<\s*\/DocMDP\s+\d+\s+0\s+R/);
const doc = await PDFDocument.load(signed);
const info = doc.context.lookup(doc.context.trailerInfo.Info, PDFDict)!;
const infoValue = (key: string) => info.get(PDFName.of(key))?.toString() ?? null;
assert.equal(infoValue("2.16.76.1.12.1.1"), "(Prescricao de medicamento)");
assert.equal(infoValue("2.16.76.1.4.2.2.1"), "(12345)");
assert.equal(infoValue("2.16.76.1.4.2.2.2"), "(PE)");
assert.equal(doc.getPageCount(), 2);

// 5) Parser de CRM não inventa.
assert.deepEqual(parseCrmCredential("CRM-PE 12345 · RQE 678"), { number: "12345", uf: "PE" });
assert.deepEqual(parseCrmCredential("CRM 54321/SP"), { number: "54321", uf: "SP" });
assert.deepEqual(parseCrmCredential("crm/ba nº 7788"), { number: "7788", uf: "BA" });
assert.equal(parseCrmCredential("CRM-XX 123"), null);
assert.equal(parseCrmCredential(""), null);

// 6) Transição SNCR (RDC 1.000/2025): 29/10/2026 ainda permite; 30/10/2026 00:00 BRT bloqueia.
assert.equal(isUnintegratedElectronicRceAllowed(Date.parse("2026-10-29T23:59:59-03:00")), true);
assert.equal(isUnintegratedElectronicRceAllowed(Date.parse("2026-10-30T00:00:00-03:00")), false);
assert.equal(electronicRceBlockReason(Date.parse("2026-10-08T12:00:00-03:00")), null);
assert.match(electronicRceBlockReason(Date.parse("2026-11-01T12:00:00-03:00")) ?? "", /SNCR/);

console.log("pades-icp-iti: ok");
