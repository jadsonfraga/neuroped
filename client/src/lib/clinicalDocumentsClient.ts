import { authFetch } from "./authClient";
import { uploadFile, type FileMetadata } from "./filesClient";

export type ClinicalPdfDocumentType = "laudo" | "receita" | "escala";

export interface ArchiveClinicalPdfParams {
  bytes: Uint8Array;
  filename: string;
  documentType: ClinicalPdfDocumentType;
  title: string;
  patientId?: string | null;
  sourceId?: string | null;
  sourceVersion?: string | null;
  signatureStatus?: "unsigned" | "signed" | "verified";
  signatureType?: string | null;
  signatureAlgorithm?: string | null;
  signerName?: string | null;
  certificateSubject?: string | null;
  certificateIssuer?: string | null;
  certificateSerial?: string | null;
  certificateValidUntil?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ArchivedClinicalDocument {
  storageMode?: "live-encrypted-d1" | "object-storage";
  document: {
    id: string;
    fileId: string;
    documentType: ClinicalPdfDocumentType;
    title: string;
    sha256: string | null;
    signatureStatus: string;
    retentionPolicy: string;
    isImmutable: boolean;
    createdAt: string;
  };
  file: FileMetadata;
}

function activeClinicId(): string | null {
  try {
    return sessionStorage.getItem("neuroped:active-clinic-id")?.trim() || null;
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function liveDocumentType(type: ClinicalPdfDocumentType): "report" | "prescription" | "scale" {
  if (type === "receita") return "prescription";
  if (type === "escala") return "scale";
  return "report";
}

async function archiveInClinicalLive(
  params: ArchiveClinicalPdfParams,
  clinicId: string,
): Promise<ArchivedClinicalDocument> {
  if (!params.patientId) throw new Error("Paciente LIVE é obrigatório para arquivar PDF clínico.");
  const filename = params.filename.endsWith(".pdf") ? params.filename : `${params.filename}.pdf`;
  const bytes = new Uint8Array(params.bytes);
  const [sha256, base64] = await Promise.all([
    sha256Hex(bytes),
    Promise.resolve(bytesToBase64(bytes)),
  ]);
  const issuedAt = new Date().toISOString();
  const content = {
    schema: "neuroped.live-pdf.v1",
    title: params.title,
    filename,
    mimeType: "application/pdf",
    sizeBytes: bytes.byteLength,
    sha256,
    pdfBase64: base64,
    sourceId: params.sourceId ?? null,
    sourceVersion: params.sourceVersion ?? null,
    signature: {
      status: params.signatureStatus ?? "unsigned",
      type: params.signatureType ?? null,
      algorithm: params.signatureAlgorithm ?? null,
      signerName: params.signerName ?? null,
      certificateSubject: params.certificateSubject ?? null,
      certificateIssuer: params.certificateIssuer ?? null,
      certificateSerial: params.certificateSerial ?? null,
      certificateValidUntil: params.certificateValidUntil ?? null,
    },
    metadata: params.metadata ?? {},
  };
  const encodedSize = new TextEncoder().encode(JSON.stringify(content)).byteLength;
  if (encodedSize > 240_000) {
    throw new Error(
      "PDF excede o limite seguro do cofre LIVE (240 KB cifrados). Configure object storage antes de arquivar documentos maiores.",
    );
  }

  const response = await authFetch("/api/live/documents", {
    method: "POST",
    body: JSON.stringify({
      clinicId,
      patientId: params.patientId,
      documentType: liveDocumentType(params.documentType),
      origin: "clinician",
      status: (params.signatureStatus === "signed" || params.signatureStatus === "verified") ? "published" : "draft",
      familyVisibility: false,
      issuedAt,
      content,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Falha ao arquivar no Clinical Core LIVE (${response.status})`);
  }
  const payload = await response.json() as { id: string; createdAt?: string; updatedAt?: string };
  const createdAt = payload.createdAt ?? payload.updatedAt ?? issuedAt;
  const syntheticFile: FileMetadata = {
    id: `live-document:${payload.id}`,
    filename,
    mimeType: "application/pdf",
    sizeBytes: bytes.byteLength,
    sha256,
    category: params.documentType,
    patientId: params.patientId,
    createdAt,
  };
  return {
    storageMode: "live-encrypted-d1",
    document: {
      id: payload.id,
      fileId: syntheticFile.id,
      documentType: params.documentType,
      title: params.title,
      sha256,
      signatureStatus: params.signatureStatus ?? "unsigned",
      retentionPolicy: "clinical-live-versioned",
      isImmutable: params.signatureStatus === "signed" || params.signatureStatus === "verified",
      createdAt,
    },
    file: syntheticFile,
  };
}

export async function archiveClinicalPdf(params: ArchiveClinicalPdfParams): Promise<ArchivedClinicalDocument> {
  if (!params.bytes.length) throw new Error("O PDF esta vazio.");

  // Em produção remota, a clínica ativa é a fronteira tenant. PDFs pequenos
  // (receitas e relatórios compactos) ficam dentro do Clinical Core LIVE,
  // cifrados e auditados no mesmo backend do prontuário. Não há fallback
  // silencioso para tabelas demo ou storage ausente.
  const clinicId = activeClinicId();
  if (clinicId && params.patientId) {
    return archiveInClinicalLive(params, clinicId);
  }

  const binary = new Uint8Array(params.bytes);
  const file = new File([binary.buffer], params.filename.endsWith(".pdf") ? params.filename : `${params.filename}.pdf`, {
    type: "application/pdf",
  });

  const storedFile = await uploadFile({
    file,
    category: params.documentType === "escala" ? "outros" : params.documentType,
    patientId: params.patientId ?? undefined,
  });

  const response = await authFetch("/api/documents", {
    method: "POST",
    body: JSON.stringify({
      fileId: storedFile.id,
      patientId: params.patientId ?? null,
      documentType: params.documentType,
      title: params.title,
      sourceId: params.sourceId ?? null,
      sourceVersion: params.sourceVersion ?? null,
      signatureStatus: params.signatureStatus ?? "unsigned",
      signatureType: params.signatureType ?? null,
      signatureAlgorithm: params.signatureAlgorithm ?? null,
      signerName: params.signerName ?? null,
      certificateSubject: params.certificateSubject ?? null,
      certificateIssuer: params.certificateIssuer ?? null,
      certificateSerial: params.certificateSerial ?? null,
      certificateValidUntil: params.certificateValidUntil ?? null,
      sha256: storedFile.sha256 ?? null,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Falha ao arquivar o documento (${response.status})`);
  }

  const payload = await response.json();
  return { storageMode: "object-storage", document: payload.document, file: storedFile };
}
