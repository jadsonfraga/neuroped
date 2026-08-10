let schemaReady: Promise<void> | null = null;

async function provision(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS conecta_events_demo (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL REFERENCES patients_demo(id) ON DELETE CASCADE,
        author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        category TEXT NOT NULL,
        occurred_at DATETIME NOT NULL,
        context TEXT,
        value INTEGER CHECK (value IS NULL OR (value BETWEEN 1 AND 5)),
        duration_minutes INTEGER CHECK (duration_minutes IS NULL OR (duration_minutes BETWEEN 0 AND 10080)),
        payload_json TEXT,
        is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_conecta_events_demo_patient_time
        ON conecta_events_demo(patient_id, occurred_at DESC)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_conecta_events_demo_category
        ON conecta_events_demo(category)
    `),
  ]);
}

/**
 * Mantém o deploy fail-safe mesmo quando uma migração D1 aditiva ainda não
 * foi aplicada. A migração versionada continua sendo a fonte de verdade; este
 * provisionamento é somente uma catraca idempotente para a tabela nova.
 */
export async function ensureConectaDemoSchema(db: D1Database): Promise<void> {
  if (!schemaReady) {
    schemaReady = provision(db).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}
