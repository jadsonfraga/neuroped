/**
 * Camada de persistencia. Usa Drizzle ORM sobre SQLite (better-sqlite3).
 *
 * Em producao, recomenda-se migrar para Postgres mantendo o mesmo Drizzle:
 *  - trocar drizzle/better-sqlite3 por drizzle/postgres-js
 *  - usar drizzle-kit migrate em vez do CREATE TABLE inline
 *  - configurar pool, SSL, e DATABASE_URL via .env
 */

import {
  patients,
  scaleResults,
  type ScaleResult,
  type InsertScaleResult,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, or, and, isNull, desc, getTableColumns, count } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DATABASE_PATH || "neuroped.db";
const dbDir = path.dirname(path.resolve(dbPath));
if (dbDir && !fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

export const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite);

/* =========================================================================
 * SCHEMA — criacao idempotente de tabelas (versao desenvolvimento).
 * Em producao usar drizzle-kit generate + drizzle-kit migrate.
 * ========================================================================= */

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'professional',
    crm TEXT,
    rqe TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    email_verified_at TEXT,
    last_login_at TEXT,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
  CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    issued_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    rotated_to_token_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS refresh_tokens_token_hash_idx ON refresh_tokens(token_hash);

  CREATE TABLE IF NOT EXISTS consents (
    id TEXT PRIMARY KEY,
    batch_id TEXT,
    user_id TEXT,
    patient_id TEXT,
    consent_type TEXT NOT NULL,
    consent_version TEXT NOT NULL,
    consent_text TEXT NOT NULL,
    granted INTEGER NOT NULL,
    granted_at TEXT NOT NULL,
    accepted_at TEXT,
    revoked_at TEXT,
    ip_address TEXT,
    user_agent TEXT,
    legal_basis TEXT,
    purpose TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS consents_user_idx ON consents(user_id);
  CREATE INDEX IF NOT EXISTS consents_patient_idx ON consents(patient_id);
  CREATE INDEX IF NOT EXISTS consents_type_idx ON consents(consent_type);

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    event_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS audit_logs_event_idx ON audit_logs(event_type);
  CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs(target_type, target_id);
  CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT,
    name_encrypted TEXT,
    name TEXT,
    birth_date TEXT,
    cpf_encrypted TEXT,
    cpf_hash TEXT,
    cid TEXT,
    cid_description TEXT,
    notes_encrypted TEXT,
    notes TEXT,
    is_anonymized INTEGER NOT NULL DEFAULT 0,
    anonymized_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS patients_owner_idx ON patients(owner_user_id);
  CREATE INDEX IF NOT EXISTS patients_cpf_hash_idx ON patients(cpf_hash);

  CREATE TABLE IF NOT EXISTS scale_results (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    applied_by_user_id TEXT,
    scale_name TEXT NOT NULL,
    scale_version TEXT,
    answers TEXT NOT NULL,
    answers_encrypted TEXT,
    total_score INTEGER NOT NULL,
    classification TEXT NOT NULL,
    patient_age TEXT,
    domain_scores TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY(applied_by_user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS scale_results_patient_idx ON scale_results(patient_id);
  CREATE INDEX IF NOT EXISTS scale_results_scale_idx ON scale_results(scale_name);
  CREATE INDEX IF NOT EXISTS scale_results_created_at_idx ON scale_results(created_at);

  CREATE TABLE IF NOT EXISTS scale_share_sessions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    created_by_user_id TEXT,
    token_hash TEXT UNIQUE NOT NULL,
    selected_scales TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TEXT NOT NULL,
    submitted_at TEXT,
    respondent_name TEXT,
    result_ids TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS scale_share_sessions_patient_idx ON scale_share_sessions(patient_id);
  CREATE INDEX IF NOT EXISTS scale_share_sessions_token_idx ON scale_share_sessions(token_hash);
  CREATE INDEX IF NOT EXISTS scale_share_sessions_status_idx ON scale_share_sessions(status);
  CREATE INDEX IF NOT EXISTS scale_share_sessions_expires_idx ON scale_share_sessions(expires_at);

  CREATE TABLE IF NOT EXISTS data_requests (
    id TEXT PRIMARY KEY,
    requester_email TEXT NOT NULL,
    requester_name TEXT,
    request_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    related_patient_id TEXT,
    notes TEXT,
    completed_at TEXT,
    completed_by_user_id TEXT,
    artifact_path TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS data_requests_status_idx ON data_requests(status);
  CREATE INDEX IF NOT EXISTS data_requests_type_idx ON data_requests(request_type);

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT,
    patient_id TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_provider TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    encryption_enabled INTEGER NOT NULL DEFAULT 1,
    sha256 TEXT,
    category TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS files_owner_idx ON files(owner_user_id);
  CREATE INDEX IF NOT EXISTS files_patient_idx ON files(patient_id);
  CREATE INDEX IF NOT EXISTS files_key_idx ON files(storage_key);

  CREATE TABLE IF NOT EXISTS clinical_documents (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT,
    patient_id TEXT,
    file_id TEXT UNIQUE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    source_id TEXT,
    source_version TEXT,
    signature_status TEXT NOT NULL DEFAULT 'unsigned',
    signature_type TEXT,
    signature_algorithm TEXT,
    signer_name TEXT,
    certificate_subject TEXT,
    certificate_issuer TEXT,
    certificate_serial TEXT,
    certificate_valid_until TEXT,
    sha256 TEXT,
    retention_policy TEXT NOT NULL DEFAULT 'permanent',
    is_immutable INTEGER NOT NULL DEFAULT 1,
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS clinical_documents_owner_idx ON clinical_documents(owner_user_id);
  CREATE INDEX IF NOT EXISTS clinical_documents_patient_idx ON clinical_documents(patient_id);
  CREATE INDEX IF NOT EXISTS clinical_documents_source_idx ON clinical_documents(source_id);
  CREATE INDEX IF NOT EXISTS clinical_documents_created_at_idx ON clinical_documents(created_at);
  `);

/**
 * Migração aditiva para bancos SQLite já existentes. SQLite não oferece
 * `ADD COLUMN IF NOT EXISTS` de forma portável, então inspecionamos a tabela
 * antes de acrescentar os campos do contrato transacional de consentimentos.
 */
function ensureConsentColumn(name: string, definition: string): void {
  const columns = sqlite.prepare("PRAGMA table_info(consents)").all() as Array<{
    name: string;
  }>;
  if (!columns.some((column) => column.name === name)) {
    sqlite.exec(`ALTER TABLE consents ADD COLUMN ${definition}`);
  }
}

ensureConsentColumn("batch_id", "batch_id TEXT");
ensureConsentColumn("accepted_at", "accepted_at TEXT");
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS consents_batch_idx ON consents(batch_id);
  CREATE INDEX IF NOT EXISTS consents_user_accepted_idx
    ON consents(user_id, accepted_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS consents_idempotency_idx
    ON consents(user_id, consent_type, consent_version, accepted_at);
`);

/* =========================================================================
 * Storage interface (legado para resultados; pacientes agora vai direto via db)
 * ========================================================================= */

export interface IStorage {
  saveResult(result: InsertScaleResult): ScaleResult;
  getResults(): ScaleResult[];
  getResultsAccessibleBy(user: { id: string; role: string }, limit?: number): ScaleResult[];
  getResult(id: string): ScaleResult | undefined;
  getResultsByPatient(patientId: string, limit?: number, offset?: number): ScaleResult[];
  countResultsByPatient(patientId: string): number;
  deleteResult(id: string): boolean;
  deletePatient(id: string): boolean;
}

export class SqliteStorage implements IStorage {
  saveResult(insert: InsertScaleResult): ScaleResult {
    return db.insert(scaleResults).values(insert).returning().get();
  }

  getResults(): ScaleResult[] {
    return db.select().from(scaleResults).all();
  }

  /**
   * Resultados que `user` pode ver, já filtrados e paginados em UMA query.
   *
   * A rota GET /api/results antes chamava getResults() (tabela inteira, sem
   * LIMIT) e, para não-admin, rodava uma query SÍNCRONA extra POR LINHA só
   * para checar dono do paciente — um N+1 que degrada linearmente com o
   * crescimento da tabela. A regra de ownership replicada aqui é a mesma de
   * `canAccessScaleResult` (lib/ownership.ts): resultado com paciente herda
   * SEMPRE o dono do paciente (não o `appliedByUserId`); resultado órfão (sem
   * paciente) usa `appliedByUserId`. Coberto por teste manual antes do merge:
   * duas contas, um paciente cada, resultado vinculado e órfão — cada conta
   * só vê o que é dela.
   */
  getResultsAccessibleBy(user: { id: string; role: string }, limit = 50): ScaleResult[] {
    if (user.role === "admin") {
      return db.select().from(scaleResults).orderBy(desc(scaleResults.createdAt)).limit(limit).all();
    }
    return db
      .select(getTableColumns(scaleResults))
      .from(scaleResults)
      .leftJoin(patients, eq(scaleResults.patientId, patients.id))
      .where(
        or(
          eq(patients.ownerUserId, user.id),
          and(isNull(scaleResults.patientId), eq(scaleResults.appliedByUserId, user.id)),
        ),
      )
      .orderBy(desc(scaleResults.createdAt))
      .limit(limit)
      .all() as ScaleResult[];
  }

  getResult(id: string): ScaleResult | undefined {
    return db.select().from(scaleResults).where(eq(scaleResults.id, id)).get();
  }

  getResultsByPatient(
    patientId: string,
    limit?: number,
    offset = 0,
  ): ScaleResult[] {
    if (limit === undefined) {
      return db
        .select()
        .from(scaleResults)
        .where(eq(scaleResults.patientId, patientId))
        .all();
    }
    return db
      .select()
      .from(scaleResults)
      .where(eq(scaleResults.patientId, patientId))
      .orderBy(desc(scaleResults.createdAt), desc(scaleResults.id))
      .limit(limit)
      .offset(offset)
      .all();
  }

  countResultsByPatient(patientId: string): number {
    return (
      db
        .select({ count: count() })
        .from(scaleResults)
        .where(eq(scaleResults.patientId, patientId))
        .get()?.count ?? 0
    );
  }

  deleteResult(id: string): boolean {
    const result = db.delete(scaleResults).where(eq(scaleResults.id, id)).run();
    return result.changes > 0;
  }

  deletePatient(id: string): boolean {
    const result = db.delete(patients).where(eq(patients.id, id)).run();
    return result.changes > 0;
  }
}

export const storage = new SqliteStorage();

/* =========================================================================
 * Bootstrap: cria usuario administrador inicial se nao existir e ADMIN_EMAIL
 * estiver definido. Util em primeiro deploy.
 * ========================================================================= */

export async function bootstrapAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminName = process.env.ADMIN_NAME || "Administrador";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const existing = sqlite
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(adminEmail);
  if (existing) return;

  const { hashPassword } = await import("./lib/password.js");
  const hash = await hashPassword(adminPassword);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, role, is_active, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', 1, 1, ?, ?)`,
    )
    .run(id, adminEmail, adminName, hash, now, now);

  console.log(`[bootstrap] Usuario admin criado: ${adminEmail} (deve trocar senha no primeiro login)`);
}
