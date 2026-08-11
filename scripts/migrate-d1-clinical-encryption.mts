import {
  CLINICAL_ENVELOPE_VERSION,
  CLINICAL_LEGACY_SENTINEL,
  clinicalBlindTokensForValue,
  clinicalKeyId,
  decryptClinicalJson,
  encryptClinicalJson,
  type ClinicalKeyring,
} from "../shared/clinical-crypto";

const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() ?? "";
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "";
const databaseId = process.env.D1_DATABASE_ID?.trim() ?? "";
const clinicalSecret = process.env.CLINICAL_DATA_KEY?.trim() ?? "";
const operationalSecret = process.env.OPERATIONAL_DATA_KEY?.trim() ?? "";
const legacyOperationalSecret = process.env.LEGACY_OPERATIONAL_DATA_KEY?.trim() ?? "";
const mode = process.argv[2] ?? "apply";

if (!apiToken || !accountId || !databaseId) {
  throw new Error("CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID e D1_DATABASE_ID são obrigatórios.");
}
if (clinicalSecret.length < 32) throw new Error("CLINICAL_DATA_KEY deve ter ao menos 32 caracteres.");

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

interface D1QueryResult<T = Record<string, unknown>> {
  results?: T[];
  success?: boolean;
  meta?: { changes?: number };
}

async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<D1QueryResult<T>> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const payload = (await response.json()) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: D1QueryResult<T>[];
  };
  if (!response.ok || payload.success !== true || !payload.result?.[0]?.success) {
    const detail = payload.errors?.map((item) => item.message).filter(Boolean).join("; ") || `HTTP ${response.status}`;
    throw new Error(`D1_QUERY_FAILED: ${detail}`);
  }
  return payload.result[0];
}

async function tableExists(table: string): Promise<boolean> {
  const result = await query<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
    [table],
  );
  return Boolean(result.results?.length);
}

async function columnNames(table: string): Promise<Set<string>> {
  const result = await query<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set((result.results ?? []).map((row) => row.name));
}

async function ensureColumn(table: string, definition: string): Promise<void> {
  if (!(await tableExists(table))) return;
  const name = definition.trim().split(/\s+/)[0];
  const columns = await columnNames(table);
  if (columns.has(name)) return;
  await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  console.log(`[schema] ${table}.${name}: adicionada`);
}

async function ensureSchema(): Promise<void> {
  await query(`CREATE TABLE IF NOT EXISTS clinical_search_tokens (
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    patient_id TEXT,
    owner_user_id TEXT,
    token_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (resource_type, resource_id, token_hash)
  )`);
  await query(`CREATE INDEX IF NOT EXISTS idx_clinical_search_tokens_lookup
    ON clinical_search_tokens(resource_type, token_hash, owner_user_id, resource_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_clinical_search_tokens_patient
    ON clinical_search_tokens(patient_id, resource_type)`);
  await query(`CREATE TABLE IF NOT EXISTS clinical_encryption_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    envelope_version TEXT NOT NULL,
    key_id TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('dual_read','migrating','strict')),
    backup_sha256 TEXT,
    started_at DATETIME NOT NULL,
    migrated_at DATETIME,
    verified_at DATETIME,
    rollback_verified_at DATETIME,
    last_error TEXT
  )`);
  for (const table of [
    "patients_demo",
    "consultations_demo",
    "scale_results_demo",
    "documents_demo",
    "memory_notes",
    "clinical_events_demo",
    "conecta_events_demo",
  ]) {
    await ensureColumn(table, "secure_payload_encrypted TEXT");
  }
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function existingOrLegacyPayload<T extends Record<string, unknown>>(
  table: string,
  rowId: string,
  encrypted: unknown,
  legacy: T,
): Promise<T> {
  if (typeof encrypted === "string" && encrypted.length > 0) {
    const decoded = await decryptClinicalJson<T>(
      { active: clinicalSecret, strict: true },
      { table, rowId, field: "secure_payload" },
      encrypted,
    );
    if (!decoded) throw new Error(`${table}/${rowId}: payload cifrado vazio`);
    return decoded;
  }
  return legacy;
}

async function replaceTokens(
  resourceType: string,
  resourceId: string,
  patientId: string | null,
  ownerUserId: string | null,
  values: Array<string | null | undefined>,
): Promise<void> {
  const hashes = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const hash of await clinicalBlindTokensForValue(clinicalSecret, resourceType, value)) hashes.add(hash);
  }
  await query("DELETE FROM clinical_search_tokens WHERE resource_type = ? AND resource_id = ?", [resourceType, resourceId]);
  for (const hash of hashes) {
    await query(
      `INSERT INTO clinical_search_tokens
        (resource_type, resource_id, patient_id, owner_user_id, token_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(resource_type, resource_id, token_hash) DO UPDATE SET
         patient_id = excluded.patient_id,
         owner_user_id = excluded.owner_user_id`,
      [resourceType, resourceId, patientId, ownerUserId, hash, new Date().toISOString()],
    );
  }
}

async function migratePatients(): Promise<void> {
  if (!(await tableExists("patients_demo"))) return;
  const rows = (await query<any>(`SELECT id, owner_user_id, name, birth_date, guardian_name, guardian_phone,
      diagnosis_code, notes, secure_payload_encrypted
    FROM patients_demo WHERE is_demo = 1 ORDER BY id`)).results ?? [];
  for (const row of rows) {
    const payload = await existingOrLegacyPayload("patients_demo", row.id, row.secure_payload_encrypted, {
      name: row.name === CLINICAL_LEGACY_SENTINEL ? null : nullableString(row.name),
      birthDate: nullableString(row.birth_date),
      guardianName: nullableString(row.guardian_name),
      guardianPhone: nullableString(row.guardian_phone),
      diagnosisCode: nullableString(row.diagnosis_code),
      notes: nullableString(row.notes),
    });
    if (!payload.name) throw new Error(`patients_demo/${row.id}: nome ausente durante migração`);
    const encrypted = await encryptClinicalJson(clinicalSecret, { table: "patients_demo", rowId: row.id, field: "secure_payload" }, payload);
    await query(`UPDATE patients_demo SET secure_payload_encrypted = ?, name = ?, birth_date = NULL,
      guardian_name = NULL, guardian_phone = NULL, diagnosis_code = NULL, notes = NULL WHERE id = ?`,
      [encrypted, CLINICAL_LEGACY_SENTINEL, row.id]);
    await replaceTokens("patient", row.id, row.id, nullableString(row.owner_user_id), [
      String(payload.name),
      nullableString(payload.guardianName),
      nullableString(payload.diagnosisCode),
    ]);
  }
  console.log(`[migrate] patients_demo: ${rows.length}`);
}

async function migrateConsultations(): Promise<void> {
  if (!(await tableExists("consultations_demo"))) return;
  const rows = (await query<any>(`SELECT id, patient_id, subjective, objective, assessment, plan, secure_payload_encrypted
    FROM consultations_demo WHERE is_demo = 1 ORDER BY id`)).results ?? [];
  for (const row of rows) {
    const payload = await existingOrLegacyPayload("consultations_demo", row.id, row.secure_payload_encrypted, {
      subjective: nullableString(row.subjective),
      objective: nullableString(row.objective),
      assessment: nullableString(row.assessment),
      plan: nullableString(row.plan),
    });
    const encrypted = await encryptClinicalJson(clinicalSecret, { table: "consultations_demo", rowId: row.id, field: "secure_payload" }, payload);
    await query(`UPDATE consultations_demo SET secure_payload_encrypted = ?, subjective = NULL, objective = NULL,
      assessment = NULL, plan = NULL WHERE id = ?`, [encrypted, row.id]);
  }
  console.log(`[migrate] consultations_demo: ${rows.length}`);
}

async function migrateScaleResults(): Promise<void> {
  if (!(await tableExists("scale_results_demo"))) return;
  const rows = (await query<any>(`SELECT id, patient_id, scale_name, score, interpretation, details, secure_payload_encrypted
    FROM scale_results_demo WHERE is_demo = 1 ORDER BY id`)).results ?? [];
  for (const row of rows) {
    const payload = await existingOrLegacyPayload("scale_results_demo", row.id, row.secure_payload_encrypted, {
      scaleName: row.scale_name === CLINICAL_LEGACY_SENTINEL ? null : nullableString(row.scale_name),
      score: row.score ?? null,
      interpretation: nullableString(row.interpretation),
      details: nullableString(row.details),
    });
    const encrypted = await encryptClinicalJson(clinicalSecret, { table: "scale_results_demo", rowId: row.id, field: "secure_payload" }, payload);
    await query(`UPDATE scale_results_demo SET secure_payload_encrypted = ?, scale_name = ?, score = NULL,
      interpretation = NULL, details = NULL WHERE id = ?`, [encrypted, CLINICAL_LEGACY_SENTINEL, row.id]);
  }
  console.log(`[migrate] scale_results_demo: ${rows.length}`);
}

async function migrateDocuments(): Promise<void> {
  if (!(await tableExists("documents_demo"))) return;
  const rows = (await query<any>(`SELECT id, patient_id, title, content, secure_payload_encrypted
    FROM documents_demo WHERE is_demo = 1 ORDER BY id`)).results ?? [];
  for (const row of rows) {
    const payload = await existingOrLegacyPayload("documents_demo", row.id, row.secure_payload_encrypted, {
      title: row.title === CLINICAL_LEGACY_SENTINEL ? null : nullableString(row.title),
      content: nullableString(row.content),
    });
    if (!payload.title) throw new Error(`documents_demo/${row.id}: título ausente durante migração`);
    const encrypted = await encryptClinicalJson(clinicalSecret, { table: "documents_demo", rowId: row.id, field: "secure_payload" }, payload);
    await query(`UPDATE documents_demo SET secure_payload_encrypted = ?, title = ?, content = NULL WHERE id = ?`,
      [encrypted, CLINICAL_LEGACY_SENTINEL, row.id]);
  }
  console.log(`[migrate] documents_demo: ${rows.length}`);
}

async function migrateMemoryNotes(): Promise<void> {
  if (!(await tableExists("memory_notes"))) return;
  const rows = (await query<any>(`SELECT n.id, n.patient_id, n.title, n.content, n.category, n.source, n.tags,
      n.secure_payload_encrypted, p.owner_user_id
    FROM memory_notes n LEFT JOIN patients_demo p ON p.id = n.patient_id
    WHERE n.is_demo = 1 ORDER BY n.id`)).results ?? [];
  for (const row of rows) {
    const payload = await existingOrLegacyPayload("memory_notes", row.id, row.secure_payload_encrypted, {
      title: nullableString(row.title),
      content: row.content === CLINICAL_LEGACY_SENTINEL ? null : nullableString(row.content),
      source: nullableString(row.source),
      tags: nullableString(row.tags),
    });
    if (!payload.content) throw new Error(`memory_notes/${row.id}: conteúdo ausente durante migração`);
    const encrypted = await encryptClinicalJson(clinicalSecret, { table: "memory_notes", rowId: row.id, field: "secure_payload" }, payload);
    await query(`UPDATE memory_notes SET secure_payload_encrypted = ?, title = NULL, content = ?, source = NULL, tags = NULL WHERE id = ?`,
      [encrypted, CLINICAL_LEGACY_SENTINEL, row.id]);
    await replaceTokens("memory_note", row.id, nullableString(row.patient_id), nullableString(row.owner_user_id), [
      nullableString(payload.title),
      String(payload.content),
      nullableString(payload.tags),
      nullableString(row.category),
    ]);
  }
  console.log(`[migrate] memory_notes: ${rows.length}`);
}

async function migrateClinicalEvents(): Promise<void> {
  if (!(await tableExists("clinical_events_demo"))) return;
  const rows = (await query<any>(`SELECT id, payload_json, secure_payload_encrypted
    FROM clinical_events_demo WHERE is_demo = 1 ORDER BY id`)).results ?? [];
  for (const row of rows) {
    const payload = await existingOrLegacyPayload("clinical_events_demo", row.id, row.secure_payload_encrypted,
      row.payload_json === CLINICAL_LEGACY_SENTINEL ? {} : JSON.parse(String(row.payload_json || "{}")));
    const encrypted = await encryptClinicalJson(clinicalSecret, { table: "clinical_events_demo", rowId: row.id, field: "secure_payload" }, payload);
    await query(`UPDATE clinical_events_demo SET secure_payload_encrypted = ?, payload_json = ? WHERE id = ?`,
      [encrypted, CLINICAL_LEGACY_SENTINEL, row.id]);
  }
  console.log(`[migrate] clinical_events_demo: ${rows.length}`);
}

async function migrateConectaEvents(): Promise<void> {
  if (!(await tableExists("conecta_events_demo"))) return;
  const rows = (await query<any>(`SELECT id, context, payload_json, secure_payload_encrypted
    FROM conecta_events_demo WHERE is_demo = 1 ORDER BY id`)).results ?? [];
  for (const row of rows) {
    let legacyPayload: unknown = null;
    if (row.payload_json) {
      try { legacyPayload = JSON.parse(String(row.payload_json)); } catch { legacyPayload = null; }
    }
    const payload = await existingOrLegacyPayload("conecta_events_demo", row.id, row.secure_payload_encrypted, {
      context: nullableString(row.context),
      payload: legacyPayload,
    });
    const encrypted = await encryptClinicalJson(clinicalSecret, { table: "conecta_events_demo", rowId: row.id, field: "secure_payload" }, payload);
    await query(`UPDATE conecta_events_demo SET secure_payload_encrypted = ?, context = NULL, payload_json = NULL WHERE id = ?`,
      [encrypted, row.id]);
  }
  console.log(`[migrate] conecta_events_demo: ${rows.length}`);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
async function operationalKey(secret: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(`neuroped-operational-v1:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function decryptOperational(secret: string, value: string): Promise<string> {
  const [version, ivB64, cipherB64] = value.split(".");
  if (version !== "v1" || !ivB64 || !cipherB64) throw new Error("OPERATIONAL_LEGACY_ENVELOPE_INVALID");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(ivB64) }, await operationalKey(secret), base64ToBytes(cipherB64));
  return new TextDecoder().decode(plain);
}
async function encryptOperational(secret: string, value: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await operationalKey(secret), new TextEncoder().encode(value));
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipher))}`;
}

async function migrateOperationalFromLegacy(): Promise<void> {
  if (!legacyOperationalSecret) return;
  if (operationalSecret.length < 32) throw new Error("OPERATIONAL_DATA_KEY ausente para migração do legado.");
  const specs: Array<{ table: string; id: string; columns: string[] }> = [
    { table: "appointments", id: "id", columns: ["guardian_name_encrypted", "guardian_email_encrypted", "guardian_phone_encrypted", "patient_name_encrypted"] },
    { table: "waitlist_entries", id: "id", columns: ["guardian_name_encrypted", "guardian_email_encrypted", "guardian_phone_encrypted", "patient_name_encrypted"] },
    { table: "appointment_reviews", id: "id", columns: ["comment_encrypted"] },
    { table: "notification_outbox", id: "id", columns: ["recipient_encrypted", "payload_encrypted"] },
  ];
  for (const spec of specs) {
    if (!(await tableExists(spec.table))) continue;
    const rows = (await query<any>(`SELECT ${[spec.id, ...spec.columns].join(", ")} FROM ${spec.table}`)).results ?? [];
    for (const row of rows) {
      for (const column of spec.columns) {
        const stored = nullableString(row[column]);
        if (!stored) continue;
        const plaintext = await decryptOperational(legacyOperationalSecret, stored);
        const reencrypted = await encryptOperational(operationalSecret, plaintext);
        await query(`UPDATE ${spec.table} SET ${column} = ? WHERE ${spec.id} = ?`, [reencrypted, row[spec.id]]);
      }
    }
    console.log(`[migrate] operational ${spec.table}: ${rows.length}`);
  }
}

async function verifyNoPlaintext(): Promise<void> {
  const checks: Array<{ table: string; sql: string }> = [
    { table: "patients_demo", sql: `SELECT COUNT(*) AS n FROM patients_demo WHERE is_demo = 1 AND (secure_payload_encrypted IS NULL OR name <> '${CLINICAL_LEGACY_SENTINEL}' OR birth_date IS NOT NULL OR guardian_name IS NOT NULL OR guardian_phone IS NOT NULL OR diagnosis_code IS NOT NULL OR notes IS NOT NULL)` },
    { table: "consultations_demo", sql: "SELECT COUNT(*) AS n FROM consultations_demo WHERE is_demo = 1 AND (secure_payload_encrypted IS NULL OR subjective IS NOT NULL OR objective IS NOT NULL OR assessment IS NOT NULL OR plan IS NOT NULL)" },
    { table: "scale_results_demo", sql: `SELECT COUNT(*) AS n FROM scale_results_demo WHERE is_demo = 1 AND (secure_payload_encrypted IS NULL OR scale_name <> '${CLINICAL_LEGACY_SENTINEL}' OR score IS NOT NULL OR interpretation IS NOT NULL OR details IS NOT NULL)` },
    { table: "documents_demo", sql: `SELECT COUNT(*) AS n FROM documents_demo WHERE is_demo = 1 AND (secure_payload_encrypted IS NULL OR title <> '${CLINICAL_LEGACY_SENTINEL}' OR content IS NOT NULL)` },
    { table: "memory_notes", sql: `SELECT COUNT(*) AS n FROM memory_notes WHERE is_demo = 1 AND (secure_payload_encrypted IS NULL OR title IS NOT NULL OR content <> '${CLINICAL_LEGACY_SENTINEL}' OR source IS NOT NULL OR tags IS NOT NULL)` },
    { table: "clinical_events_demo", sql: `SELECT COUNT(*) AS n FROM clinical_events_demo WHERE is_demo = 1 AND (secure_payload_encrypted IS NULL OR payload_json <> '${CLINICAL_LEGACY_SENTINEL}')` },
    { table: "conecta_events_demo", sql: "SELECT COUNT(*) AS n FROM conecta_events_demo WHERE is_demo = 1 AND (secure_payload_encrypted IS NULL OR context IS NOT NULL OR payload_json IS NOT NULL)" },
  ];
  for (const check of checks) {
    if (!(await tableExists(check.table))) continue;
    const row = (await query<{ n: number }>(check.sql)).results?.[0];
    if (Number(row?.n ?? 0) !== 0) throw new Error(`PLAINTEXT_RESIDUAL:${check.table}:${row?.n ?? "?"}`);
  }

  const decryptSpecs: Array<{ table: string }> = [
    { table: "patients_demo" }, { table: "consultations_demo" }, { table: "scale_results_demo" },
    { table: "documents_demo" }, { table: "memory_notes" }, { table: "clinical_events_demo" }, { table: "conecta_events_demo" },
  ];
  const keyring: ClinicalKeyring = { active: clinicalSecret, strict: true };
  for (const spec of decryptSpecs) {
    if (!(await tableExists(spec.table))) continue;
    const rows = (await query<any>(`SELECT id, secure_payload_encrypted FROM ${spec.table} WHERE secure_payload_encrypted IS NOT NULL LIMIT 5000`)).results ?? [];
    for (const row of rows) {
      await decryptClinicalJson(keyring, { table: spec.table, rowId: row.id, field: "secure_payload" }, row.secure_payload_encrypted);
    }
  }
  console.log("[verify] zero plaintext residual + todos os envelopes amostrados autenticados/decriptáveis");
}

async function state(phase: "dual_read" | "migrating" | "strict", extra: { migrated?: boolean; verified?: boolean } = {}): Promise<void> {
  const now = new Date().toISOString();
  const keyId = await clinicalKeyId(clinicalSecret);
  await query(
    `INSERT INTO clinical_encryption_state (id, envelope_version, key_id, phase, started_at, migrated_at, verified_at, last_error)
     VALUES (1, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(id) DO UPDATE SET envelope_version=excluded.envelope_version, key_id=excluded.key_id,
       phase=excluded.phase, migrated_at=COALESCE(excluded.migrated_at, clinical_encryption_state.migrated_at),
       verified_at=COALESCE(excluded.verified_at, clinical_encryption_state.verified_at), last_error=NULL`,
    [CLINICAL_ENVELOPE_VERSION, keyId, phase, now, extra.migrated ? now : null, extra.verified ? now : null],
  );
}

await ensureSchema();
if (mode === "schema") {
  console.log("[clinical-encryption] schema pronto");
  process.exit(0);
}
if (mode === "verify") {
  await verifyNoPlaintext();
  await state("strict", { verified: true });
  process.exit(0);
}
if (mode !== "apply") throw new Error(`Modo desconhecido: ${mode}`);

await state("migrating");
await migrateOperationalFromLegacy();
await migratePatients();
await migrateConsultations();
await migrateScaleResults();
await migrateDocuments();
await migrateMemoryNotes();
await migrateClinicalEvents();
await migrateConectaEvents();
await verifyNoPlaintext();
await state("strict", { migrated: true, verified: true });
console.log(`[clinical-encryption] migração concluída; key_id=${await clinicalKeyId(clinicalSecret)}`);
