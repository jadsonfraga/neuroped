import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import { getClinicMembership, membershipCanReadClinical, tenantError } from "../tenant/_core";
import { clinicalCryptoReady } from "../tenant/_crypto";
import { getDecryptedObject, type OperationalEnv } from "./_operational";

function text(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

export const onRequestGet: PagesFunction<OperationalEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); const url = new URL(context.request.url); const clinicId = text(url.searchParams.get("clinicId"), 80); const requestId = text(url.searchParams.get("requestId"), 120);
  if (!db) return tenantError("Banco LIVE não configurado.", "DB_REQUIRED", 503); if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401); if (!OPAQUE_ID.test(clinicId) || !OPAQUE_ID.test(requestId)) return tenantError("Identificadores inválidos.", "VALIDATION_ERROR", 400); if (!clinicalCryptoReady(context.env)) return tenantError("Keyring clínico não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  const membership = await getClinicMembership(db, clinicId, user); if (!membership || !membershipCanReadClinical(membership)) return tenantError("Acesso negado.", "TENANT_FORBIDDEN", 403); const entitlement = await requireBillingEntitlement(db, user.id, clinicId, "export"); if (entitlement) return entitlement;
  const row = await db.prepare(`SELECT artifact_key, artifact_digest_sha256, artifact_byte_length FROM live_export_requests WHERE id = ? AND clinic_id = ? AND status = 'completed' LIMIT 1`).bind(requestId, clinicId).first<{ artifact_key: string | null; artifact_digest_sha256: string | null; artifact_byte_length: number | null }>();
  if (!row?.artifact_key) return tenantError("Exportação não disponível.", "EXPORT_NOT_READY", 404);
  const data = await getDecryptedObject(context.env, clinicId, `lgpd-export:${requestId}`, row.artifact_key); if (!data) return tenantError("Artefato não encontrado no storage.", "EXPORT_OBJECT_NOT_FOUND", 404);
  return new Response(data, { status: 200, headers: { "Content-Type": "application/json", "Content-Length": String(data.byteLength), "Content-Disposition": `attachment; filename="neuroped-export-${requestId}.json"`, "Cache-Control": "private, no-store", "X-Artifact-SHA256": row.artifact_digest_sha256 ?? "" } });
};
