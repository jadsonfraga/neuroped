import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  tenantError,
  tenantJson,
} from "../tenant/_core";
import { clinicalCryptoReady } from "../tenant/_crypto";
import {
  appendAuditChain,
  getDecryptedObject,
  opaqueObjectKey,
  operationalBucket,
  putEncryptedObject,
  safeOperationalError,
  type OperationalEnv,
} from "./_operational";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const MAX_PDF_BYTES = 20 * 1024 * 1024;

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) return null;
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

function isPdf(bytes: Uint8Array): boolean {
  return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
}

async function authorize(
  db: D1Database | undefined,
  env: OperationalEnv,
  user: ReturnType<typeof getContextUser>,
  clinicId: string,
  mode: "read" | "write",
): Promise<Response | null> {
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicalCryptoReady(env) || !operationalBucket(env)) {
    return tenantError("Arquivamento PDF não está configurado.", "PDF_ARCHIVE_NOT_CONFIGURED", 503);
  }
  if (!OPAQUE_ID.test(clinicId)) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || (mode === "read" ? !membershipCanReadClinical(membership) : !membershipCanWriteClinical(membership))) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const entitlement = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  return entitlement;
}

export const onRequestGet: PagesFunction<OperationalEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  const url = new URL(context.request.url);
  const clinicId = cleanText(url.searchParams.get("clinicId"), 80);
  const patientId = cleanText(url.searchParams.get("patientId"), 120);
  const archiveId = cleanText(url.searchParams.get("archiveId"), 120);
  const denial = await authorize(db, context.env, user, clinicId, "read");
  if (denial) return denial;
  if (patientId && !OPAQUE_ID.test(patientId)) return tenantError("Paciente inválido.", "VALIDATION_ERROR", 400);
  if (archiveId && !OPAQUE_ID.test(archiveId)) return tenantError("Arquivo inválido.", "VALIDATION_ERROR", 400);

  if (archiveId) {
    const row = await db!.prepare(
      `SELECT id, patient_id, document_type, version, sha256, byte_length, content_type
         FROM live_pdf_archives
        WHERE id = ? AND clinic_id = ? AND status = 'archived' LIMIT 1`,
    ).bind(archiveId, clinicId).first<{
      id: string; patient_id: string; document_type: string; version: number;
      sha256: string; byte_length: number; content_type: string;
    }>();
    if (!row) return tenantError("PDF não encontrado nesta clínica.", "PDF_NOT_FOUND", 404);
    try {
      const plain = await getDecryptedObject(context.env, clinicId, `clinical-pdf:${archiveId}`, await db!.prepare(
        `SELECT object_key FROM live_pdf_archives WHERE id = ? AND clinic_id = ? AND status = 'archived' LIMIT 1`,
      ).bind(archiveId, clinicId).first<{ object_key: string }>().then((value) => value?.object_key ?? ""));
      if (!plain) return tenantError("PDF não encontrado no storage.", "PDF_OBJECT_NOT_FOUND", 404);
      return new Response(plain, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(plain.byteLength),
          "Content-Disposition": `attachment; filename="neuroped-${archiveId}.pdf"`,
          "Cache-Control": "private, no-store",
          "X-Content-SHA256": row.sha256,
        },
      });
    } catch (error) {
      return tenantError("PDF indisponível.", safeOperationalError(error), 503);
    }
  }

  const rows = await db!.prepare(
    `SELECT id, clinic_id, patient_id, document_id, document_version_id, document_type,
            author_user_id, created_at, version, sha256, byte_length, status
       FROM live_pdf_archives
      WHERE clinic_id = ? AND status = 'archived'
        AND (? = '' OR patient_id = ?)
      ORDER BY created_at DESC LIMIT 200`,
  ).bind(clinicId, patientId, patientId).all();
  return tenantJson({ data: rows.results ?? [] });
};

export const onRequestPost: PagesFunction<OperationalEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = cleanText(body.clinicId, 80);
  const patientId = cleanText(body.patientId, 120);
  const documentId = cleanText(body.documentId, 120);
  const documentVersionId = cleanText(body.documentVersionId, 120);
  const pdfBase64 = cleanText(body.pdfBase64, MAX_PDF_BYTES * 2);
  const denial = await authorize(db, context.env, user, clinicId, "write");
  if (denial) return denial;
  if (!OPAQUE_ID.test(patientId) || !OPAQUE_ID.test(documentId) || !OPAQUE_ID.test(documentVersionId)) {
    return tenantError("clinicId, patientId, documentId e documentVersionId são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  const pdf = base64ToBytes(pdfBase64);
  if (!pdf || pdf.byteLength < 5 || pdf.byteLength > MAX_PDF_BYTES || !isPdf(pdf)) {
    return tenantError("Envie um PDF válido dentro do limite de 20 MB.", "PDF_INVALID", 400);
  }

  const source = await db!.prepare(
    `SELECT d.document_type, d.patient_id, v.version, v.id AS version_id
       FROM live_documents d
       JOIN live_document_versions v ON v.document_id = d.id AND v.version = d.current_version
      WHERE d.id = ? AND d.clinic_id = ? AND d.patient_id = ?
        AND v.id = ? AND v.status = 'published' LIMIT 1`,
  ).bind(documentId, clinicId, patientId, documentVersionId).first<{
    document_type: string; patient_id: string; version: number; version_id: string;
  }>();
  if (!source) return tenantError("Versão publicada não encontrada nesta clínica.", "DOCUMENT_VERSION_NOT_FOUND", 404);

  const archiveId = crypto.randomUUID();
  const objectKey = opaqueObjectKey("clinical-pdf");
  let digest: { sha256: string; byteLength: number };
  try {
    digest = await putEncryptedObject(context.env, clinicId, `clinical-pdf:${archiveId}`, objectKey, pdf, {
      archiveId,
      clinicId,
      documentId,
      documentVersionId,
    });
    await db!.prepare(
      `INSERT INTO live_pdf_archives
        (id, clinic_id, patient_id, document_id, document_version_id, document_type,
         author_user_id, created_at, version, sha256, object_key, byte_length, content_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'application/pdf', 'archived')`,
    ).bind(
      archiveId,
      clinicId,
      patientId,
      documentId,
      documentVersionId,
      source.document_type,
      user!.id,
      new Date().toISOString(),
      source.version,
      digest.sha256,
      objectKey,
      digest.byteLength,
    ).run();
    await appendAuditChain(db!, {
      clinicId,
      actorUserId: user!.id,
      action: "live_pdf_archive_create",
      targetType: "pdf_archive",
      targetId: archiveId,
      result: "success",
      metadata: { version: source.version, byteLength: digest.byteLength, sha256: digest.sha256 },
    });
  } catch (error) {
    try { await (context.env.CLINICAL_PDF_BUCKET ?? context.env.CLINICAL_ARTIFACT_BUCKET)?.delete(objectKey); } catch { /* storage rollback best-effort */ }
    return tenantError("Não foi possível arquivar o PDF.", safeOperationalError(error), 500);
  }

  return tenantJson({
    id: archiveId,
    clinicId,
    patientId,
    documentId,
    documentVersionId,
    version: source.version,
    sha256: digest.sha256,
    byteLength: digest.byteLength,
    status: "archived",
    download: `/api/live/pdf-archives?clinicId=${encodeURIComponent(clinicId)}&archiveId=${encodeURIComponent(archiveId)}`,
  }, 201);
};
