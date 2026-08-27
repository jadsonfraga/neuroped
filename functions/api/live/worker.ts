import { decryptClinicalJson } from "../tenant/_crypto";
import {
  appendAuditChain,
  deleteObject,
  operationalBucket,
  putEncryptedObject,
  safeOperationalError,
  workerAuthorized,
  type OperationalEnv,
} from "./_operational";

type WorkerRow = {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  scope: "clinic" | "patient";
  worker_attempts: number;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function error(message: string, code: string, status: number): Response {
  return json({ error: message, code }, status);
}

function actorId(env: OperationalEnv): string | null {
  const value = (env as OperationalEnv & { WORKER_ACTOR_USER_ID?: string }).WORKER_ACTOR_USER_ID?.trim();
  return value || null;
}

async function claim(
  db: D1Database,
  table: "live_export_requests" | "live_deletion_requests",
  id: string,
): Promise<boolean> {
  const result = await db.prepare(
    `UPDATE ${table}
        SET status = 'processing', worker_attempts = worker_attempts + 1,
            worker_claimed_at = CURRENT_TIMESTAMP,
            worker_lease_until = datetime('now', '+10 minutes'),
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND status IN ('approved','processing')
        AND (worker_lease_until IS NULL OR worker_lease_until < CURRENT_TIMESTAMP)`,
  ).bind(id).run();
  return Number(result.meta?.changes ?? 0) === 1;
}

async function nextRequest(
  db: D1Database,
  table: "live_export_requests" | "live_deletion_requests",
): Promise<WorkerRow | null> {
  return db.prepare(
    `SELECT id, clinic_id, patient_id, scope, worker_attempts
       FROM ${table}
      WHERE status IN ('approved','processing')
        AND (worker_lease_until IS NULL OR worker_lease_until < CURRENT_TIMESTAMP)
      ORDER BY requested_at ASC LIMIT 1`,
  ).first<WorkerRow>();
}

async function claimNext(
  db: D1Database,
  table: "live_export_requests" | "live_deletion_requests",
): Promise<WorkerRow | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const row = await nextRequest(db, table);
    if (!row) return null;
    if (await claim(db, table, row.id)) return row;
  }
  return null;
}

async function audit(
  db: D1Database,
  actorUserId: string,
  request: WorkerRow,
  action: string,
  result: "success" | "denied" | "failure" | "blocked",
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await appendAuditChain(db, {
    clinicId: request.clinic_id,
    actorUserId,
    action,
    targetType: request.scope === "patient" ? "patient_rights_request" : "clinic_rights_request",
    targetId: request.id,
    result,
    metadata: { requestId: request.id, scope: request.scope, attempt: request.worker_attempts + 1, ...metadata },
  });
}

async function exportRequest(
  db: D1Database,
  env: OperationalEnv,
  request: WorkerRow,
  actorUserId: string,
): Promise<{ status: string; bytes?: number }> {
  if (!operationalBucket(env)) throw new Error("OBJECT_STORAGE_NOT_CONFIGURED");
  if (request.scope === "patient" && !request.patient_id) throw new Error("PATIENT_SCOPE_ID_MISSING");

  const patientClause = request.scope === "patient" ? " AND p.id = ?" : "";
  const patientBindings = request.scope === "patient" ? [request.clinic_id, request.patient_id] : [request.clinic_id];
  const patients = await db.prepare(
    `SELECT p.id, p.profile_encrypted, p.encryption_version, p.status, p.created_at, p.updated_at
       FROM live_patients p
      WHERE p.clinic_id = ?${patientClause}
      ORDER BY p.created_at ASC`,
  ).bind(...patientBindings).all<{
    id: string; profile_encrypted: string; encryption_version: string;
    status: string; created_at: string; updated_at: string;
  }>();
  if (request.scope === "patient" && (patients.results?.length ?? 0) !== 1) throw new Error("PATIENT_NOT_FOUND");

  const patientIds = (patients.results ?? []).map((row) => row.id);
  const events = patientIds.length
    ? await db.prepare(
        `SELECT id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
                provenance_kind, provenance_source, payload_encrypted, encryption_version,
                supersedes_event_id, status, created_at
           FROM live_clinical_events
          WHERE clinic_id = ? AND patient_id IN (${patientIds.map(() => "?").join(",")})
          ORDER BY occurred_at ASC, created_at ASC`,
      ).bind(request.clinic_id, ...patientIds).all()
    : { results: [] };

  const documents = patientIds.length
    ? await db.prepare(
        `SELECT d.id, d.patient_id, d.author_user_id, d.document_type, d.origin, d.status,
                d.family_visibility, d.current_version, d.created_at, d.updated_at,
                v.id AS version_id, v.version, v.content_encrypted, v.encryption_version,
                v.origin AS version_origin, v.issued_at, v.status AS version_status,
                v.family_visibility AS version_family_visibility, v.superseded_at, v.created_at AS version_created_at
           FROM live_documents d
           JOIN live_document_versions v ON v.document_id = d.id AND v.version = d.current_version
          WHERE d.clinic_id = ? AND d.patient_id IN (${patientIds.map(() => "?").join(",")})
          ORDER BY d.updated_at ASC`,
      ).bind(request.clinic_id, ...patientIds).all()
    : { results: [] };

  const assessments = patientIds.length
    ? await db.prepare(
        `SELECT id, patient_id, instrument_id, instrument_version, applied_by_user_id,
                applied_at, provenance_source, payload_encrypted, encryption_version, status, created_at, updated_at
           FROM live_assessments
          WHERE clinic_id = ? AND patient_id IN (${patientIds.map(() => "?").join(",")})
          ORDER BY applied_at ASC`,
      ).bind(request.clinic_id, ...patientIds).all()
    : { results: [] };

  const data = {
    schemaVersion: "neuroped-lgpd-export-v1",
    clinicId: request.clinic_id,
    scope: request.scope,
    generatedAt: new Date().toISOString(),
    data: {
      patients: await Promise.all((patients.results ?? []).map(async (row) => ({
        id: row.id,
        profile: await decryptClinicalJson<unknown>(env, request.clinic_id, `patient-profile:${row.id}`, row.profile_encrypted),
        encryptionVersion: row.encryption_version,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))),
      events: await Promise.all((events.results ?? []).map(async (row: any) => ({
        id: row.id,
        patientId: row.patient_id,
        authorUserId: row.author_user_id,
        eventType: row.event_type,
        occurredAt: row.occurred_at,
        encounterId: row.encounter_id,
        provenanceKind: row.provenance_kind,
        provenanceSource: row.provenance_source,
        payload: await decryptClinicalJson<unknown>(env, request.clinic_id, `clinical-event:${row.id}`, row.payload_encrypted),
        status: row.status,
        createdAt: row.created_at,
      }))),
      documents: await Promise.all((documents.results ?? []).map(async (row: any) => ({
        id: row.id,
        patientId: row.patient_id,
        authorUserId: row.author_user_id,
        documentType: row.document_type,
        origin: row.origin,
        status: row.status,
        currentVersion: row.current_version,
        version: {
          id: row.version_id,
          version: row.version,
          content: await decryptClinicalJson<unknown>(env, request.clinic_id, `document-version:${row.version_id}`, row.content_encrypted),
          origin: row.version_origin,
          issuedAt: row.issued_at,
          status: row.version_status,
          supersededAt: row.superseded_at,
          createdAt: row.version_created_at,
        },
      }))),
      assessments: await Promise.all((assessments.results ?? []).map(async (row: any) => ({
        id: row.id,
        patientId: row.patient_id,
        instrumentId: row.instrument_id,
        instrumentVersion: row.instrument_version,
        appliedByUserId: row.applied_by_user_id,
        appliedAt: row.applied_at,
        provenanceSource: row.provenance_source,
        payload: await decryptClinicalJson<unknown>(env, request.clinic_id, `assessment:${row.id}`, row.payload_encrypted),
        status: row.status,
      }))),
    },
  };

  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const objectKey = `lgpd-export/${request.id}.bin`;
  const digest = await putEncryptedObject(env, request.clinic_id, `lgpd-export:${request.id}`, objectKey, bytes, {
    requestId: request.id,
    clinicId: request.clinic_id,
    scope: request.scope,
  });
  const updated = await db.prepare(
    `UPDATE live_export_requests
        SET artifact_key = ?, artifact_digest_sha256 = ?, artifact_byte_length = ?,
            status = 'completed', completed_at = CURRENT_TIMESTAMP,
            worker_lease_until = NULL, failure_code = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND clinic_id = ? AND status = 'processing'`,
  ).bind(objectKey, digest.sha256, digest.byteLength, request.id, request.clinic_id).run();
  if (Number(updated.meta?.changes ?? 0) !== 1) throw new Error("EXPORT_COMPLETION_STALE");
  await audit(db, actorUserId, request, "live_export_worker_complete", "success", {
    bytes: digest.byteLength,
    sha256: digest.sha256,
  });
  return { status: "completed", bytes: digest.byteLength };
}

async function deletePatientData(
  db: D1Database,
  env: OperationalEnv,
  request: WorkerRow,
): Promise<Record<string, number>> {
  if (!request.patient_id) throw new Error("PATIENT_SCOPE_ID_MISSING");
  const patientId = request.patient_id;
  const clinicId = request.clinic_id;
  const counts: Record<string, number> = {};
  const pdfs = await db.prepare(
    `SELECT id, object_key FROM live_pdf_archives
      WHERE clinic_id = ? AND patient_id = ? AND status = 'archived'`,
  ).bind(clinicId, patientId).all<{ id: string; object_key: string | null }>();
  for (const pdf of pdfs.results ?? []) {
    if (pdf.object_key) await deleteObject(env, pdf.object_key);
    await db.prepare(`UPDATE live_pdf_archives SET status = 'redacted', object_key = NULL WHERE id = ? AND clinic_id = ? AND status = 'archived'`).bind(pdf.id, clinicId).run();
    await db.prepare(`DELETE FROM live_pdf_archives WHERE id = ? AND clinic_id = ? AND status = 'redacted'`).bind(pdf.id, clinicId).run();
  }
  counts.pdfArchives = pdfs.results?.length ?? 0;

  const tables: Array<[string, string]> = [
    ["live_assessment_responses", "clinic_id = ? AND patient_id = ?"],
    ["live_assessments", "clinic_id = ? AND patient_id = ?"],
    ["live_epilepsy_safety_plans", "clinic_id = ? AND patient_id = ?"],
    ["live_previsit_submissions", "clinic_id = ? AND patient_id = ?"],
    ["family_portal_invites", "clinic_id = ? AND patient_id = ?"],
    ["live_clinical_drafts", "clinic_id = ? AND patient_id = ?"],
    ["live_documents", "clinic_id = ? AND patient_id = ?"],
    ["live_clinical_events", "clinic_id = ? AND patient_id = ?"],
  ];
  for (const [table, where] of tables) {
    const result = await db.prepare(`DELETE FROM ${table} WHERE ${where}`).bind(clinicId, patientId).run();
    counts[table] = Number(result.meta?.changes ?? 0);
  }
  await db.prepare(`UPDATE live_export_requests SET patient_id = NULL WHERE clinic_id = ? AND patient_id = ?`).bind(clinicId, patientId).run();
  await db.prepare(`UPDATE live_deletion_requests SET patient_id = NULL WHERE clinic_id = ? AND patient_id = ? AND id <> ?`).bind(clinicId, patientId, request.id).run();
  const patient = await db.prepare(`DELETE FROM live_patients WHERE clinic_id = ? AND id = ?`).bind(clinicId, patientId).run();
  counts.live_patients = Number(patient.meta?.changes ?? 0);
  if (counts.live_patients !== 1) throw new Error("PATIENT_DELETE_NOT_APPLIED");
  return counts;
}

async function deletionRequest(
  db: D1Database,
  env: OperationalEnv,
  request: WorkerRow,
  actorUserId: string,
): Promise<{ status: string; counts?: Record<string, number> }> {
  const lifecycle = await db.prepare(`SELECT legal_hold, status, retention_until FROM tenant_lifecycle WHERE clinic_id = ? LIMIT 1`).bind(request.clinic_id).first<{ legal_hold: number; status: string; retention_until: string | null }>();
  if (lifecycle?.legal_hold === 1) {
    await db.prepare(`UPDATE live_deletion_requests SET status = 'rejected', failure_code = 'LEGAL_HOLD', worker_lease_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ? AND status = 'processing'`).bind(request.id, request.clinic_id).run();
    await audit(db, actorUserId, request, "live_deletion_worker_blocked_legal_hold", "blocked", { reason: "LEGAL_HOLD" });
    return { status: "blocked" };
  }
  if (request.scope === "clinic") {
    await db.prepare(`UPDATE live_deletion_requests SET status = 'rejected', failure_code = 'CLINIC_PURGE_REQUIRES_SEPARATE_APPROVAL', worker_lease_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ? AND status = 'processing'`).bind(request.id, request.clinic_id).run();
    await audit(db, actorUserId, request, "live_deletion_worker_fail", "denied", { reason: "CLINIC_PURGE_REQUIRES_SEPARATE_APPROVAL" });
    return { status: "blocked" };
  }
  const policy = await db.prepare(`SELECT retention_days FROM live_retention_policies WHERE clinic_id = ? LIMIT 1`).bind(request.clinic_id).first<{ retention_days: number }>();
  if (policy && policy.retention_days > 0) {
    const requestedAt = await db.prepare(`SELECT requested_at FROM live_deletion_requests WHERE id = ? AND clinic_id = ? LIMIT 1`).bind(request.id, request.clinic_id).first<{ requested_at: string }>();
    const deadline = Date.parse(requestedAt?.requested_at ?? "") + Number(policy.retention_days) * 86_400_000;
    if (Number.isFinite(deadline) && deadline > Date.now()) {
      await db.prepare(`UPDATE live_deletion_requests SET status = 'rejected', failure_code = 'RETENTION_NOT_EXPIRED', worker_lease_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ? AND status = 'processing'`).bind(request.id, request.clinic_id).run();
      await audit(db, actorUserId, request, "live_deletion_worker_fail", "blocked", { reason: "RETENTION_NOT_EXPIRED" });
      return { status: "blocked" };
    }
  }
  const counts = await deletePatientData(db, env, request);
  const updated = await db.prepare(
    `UPDATE live_deletion_requests
        SET patient_id = NULL, status = 'completed', deleted_counts_json = ?,
            completed_at = CURRENT_TIMESTAMP, worker_lease_until = NULL,
            failure_code = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND clinic_id = ? AND status = 'processing'`,
  ).bind(JSON.stringify(counts), request.id, request.clinic_id).run();
  if (Number(updated.meta?.changes ?? 0) !== 1) throw new Error("DELETION_COMPLETION_STALE");
  await audit(db, actorUserId, request, "live_deletion_worker_complete", "success", counts);
  return { status: "completed", counts };
}

async function runWorker(db: D1Database, env: OperationalEnv, actorUserId: string) {
  const results: Array<Record<string, unknown>> = [];
  for (const kind of ["export", "delete"] as const) {
    const table = kind === "export" ? "live_export_requests" : "live_deletion_requests";
    const request = await claimNext(db, table);
    if (!request) continue;
    await audit(db, actorUserId, request, kind === "export" ? "live_export_worker_claim" : "live_deletion_worker_claim", "success");
    try {
      const result = kind === "export"
        ? await exportRequest(db, env, request, actorUserId)
        : await deletionRequest(db, env, request, actorUserId);
      results.push({ kind, requestId: request.id, ...result });
    } catch (error) {
      const code = safeOperationalError(error);
      await db.prepare(
        `UPDATE ${table} SET status = 'rejected', failure_code = ?, worker_lease_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ? AND status = 'processing'`,
      ).bind(code, request.id, request.clinic_id).run();
      await audit(db, actorUserId, request, kind === "export" ? "live_export_worker_fail" : "live_deletion_worker_fail", "failure", { failureCode: code });
      results.push({ kind, requestId: request.id, status: "failed", failureCode: code });
    }
  }
  return results;
}

export const onRequestPost: PagesFunction<OperationalEnv> = async (context) => {
  if (!workerAuthorized(context.request, context.env)) return error("Worker não autorizado.", "WORKER_UNAUTHORIZED", 401);
  if (!context.env.DB) return error("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  const serviceUser = actorId(context.env);
  if (!serviceUser) return error("Identidade do worker não configurada.", "WORKER_ACTOR_NOT_CONFIGURED", 503);
  try {
    return json({ ok: true, results: await runWorker(context.env.DB, context.env, serviceUser) });
  } catch (error) {
    return error("Worker não conseguiu concluir o ciclo.", safeOperationalError(error), 500);
  }
};
