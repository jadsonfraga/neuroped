import { z } from "zod";
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import {
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../tenant/_crypto";

const DOCUMENT_TYPES = new Set(["clinical_note", "report", "prescription", "scale", "school", "other"]);
const ORIGINS = new Set(["clinician", "instrument", "imported", "family", "school", "system", "other"]);
const STATUSES = new Set(["draft", "published"]);
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const ISO_INSTANT = z.string().datetime({ offset: true });
const MAX_CONTENT_BYTES = 250_000;

interface LiveDocumentRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  author_user_id: string;
  document_type: string;
  origin: string;
  status: "draft" | "published" | "superseded" | "voided";
  family_visibility: number;
  current_version: number;
  created_at: string;
  updated_at: string;
}

interface LiveDocumentVersionRow {
  id: string;
  clinic_id: string;
  document_id: string;
  patient_id: string;
  author_user_id: string;
  version: number;
  content_encrypted: string;
  encryption_version: string;
  origin: string;
  issued_at: string;
  status: "draft" | "published" | "superseded" | "voided";
  family_visibility: number;
  superseded_at: string | null;
  created_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizedInstant(value: unknown): string | null {
  const raw = cleanText(value, 64);
  if (!raw) return new Date().toISOString();
  const parsed = ISO_INSTANT.safeParse(raw);
  if (!parsed.success) return null;
  const millis = Date.parse(parsed.data);
  return Number.isFinite(millis) ? new Date(millis).toISOString() : null;
}

function isPlainJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError("Clinical Core LIVE permanece bloqueado.", "CLINICAL_LIVE_DISABLED", 503);
  }
  if (!clinicalCryptoReady(env)) {
    return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }
  return null;
}

async function patientBelongsToClinic(
  db: D1Database,
  clinicId: string,
  patientId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT id FROM live_patients
        WHERE id = ? AND clinic_id = ? AND status <> 'merged' LIMIT 1`,
    )
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

async function decodeDocument(
  env: TenantEnv,
  clinicId: string,
  document: LiveDocumentRow,
  version: LiveDocumentVersionRow,
): Promise<Record<string, unknown>> {
  return {
    id: document.id,
    clinicId: document.clinic_id,
    patientId: document.patient_id,
    authorUserId: document.author_user_id,
    documentType: document.document_type,
    origin: document.origin,
    status: document.status,
    familyVisibility: Boolean(document.family_visibility),
    currentVersion: document.current_version,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    version: {
      id: version.id,
      version: version.version,
      content: await decryptClinicalJson<unknown>(
        env,
        clinicId,
        `document-version:${version.id}`,
        version.content_encrypted,
      ),
      encryptionVersion: version.encryption_version,
      origin: version.origin,
      issuedAt: version.issued_at,
      status: version.status,
      familyVisibility: Boolean(version.family_visibility),
      supersededAt: version.superseded_at,
      createdAt: version.created_at,
    },
  };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

  const url = new URL(context.request.url);
  const clinicId = cleanText(url.searchParams.get("clinicId"), 80);
  const patientId = cleanText(url.searchParams.get("patientId"), 80);
  if (!clinicId || !patientId || !OPAQUE_ID.test(patientId)) {
    return tenantError("clinicId e patientId válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingReadError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingReadError) return billingReadError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  const rows = await db
    .prepare(
      `SELECT d.id, d.clinic_id, d.patient_id, d.author_user_id, d.document_type,
              d.origin, d.status, d.family_visibility, d.current_version,
              d.created_at, d.updated_at,
              v.id AS version_id, v.author_user_id AS version_author_user_id,
              v.version, v.content_encrypted, v.encryption_version,
              v.origin AS version_origin, v.issued_at, v.status AS version_status,
              v.family_visibility AS version_family_visibility, v.superseded_at,
              v.created_at AS version_created_at
         FROM live_documents d
         JOIN live_document_versions v
           ON v.document_id = d.id AND v.version = d.current_version
        WHERE d.clinic_id = ? AND d.patient_id = ?
          AND d.status <> 'voided'
        ORDER BY d.updated_at DESC
        LIMIT 200`,
    )
    .bind(clinicId, patientId)
    .all<LiveDocumentRow & {
      version_id: string;
      version_author_user_id: string;
      version: number;
      content_encrypted: string;
      encryption_version: string;
      version_origin: string;
      issued_at: string;
      version_status: "draft" | "published" | "superseded" | "voided";
      version_family_visibility: number;
      superseded_at: string | null;
      version_created_at: string;
    }>();

  try {
    const data = await Promise.all(
      (rows.results ?? []).map((row) =>
        decodeDocument(context.env, clinicId, row, {
          id: row.version_id,
          clinic_id: row.clinic_id,
          document_id: row.id,
          patient_id: row.patient_id,
          author_user_id: row.version_author_user_id,
          version: row.version,
          content_encrypted: row.content_encrypted,
          encryption_version: row.encryption_version,
          origin: row.version_origin,
          issued_at: row.issued_at,
          status: row.version_status,
          family_visibility: row.version_family_visibility,
          superseded_at: row.superseded_at,
          created_at: row.version_created_at,
        }),
      ),
    );
    return tenantJson({ data });
  } catch (error) {
    console.error("[live.documents.GET] decrypt failure", error);
    return tenantError("Documentos clínicos indisponíveis.", "CLINICAL_DECRYPT_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const clinicId = cleanText(body.clinicId, 80);
  const patientId = cleanText(body.patientId, 80);
  const documentId = cleanText(body.documentId, 120) || null;
  const documentType = cleanText(body.documentType, 40);
  const origin = cleanText(body.origin, 40);
  const status = cleanText(body.status, 20) || "draft";
  const content = body.content;
  const familyVisibility = body.familyVisibility === true;
  const issuedAt = normalizedInstant(body.issuedAt);

  if (!clinicId || !OPAQUE_ID.test(patientId) || !DOCUMENT_TYPES.has(documentType) || !ORIGINS.has(origin)) {
    return tenantError(
      "clinicId, patientId, documentType e origin válidos são obrigatórios.",
      "VALIDATION_ERROR",
      400,
    );
  }
  if (!STATUSES.has(status) || !issuedAt || content === undefined) {
    return tenantError("status, issuedAt e content são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  if (typeof content !== "string" && !isPlainJsonObject(content)) {
    return tenantError("content deve ser texto ou objeto JSON.", "VALIDATION_ERROR", 400);
  }
  if (new TextEncoder().encode(JSON.stringify(content)).byteLength > MAX_CONTENT_BYTES) {
    return tenantError("Conteúdo clínico excede 250 KB.", "PAYLOAD_TOO_LARGE", 413);
  }
  if (documentId && !OPAQUE_ID.test(documentId)) {
    return tenantError("documentId inválido.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) {
    return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingWriteError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingWriteError) return billingWriteError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  let existing: {
    id: string;
    current_version: number;
    status: "draft" | "published" | "superseded" | "voided";
    clinic_id: string;
    patient_id: string;
  } | null = null;
  if (documentId) {
    existing = await db
      .prepare(
        `SELECT id, current_version, status, clinic_id, patient_id
           FROM live_documents
          WHERE id = ? AND clinic_id = ? AND patient_id = ? LIMIT 1`,
      )
      .bind(documentId, clinicId, patientId)
      .first();
    if (!existing) return tenantError("Documento não encontrado nesta clínica.", "DOCUMENT_NOT_FOUND", 404);
    if (existing.status === "voided") return tenantError("Documento voided não pode ser reaberto.", "DOCUMENT_VOIDED", 409);
  }

  const id = documentId ?? crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const version = existing ? existing.current_version + 1 : 1;
  const now = new Date().toISOString();
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const contentEncrypted = await encryptClinicalJson(
    context.env,
    clinicId,
    `document-version:${versionId}`,
    content,
  );

  const statements: D1PreparedStatement[] = [];
  if (existing) {
    statements.push(
      db
        .prepare(
          `UPDATE live_document_versions
              SET status = CASE WHEN status = 'published' THEN 'superseded' ELSE status END,
                  superseded_at = CASE WHEN status = 'published' THEN ? ELSE superseded_at END
            WHERE document_id = ? AND version = ? AND status IN ('draft', 'published')`,
        )
        .bind(now, id, existing.current_version),
    );
    statements.push(
      db
        .prepare(
          `UPDATE live_documents
              SET document_type = ?, origin = ?, status = ?, family_visibility = ?,
                  current_version = ?, updated_at = ?
            WHERE id = ? AND clinic_id = ? AND patient_id = ? AND current_version = ?`,
        )
        .bind(
          documentType,
          origin,
          status,
          familyVisibility ? 1 : 0,
          version,
          now,
          id,
          clinicId,
          patientId,
          existing.current_version,
        ),
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO live_documents
            (id, clinic_id, patient_id, author_user_id, document_type, origin,
             status, family_visibility, current_version, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          id,
          clinicId,
          patientId,
          user.id,
          documentType,
          origin,
          status,
          familyVisibility ? 1 : 0,
          now,
          now,
        ),
    );
  }

  statements.push(
    db
      .prepare(
        `INSERT INTO live_document_versions
          (id, clinic_id, document_id, patient_id, author_user_id, version,
           content_encrypted, encryption_version, origin, issued_at, status,
           family_visibility, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        versionId,
        clinicId,
        id,
        patientId,
        user.id,
        version,
        contentEncrypted,
        encryptionVersion,
        origin,
        issuedAt,
        status,
        familyVisibility ? 1 : 0,
        now,
      ),
  );
  statements.push(
    prepareSaasAudit(
      db,
      {
        clinicId,
        actorUserId: user.id,
        action: existing ? "live_document_version_create" : "live_document_create",
        targetType: "document",
        targetId: id,
        metadata: { version, documentType, status, encryptionVersion },
      },
      true,
    ),
  );

  try {
    const results = await db.batch(statements);
    const documentResultIndex = existing ? 1 : 0;
    const versionResultIndex = existing ? 2 : 1;
    const auditResult = results[results.length - 1];
    if (
      Number(results[documentResultIndex]?.meta?.changes ?? 0) !== 1 ||
      Number(results[versionResultIndex]?.meta?.changes ?? 0) !== 1 ||
      Number(auditResult?.meta?.changes ?? 0) !== 1
    ) {
      return tenantError("Documento mudou durante a edição. Recarregue antes de publicar.", "DOCUMENT_STALE", 409);
    }
  } catch (error) {
    console.error("[live.documents.POST] DB error", error);
    return tenantError("Não foi possível registrar o documento LIVE.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id,
      clinicId,
      patientId,
      authorUserId: user.id,
      documentType,
      origin,
      status,
      familyVisibility,
      currentVersion: version,
      version: {
        id: versionId,
        version,
        content,
        encryptionVersion,
        origin,
        issuedAt,
        status,
        familyVisibility,
        supersededAt: null,
        createdAt: now,
      },
      createdAt: existing ? undefined : now,
      updatedAt: now,
    },
    201,
  );
};
