// ============================================================
// Assinatura digital ICP-Brasil (certificado A1 .p12) — no NAVEGADOR.
// A chave privada do certificado NUNCA sai do dispositivo: o .p12 é lido em
// memória, usado para assinar (PAdES) e descartado. Nada é enviado ao servidor.
//
// Perfil atual: PAdES-BES (assinatura CAdES embutida no PDF com o certificado
// A1 ICP-Brasil). Para AD-RT (carimbo do tempo de uma ACT ICP-Brasil) é preciso
// acoplar uma TSA — passo futuro.
// ============================================================
import { Buffer } from "buffer";
import { PDFDocument } from "pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import forge from "node-forge";

export interface SignMeta {
  reason?: string;
  name?: string;
  location?: string;
  contactInfo?: string;
}

export interface CertInfo {
  commonName: string;
  notBefore: Date;
  notAfter: Date;
  issuer: string;
}

/**
 * Normaliza um PFX para 3DES (formato amplamente suportado por @signpdf/signer-p12).
 * Certs ICP-Brasil antigos usam RC2-40-CBC (cipher legado) que o signer-p12 não
 * consegue abrir para extrair a chave privada, mesmo com a senha correta.
 * Esta função extrai key+cert via node-forge (que suporta RC2-40) e reempacota
 * em 3DES-CBC, mantendo a mesma senha.
 */
function normalizePfxBuffer(p12: ArrayBuffer, passphrase: string): Buffer {
  const der = Buffer.from(p12).toString("binary");
  const asn1 = forge.asn1.fromDer(der);
  const p12obj = forge.pkcs12.pkcs12FromAsn1(asn1, passphrase);

  // Extrai chave privada (pkcs8ShroudedKeyBag ou keyBag)
  let privateKey: forge.pki.rsa.PrivateKey | null = null;
  const shroudedBags = p12obj.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const shroudedList = shroudedBags[forge.pki.oids.pkcs8ShroudedKeyBag];
  if (shroudedList?.length) privateKey = shroudedList[0].key ?? null;
  if (!privateKey) {
    const keyBags = p12obj.getBags({ bagType: forge.pki.oids.keyBag });
    const keyList = keyBags[forge.pki.oids.keyBag];
    if (keyList?.length) privateKey = keyList[0].key ?? null;
  }
  if (!privateKey) throw new Error("Chave privada não encontrada no certificado.");

  // Extrai cadeia de certificados
  const certBags = p12obj.getBags({ bagType: forge.pki.oids.certBag });
  const certList = certBags[forge.pki.oids.certBag] ?? [];
  const certs = certList.map((b) => b.cert).filter((c): c is forge.pki.Certificate => !!c);
  if (!certs.length) throw new Error("Certificado não encontrado no .p12.");

  // Reempacota com 3DES-CBC (suportado por @signpdf e pela maioria dos validadores)
  const newAsn1 = forge.pkcs12.toPkcs12Asn1(privateKey, certs, passphrase, {
    algorithm: "3des",
    friendlyName: certs[0]?.subject?.getField("CN")?.value ?? undefined,
  });
  return Buffer.from(forge.asn1.toDer(newAsn1).getBytes(), "binary");
}

/** Lê o titular e a validade do certificado .p12 (para exibir antes de assinar). */
export function readP12Info(p12: ArrayBuffer, passphrase: string): CertInfo {
  const der = Buffer.from(p12).toString("binary");
  const asn1 = forge.asn1.fromDer(der);
  const p12obj = forge.pkcs12.pkcs12FromAsn1(asn1, passphrase);
  const bags = p12obj.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = bags[forge.pki.oids.certBag]?.[0];
  const cert = certBag?.cert;
  if (!cert) throw new Error("Certificado não encontrado no arquivo .p12.");
  const cn = cert.subject.getField("CN")?.value ?? "(sem nome)";
  const issuer = cert.issuer.getField("CN")?.value ?? cert.issuer.getField("O")?.value ?? "(emissor)";
  return { commonName: cn, notBefore: cert.validity.notBefore, notAfter: cert.validity.notAfter, issuer };
}

/** Assina um PDF (bytes) com o certificado .p12, em PAdES. Retorna o PDF assinado. */
export async function signPdfWithP12(
  pdfBytes: Uint8Array,
  p12: ArrayBuffer,
  passphrase: string,
  meta: SignMeta = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  pdflibAddPlaceholder({
    pdfDoc: doc,
    reason: meta.reason ?? "Assinatura digital ICP-Brasil",
    name: meta.name ?? "",
    location: meta.location ?? "",
    contactInfo: meta.contactInfo ?? "NeuroPed",
  });
  const withPlaceholder = Buffer.from(await doc.save({ useObjectStreams: false }));
  // Normaliza para 3DES antes de assinar — necessário para certs ICP-Brasil
  // com criptografia legada RC2-40-CBC (emitidos antes de ~2023).
  const normalizedP12 = normalizePfxBuffer(p12, passphrase);
  const signer = new P12Signer(normalizedP12, { passphrase });
  const signed = await new SignPdf().sign(withPlaceholder, signer);
  return new Uint8Array(signed);
}

/** SHA-256 (hex) de bytes — fingerprint do documento para verificação. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Dispara o download de bytes como arquivo. */
export function downloadBytes(bytes: Uint8Array, filename: string, mime = "application/pdf") {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
