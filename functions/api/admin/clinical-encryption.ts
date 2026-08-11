import { getContextUser, isAdmin } from "../auth/_authorization";
import { isPlainObject } from "../_request";
import {
  clinicalCryptoErrorResponse,
  clinicalKeyringFromEnv,
  decryptClinicalPayload,
  encryptedLegacySentinel,
  encryptClinicalPayload,
  replaceClinicalSearchTokensStatements,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";
import {
  decryptText as decryptOperationalText,
  encryptText as encryptOperationalText,
  type OperationsEnv,
} from "../operations/_core";
import { clinicalKeyId } from "../../../shared/clinical-crypto";

interface Env extends ClinicalCryptoEnv, OperationsEnv {
  DB?: D1Database;
}

type ClinicalResource =
  | "patients"
  | "consultations"
  | "scale-results"
  | "documents"
  | "memory-notes"
  | "clinical-events"
  | "conecta-events";

type OperationalResource =
  | "operations-appointments"
  | "operations-waitlist"
  | "operations-reviews"
  | "operations-notifications";

type MigrationResource = ClinicalResource | OperationalResource;

const RESOURCES: readonly MigrationResource[] = [
  "patients",
  "consultations",
  "scale-results",
  "documents",
  "memory-notes",
  "clinical-events",
  "conecta-events",
  "operations-appointments",
  "operations-waitlist",
  "operations-reviews",
  "operations-notifications",
] as const;

const PAGE_LIMIT = 40;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
function error(message: string, code: string, status: number): Response {
  return json({ error: message, code }, status);
}
function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
function cursorFrom(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 256);
}
function parseResource(value: unknown): MigrationResource | null {
  return typeof value === "string" && RESOURCES.includes(value as MigrationResource)
    ? (value as MigrationResource)
    : null;
}
function safeJson(value: unknown, fallback: unknown): unknown {
  if (typeof value !== "string" || !value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

async function updateOne(
  db: D1Database,
  statement: D1PreparedStatement,
): Promise<void> {
  const result = await statement.run();
  if ((result.meta.changes ?? 0) !== 1) throw new Error("MIGRATION_ROW_STALE");
}

async function migratePatients(env: Env, cursor: string) {
  const rows = await env.DB!.prepare(
    `SELECT id, owner_user_id, name, birth_date, guardian_name, guardian_phone,
            diagnosis_code, notes, secure_payload_encrypted
       FROM patients_demo
      WHERE is_demo = 1 AND id > ?
      ORDER BY id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const legacyName = row.name !== encryptedLegacySentinel() ? stringOrNull(row.name) : null;
    const payload = await decryptClinicalPayload<any>(
      env,
      "patients_demo",
      row.id,
      stringOrNull(row.secure_payload_encrypted),
      legacyName
        ? JSON.stringify({
            name: legacyName,
            birthDate: stringOrNull(row.birth_date),
            guardianName: stringOrNull(row.guardian_name),
            guardianPhone: stringOrNull(row.guardian_phone),
            diagnosisCode: stringOrNull(row.diagnosis_code),
            notes: stringOrNull(row.notes),
          })
        : null,
    );
    if (!payload?.name) throw new Error(`MIGRATION_PATIENT_INVALID:${row.id}`);
    const encrypted = await encryptClinicalPayload(env, "patients_demo", row.id, payload);
    const statements = [
      env.DB!.prepare(
        `UPDATE patients_demo
            SET secure_payload_encrypted = ?, name = ?, birth_date = NULL,
                guardian_name = NULL, guardian_phone = NULL, diagnosis_code = NULL,
                notes = NULL, updated_at = ?
          WHERE id = ? AND is_demo = 1`,
      ).bind(encrypted, encryptedLegacySentinel(), new Date().toISOString(), row.id),
      ...(await replaceClinicalSearchTokensStatements(env.DB!, env, {
        resourceType: "patient",
        resourceId: row.id,
        patientId: row.id,
        ownerUserId: stringOrNull(row.owner_user_id),
        values: [payload.name, payload.guardianName, payload.diagnosisCode],
      })),
    ];
    const results = await env.DB!.batch(statements);
    if ((results[0]?.meta.changes ?? 0) !== 1) throw new Error("MIGRATION_ROW_STALE");
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

async function migrateConsultations(env: Env, cursor: string) {
  const rows = await env.DB!.prepare(
    `SELECT id, subjective, objective, assessment, plan, secure_payload_encrypted
       FROM consultations_demo WHERE is_demo = 1 AND id > ? ORDER BY id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const payload = await decryptClinicalPayload<any>(
      env,
      "consultations_demo",
      row.id,
      stringOrNull(row.secure_payload_encrypted),
      JSON.stringify({ subjective: stringOrNull(row.subjective), objective: stringOrNull(row.objective), assessment: stringOrNull(row.assessment), plan: stringOrNull(row.plan) }),
    );
    const encrypted = await encryptClinicalPayload(env, "consultations_demo", row.id, payload ?? {});
    await updateOne(env.DB!, env.DB!.prepare(
      `UPDATE consultations_demo SET secure_payload_encrypted = ?, subjective = NULL,
        objective = NULL, assessment = NULL, plan = NULL WHERE id = ? AND is_demo = 1`,
    ).bind(encrypted, row.id));
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

async function migrateScaleResults(env: Env, cursor: string) {
  const rows = await env.DB!.prepare(
    `SELECT id, scale_name, score, interpretation, details, secure_payload_encrypted
       FROM scale_results_demo WHERE is_demo = 1 AND id > ? ORDER BY id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const legacyName = row.scale_name !== encryptedLegacySentinel() ? stringOrNull(row.scale_name) : null;
    const payload = await decryptClinicalPayload<any>(
      env,
      "scale_results_demo",
      row.id,
      stringOrNull(row.secure_payload_encrypted),
      legacyName ? JSON.stringify({ scaleName: legacyName, score: row.score ?? null, interpretation: stringOrNull(row.interpretation), details: stringOrNull(row.details) }) : null,
    );
    if (!payload?.scaleName) throw new Error(`MIGRATION_SCALE_INVALID:${row.id}`);
    const encrypted = await encryptClinicalPayload(env, "scale_results_demo", row.id, payload);
    await updateOne(env.DB!, env.DB!.prepare(
      `UPDATE scale_results_demo SET secure_payload_encrypted = ?, scale_name = ?, score = NULL,
        interpretation = NULL, details = NULL WHERE id = ? AND is_demo = 1`,
    ).bind(encrypted, encryptedLegacySentinel(), row.id));
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

async function migrateDocuments(env: Env, cursor: string) {
  const rows = await env.DB!.prepare(
    `SELECT id, title, content, secure_payload_encrypted
       FROM documents_demo WHERE is_demo = 1 AND id > ? ORDER BY id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const legacyTitle = row.title !== encryptedLegacySentinel() ? stringOrNull(row.title) : null;
    const payload = await decryptClinicalPayload<any>(
      env,
      "documents_demo",
      row.id,
      stringOrNull(row.secure_payload_encrypted),
      legacyTitle ? JSON.stringify({ title: legacyTitle, content: stringOrNull(row.content) ?? "" }) : null,
    );
    if (!payload?.title) throw new Error(`MIGRATION_DOCUMENT_INVALID:${row.id}`);
    const encrypted = await encryptClinicalPayload(env, "documents_demo", row.id, payload);
    await updateOne(env.DB!, env.DB!.prepare(
      `UPDATE documents_demo SET secure_payload_encrypted = ?, title = ?, content = NULL
        WHERE id = ? AND is_demo = 1`,
    ).bind(encrypted, encryptedLegacySentinel(), row.id));
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

async function migrateMemoryNotes(env: Env, cursor: string) {
  const rows = await env.DB!.prepare(
    `SELECT n.id, n.patient_id, n.title, n.content, n.category, n.source, n.tags,
            n.secure_payload_encrypted, p.owner_user_id
       FROM memory_notes n LEFT JOIN patients_demo p ON p.id = n.patient_id
      WHERE n.is_demo = 1 AND n.id > ? ORDER BY n.id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const legacyContent = row.content !== encryptedLegacySentinel() ? stringOrNull(row.content) : null;
    const payload = await decryptClinicalPayload<any>(
      env,
      "memory_notes",
      row.id,
      stringOrNull(row.secure_payload_encrypted),
      legacyContent ? JSON.stringify({ title: stringOrNull(row.title), content: legacyContent, source: stringOrNull(row.source), tags: stringOrNull(row.tags) }) : null,
    );
    if (!payload?.content) throw new Error(`MIGRATION_MEMORY_INVALID:${row.id}`);
    const encrypted = await encryptClinicalPayload(env, "memory_notes", row.id, payload);
    const statements = [
      env.DB!.prepare(
        `UPDATE memory_notes SET secure_payload_encrypted = ?, title = NULL, content = ?,
                source = NULL, tags = NULL, updated_at = ?
          WHERE id = ? AND is_demo = 1`,
      ).bind(encrypted, encryptedLegacySentinel(), new Date().toISOString(), row.id),
      ...(await replaceClinicalSearchTokensStatements(env.DB!, env, {
        resourceType: "memory_note",
        resourceId: row.id,
        patientId: stringOrNull(row.patient_id),
        ownerUserId: stringOrNull(row.owner_user_id),
        values: [payload.title, payload.content, payload.tags, stringOrNull(row.category)],
      })),
    ];
    const results = await env.DB!.batch(statements);
    if ((results[0]?.meta.changes ?? 0) !== 1) throw new Error("MIGRATION_ROW_STALE");
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

async function migrateClinicalEvents(env: Env, cursor: string) {
  const rows = await env.DB!.prepare(
    `SELECT id, payload_json, secure_payload_encrypted
       FROM clinical_events_demo WHERE is_demo = 1 AND id > ? ORDER BY id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const legacy = row.payload_json !== encryptedLegacySentinel()
      ? JSON.stringify(safeJson(row.payload_json, {}))
      : null;
    const payload = await decryptClinicalPayload<any>(env, "clinical_events_demo", row.id, stringOrNull(row.secure_payload_encrypted), legacy);
    const encrypted = await encryptClinicalPayload(env, "clinical_events_demo", row.id, payload ?? {});
    await updateOne(env.DB!, env.DB!.prepare(
      `UPDATE clinical_events_demo SET secure_payload_encrypted = ?, payload_json = ?
        WHERE id = ? AND is_demo = 1`,
    ).bind(encrypted, encryptedLegacySentinel(), row.id));
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

async function migrateConectaEvents(env: Env, cursor: string) {
  const rows = await env.DB!.prepare(
    `SELECT id, context, payload_json, secure_payload_encrypted
       FROM conecta_events_demo WHERE is_demo = 1 AND id > ? ORDER BY id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const legacy = row.context != null || row.payload_json != null
      ? JSON.stringify({ context: stringOrNull(row.context), payload: safeJson(row.payload_json, null) })
      : null;
    const payload = await decryptClinicalPayload<any>(env, "conecta_events_demo", row.id, stringOrNull(row.secure_payload_encrypted), legacy);
    const encrypted = await encryptClinicalPayload(env, "conecta_events_demo", row.id, payload ?? {});
    await updateOne(env.DB!, env.DB!.prepare(
      `UPDATE conecta_events_demo SET secure_payload_encrypted = ?, context = NULL, payload_json = NULL
        WHERE id = ? AND is_demo = 1`,
    ).bind(encrypted, row.id));
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

const OPERATIONAL_SPECS: Record<OperationalResource, { table: string; columns: string[] }> = {
  "operations-appointments": { table: "appointments", columns: ["guardian_name_encrypted", "guardian_email_encrypted", "guardian_phone_encrypted", "patient_name_encrypted"] },
  "operations-waitlist": { table: "waitlist_entries", columns: ["guardian_name_encrypted", "guardian_email_encrypted", "guardian_phone_encrypted", "patient_name_encrypted"] },
  "operations-reviews": { table: "appointment_reviews", columns: ["comment_encrypted"] },
  "operations-notifications": { table: "notification_outbox", columns: ["recipient_encrypted", "payload_encrypted"] },
};

async function migrateOperational(env: Env, resource: OperationalResource, cursor: string) {
  const spec = OPERATIONAL_SPECS[resource];
  const rows = await env.DB!.prepare(
    `SELECT id, ${spec.columns.join(", ")} FROM ${spec.table} WHERE id > ? ORDER BY id LIMIT ?`,
  ).bind(cursor, PAGE_LIMIT).all<any>();
  let lastCursor = cursor;
  for (const row of rows.results ?? []) {
    const updates: string[] = [];
    const binds: unknown[] = [];
    for (const column of spec.columns) {
      const stored = stringOrNull(row[column]);
      if (!stored) continue;
      const plain = await decryptOperationalText(env, stored);
      if (plain === null) throw new Error(`OPERATIONAL_CIPHERTEXT_INVALID:${spec.table}:${row.id}:${column}`);
      updates.push(`${column} = ?`);
      binds.push(await encryptOperationalText(env, plain));
    }
    if (updates.length) {
      binds.push(row.id);
      await updateOne(env.DB!, env.DB!.prepare(`UPDATE ${spec.table} SET ${updates.join(", ")} WHERE id = ?`).bind(...binds));
    }
    lastCursor = row.id;
  }
  return { processed: rows.results?.length ?? 0, cursor: lastCursor, done: (rows.results?.length ?? 0) < PAGE_LIMIT };
}

async function migrateResource(env: Env, resource: MigrationResource, cursor: string) {
  if (resource === "patients") return migratePatients(env, cursor);
  if (resource === "consultations") return migrateConsultations(env, cursor);
  if (resource === "scale-results") return migrateScaleResults(env, cursor);
  if (resource === "documents") return migrateDocuments(env, cursor);
  if (resource === "memory-notes") return migrateMemoryNotes(env, cursor);
  if (resource === "clinical-events") return migrateClinicalEvents(env, cursor);
  if (resource === "conecta-events") return migrateConectaEvents(env, cursor);
  return migrateOperational(env, resource, cursor);
}

async function tableExists(db: D1Database, table: string): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1").bind(table).first<{ present: number }>();
  return row?.present === 1;
}

async function plaintextResiduals(db: D1Database): Promise<Record<string, number>> {
  const sentinel = encryptedLegacySentinel();
  const checks: Array<[string, string, unknown[]]> = [
    ["patients_demo", `SELECT COUNT(*) AS n FROM patients_demo WHERE is_demo=1 AND (secure_payload_encrypted IS NULL OR name <> ? OR birth_date IS NOT NULL OR guardian_name IS NOT NULL OR guardian_phone IS NOT NULL OR diagnosis_code IS NOT NULL OR notes IS NOT NULL)`, [sentinel]],
    ["consultations_demo", "SELECT COUNT(*) AS n FROM consultations_demo WHERE is_demo=1 AND (secure_payload_encrypted IS NULL OR subjective IS NOT NULL OR objective IS NOT NULL OR assessment IS NOT NULL OR plan IS NOT NULL)", []],
    ["scale_results_demo", `SELECT COUNT(*) AS n FROM scale_results_demo WHERE is_demo=1 AND (secure_payload_encrypted IS NULL OR scale_name <> ? OR score IS NOT NULL OR interpretation IS NOT NULL OR details IS NOT NULL)`, [sentinel]],
    ["documents_demo", `SELECT COUNT(*) AS n FROM documents_demo WHERE is_demo=1 AND (secure_payload_encrypted IS NULL OR title <> ? OR content IS NOT NULL)`, [sentinel]],
    ["memory_notes", `SELECT COUNT(*) AS n FROM memory_notes WHERE is_demo=1 AND (secure_payload_encrypted IS NULL OR title IS NOT NULL OR content <> ? OR source IS NOT NULL OR tags IS NOT NULL)`, [sentinel]],
    ["clinical_events_demo", `SELECT COUNT(*) AS n FROM clinical_events_demo WHERE is_demo=1 AND (secure_payload_encrypted IS NULL OR payload_json <> ?)`, [sentinel]],
    ["conecta_events_demo", "SELECT COUNT(*) AS n FROM conecta_events_demo WHERE is_demo=1 AND (secure_payload_encrypted IS NULL OR context IS NOT NULL OR payload_json IS NOT NULL)", []],
  ];
  const out: Record<string, number> = {};
  for (const [table, sql, binds] of checks) {
    if (!(await tableExists(db, table))) { out[table] = 0; continue; }
    const row = await db.prepare(sql).bind(...binds).first<{ n: number }>();
    out[table] = Number(row?.n ?? 0);
  }
  return out;
}

async function verifyOperationalActiveKey(env: Env): Promise<void> {
  const activeOnly: OperationsEnv = { OPERATIONAL_DATA_KEY: env.OPERATIONAL_DATA_KEY };
  for (const spec of Object.values(OPERATIONAL_SPECS)) {
    if (!(await tableExists(env.DB!, spec.table))) continue;
    const rows = await env.DB!.prepare(`SELECT id, ${spec.columns.join(", ")} FROM ${spec.table}`).all<any>();
    for (const row of rows.results ?? []) {
      for (const column of spec.columns) {
        const stored = stringOrNull(row[column]);
        if (!stored) continue;
        if ((await decryptOperationalText(activeOnly, stored)) === null) {
          throw new Error(`OPERATIONAL_PREVIOUS_KEY_STILL_REQUIRED:${spec.table}:${row.id}:${column}`);
        }
      }
    }
  }
}

async function verifyAndMarkStrict(env: Env, backupSha256: string, rollbackVerified: boolean) {
  if (!/^[0-9a-f]{64}$/.test(backupSha256)) throw new Error("BACKUP_SHA256_INVALID");
  if (!rollbackVerified) throw new Error("ROLLBACK_NOT_VERIFIED");
  const residuals = await plaintextResiduals(env.DB!);
  const totalResiduals = Object.values(residuals).reduce((sum, value) => sum + value, 0);
  if (totalResiduals !== 0) throw new Error(`PLAINTEXT_RESIDUAL:${JSON.stringify(residuals)}`);
  await verifyOperationalActiveKey(env);
  const keyId = await clinicalKeyId(clinicalKeyringFromEnv(env).active);
  const now = new Date().toISOString();
  await env.DB!.prepare(
    `INSERT INTO clinical_encryption_state
      (id,envelope_version,key_id,phase,backup_sha256,started_at,migrated_at,verified_at,rollback_verified_at,last_error)
     VALUES (1,'c1',?,'strict',?,?,?,?,?,NULL)
     ON CONFLICT(id) DO UPDATE SET
       envelope_version='c1', key_id=excluded.key_id, phase='strict', backup_sha256=excluded.backup_sha256,
       migrated_at=excluded.migrated_at, verified_at=excluded.verified_at,
       rollback_verified_at=excluded.rollback_verified_at, last_error=NULL`,
  ).bind(keyId, backupSha256, now, now, now, now).run();
  return { residuals, keyId, phase: "strict" };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) return error("Banco indisponível.", "DB_REQUIRED", 503);
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!isAdmin(user)) return error("Migração restrita ao administrador.", "FORBIDDEN", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return error("Corpo JSON inválido.", "INVALID_JSON", 400); }
  if (!isPlainObject(body)) return error("Corpo deve ser objeto JSON.", "INVALID_JSON", 400);
  const action = typeof body.action === "string" ? body.action : "";

  try {
    clinicalKeyringFromEnv(env);
    if (!env.OPERATIONAL_DATA_KEY?.trim() || env.OPERATIONAL_DATA_KEY.trim().length < 32) {
      return error("Chave operacional não configurada.", "OPERATIONAL_CRYPTO_NOT_CONFIGURED", 503);
    }

    if (action === "migrate") {
      const resource = parseResource(body.resource);
      if (!resource) return error("Recurso de migração inválido.", "VALIDATION_ERROR", 400);
      const result = await migrateResource(env, resource, cursorFrom(body.cursor));
      return json({ ok: true, action, resource, ...result });
    }

    if (action === "verify") {
      const backupSha256 = typeof body.backupSha256 === "string" ? body.backupSha256.trim().toLowerCase() : "";
      const result = await verifyAndMarkStrict(env, backupSha256, body.rollbackVerified === true);
      return json({ ok: true, action, ...result });
    }

    if (action === "status") {
      const state = await env.DB.prepare(
        "SELECT envelope_version,key_id,phase,backup_sha256 IS NOT NULL AS has_backup,rollback_verified_at IS NOT NULL AS rollback_verified FROM clinical_encryption_state WHERE id=1",
      ).first<Record<string, unknown>>();
      return json({ ok: true, action, state: state ?? null, residuals: await plaintextResiduals(env.DB) });
    }

    return error("Ação inválida.", "VALIDATION_ERROR", 400);
  } catch (cause) {
    const cryptoResponse = clinicalCryptoErrorResponse(cause);
    if (cryptoResponse) return cryptoResponse;
    console.error("[admin/clinical-encryption]", cause);
    return error("Migração clínica falhou de modo seguro.", "CLINICAL_MIGRATION_FAILED", 500);
  }
};
