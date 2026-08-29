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
 * SCHEMA SaaS — módulos de operação (onboarding, feedback, templates,
 * instituições, rate limit e trilha de autorização).
 *
 * As migrations em db/migrations/ atendem ao D1 (Cloudflare). O servidor
 * Express cria o mesmo contrato aqui, porque nada executa aquelas migrations
 * neste runtime: sem estas tabelas toda a superfície /api/saas responde 500.
 *
 * `clinic_memberships` espelha o modelo de tenant do D1 (shared/tenant.ts) e é
 * a ÚNICA fonte de verdade para acesso a uma clínica. Nenhum identificador de
 * clínica vindo do cliente concede acesso por si só.
 * ========================================================================= */

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS clinic_memberships (
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    PRIMARY KEY (clinic_id, user_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS clinic_memberships_user_idx ON clinic_memberships(user_id);
  CREATE INDEX IF NOT EXISTS clinic_memberships_clinic_idx ON clinic_memberships(clinic_id);

  CREATE TABLE IF NOT EXISTS onboarding_checklist (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    step_label TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    completed_by TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_clinic_step
    ON onboarding_checklist(clinic_id, step_id);
  CREATE INDEX IF NOT EXISTS idx_onboarding_clinic ON onboarding_checklist(clinic_id);

  CREATE TABLE IF NOT EXISTS appointment_feedback (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL UNIQUE,
    clinic_id TEXT NOT NULL,
    rating INTEGER,
    nps_score INTEGER,
    comment TEXT,
    sentiment TEXT,
    sent_at TEXT,
    responded_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_feedback_clinic ON appointment_feedback(clinic_id);
  CREATE INDEX IF NOT EXISTS idx_feedback_clinic_date
    ON appointment_feedback(clinic_id, created_at);

  CREATE TABLE IF NOT EXISTS availability_templates (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rules TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_avail_template_clinic_name
    ON availability_templates(clinic_id, name);
  CREATE INDEX IF NOT EXISTS idx_avail_template_clinic ON availability_templates(clinic_id);

  CREATE TABLE IF NOT EXISTS professional_template_assignments (
    id TEXT PRIMARY KEY,
    professional_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    clinic_id TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    applied_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_prof_template_assignment
    ON professional_template_assignments(professional_id, template_id);
  CREATE INDEX IF NOT EXISTS idx_prof_assignment_clinic
    ON professional_template_assignments(clinic_id);

  CREATE TABLE IF NOT EXISTS tenant_lifecycle_events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    reason TEXT,
    triggered_by TEXT NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lifecycle_tenant ON tenant_lifecycle_events(tenant_id);

  CREATE TABLE IF NOT EXISTS communication_templates (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    name TEXT NOT NULL,
    channel TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    variables TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_comm_template_clinic_channel
    ON communication_templates(clinic_id, channel, name);
  CREATE INDEX IF NOT EXISTS idx_comm_template_clinic ON communication_templates(clinic_id);

  CREATE TABLE IF NOT EXISTS institutions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    cnpj TEXT UNIQUE,
    country TEXT NOT NULL DEFAULT 'BR',
    city TEXT,
    state TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    admin_user_id TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    clinic_count INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_institution_admin ON institutions(admin_user_id);

  CREATE TABLE IF NOT EXISTS institution_clinic_assignments (
    id TEXT PRIMARY KEY,
    institution_id TEXT NOT NULL,
    clinic_id TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'primary',
    assigned_at TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ica_institution ON institution_clinic_assignments(institution_id);

  CREATE TABLE IF NOT EXISTS institution_users (
    id TEXT PRIMARY KEY,
    institution_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    granted_at TEXT NOT NULL,
    granted_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_inst_user_role
    ON institution_users(institution_id, user_id);

  CREATE TABLE IF NOT EXISTS rate_limit_state (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    window_start TEXT NOT NULL,
    window_end TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    limit_per_window INTEGER NOT NULL DEFAULT 100,
    status TEXT DEFAULT 'active',
    last_request_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_rl_clinic_endpoint
    ON rate_limit_state(clinic_id, endpoint, window_start);

  CREATE TABLE IF NOT EXISTS authorization_logs (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT,
    result TEXT NOT NULL,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_auth_log_clinic ON authorization_logs(clinic_id);
  CREATE INDEX IF NOT EXISTS idx_auth_log_result ON authorization_logs(result, created_at);
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
