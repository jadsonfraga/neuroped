import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  clampExpiresHours,
  clampMaxViews,
  validatePortalDraft,
  type PortalContent,
} from "../../../../shared/family-portal";
import {
  createFamilyPortalToken,
  extractDocumentForFamily,
} from "../../family-portal/_shared";
import { cleanIntakeText, requireRemoteIntakeConfiguration } from "../../intake/_shared";
import {
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import { currentClinicalEncryptionVersion, decryptClinicalJson, encryptClinicalJson } from "../../tenant/_crypto";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function patientBelongsToClinic(db: D1Database, clinicId: string, patientId: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? AND status <> 'merged' LIMIT 1`)
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

interface ShareListRow {
  id: string;
  status: "active" | "revoked";
  expires_at: string;
  max_views: number;
  view_count: number;
  first_consented_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

/** Lista só metadados de acesso (nunca o conteúdo nem o token). */
export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const url = new URL(context.request.url);
  const clinicId = cleanIntakeText(url.searchParams.get("clinicId"), 80);
  const patientId = cleanIntakeText(url.searchParams.get("patientId"), 120);
  if (!clinicId || !OPAQUE_ID.test(patientId)) return tenantError("clinicId e patientId válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;

  const rows = await db
    .prepare(
      `SELECT id, status, expires_at, max_views, view_count, first_consented_at, last_viewed_at, created_at, revoked_at
         FROM family_portal_shares WHERE clinic_id = ? AND patient_id = ?
        ORDER BY created_at DESC LIMIT 50`,
    )
    .bind(clinicId, patientId)
    .all<ShareListRow>();
  const now = Date.now();
  return tenantJson({
    data: (rows.results ?? []).map((r) => ({
      id: r.id,
      status: r.status === "revoked" ? "revoked" : Date.parse(r.expires_at) <= now ? "expired" : r.view_count >= r.max_views ? "exhausted" : "active",
      expiresAt: r.expires_at,
      maxViews: r.max_views,
      viewCount: r.view_count,
      consentedAt: r.first_consented_at,
      lastViewedAt: r.last_viewed_at,
      createdAt: r.created_at,
      revokedAt: r.revoked_at,
    })),
  });
};

interface DocRow {
  id: string;
  document_type: string;
  origin: string;
  status: string;
  family_visibility: number;
  version_id: string;
  issued_at: string;
  content_encrypted: string;
}

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireRemoteIntakeConfiguration(context.env);
  if (configError) return configError;
  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);

  const clinicId = cleanIntakeText(body.clinicId, 80);
  const patientId = cleanIntakeText(body.patientId, 120);
  if (!clinicId || !OPAQUE_ID.test(patientId)) return tenantError("Dados inválidos.", "VALIDATION_ERROR", 400);
  const expiresInHours = clampExpiresHours(body.expiresInHours);
  const maxViews = clampMaxViews(body.maxViews);
  if (expiresInHours === null) return tenantError("expiresInHours deve estar entre 1 e 720.", "VALIDATION_ERROR", 400);
  if (maxViews === null) return tenantError("maxViews deve estar entre 1 e 10.", "VALIDATION_ERROR", 400);
  if (body.doctorReviewed !== true) {
    return tenantError("Confirme que revisou o conteúdo antes de gerar o link.", "REVIEW_REQUIRED", 400);
  }
  const draft = validatePortalDraft(body.content);
  if (!draft.ok) return tenantError(draft.message, "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  if (!(await patientBelongsToClinic(db, clinicId, patientId))) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);

  // Documentos: só os já publicados E liberados à família no prontuário; nunca
  // saída automática de instrumento próprio (origem "instrument") nem escalas.
  const documentos = [];
  for (const documentId of draft.value.documentIds) {
    const row = await db
      .prepare(
        `SELECT d.id, d.document_type, d.origin, d.status, d.family_visibility,
                v.id AS version_id, v.issued_at, v.content_encrypted
           FROM live_documents d JOIN live_document_versions v ON v.document_id = d.id AND v.version = d.current_version
          WHERE d.id = ? AND d.clinic_id = ? AND d.patient_id = ? LIMIT 1`,
      )
      .bind(documentId, clinicId, patientId)
      .first<DocRow>();
    if (!row || row.status !== "published" || !row.family_visibility) {
      return tenantError("Só documentos publicados e liberados à família podem entrar no portal.", "DOCUMENT_NOT_RELEASED", 400);
    }
    if (row.origin === "instrument" || row.document_type === "scale") {
      return tenantError("Resultados de instrumentos/escalas não são enviados pelo portal; o médico os explica na consulta.", "DOCUMENT_NOT_ALLOWED", 400);
    }
    const content = await decryptClinicalJson<string | Record<string, unknown>>(context.env, clinicId, `document-version:${row.version_id}`, row.content_encrypted);
    const doc = extractDocumentForFamily(row.id, row.document_type, row.issued_at, content);
    if (!doc) return tenantError("Documento sem texto exportável.", "DOCUMENT_EMPTY", 400);
    documentos.push(doc);
  }

  const { documentIds: _ignored, ...rest } = draft.value;
  void _ignored;
  const content: PortalContent = { ...rest, documentos };

  const shareId = crypto.randomUUID();
  const { token, tokenHash } = await createFamilyPortalToken(context.env, clinicId, shareId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 3_600_000).toISOString();
  const encrypted = await encryptClinicalJson(context.env, clinicId, `family-portal-share:${shareId}`, content);

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO family_portal_shares
            (id, clinic_id, patient_id, created_by_user_id, token_hash, status, expires_at, max_views,
             view_count, content_encrypted, encryption_version, created_at)
           VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0, ?, ?, ?)`,
        )
        .bind(shareId, clinicId, patientId, user.id, tokenHash, expiresAt, maxViews, encrypted, currentClinicalEncryptionVersion(context.env), now.toISOString()),
      prepareSaasAudit(db, {
        clinicId,
        actorUserId: user.id,
        action: "family_portal_share_create",
        targetType: "family_portal_share",
        targetId: shareId,
        // Só contagens: nada de conteúdo, nome ou token.
        metadata: {
          expiresInHours,
          maxViews,
          orientacoes: content.orientacoes.length,
          lembretes: content.lembretes.length,
          documentos: content.documentos.length,
          questionarios: content.questionarios.length,
          avaliacoesProprias: content.avaliacoesProprias.length,
        },
      }),
    ]);
  } catch (error) {
    console.error("[live.family-portal.POST] create failure", error);
    return tenantError("Não foi possível criar o link.", "PORTAL_CREATE_FAILED", 500);
  }

  return tenantJson(
    { id: shareId, token, expiresAt, maxViews, tokenNotice: "O token é exibido uma única vez e não é armazenado em texto claro. Nada foi enviado: copie a mensagem e envie você mesmo." },
    201,
  );
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const clinicId = cleanIntakeText(body.clinicId, 80);
  const patientId = cleanIntakeText(body.patientId, 120);
  const shareId = cleanIntakeText(body.shareId, 120);
  if (!clinicId || !OPAQUE_ID.test(patientId) || !OPAQUE_ID.test(shareId) || body.action !== "revoke") {
    return tenantError("Ação inválida.", "VALIDATION_ERROR", 400);
  }
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  const now = new Date().toISOString();
  const results = await db.batch([
    db
      .prepare(`UPDATE family_portal_shares SET status = 'revoked', revoked_at = ? WHERE id = ? AND clinic_id = ? AND patient_id = ? AND status = 'active'`)
      .bind(now, shareId, clinicId, patientId),
    prepareSaasAudit(db, { clinicId, actorUserId: user.id, action: "family_portal_share_revoke", targetType: "family_portal_share", targetId: shareId }, true),
  ]);
  if ((results[0]?.meta?.changes ?? 0) !== 1) return tenantError("Link não encontrado ou já cancelado.", "SHARE_NOT_ACTIVE", 404);
  return tenantJson({ id: shareId, status: "revoked" });
};
