import { getContextUser } from "../../auth/_authorization";
import {
  getClinicMembership,
  tenantError,
  type TenantEnv,
} from "../../tenant/_core";
import { collectTenantExportPayload } from "../../tenant/_exportPayload";
import {
  TENANT_EXPORT_SCHEMA_VERSION,
  TENANT_SYNC_EXPORT_LIMITS,
} from "../../../../shared/tenantLifecycle";
import { sha256Hex } from "../../auth/_crypto";

function clinicIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? ""))
    .trim()
    .slice(0, 80);
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db)
    return tenantError(
      "Banco SaaS não configurado.",
      "SAAS_DB_NOT_CONFIGURED",
      503,
    );
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const clinicId = clinicIdFrom(
    context.params as Record<string, string | string[]>,
  );
  if (!clinicId)
    return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !["owner", "clinic_admin"].includes(membership.role)) {
    return tenantError(
      "Apenas gestores podem exportar o tenant completo.",
      "TENANT_EXPORT_FORBIDDEN",
      403,
    );
  }
  if (membership.clinicStatus === "closed") {
    return tenantError("A clínica está encerrada.", "TENANT_CLOSED", 410);
  }

  // A coleta vive em functions/api/tenant/_exportPayload.ts para que o executor
  // assíncrono de LGPD use exatamente o mesmo payload — antes ela estava inline
  // aqui e o worker não conseguia reaproveitá-la.
  const collected = await collectTenantExportPayload(
    db,
    context.env,
    clinicId,
    {
      enforceSyncLimits: true,
    },
  );
  if (!collected.ok) {
    return tenantError(collected.message, collected.code, collected.status);
  }
  const { data, counts: safeCounts } = collected;
  const generatedAt = new Date().toISOString();

  const digestInput = JSON.stringify({
    schemaVersion: TENANT_EXPORT_SCHEMA_VERSION,
    generatedAt,
    data,
  });
  const digestSha256 = await sha256Hex(digestInput);
  const exportId = crypto.randomUUID();
  const document = {
    manifest: {
      exportId,
      schemaVersion: TENANT_EXPORT_SCHEMA_VERSION,
      generatedAt,
      digestAlgorithm: "SHA-256",
      digestSha256,
      counts: {
        patients: safeCounts.patients,
        clinicalEvents: safeCounts.events,
        memberships: safeCounts.memberships,
      },
      complete: true,
    },
    data,
  };
  const text = JSON.stringify(document);
  const byteLength = new TextEncoder().encode(text).byteLength;
  if (byteLength > TENANT_SYNC_EXPORT_LIMITS.outputBytes) {
    return tenantError(
      "A exportação completa excede o limite de resposta; nenhum arquivo parcial foi entregue.",
      "TENANT_EXPORT_TOO_LARGE",
      413,
    );
  }

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO tenant_export_events
          (id, clinic_id, requested_by_user_id, schema_version, format,
           patient_count, event_count, membership_count, byte_length, digest_sha256, created_at)
         VALUES (?, ?, ?, ?, 'json', ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          exportId,
          clinicId,
          user.id,
          TENANT_EXPORT_SCHEMA_VERSION,
          safeCounts.patients,
          safeCounts.events,
          safeCounts.memberships,
          byteLength,
          digestSha256,
          generatedAt,
        ),
      db
        .prepare(
          `INSERT INTO saas_audit_log
          (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
         VALUES (?, ?, ?, 'tenant_export_created', 'tenant_export', ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          clinicId,
          user.id,
          exportId,
          JSON.stringify({
            schemaVersion: TENANT_EXPORT_SCHEMA_VERSION,
            patientCount: safeCounts.patients,
            eventCount: safeCounts.events,
            membershipCount: safeCounts.memberships,
            byteLength,
          }),
          generatedAt,
        ),
    ]);
  } catch (error) {
    console.error("[tenant.export] audit persistence", error);
    return tenantError(
      "A exportação não foi liberada porque a trilha de auditoria não pôde ser registrada.",
      "TENANT_EXPORT_AUDIT_FAILED",
      500,
    );
  }

  const date = generatedAt.slice(0, 10);
  const filename = `neuroped-${membership.clinicSlug}-export-${date}.json`;
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-NeuroPed-Export-Schema": TENANT_EXPORT_SCHEMA_VERSION,
      "X-NeuroPed-Export-Digest": digestSha256,
    },
  });
};
