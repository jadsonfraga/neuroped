import type { SaasAuditParams } from "../../tenant/_core";

export type LgpdWorkerRequestType = "export" | "delete";

export interface LgpdWorkerClaim {
  jobId: string;
  requestType: LgpdWorkerRequestType;
  requestId: string;
  clinicId: string;
  attempt: number;
  claimedAt: string;
  leaseUntil: string;
  workerRunId: string;
}

export interface LgpdExportEvidence {
  artifactKey: string;
  digestSha256: string;
  byteLength: number;
}

export interface LgpdDeletionEvidence {
  deletedCounts: Record<string, number>;
}

interface RequestRow {
  id: string;
  clinic_id: string;
  status: string;
}

interface WorkerJobRow {
  id: string;
  attempts: number;
}

const REQUEST_TABLES: Record<LgpdWorkerRequestType, string> = {
  export: "live_export_requests",
  delete: "live_deletion_requests",
};

export const LGPD_WORKER_LEASE_MS = 10 * 60 * 1000;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_:-]{0,199}$/;
const FAILURE_CODE = /^[A-Z0-9][A-Z0-9_:-]{0,79}$/;
const COUNT_KEY = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;
const SHA256_HEX = /^[a-f0-9]{64}$/i;

function iso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("LGPD_WORKER_INVALID_TIME");
  return date.toISOString();
}

function requireOpaque(value: string, code: string): string {
  const clean = value.trim();
  if (!OPAQUE_ID.test(clean)) throw new Error(code);
  return clean;
}

function jobIdFor(requestType: LgpdWorkerRequestType, requestId: string): string {
  return `lgpd:${requestType}:${requestId}`;
}

export function normalizeExportEvidence(input: LgpdExportEvidence): LgpdExportEvidence {
  const artifactKey = input.artifactKey.trim();
  const digestSha256 = input.digestSha256.trim().toLowerCase();
  if (!artifactKey || artifactKey.length > 500) throw new Error("LGPD_EXPORT_ARTIFACT_KEY_INVALID");
  if (!SHA256_HEX.test(digestSha256)) throw new Error("LGPD_EXPORT_DIGEST_INVALID");
  if (!Number.isSafeInteger(input.byteLength) || input.byteLength <= 0) {
    throw new Error("LGPD_EXPORT_BYTE_LENGTH_INVALID");
  }
  return { artifactKey, digestSha256, byteLength: input.byteLength };
}

export function normalizeDeletedCounts(input: LgpdDeletionEvidence): Record<string, number> {
  const entries = Object.entries(input.deletedCounts ?? {});
  if (!entries.length) throw new Error("LGPD_DELETE_COUNTS_REQUIRED");
  const normalized: Record<string, number> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim();
    if (!COUNT_KEY.test(key)) throw new Error("LGPD_DELETE_COUNT_KEY_INVALID");
    if (!Number.isSafeInteger(rawValue) || rawValue < 0) throw new Error("LGPD_DELETE_COUNT_INVALID");
    normalized[key] = rawValue;
  }
  return normalized;
}

/**
 * Claim atômico por request. A UNIQUE(request_type, request_id) impede jobs
 * duplicados; o UPDATE condicionado ao lease garante que dois executores
 * concorrentes não adquiram a mesma solicitação.
 */
export async function claimLgpdRequest(
  db: D1Database,
  requestType: LgpdWorkerRequestType,
  requestIdInput: string,
  workerRunIdInput: string,
  nowInput: Date | string = new Date(),
  leaseMs = LGPD_WORKER_LEASE_MS,
): Promise<LgpdWorkerClaim | null> {
  const requestId = requireOpaque(requestIdInput, "LGPD_WORKER_REQUEST_ID_INVALID");
  const workerRunId = requireOpaque(workerRunIdInput, "LGPD_WORKER_RUN_ID_INVALID");
  if (!Number.isSafeInteger(leaseMs) || leaseMs < 60_000 || leaseMs > 60 * 60 * 1000) {
    throw new Error("LGPD_WORKER_LEASE_INVALID");
  }
  const claimedAt = iso(nowInput);
  const leaseUntil = new Date(new Date(claimedAt).getTime() + leaseMs).toISOString();
  const table = REQUEST_TABLES[requestType];

  const request = await db
    .prepare(`SELECT id, clinic_id, status FROM ${table} WHERE id = ? LIMIT 1`)
    .bind(requestId)
    .first<RequestRow>();
  if (!request || !["approved", "processing"].includes(request.status)) return null;

  const jobId = jobIdFor(requestType, requestId);
  await db
    .prepare(
      `INSERT OR IGNORE INTO live_lgpd_worker_jobs
        (id, request_type, request_id, clinic_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'queued', ?, ?)`,
    )
    .bind(jobId, requestType, requestId, request.clinic_id, claimedAt, claimedAt)
    .run();

  const claimed = await db
    .prepare(
      `UPDATE live_lgpd_worker_jobs
          SET status = 'processing',
              attempts = attempts + 1,
              claimed_at = ?,
              lease_until = ?,
              worker_run_id = ?,
              failure_code = NULL,
              updated_at = ?
        WHERE request_type = ?
          AND request_id = ?
          AND clinic_id = ?
          AND (
            status IN ('queued','failed')
            OR (status = 'processing' AND (lease_until IS NULL OR lease_until < ?))
          )
          AND EXISTS (
            SELECT 1 FROM ${table} r
             WHERE r.id = live_lgpd_worker_jobs.request_id
               AND r.clinic_id = live_lgpd_worker_jobs.clinic_id
               AND r.status IN ('approved','processing')
          )`,
    )
    .bind(
      claimedAt,
      leaseUntil,
      workerRunId,
      claimedAt,
      requestType,
      requestId,
      request.clinic_id,
      claimedAt,
    )
    .run();
  if (Number(claimed.meta?.changes ?? 0) !== 1) return null;

  await db
    .prepare(
      `UPDATE ${table}
          SET status = 'processing', updated_at = ?
        WHERE id = ? AND clinic_id = ? AND status = 'approved'`,
    )
    .bind(claimedAt, requestId, request.clinic_id)
    .run();

  // Fecha a janela entre o claim e a promoção da request: se um gestor
  // rejeitou a solicitação nesse intervalo, o worker não pode executá-la —
  // e o job não pode ficar 'processing' para sempre (zumbi), já que um novo
  // claim exigiria a request em approved/processing. Libera o claim marcando
  // o job como failed recuperável e desiste.
  const requestState = await db
    .prepare(`SELECT status FROM ${table} WHERE id = ? AND clinic_id = ? LIMIT 1`)
    .bind(requestId, request.clinic_id)
    .first<{ status: string }>();
  if (requestState?.status !== "processing") {
    await db
      .prepare(
        `UPDATE live_lgpd_worker_jobs
            SET status = 'failed', failure_code = 'REQUEST_STATE_CHANGED',
                lease_until = NULL, updated_at = ?
          WHERE request_type = ? AND request_id = ? AND clinic_id = ?
            AND status = 'processing' AND worker_run_id = ?`,
      )
      .bind(claimedAt, requestType, requestId, request.clinic_id, workerRunId)
      .run();
    return null;
  }

  const job = await db
    .prepare(
      `SELECT id, attempts FROM live_lgpd_worker_jobs
        WHERE request_type = ? AND request_id = ? AND clinic_id = ? LIMIT 1`,
    )
    .bind(requestType, requestId, request.clinic_id)
    .first<WorkerJobRow>();
  if (!job) throw new Error("LGPD_WORKER_JOB_MISSING_AFTER_CLAIM");

  return {
    jobId: job.id,
    requestType,
    requestId,
    clinicId: request.clinic_id,
    attempt: Number(job.attempts),
    claimedAt,
    leaseUntil,
    workerRunId,
  };
}

export async function failLgpdJob(
  db: D1Database,
  claim: LgpdWorkerClaim,
  failureCodeInput: string,
  nowInput: Date | string = new Date(),
): Promise<boolean> {
  const failureCode = failureCodeInput.trim().toUpperCase();
  if (!FAILURE_CODE.test(failureCode)) throw new Error("LGPD_WORKER_FAILURE_CODE_INVALID");
  const now = iso(nowInput);
  const result = await db
    .prepare(
      `UPDATE live_lgpd_worker_jobs
          SET status = 'failed', failure_code = ?, lease_until = NULL, updated_at = ?
        WHERE id = ? AND clinic_id = ? AND status = 'processing' AND worker_run_id = ?`,
    )
    .bind(failureCode, now, claim.jobId, claim.clinicId, claim.workerRunId)
    .run();
  return Number(result.meta?.changes ?? 0) === 1;
}

/**
 * Os dois statements do batch de conclusão são guardados pelo mesmo invariante
 * (request ainda em 'processing'): sem isso, uma rejeição concorrente do gestor
 * deixaria o job 'completed' com evidência de um artefato que o executor em
 * seguida apaga — prova material apontando para objeto inexistente.
 */
export async function completeExportJob(
  db: D1Database,
  claim: LgpdWorkerClaim,
  evidenceInput: LgpdExportEvidence,
  nowInput: Date | string = new Date(),
): Promise<boolean> {
  if (claim.requestType !== "export") throw new Error("LGPD_WORKER_REQUEST_TYPE_MISMATCH");
  const evidence = normalizeExportEvidence(evidenceInput);
  const now = iso(nowInput);
  const results = await db.batch([
    db
      .prepare(
        `UPDATE live_lgpd_worker_jobs
            SET status = 'completed', artifact_key = ?, artifact_digest_sha256 = ?,
                artifact_byte_length = ?, lease_until = NULL, failure_code = NULL, updated_at = ?
          WHERE id = ? AND clinic_id = ? AND request_type = 'export'
            AND status = 'processing' AND worker_run_id = ?
            AND EXISTS (
              SELECT 1 FROM live_export_requests r
               WHERE r.id = live_lgpd_worker_jobs.request_id
                 AND r.clinic_id = live_lgpd_worker_jobs.clinic_id
                 AND r.status = 'processing'
            )`,
      )
      .bind(
        evidence.artifactKey,
        evidence.digestSha256,
        evidence.byteLength,
        now,
        claim.jobId,
        claim.clinicId,
        claim.workerRunId,
      ),
    db
      .prepare(
        `UPDATE live_export_requests
            SET status = 'completed', artifact_key = ?, completed_at = ?, updated_at = ?
          WHERE id = ? AND clinic_id = ? AND status = 'processing'`,
      )
      .bind(evidence.artifactKey, now, now, claim.requestId, claim.clinicId),
  ]);
  return Number(results[0]?.meta?.changes ?? 0) === 1 && Number(results[1]?.meta?.changes ?? 0) === 1;
}

export async function completeDeletionJob(
  db: D1Database,
  claim: LgpdWorkerClaim,
  evidenceInput: LgpdDeletionEvidence,
  nowInput: Date | string = new Date(),
): Promise<boolean> {
  if (claim.requestType !== "delete") throw new Error("LGPD_WORKER_REQUEST_TYPE_MISMATCH");
  const deletedCounts = normalizeDeletedCounts(evidenceInput);
  const countsJson = JSON.stringify(deletedCounts);
  const now = iso(nowInput);
  const results = await db.batch([
    db
      .prepare(
        `UPDATE live_lgpd_worker_jobs
            SET status = 'completed', deleted_counts_json = ?, lease_until = NULL,
                failure_code = NULL, updated_at = ?
          WHERE id = ? AND clinic_id = ? AND request_type = 'delete'
            AND status = 'processing' AND worker_run_id = ?
            AND EXISTS (
              SELECT 1 FROM live_deletion_requests r
               WHERE r.id = live_lgpd_worker_jobs.request_id
                 AND r.clinic_id = live_lgpd_worker_jobs.clinic_id
                 AND r.status = 'processing'
            )`,
      )
      .bind(countsJson, now, claim.jobId, claim.clinicId, claim.workerRunId),
    db
      .prepare(
        `UPDATE live_deletion_requests
            SET status = 'completed', completed_at = ?, updated_at = ?
          WHERE id = ? AND clinic_id = ? AND status = 'processing'`,
      )
      .bind(now, now, claim.requestId, claim.clinicId),
  ]);
  return Number(results[0]?.meta?.changes ?? 0) === 1 && Number(results[1]?.meta?.changes ?? 0) === 1;
}

/**
 * Confirma se a conclusão do export de fato commitou com esta evidência —
 * usada pelo executor quando o ack de `completeExportJob` se perde (ex.: erro
 * de rede após o commit). Só com esta prova o artefato pode ser preservado.
 */
export async function isExportJobCompletedWithEvidence(
  db: D1Database,
  claim: LgpdWorkerClaim,
  evidence: LgpdExportEvidence,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok FROM live_lgpd_worker_jobs
        WHERE id = ? AND clinic_id = ? AND status = 'completed'
          AND artifact_key = ? AND artifact_digest_sha256 = ?
        LIMIT 1`,
    )
    .bind(claim.jobId, claim.clinicId, evidence.artifactKey, evidence.digestSha256)
    .first<{ ok: number }>();
  return row?.ok === 1;
}

/** Metadata permitida para auditoria futura do executor; sem payload clínico. */
export function lgpdWorkerAuditMetadata(claim: LgpdWorkerClaim): SaasAuditParams["metadata"] {
  return {
    requestType: claim.requestType,
    attempt: claim.attempt,
    workerRunId: claim.workerRunId,
  };
}
