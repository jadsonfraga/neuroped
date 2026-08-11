import {
  blindIndexTokens,
  clinicalCryptoConfigured,
  clinicalStrictMode,
  decryptClinicalOrLegacy,
  decryptClinicalPayload,
  encryptClinicalPayload,
  isEncryptedClinicalValue,
  replaceBlindTokensStatements,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";
import { getContextUser, isAdmin } from "../auth/_authorization";
import { isPlainObject } from "../_request";

interface Env extends ClinicalCryptoEnv {
  DB?: D1Database;
}

interface MigrationStats {
  patients: number;
  consultations: number;
  scaleResults: number;
  documents: number;
  memoryNotes: number;
  clinicalEvents: number;
  conectaEvents: number;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function error(message: string, code: string, status: number): Response {
  return json({ error: message, code }, status);
}

async function ensureSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS clinical_search_tokens (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      field_scope TEXT NOT NULL,
      key_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (entity_type, entity_id, field_scope, key_id, token_hash)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_clinical_search_lookup
      ON clinical_search_tokens(entity_type, field_scope, key_id, token_hash, entity_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_clinical_search_entity
      ON clinical_search_tokens(entity_type, entity_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS clinical_crypto_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);
}

async function stateSet(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(`INSERT INTO clinical_crypto_state (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`)
    .bind(key, value)
    .run();
}

async function migratePatients(env: Env, db: D1Database): Promise<number> {
  const rows = await db.prepare(
    `SELECT id, owner_user_id, name, birth_date, guardian_name, guardian_phone,
            diagnosis_code, notes
       FROM patients_demo WHERE is_demo = 1 ORDER BY id`,
  ).all<Record<string, unknown>>();
  let migrated = 0;
  for (const row of rows.results ?? []) {
    const id = String(row.id);
    const aad = { entityType: "patient", entityId: id, patientId: id };
    const payload = await decryptClinicalOrLegacy<Record<string, string | null>>(
      env,
      aad,
      row.notes,
      () => ({
        name: String(row.name ?? ""),
        birth_date: row.birth_date == null ? null : String(row.birth_date),
        guardian_name: row.guardian_name == null ? null : String(row.guardian_name),
        guardian_phone: row.guardian_phone == null ? null : String(row.guardian_phone),
        diagnosis_code: row.diagnosis_code == null ? null : String(row.diagnosis_code),
        notes: row.notes == null ? null : String(row.notes),
      }),
    );
    const envelope = isEncryptedClinicalValue(row.notes)
      ? String(row.notes)
      : await encryptClinicalPayload(env, aad, payload);
    const tokens = await blindIndexTokens(env, [payload.name, payload.guardian_name, payload.diagnosis_code]);
    await db.batch([
      db.prepare(`UPDATE patients_demo
                     SET name = '[encrypted]', birth_date = NULL, guardian_name = NULL,
                         guardian_phone = NULL, diagnosis_code = NULL, notes = ?,
                         updated_at = CURRENT_TIMESTAMP
                   WHERE id = ? AND is_demo = 1`).bind(envelope, id),
      ...replaceBlindTokensStatements(db, "patient", id, "patient_search", tokens),
    ]);
    if (!isEncryptedClinicalValue(row.notes)) migrated += 1;
  }
  return migrated;
}

async function migrateConsultations(env: Env, db: D1Database): Promise<number> {
  const rows = await db.prepare(
    `SELECT id, patient_id, subjective, objective, assessment, plan
       FROM consultations_demo WHERE is_demo = 1 ORDER BY id`,
  ).all<Record<string, unknown>>();
  let migrated = 0;
  for (const row of rows.results ?? []) {
    const id = String(row.id);
    const patientId = String(row.patient_id);
    const aad = { entityType: "consultation", entityId: id, patientId };
    const payload = await decryptClinicalOrLegacy<Record<string, string | null>>(
      env,
      aad,
      row.subjective,
      () => ({
        subjective: row.subjective == null ? null : String(row.subjective),
        objective: row.objective == null ? null : String(row.objective),
        assessment: row.assessment == null ? null : String(row.assessment),
        plan: row.plan == null ? null : String(row.plan),
      }),
    );
    const envelope = isEncryptedClinicalValue(row.subjective)
      ? String(row.subjective)
      : await encryptClinicalPayload(env, aad, payload);
    await db.prepare(
      `UPDATE consultations_demo
          SET subjective = ?, objective = NULL, assessment = NULL, plan = NULL
        WHERE id = ? AND is_demo = 1`,
    ).bind(envelope, id).run();
    if (!isEncryptedClinicalValue(row.subjective)) migrated += 1;
  }
  return migrated;
}

async function migrateScaleResults(env: Env, db: D1Database): Promise<number> {
  const rows = await db.prepare(
    `SELECT id, patient_id, scale_id, scale_name, score, interpretation, details
       FROM scale_results_demo WHERE is_demo = 1 ORDER BY id`,
  ).all<Record<string, unknown>>();
  let migrated = 0;
  for (const row of rows.results ?? []) {
    const id = String(row.id);
    const patientId = String(row.patient_id);
    const aad = { entityType: "scale_result", entityId: id, patientId };
    const payload = await decryptClinicalOrLegacy<Record<string, unknown>>(
      env,
      aad,
      row.details,
      () => ({ scale_id: String(row.scale_id ?? ""), scale_name: String(row.scale_name ?? ""), score: row.score ?? null, interpretation: row.interpretation ?? null, details: row.details ?? null }),
    );
    const envelope = isEncryptedClinicalValue(row.details)
      ? String(row.details)
      : await encryptClinicalPayload(env, aad, payload);
    await db.prepare(
      `UPDATE scale_results_demo
          SET scale_id = 'encrypted', scale_name = '[encrypted]', score = NULL, interpretation = NULL, details = ?
        WHERE id = ? AND is_demo = 1`,
    ).bind(envelope, id).run();
    if (!isEncryptedClinicalValue(row.details)) migrated += 1;
  }
  return migrated;
}

async function migrateDocuments(env: Env, db: D1Database): Promise<number> {
  const rows = await db.prepare(
    `SELECT id, patient_id, type, title, content
       FROM documents_demo WHERE is_demo = 1 ORDER BY id`,
  ).all<Record<string, unknown>>();
  let migrated = 0;
  for (const row of rows.results ?? []) {
    const id = String(row.id);
    const patientId = String(row.patient_id);
    const aad = { entityType: "document", entityId: id, patientId };
    const payload = await decryptClinicalOrLegacy<Record<string, string | null>>(
      env,
      aad,
      row.content,
      () => ({ type: String(row.type ?? ""), title: String(row.title ?? ""), content: row.content == null ? null : String(row.content) }),
    );
    const envelope = isEncryptedClinicalValue(row.content)
      ? String(row.content)
      : await encryptClinicalPayload(env, aad, payload);
    await db.prepare(
      `UPDATE documents_demo
          SET type = 'encrypted', title = '[encrypted]', content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_demo = 1`,
    ).bind(envelope, id).run();
    if (!isEncryptedClinicalValue(row.content)) migrated += 1;
  }
  return migrated;
}

async function migrateMemoryNotes(env: Env, db: D1Database): Promise<number> {
  const rows = await db.prepare(
    `SELECT id, patient_id, type, title, content, category, source, tags
       FROM memory_notes WHERE is_demo = 1 ORDER BY id`,
  ).all<Record<string, unknown>>();
  let migrated = 0;
  for (const row of rows.results ?? []) {
    const id = String(row.id);
    const patientId = row.patient_id == null ? null : String(row.patient_id);
    const aad = { entityType: "memory_note", entityId: id, patientId };
    const payload = await decryptClinicalOrLegacy<Record<string, string | null>>(
      env,
      aad,
      row.content,
      () => ({
        title: row.title == null ? null : String(row.title),
        content: String(row.content ?? ""),
        category: row.category == null ? null : String(row.category),
        source: row.source == null ? null : String(row.source),
        tags: row.tags == null ? null : String(row.tags),
      }),
    );
    const envelope = isEncryptedClinicalValue(row.content)
      ? String(row.content)
      : await encryptClinicalPayload(env, aad, payload);
    const tokens = await blindIndexTokens(env, [payload.title, payload.content, payload.category, payload.tags]);
    await db.batch([
      db.prepare(`UPDATE memory_notes
                     SET title = NULL, content = ?, category = NULL, source = NULL,
                         tags = NULL, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ? AND is_demo = 1`).bind(envelope, id),
      ...replaceBlindTokensStatements(db, "memory_note", id, "memory_search", tokens),
    ]);
    if (!isEncryptedClinicalValue(row.content)) migrated += 1;
  }
  return migrated;
}

async function migrateClinicalEvents(env: Env, db: D1Database): Promise<number> {
  const rows = await db.prepare(
    `SELECT id, patient_id, event_type, encounter_id, provenance_kind, provenance_source, payload_json
       FROM clinical_events_demo WHERE is_demo = 1 ORDER BY id`,
  ).all<Record<string, unknown>>();
  let migrated = 0;
  for (const row of rows.results ?? []) {
    const id = String(row.id);
    const patientId = String(row.patient_id);
    const aad = { entityType: "clinical_event", entityId: id, patientId };
    const payload = await decryptClinicalOrLegacy<Record<string, unknown>>(
      env,
      aad,
      row.payload_json,
      () => ({
        event_type: row.event_type,
        encounter_id: row.encounter_id ?? null,
        provenance_kind: row.provenance_kind,
        provenance_source: row.provenance_source,
        payload_json: row.payload_json,
      }),
    );
    const envelope = isEncryptedClinicalValue(row.payload_json)
      ? String(row.payload_json)
      : await encryptClinicalPayload(env, aad, payload);
    await db.prepare(
      `UPDATE clinical_events_demo
          SET event_type = 'observation', encounter_id = NULL,
              provenance_kind = 'documented', provenance_source = 'encrypted', payload_json = ?
        WHERE id = ? AND is_demo = 1`,
    ).bind(envelope, id).run();
    if (!isEncryptedClinicalValue(row.payload_json)) migrated += 1;
  }
  return migrated;
}

async function migrateConectaEvents(env: Env, db: D1Database): Promise<number> {
  const rows = await db.prepare(
    `SELECT id, patient_id, category, context, value, duration_minutes, payload_json
       FROM conecta_events_demo WHERE is_demo = 1 ORDER BY id`,
  ).all<Record<string, unknown>>();
  let migrated = 0;
  for (const row of rows.results ?? []) {
    const id = String(row.id);
    const patientId = String(row.patient_id);
    const aad = { entityType: "conecta_event", entityId: id, patientId };
    const payload = await decryptClinicalOrLegacy<Record<string, unknown>>(
      env,
      aad,
      row.payload_json,
      () => ({
        category: row.category,
        context: row.context ?? null,
        value: row.value ?? null,
        duration_minutes: row.duration_minutes ?? null,
        payload_json: row.payload_json ?? null,
      }),
    );
    const envelope = isEncryptedClinicalValue(row.payload_json)
      ? String(row.payload_json)
      : await encryptClinicalPayload(env, aad, payload);
    await db.prepare(
      `UPDATE conecta_events_demo
          SET category = 'encrypted', context = NULL, value = NULL,
              duration_minutes = NULL, payload_json = ?
        WHERE id = ? AND is_demo = 1`,
    ).bind(envelope, id).run();
    if (!isEncryptedClinicalValue(row.payload_json)) migrated += 1;
  }
  return migrated;
}

async function verifyEncryptedRows(env: Env, db: D1Database): Promise<{ residualPlaintext: number; decryptFailures: number; missingSearchIndexes: number; totalEncryptedRows: number }> {
  const specs = [
    { table: "patients_demo", entityType: "patient", field: "notes", patientField: "id" },
    { table: "consultations_demo", entityType: "consultation", field: "subjective", patientField: "patient_id" },
    { table: "scale_results_demo", entityType: "scale_result", field: "details", patientField: "patient_id" },
    { table: "documents_demo", entityType: "document", field: "content", patientField: "patient_id" },
    { table: "memory_notes", entityType: "memory_note", field: "content", patientField: "patient_id" },
    { table: "clinical_events_demo", entityType: "clinical_event", field: "payload_json", patientField: "patient_id" },
    { table: "conecta_events_demo", entityType: "conecta_event", field: "payload_json", patientField: "patient_id" },
  ] as const;
  let residualPlaintext = 0;
  let decryptFailures = 0;
  let totalEncryptedRows = 0;
  for (const spec of specs) {
    const rows = await db.prepare(
      `SELECT id, ${spec.patientField} AS patient_id, ${spec.field} AS encrypted_value
         FROM ${spec.table} WHERE is_demo = 1 ORDER BY id`,
    ).all<Record<string, unknown>>();
    for (const row of rows.results ?? []) {
      const stored = row.encrypted_value;
      if (!isEncryptedClinicalValue(stored)) {
        residualPlaintext += 1;
        continue;
      }
      totalEncryptedRows += 1;
      try {
        await decryptClinicalPayload(env, {
          entityType: spec.entityType,
          entityId: String(row.id),
          patientId: row.patient_id == null ? null : String(row.patient_id),
        }, stored);
      } catch {
        decryptFailures += 1;
      }
    }
  }

  const scrubChecks = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS n FROM patients_demo WHERE is_demo = 1 AND (name <> '[encrypted]' OR birth_date IS NOT NULL OR guardian_name IS NOT NULL OR guardian_phone IS NOT NULL OR diagnosis_code IS NOT NULL)`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM consultations_demo WHERE is_demo = 1 AND (objective IS NOT NULL OR assessment IS NOT NULL OR plan IS NOT NULL)`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM scale_results_demo WHERE is_demo = 1 AND (scale_id <> 'encrypted' OR scale_name <> '[encrypted]' OR score IS NOT NULL OR interpretation IS NOT NULL)`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM documents_demo WHERE is_demo = 1 AND (type <> 'encrypted' OR title <> '[encrypted]')`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM memory_notes WHERE is_demo = 1 AND (title IS NOT NULL OR category IS NOT NULL OR source IS NOT NULL OR tags IS NOT NULL)`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM clinical_events_demo WHERE is_demo = 1 AND (event_type <> 'observation' OR encounter_id IS NOT NULL OR provenance_kind <> 'documented' OR provenance_source <> 'encrypted')`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM conecta_events_demo WHERE is_demo = 1 AND (category <> 'encrypted' OR context IS NOT NULL OR value IS NOT NULL OR duration_minutes IS NOT NULL)`).first<{ n: number }>(),
  ]);
  residualPlaintext += scrubChecks.reduce((sum, row) => sum + Number(row?.n ?? 0), 0);

  const missingPatient = await db.prepare(
    `SELECT COUNT(*) AS n FROM patients_demo p
      WHERE p.is_demo = 1 AND NOT EXISTS (
        SELECT 1 FROM clinical_search_tokens t
         WHERE t.entity_type = 'patient' AND t.entity_id = p.id AND t.field_scope = 'patient_search'
      )`,
  ).first<{ n: number }>();
  const missingMemory = await db.prepare(
    `SELECT COUNT(*) AS n FROM memory_notes m
      WHERE m.is_demo = 1 AND NOT EXISTS (
        SELECT 1 FROM clinical_search_tokens t
         WHERE t.entity_type = 'memory_note' AND t.entity_id = m.id AND t.field_scope = 'memory_search'
      )`,
  ).first<{ n: number }>();

  return {
    residualPlaintext,
    decryptFailures,
    missingSearchIndexes: Number(missingPatient?.n ?? 0) + Number(missingMemory?.n ?? 0),
    totalEncryptedRows,
  };
}

async function status(env: Env, db: D1Database) {
  await ensureSchema(db);
  const verification = await verifyEncryptedRows(env, db);
  const fts = await db.prepare(
    `SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'memory_notes_fts'`,
  ).first<{ n: number }>();
  return {
    cryptoConfigured: clinicalCryptoConfigured(env),
    strictMode: clinicalStrictMode(env),
    ...verification,
    plaintextFtsObjects: Number(fts?.n ?? 0),
    readyForStrict:
      clinicalCryptoConfigured(env) &&
      verification.residualPlaintext === 0 &&
      verification.decryptFailures === 0 &&
      verification.missingSearchIndexes === 0 &&
      Number(fts?.n ?? 0) === 0,
  };
}

function requireAdmin(context: { data?: unknown }): Response | null {
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!isAdmin(user)) return error("Acesso restrito ao administrador.", "FORBIDDEN", 403);
  return null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  if (!context.env.DB) return error("Banco indisponível.", "DB_REQUIRED", 503);
  if (!clinicalCryptoConfigured(context.env)) {
    return error("Chaves clínicas independentes não configuradas.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }
  try {
    return json(await status(context.env, context.env.DB));
  } catch (cause) {
    console.error("[crypto-migration.GET]", cause);
    return error("Não foi possível verificar a migração clínica.", "CRYPTO_VERIFY_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  const { env, request } = context;
  if (!env.DB) return error("Banco indisponível.", "DB_REQUIRED", 503);
  if (!clinicalCryptoConfigured(env)) {
    return error("Chaves clínicas independentes não configuradas.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return error("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  if (!isPlainObject(parsed)) return error("Corpo deve ser objeto JSON.", "INVALID_JSON", 400);
  const action = parsed.action;
  if (action !== "migrate" && action !== "verify") {
    return error("Ação inválida.", "VALIDATION_ERROR", 400);
  }

  try {
    await ensureSchema(env.DB);
    if (action === "migrate") {
      const stats: MigrationStats = {
        patients: await migratePatients(env, env.DB),
        consultations: await migrateConsultations(env, env.DB),
        scaleResults: await migrateScaleResults(env, env.DB),
        documents: await migrateDocuments(env, env.DB),
        memoryNotes: await migrateMemoryNotes(env, env.DB),
        clinicalEvents: await migrateClinicalEvents(env, env.DB),
        conectaEvents: await migrateConectaEvents(env, env.DB),
      };
      await env.DB.exec(`
        DROP TRIGGER IF EXISTS memory_notes_ai;
        DROP TRIGGER IF EXISTS memory_notes_ad;
        DROP TRIGGER IF EXISTS memory_notes_au;
        DROP TABLE IF EXISTS memory_notes_fts;
      `);
      await stateSet(env.DB, "migrated_at", new Date().toISOString());
      await stateSet(env.DB, "data_key_id", env.CLINICAL_DATA_KEY_ID?.trim() || "k1");
      await stateSet(env.DB, "index_key_id", env.CLINICAL_INDEX_KEY_ID?.trim() || "k1");
      const verification = await status(env, env.DB);
      if (!verification.readyForStrict) {
        return json({ error: "Migração executada, mas a verificação não ficou limpa.", code: "CRYPTO_VERIFY_FAILED", stats, verification }, 500);
      }
      return json({ migrated: true, stats, verification });
    }

    const verification = await status(env, env.DB);
    if (verification.readyForStrict) await stateSet(env.DB, "verified_at", new Date().toISOString());
    return json({ verified: verification.readyForStrict, verification }, verification.readyForStrict ? 200 : 409);
  } catch (cause) {
    console.error("[crypto-migration.POST]", cause instanceof Error ? cause.message : "unknown");
    return error("Migração clínica falhou sem expor conteúdo dos registros.", "CRYPTO_MIGRATION_FAILED", 500);
  }
};
