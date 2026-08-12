// ============================================================
// Assinatura digital ICP-Brasil (certificado A1 .p12/.pfx) no navegador.
// A chave privada nunca sai do dispositivo: o arquivo e lido em memoria,
// usado para assinar o PDF e descartado.
// ============================================================
import { Buffer } from "buffer";
import { PDFDocument } from "pdf-lib";
import forge from "node-forge";

// @signpdf ainda publica módulos CommonJS que esperam `Buffer` como global.
// O carregamento dinâmico abaixo acontece somente depois deste shim mínimo,
// evitando incluir toda a stdlib/crypto do Node no navegador.
(globalThis as typeof globalThis & { Buffer?: typeof Buffer }).Buffer ??= Buffer;

export interface SignMeta {
  reason?: string;
  name?: string;
  location?: string;
  contactInfo?: string;
  widgetRect?: number[];
  widgetPageIndex?: number;
}

export interface CertInfo {
  commonName: string;
  notBefore: Date;
  notAfter: Date;
  issuer: string;
  hasPrivateKey: boolean;
}

const SIGNATURE_PLACEHOLDER_LENGTHS = [131072, 262144];

interface ParsedP12 {
  privateKey: forge.pki.rsa.PrivateKey;
  certs: forge.pki.Certificate[];
}

function parseP12(p12: ArrayBuffer, passphrase: string): ParsedP12 {
  const der = Buffer.from(p12).toString("binary");
  const asn1 = forge.asn1.fromDer(der);
  const p12obj = forge.pkcs12.pkcs12FromAsn1(asn1, passphrase);

  let privateKey: forge.pki.rsa.PrivateKey | null = null;
  const shroudedBags = p12obj.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const shroudedList = shroudedBags[forge.pki.oids.pkcs8ShroudedKeyBag];
  if (shroudedList?.length) privateKey = shroudedList[0].key ?? null;

  if (!privateKey) {
    const keyBags = p12obj.getBags({ bagType: forge.pki.oids.keyBag });
    const keyList = keyBags[forge.pki.oids.keyBag];
    if (keyList?.length) privateKey = keyList[0].key ?? null;
  }

  if (!privateKey) throw new Error("Chave privada nao encontrada no certificado.");

  const certBags = p12obj.getBags({ bagType: forge.pki.oids.certBag });
  const certList = certBags[forge.pki.oids.certBag] ?? [];
  const certs = certList.map((bag) => bag.cert).filter((cert): cert is forge.pki.Certificate => !!cert);
  if (!certs.length) throw new Error("Certificado nao encontrado no arquivo .p12/.pfx.");

  return { privateKey, certs };
}

function assertCertificateDates(cert: forge.pki.Certificate, now = new Date()) {
  if (now < cert.validity.notBefore) {
    throw new Error("Certificado ainda nao esta valido.");
  }
  if (now > cert.validity.notAfter) {
    throw new Error("Certificado expirado.");
  }
}

function getCertDisplayInfo(cert: forge.pki.Certificate): Omit<CertInfo, "hasPrivateKey"> {
  const commonName = cert.subject.getField("CN")?.value ?? "(sem nome)";
  const issuer = cert.issuer.getField("CN")?.value ?? cert.issuer.getField("O")?.value ?? "(emissor)";
  return { commonName, issuer, notBefore: cert.validity.notBefore, notAfter: cert.validity.notAfter };
}

function certMatchesPrivateKey(cert: forge.pki.Certificate, privateKey: forge.pki.rsa.PrivateKey): boolean {
  const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
  return Boolean(publicKey?.n?.equals(privateKey.n) && publicKey?.e?.equals(privateKey.e));
}

function orderCertChain(privateKey: forge.pki.rsa.PrivateKey, certs: forge.pki.Certificate[]): forge.pki.Certificate[] {
  const signingCertIndex = certs.findIndex((cert) => certMatchesPrivateKey(cert, privateKey));
  if (signingCertIndex === -1) {
    throw new Error("Nenhum certificado do arquivo .p12/.pfx corresponde à chave privada encontrada. Verifique se o arquivo não está corrompido.");
  }
  if (signingCertIndex === 0) return certs;
  const signingCert = certs[signingCertIndex];
  return [signingCert, ...certs.slice(0, signingCertIndex), ...certs.slice(signingCertIndex + 1)];
}

/**
 * Normaliza um PFX/P12 para 3DES, formato amplamente suportado por @signpdf/signer-p12.
 * Certificados ICP-Brasil antigos podem vir em RC2-40-CBC; o node-forge consegue
 * abrir esse legado e reempacotar mantendo a mesma senha e a cadeia de certificados.
 */
function normalizePfxBuffer(p12: ArrayBuffer, passphrase: string): Buffer {
  const { privateKey, certs } = parseP12(p12, passphrase);
  const orderedCerts = orderCertChain(privateKey, certs);
  assertCertificateDates(orderedCerts[0]);

  const newAsn1 = forge.pkcs12.toPkcs12Asn1(privateKey, orderedCerts, passphrase, {
    algorithm: "3des",
    friendlyName: orderedCerts[0]?.subject?.getField("CN")?.value ?? undefined,
  });

  return Buffer.from(forge.asn1.toDer(newAsn1).getBytes(), "binary");
}

function originalPfxBuffer(p12: ArrayBuffer): Buffer {
  return Buffer.from(p12);
}

export function icpErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error || "");
  if (/invalid password|mac verify failure|password|senha|pkcs12/i.test(msg)) {
    return "Senha incorreta ou certificado .p12/.pfx invalido.";
  }
  if (/private key|chave privada/i.test(msg)) {
    return "O certificado selecionado nao contem chave privada. Use o certificado A1 completo (.p12/.pfx).";
  }
  if (/integridade|byterange|contents|subfilter|pdf assinado/i.test(msg)) {
    return "O PDF foi processado, mas a assinatura digital não passou na verificação estrutural interna. Gere novamente e não utilize o arquivo incompleto.";
  }
  if (/not enough space|placeholder|signature/i.test(msg)) {
    return "Falha ao embutir a assinatura no PDF. Gere novamente; o app agora reserva espaco ampliado para certificados ICP-Brasil.";
  }
  return msg || "Falha ao assinar o PDF. Verifique o certificado e tente novamente.";
}

/** Le titular, emissor e validade do certificado .p12/.pfx antes de assinar. */
export function readP12Info(p12: ArrayBuffer, passphrase: string): CertInfo {
  const { privateKey, certs } = parseP12(p12, passphrase);
  const cert = orderCertChain(privateKey, certs)[0];
  assertCertificateDates(cert);
  return { ...getCertDisplayInfo(cert), hasPrivateKey: true };
}

/**
 * Verifica o ARQUIVO produzido pelo assinador, não apenas a ausência de exceção.
 * Isso bloqueia falsos positivos em que o download seria disparado com um PDF
 * parseável, porém sem dicionário de assinatura efetivamente preenchido.
 */
export async function assertSignedPdfIntegrity(
  signedBytes: Uint8Array,
  expectedPageCount?: number,
): Promise<void> {
  const buffer = Buffer.from(signedBytes);
  if (buffer.length < 128 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Integridade do PDF assinado inválida: cabeçalho PDF ausente.");
  }

  const source = buffer.toString("latin1");
  if (!/\/ByteRange\s*\[\s*0\s+\d+\s+\d+\s+\d+\s*\]/.test(source)) {
    throw new Error("Integridade do PDF assinado inválida: /ByteRange ausente.");
  }
  if (!/\/SubFilter\s*\/ETSI\.CAdES\.detached/.test(source)) {
    throw new Error("Integridade do PDF assinado inválida: subfiltro CAdES detached ausente.");
  }
  const contents = source.match(/\/Contents\s*<([0-9A-Fa-f]{64,})>/);
  if (!contents || /^0+$/.test(contents[1].slice(0, 128))) {
    throw new Error("Integridade do PDF assinado inválida: /Contents não foi preenchido.");
  }

  const parsed = await PDFDocument.load(signedBytes);
  if (expectedPageCount !== undefined && parsed.getPageCount() !== expectedPageCount) {
    throw new Error(
      `Integridade do PDF assinado inválida: páginas ${parsed.getPageCount()} != ${expectedPageCount}.`,
    );
  }
}

async function signPreparedPdf(
  pdfBytes: Uint8Array,
  p12Buffer: Buffer,
  passphrase: string,
  signatureLength: number,
  meta: SignMeta,
): Promise<Uint8Array> {
  const [
    { SignPdf },
    { P12Signer },
    { pdflibAddPlaceholder },
    { SUBFILTER_ETSI_CADES_DETACHED },
  ] = await Promise.all([
    import("@signpdf/signpdf"),
    import("@signpdf/signer-p12"),
    import("@signpdf/placeholder-pdf-lib"),
    import("@signpdf/utils"),
  ]);
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const signaturePage = pages[Math.min(Math.max(meta.widgetPageIndex ?? 0, 0), pages.length - 1)];

  pdflibAddPlaceholder({
    pdfPage: signaturePage,
    reason: meta.reason ?? "Assinatura digital ICP-Brasil",
    name: meta.name ?? "",
    location: meta.location ?? "",
    contactInfo: meta.contactInfo ?? "NeuroPed",
    subFilter: SUBFILTER_ETSI_CADES_DETACHED,
    signatureLength,
    widgetRect: meta.widgetRect ?? [0, 0, 0, 0],
  });

  const withPlaceholder = Buffer.from(await doc.save({ useObjectStreams: false }));
  const signer = new P12Signer(p12Buffer, { passphrase });
  const signed = await new SignPdf().sign(withPlaceholder, signer);
  return new Uint8Array(signed);
}

/** Assina um PDF com certificado A1 .p12/.pfx. */
export async function signPdfWithP12(
  pdfBytes: Uint8Array,
  p12: ArrayBuffer,
  passphrase: string,
  meta: SignMeta = {},
): Promise<Uint8Array> {
  // Valida senha, validade e chave privada antes de gerar a assinatura.
  readP12Info(p12, passphrase);
  const original = await PDFDocument.load(pdfBytes);
  const expectedPageCount = original.getPageCount();

  const candidateP12s = [normalizePfxBuffer(p12, passphrase), originalPfxBuffer(p12)];
  let lastError: unknown = null;

  for (const signatureLength of SIGNATURE_PLACEHOLDER_LENGTHS) {
    for (const candidateP12 of candidateP12s) {
      try {
        const signed = await signPreparedPdf(pdfBytes, candidateP12, passphrase, signatureLength, meta);
        await assertSignedPdfIntegrity(signed, expectedPageCount);
        return signed;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw new Error(icpErrorMessage(lastError));
}

/** SHA-256 (hex) de bytes para comprovante de integridade do documento. */
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
