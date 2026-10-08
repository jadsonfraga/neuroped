// ============================================================
// PAdES ICP-Brasil no navegador — peças que o @signpdf não oferece:
//  1. CMS/CAdES destacado com o atributo assinado ESS signing-certificate-v2
//     (obrigatório para SubFilter ETSI.CAdES.detached; ETSI EN 319 142-1 e
//     DOC-ICP-15.02) e SEM signing-time (no PAdES a hora declarada vai em /M).
//  2. Placeholder de assinatura com DocMDP (ISO 32000-1 §12.8.2.2), recomendado
//     pelo VALIDAR/ITI para não resultar em "Indeterminado".
//  3. Metadados OID de documento de saúde exigidos pelo Guia do Desenvolvedor
//     do VALIDAR/ITI para prescrições geradas por sistemas.
// A chave privada é usada somente em memória; nada aqui faz rede ou storage.
// ============================================================
import forge from "node-forge";
import {
  PDFArray,
  PDFDict,
  PDFHexString,
  PDFInvalidObject,
  PDFName,
  PDFNumber,
  PDFString,
  type PDFDocument,
  type PDFPage,
} from "pdf-lib";

const { asn1 } = forge;

const OID = {
  data: "1.2.840.113549.1.7.1",
  signedData: "1.2.840.113549.1.7.2",
  contentType: "1.2.840.113549.1.9.3",
  messageDigest: "1.2.840.113549.1.9.4",
  signingCertificateV2: "1.2.840.113549.1.9.16.2.47",
  sha256: "2.16.840.1.101.3.4.2.1",
  rsaEncryption: "1.2.840.113549.1.1.1",
} as const;

type Asn1 = forge.asn1.Asn1;

const oidNode = (oid: string): Asn1 =>
  asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(oid).getBytes());
const seq = (items: Asn1[]): Asn1 => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, items);
const setOf = (items: Asn1[]): Asn1 => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, items);
const octets = (bytes: string): Asn1 => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, bytes);
const nullNode = (): Asn1 => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "");
const intNode = (bytes: string): Asn1 => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, bytes);
const algId = (oid: string): Asn1 => seq([oidNode(oid), nullNode()]);
const der = (node: Asn1): string => asn1.toDer(node).getBytes();

function serialBytes(cert: forge.pki.Certificate): string {
  const hex = cert.serialNumber.length % 2 ? `0${cert.serialNumber}` : cert.serialNumber;
  return forge.util.hexToBytes(hex);
}

function sha256Bytes(binary: string): string {
  return forge.md.sha256.create().update(binary).digest().getBytes();
}

function signedAttribute(type: string, value: Asn1): Asn1 {
  return seq([oidNode(type), setOf([value])]);
}

/** ESS SigningCertificateV2 (RFC 5035) com ESSCertIDv2 em SHA-256 + IssuerSerial. */
function signingCertificateV2(cert: forge.pki.Certificate, certDer: string): Asn1 {
  const issuerSerial = seq([
    // GeneralNames ::= SEQUENCE OF GeneralName; directoryName [4] EXPLICIT Name
    seq([asn1.create(asn1.Class.CONTEXT_SPECIFIC, 4, true, [forge.pki.distinguishedNameToAsn1(cert.issuer)])]),
    intNode(serialBytes(cert)),
  ]);
  // hashAlgorithm omitido = DEFAULT id-sha256.
  const essCertIdV2 = seq([octets(sha256Bytes(certDer)), issuerSerial]);
  return seq([seq([essCertIdV2])]);
}

function compareBinary(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const diff = a.charCodeAt(i) - b.charCodeAt(i);
    if (diff) return diff;
  }
  return a.length - b.length;
}

export interface CadesSignerInput {
  privateKey: forge.pki.rsa.PrivateKey;
  /** Cadeia ordenada: [certificado do signatário, ...intermediárias]. */
  certs: forge.pki.Certificate[];
}

/**
 * Gera ContentInfo(SignedData) DER, destacado, com atributos assinados
 * content-type, message-digest e signing-certificate-v2 (ordem DER do SET OF).
 */
export function buildCadesDetachedSignature(content: Uint8Array, input: CadesSignerInput): Uint8Array {
  const [signerCert] = input.certs;
  if (!signerCert) throw new Error("Certificado do signatário ausente.");
  const certNodes = input.certs.map((cert) => forge.pki.certificateToAsn1(cert));
  const signerCertDer = der(certNodes[0]);
  const contentBinary = forge.util.binary.raw.encode(content);

  const attributes = [
    signedAttribute(OID.contentType, oidNode(OID.data)),
    signedAttribute(OID.messageDigest, octets(sha256Bytes(contentBinary))),
    signedAttribute(OID.signingCertificateV2, signingCertificateV2(signerCert, signerCertDer)),
  ]
    .map((node) => ({ node, bytes: der(node) }))
    .sort((a, b) => compareBinary(a.bytes, b.bytes))
    .map(({ node }) => node);

  // A assinatura cobre o DER do SET OF (tag 0x31), não o [0] IMPLICIT.
  const md = forge.md.sha256.create();
  md.update(der(setOf(attributes)));
  const signature = input.privateKey.sign(md);

  const signerInfo = seq([
    intNode(String.fromCharCode(1)),
    seq([forge.pki.distinguishedNameToAsn1(signerCert.issuer), intNode(serialBytes(signerCert))]),
    algId(OID.sha256),
    asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, attributes),
    algId(OID.rsaEncryption),
    octets(signature),
  ]);

  const signedData = seq([
    intNode(String.fromCharCode(1)),
    setOf([algId(OID.sha256)]),
    seq([oidNode(OID.data)]),
    asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, certNodes),
    setOf([signerInfo]),
  ]);

  const contentInfo = seq([
    oidNode(OID.signedData),
    asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [signedData]),
  ]);
  return forge.util.binary.raw.decode(der(contentInfo));
}

// ── Metadados de documento de saúde (VALIDAR/ITI) ────────────────────────

export type HealthDocumentKind = "prescricao" | "atestado" | "solicitacao_exame" | "relatorio";

export const HEALTH_DOCUMENT_OIDS: Record<HealthDocumentKind, { oid: string; label: string }> = {
  prescricao: { oid: "2.16.76.1.12.1.1", label: "Prescricao de medicamento" },
  atestado: { oid: "2.16.76.1.12.1.2", label: "Atestado medico" },
  solicitacao_exame: { oid: "2.16.76.1.12.1.3", label: "Solicitacao de exame" },
  relatorio: { oid: "2.16.76.1.12.1.11", label: "Relatorio Medico" },
};

export const PROFESSIONAL_OIDS = {
  crmNumber: "2.16.76.1.4.2.2.1",
  crmUf: "2.16.76.1.4.2.2.2",
  pharmacistNumber: "2.16.76.1.4.2.3.1",
  pharmacistUf: "2.16.76.1.4.2.3.2",
} as const;

export interface HealthDocumentMeta {
  kind: HealthDocumentKind;
  /** Linha livre de credenciais do perfil (ex.: "CRM-PE 12345 · RQE 678"). */
  credentialsLine?: string;
}

const BR_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

/** Extrai número e UF do CRM de uma linha livre; null quando ambíguo (nunca inventa). */
export function parseCrmCredential(line: string | null | undefined): { number: string; uf: string } | null {
  const text = String(line ?? "").toUpperCase();
  const ufFirst = text.match(/CRM\s*[-/ ]?\s*([A-Z]{2})\s*[-:/ ]?\s*(?:N[º°O.]*\s*)?(\d{3,8})\b/);
  if (ufFirst && BR_UFS.has(ufFirst[1])) return { number: ufFirst[2], uf: ufFirst[1] };
  const numberFirst = text.match(/CRM\s*[-:]?\s*(?:N[º°O.]*\s*)?(\d{3,8})\s*[-/ ]\s*([A-Z]{2})\b/);
  if (numberFirst && BR_UFS.has(numberFirst[2])) return { number: numberFirst[1], uf: numberFirst[2] };
  return null;
}

/**
 * Grava os OIDs do Guia do Desenvolvedor do VALIDAR no dicionário Info do PDF.
 * Deve rodar ANTES da assinatura para que os metadados fiquem cobertos por ela.
 * Retorna se o CRM pôde ser identificado (para alertar o prescritor).
 */
export function applyItiHealthMetadata(doc: PDFDocument, meta: HealthDocumentMeta): { crmIdentified: boolean } {
  // Garante a existência do dicionário Info.
  doc.setCreator("NeuroPed");
  const infoRef = doc.context.trailerInfo.Info;
  const info = infoRef ? doc.context.lookup(infoRef, PDFDict) : undefined;
  if (!info) throw new Error("Dicionario Info do PDF indisponivel para metadados ITI.");
  const docType = HEALTH_DOCUMENT_OIDS[meta.kind];
  const crm = parseCrmCredential(meta.credentialsLine);
  const entries: Array<[string, string]> = [
    [docType.oid, docType.label],
    [PROFESSIONAL_OIDS.crmNumber, crm?.number ?? ""],
    [PROFESSIONAL_OIDS.crmUf, crm?.uf ?? ""],
    [PROFESSIONAL_OIDS.pharmacistNumber, ""],
    [PROFESSIONAL_OIDS.pharmacistUf, ""],
  ];
  for (const [key, value] of entries) info.set(PDFName.of(key), PDFString.of(value));
  return { crmIdentified: Boolean(crm) };
}

// ── Placeholder PAdES com DocMDP ─────────────────────────────────────────

export interface PadesPlaceholderInput {
  page: PDFPage;
  reason: string;
  name: string;
  location: string;
  contactInfo: string;
  subFilter: string;
  signatureLength: number;
  byteRangePlaceholder: string;
  widgetRect: number[];
  signingTime?: Date;
  /** 1 = nenhuma alteração; 2 = só formulários/assinaturas (padrão ITI). */
  docMdpPermission?: 1 | 2 | 3;
}

const SIG_FLAGS_SIGNATURES_EXIST_APPEND_ONLY = 3;
const ANNOTATION_FLAG_PRINT = 4;

/** Mesmo contrato do pdflibAddPlaceholder (@signpdf), acrescido de DocMDP. */
export function addPadesPlaceholder(input: PadesPlaceholderInput): void {
  const doc = input.page.doc;
  const ctx = doc.context;
  const byteRange = PDFArray.withContext(ctx);
  byteRange.push(PDFNumber.of(0));
  byteRange.push(PDFName.of(input.byteRangePlaceholder));
  byteRange.push(PDFName.of(input.byteRangePlaceholder));
  byteRange.push(PDFName.of(input.byteRangePlaceholder));

  const transformParams = ctx.obj({
    Type: "TransformParams",
    P: input.docMdpPermission ?? 2,
    V: PDFName.of("1.2"),
  });
  const sigRef = ctx.obj({ Type: "SigRef", TransformMethod: "DocMDP", TransformParams: transformParams });

  const signatureDict = ctx.obj({
    Type: "Sig",
    Filter: "Adobe.PPKLite",
    SubFilter: input.subFilter,
    ByteRange: byteRange,
    // Mesmo dimensionamento do @signpdf: signatureLength caracteres hex.
    Contents: PDFHexString.of("0".repeat(input.signatureLength)),
    Reason: PDFString.of(input.reason),
    M: PDFString.fromDate(input.signingTime ?? new Date()),
    ContactInfo: PDFString.of(input.contactInfo),
    Name: PDFString.of(input.name),
    Location: PDFString.of(input.location),
    Reference: [sigRef],
    Prop_Build: { Filter: { Name: "Adobe.PPKLite" }, App: { Name: "NeuroPed" } },
  });
  // Serializado como objeto "cru" para nunca cair em object stream.
  const signatureBuffer = new Uint8Array(signatureDict.sizeInBytes());
  signatureDict.copyBytesInto(signatureBuffer, 0);
  const signatureRef = ctx.register(PDFInvalidObject.of(signatureBuffer));

  const rect = PDFArray.withContext(ctx);
  input.widgetRect.forEach((value) => rect.push(PDFNumber.of(value)));
  const appearance = ctx.formXObject([], { BBox: input.widgetRect, Resources: {} });
  const widgetRef = ctx.register(ctx.obj({
    Type: "Annot",
    Subtype: "Widget",
    FT: "Sig",
    Rect: rect,
    V: signatureRef,
    T: PDFString.of("AssinaturaICPBrasil"),
    F: ANNOTATION_FLAG_PRINT,
    P: input.page.ref,
    AP: { N: ctx.register(appearance) },
  }));

  const annots = input.page.node.lookupMaybe(PDFName.of("Annots"), PDFArray) ?? ctx.obj([]);
  annots.push(widgetRef);
  input.page.node.set(PDFName.of("Annots"), annots);

  let acroForm = doc.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict);
  if (!acroForm) {
    acroForm = ctx.obj({ Fields: [] });
    doc.catalog.set(PDFName.of("AcroForm"), ctx.register(acroForm));
  }
  const currentFlags = acroForm.lookupMaybe(PDFName.of("SigFlags"), PDFNumber)?.asNumber() ?? 0;
  acroForm.set(PDFName.of("SigFlags"), PDFNumber.of(currentFlags | SIG_FLAGS_SIGNATURES_EXIST_APPEND_ONLY));
  let fields = acroForm.lookupMaybe(PDFName.of("Fields"), PDFArray);
  if (!fields) {
    fields = ctx.obj([]);
    acroForm.set(PDFName.of("Fields"), fields);
  }
  fields.push(widgetRef);

  // DocMDP: o catálogo aponta para a assinatura certificadora.
  doc.catalog.set(PDFName.of("Perms"), ctx.obj({ DocMDP: signatureRef }));
}
