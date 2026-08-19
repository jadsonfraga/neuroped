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

export async function archiveClinicalPdf(params: ArchiveClinicalPdfParams): Promise<ArchivedClinicalDocument> {
  if (!params.bytes.length) throw new Error("O PDF esta vazio.");

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
  return { document: payload.document, file: storedFile };
}
