import { getContextUser } from "../../auth/_authorization";
import {
  getClinicMembership,
  tenantError,
  type TenantEnv,
} from "../../tenant/_core";
import { clinicalCryptoReady, decryptClinicalJson } from "../../tenant/_crypto";
import {
  TENANT_EXPORT_SCHEMA_VERSION,
  TENANT_SYNC_EXPORT_LIMITS,
  effectiveTenantLifecycleStatus,
  exportWithinSyncLimits,
  type TenantLifecycleStatus,
} from "../../../../shared/tenantLifecycle";

interface LifecycleRow {
  status: TenantLifecycleStatus;
  reason_code: string | null;
  requested_at: string | null;
  retention_until: string | null;
  canceled_at: string | null;
  finalized_at: string | null;
  legal_hold: number;
}

interface CountRow {
  patients: number;
  events: number;
  memberships: number;
  encrypted_bytes: number;
}

interface PatientRow {
  id: string;
  primary_professional_user_id: string | null;
  profile_encrypted: string;
  encryption_version: string;
  status: string;
  merged_into_patient_id: string | null;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  id: string;
  patient_id: string;
  author_user_id: string;
  event_type: string;
  occurred_at: string;
  encounter_id: string | null;
  provenance_kind: string;
  provenance_source: string;
  payload_encrypted: string;
  encryption_version: string;
  supersedes_event_id: string | null;
  status: string;
  created_at: string;
}

function clinicIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 80);
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const clinicId = clinicIdFrom(context.params as Record<string, string | string[]>);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !["owner", "clinic_admin"].includes(membership.role)) {
    return tenantError("Apenas gestores podem exportar o tenant completo.", "TENANT_EXPORT_FORBIDDEN", 403);
  }
  if (membership.clinicStatus === "closed") {
    return tenantError("A clínica está encerrada.", "TENANT_CLOSED", 410);
  }

  let lifecycle: LifecycleRow | null;
  try {
    lifecycle = await db.prepare(
      `SELECT status, reason_code, requested_at, retention_until, canceled_at,
              finalized_at, legal_hold
         FROM tenant_lifecycle WHERE clinic_id = ? LIMIT 1`,
    ).bind(clinicId).first<LifecycleRow>();
  } catch (error) {
    console.error("[tenant.export] lifecycle schema", error);
    return tenantError("Lifecycle do tenant ainda não migrado.", "TENANT_LIFECYCLE_NOT_CONFIGURED", 503);
  }
  if (!lifecycle) return tenantError("Lifecycle do tenant não encontrado.", "TENANT_LIFECYCLE_NOT_FOUND", 409);

  const counts = await db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM live_patients WHERE clinic_id = ?) AS patients,
       (SELECT COUNT(*) FROM live_clinical_events WHERE clinic_id = ?) AS events,
       (SELECT COUNT(*) FROM clinic_memberships WHERE clinic_id = ?) AS memberships,
       COALESCE((SELECT SUM(length(profile_encrypted)) FROM live_patients WHERE clinic_id = ?), 0)
       + COALESCE((SELECT SUM(length(payload_encrypted)) FROM live_clinical_events WHERE clinic_id = ?), 0)
         AS encrypted_bytes`,
  ).bind(clinicId, clinicId, clinicId, clinicId, clinicId).first<CountRow>();

  const safeCounts = {
    patients: Number(counts?.patients ?? 0),
    events: Number(counts?.events ?? 0),
    memberships: Number(counts?.memberships ?? 0),
    encryptedBytes: Number(counts?.encrypted_bytes ?? 0),
  };
  if (!exportWithinSyncLimits(safeCounts)) {
    return tenantError(
      "O tenant excede o limite seguro para exportação síncrona; nenhum arquivo parcial foi gerado.",
      "TENANT_EXPORT_TOO_LARGE",
      413,
    );
  }
  if ((safeCounts.patients > 0 || safeCounts.events > 0) && !clinicalCryptoReady(context.env)) {
    return tenantError(
      "Keyring clínico necessário para exportação não está configurado.",
      "CLINICAL_CRYPTO_NOT_CONFIGURED",
      503,
    );
  }

  const [clinic, membershipRows, patientRows, eventRows, billingCustomer, subscriptions] = await Promise.all([
    db.prepare(
      `SELECT id, slug, name, legal_name, timezone, status, created_at, updated_at
         FROM clinics WHERE id = ? LIMIT 1`,
    ).bind(clinicId).first<{
      id: string; slug: string; name: string; legal_name: string | null; timezone: string;
      status: string; created_at: string; updated_at: string;
    }>(),
    db.prepare(
      `SELECT user_id, role, active, invited_by_user_id, created_at, updated_at
         FROM clinic_memberships WHERE clinic_id = ? ORDER BY created_at ASC`,
    ).bind(clinicId).all<{
      user_id: string; role: string; active: number; invited_by_user_id: string | null;
      created_at: string; updated_at: string;
    }>(),
    db.prepare(
      `SELECT id, primary_professional_user_id, profile_encrypted, encryption_version,
              status, merged_into_patient_id, created_at, updated_at
         FROM live_patients WHERE clinic_id = ? ORDER BY created_at ASC`,
    ).bind(clinicId).all<PatientRow>(),
    db.prepare(
      `SELECT id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
              provenance_kind, provenance_source, payload_encrypted, encryption_version,
              supersedes_event_id, status, created_at
         FROM live_clinical_events WHERE clinic_id = ? ORDER BY occurred_at ASC, created_at ASC`,
    ).bind(clinicId).all<EventRow>(),
    db.prepare(
      `SELECT provider, status, billing_email, trial_ends_at, last_failed_at,
              canceled_at, grace_ends_at, created_at, updated_at
         FROM billing_customers WHERE clinic_id = ? LIMIT 1`,
    ).bind(clinicId).first<{
      provider: string; status: string; billing_email: string | null; trial_ends_at: string | null;
      last_failed_at: string | null; canceled_at: string | null; grace_ends_at: string | null;
      created_at: string; updated_at: string;
    }>(),
    db.prepare(
      `SELECT bs.plan_id, bs.seats, bs.status, bs.anchored_at,
              bs.current_period_starts_at, bs.current_period_ends_at, bs.canceled_at,
              bs.cancel_reason, bs.created_at, bs.updated_at
         FROM billing_subscriptions bs
         JOIN billing_customers bc ON bc.id = bs.customer_id
        WHERE bc.clinic_id = ? ORDER BY bs.created_at ASC`,
    ).bind(clinicId).all<{
      plan_id: string; seats: number | null; status: string; anchored_at: string;
      current_period_starts_at: string; current_period_ends_at: string | null;
      canceled_at: string | null; cancel_reason: string | null; created_at: string; updated_at: string;
    }>(),
  ]);

  if (!clinic) return tenantError("Clínica não encontrada.", "TENANT_NOT_FOUND", 404);

  let patients: unknown[];
  let events: unknown[];
  try {
    patients = await Promise.all((patientRows.results ?? []).map(async (row) => ({
      id: row.id,
      primaryProfessionalUserId: row.primary_professional_user_id,
      profile: await decryptClinicalJson<unknown>(
        context.env,
        clinicId,
        `patient-profile:${row.id}`,
        row.profile_encrypted,
      ),
      encryptionVersion: row.encryption_version,
      status: row.status,
      mergedIntoPatientId: row.merged_into_patient_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
    events = await Promise.all((eventRows.results ?? []).map(async (row) => ({
      id: row.id,
      patientId: row.patient_id,
      authorUserId: row.author_user_id,
      eventType: row.event_type,
      occurredAt: row.occurred_at,
      encounterId: row.encounter_id,
      provenanceKind: row.provenance_kind,
      provenanceSource: row.provenance_source,
      payload: await decryptClinicalJson<unknown>(
        context.env,
        clinicId,
        `clinical-event:${row.id}`,
        row.payload_encrypted,
      ),
      encryptionVersion: row.encryption_version,
      supersedesEventId: row.supersedes_event_id,
      status: row.status,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error("[tenant.export] decrypt", error);
    return tenantError(
      "Não foi possível decriptar integralmente o tenant; nenhum arquivo parcial foi entregue.",
      "TENANT_EXPORT_DECRYPT_FAILED",
      500,
    );
  }

  const effectiveStatus = effectiveTenantLifecycleStatus({
    status: lifecycle.status,
    requestedAt: lifecycle.requested_at,
    retentionUntil: lifecycle.retention_until,
    legalHold: lifecycle.legal_hold === 1,
  });
  const generatedAt = new Date().toISOString();
  const data = {
    clinic: {
      id: clinic.id,
      slug: clinic.slug,
      name: clinic.name,
      legalName: clinic.legal_name,
      timezone: clinic.timezone,
      status: clinic.status,
      createdAt: clinic.created_at,
      updatedAt: clinic.updated_at,
    },
    lifecycle: {
      status: lifecycle.status,
      effectiveStatus,
      reasonCode: lifecycle.reason_code,
      requestedAt: lifecycle.requested_at,
      retentionUntil: lifecycle.retention_until,
      canceledAt: lifecycle.canceled_at,
      finalizedAt: lifecycle.finalized_at,
      legalHold: lifecycle.legal_hold === 1,
    },
    memberships: (membershipRows.results ?? []).map((row) => ({
      userId: row.user_id,
      role: row.role,
      active: row.active === 1,
      invitedByUserId: row.invited_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    billing: {
      customer: billingCustomer
        ? {
            provider: billingCustomer.provider,
            status: billingCustomer.status,
            billingEmail: billingCustomer.billing_email,
            trialEndsAt: billingCustomer.trial_ends_at,
            lastFailedAt: billingCustomer.last_failed_at,
            canceledAt: billingCustomer.canceled_at,
            graceEndsAt: billingCustomer.grace_ends_at,
            createdAt: billingCustomer.created_at,
            updatedAt: billingCustomer.updated_at,
          }
        : null,
      subscriptions: (subscriptions.results ?? []).map((row) => ({
        planId: row.plan_id,
        seats: row.seats,
        status: row.status,
        anchoredAt: row.anchored_at,
        currentPeriodStartsAt: row.current_period_starts_at,
        currentPeriodEndsAt: row.current_period_ends_at,
        canceledAt: row.canceled_at,
        cancelReason: row.cancel_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    },
    patients,
    clinicalEvents: events,
  };

  const digestInput = JSON.stringify({ schemaVersion: TENANT_EXPORT_SCHEMA_VERSION, generatedAt, data });
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
      db.prepare(
        `INSERT INTO tenant_export_events
          (id, clinic_id, requested_by_user_id, schema_version, format,
           patient_count, event_count, membership_count, byte_length, digest_sha256, created_at)
         VALUES (?, ?, ?, ?, 'json', ?, ?, ?, ?, ?, ?)`,
      ).bind(
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
      db.prepare(
        `INSERT INTO saas_audit_log
          (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
         VALUES (?, ?, ?, 'tenant_export_created', 'tenant_export', ?, ?, ?)`,
      ).bind(
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
