import {
  clinicFeatureDefault,
  isClinicFeatureKey,
  resolveClinicFeatures,
  type ClinicFeatureKey,
  type ClinicFeatureState,
  type StoredClinicFeature,
} from "../../../shared/clinicFeatures";
import { prepareSaasAudit } from "./_core";

/**
 * Feature flags por clínica (migração 0026). O bootstrap de runtime espelha
 * a migração (IF NOT EXISTS), mesma política de `_settings.ts` (0019): as
 * rotas de gestão funcionam antes de a 0026 rodar em produção.
 */
const FEATURE_SCHEMA = `CREATE TABLE IF NOT EXISTS clinic_feature_flags (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clinic_id, flag_key)
)`;

export async function ensureClinicFeatureSchema(db: D1Database): Promise<void> {
  await db.prepare(FEATURE_SCHEMA).run();
}

interface FeatureRow {
  flag_key: string;
  enabled: number;
  updated_at: string | null;
}

function isMissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /no such table: clinic_feature_flags/i.test(message);
}

/**
 * Linhas gravadas para a clínica. Tabela ainda inexistente (0026 não
 * aplicada) equivale a "nenhuma decisão gravada": todas as flags existentes
 * são opt-out com padrão ligado, então ausência de armazenamento preserva o
 * comportamento anterior à migração. Qualquer outro erro propaga.
 */
export async function readStoredClinicFeatures(
  db: D1Database,
  clinicId: string,
): Promise<StoredClinicFeature[]> {
  try {
    const rows = await db
      .prepare(`SELECT flag_key, enabled, updated_at FROM clinic_feature_flags WHERE clinic_id = ?`)
      .bind(clinicId)
      .all<FeatureRow>();
    return (rows.results ?? []).map((row) => ({
      key: row.flag_key,
      enabled: row.enabled === 1,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function getClinicFeatures(db: D1Database, clinicId: string): Promise<ClinicFeatureState[]> {
  return resolveClinicFeatures(await readStoredClinicFeatures(db, clinicId));
}

/** Fail-closed: chave fora do catálogo nunca está ligada. */
export async function isClinicFeatureEnabled(
  db: D1Database,
  clinicId: string,
  key: ClinicFeatureKey,
): Promise<boolean> {
  if (!isClinicFeatureKey(key)) return false;
  const stored = (await readStoredClinicFeatures(db, clinicId)).find((row) => row.key === key);
  return stored ? stored.enabled : clinicFeatureDefault(key);
}

/**
 * Grava a decisão da clínica e a auditoria no MESMO batch; a auditoria só
 * entra se o upsert alterou exatamente uma linha.
 */
export async function setClinicFeature(
  db: D1Database,
  params: { clinicId: string; actorUserId: string; key: ClinicFeatureKey; enabled: boolean },
): Promise<void> {
  if (!isClinicFeatureKey(params.key)) throw new Error("CLINIC_FEATURE_UNKNOWN");
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO clinic_feature_flags (clinic_id, flag_key, enabled, updated_by_user_id, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(clinic_id, flag_key) DO UPDATE SET
           enabled = excluded.enabled,
           updated_by_user_id = excluded.updated_by_user_id,
           updated_at = excluded.updated_at`,
      )
      .bind(params.clinicId, params.key, params.enabled ? 1 : 0, params.actorUserId, now),
    prepareSaasAudit(
      db,
      {
        clinicId: params.clinicId,
        actorUserId: params.actorUserId,
        action: "clinic_feature_update",
        targetType: "clinic_feature",
        targetId: params.key,
        metadata: { key: params.key, enabled: params.enabled },
      },
      true,
    ),
  ]);
}
