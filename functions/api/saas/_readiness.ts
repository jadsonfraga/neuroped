import { REQUIRED_SAAS_TABLES, REQUIRED_SAAS_TRIGGERS } from "../../../shared/saas-operational";

export type SaasSchemaPosture = {
  requiredTables: readonly string[];
  missingTables: string[];
  requiredTriggers: readonly string[];
  missingTriggers: string[];
  ready: boolean;
};

export async function loadSaasSchemaPosture(db: D1Database): Promise<SaasSchemaPosture> {
  const tableResult = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${REQUIRED_SAAS_TABLES.map(() => "?").join(",")})`)
    .bind(...REQUIRED_SAAS_TABLES)
    .all<{ name: string }>();
  const triggerResult = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN (${REQUIRED_SAAS_TRIGGERS.map(() => "?").join(",")})`)
    .bind(...REQUIRED_SAAS_TRIGGERS)
    .all<{ name: string }>();
  const existingTables = new Set((tableResult.results ?? []).map((row) => row.name));
  const existingTriggers = new Set((triggerResult.results ?? []).map((row) => row.name));
  const missingTables = REQUIRED_SAAS_TABLES.filter((table) => !existingTables.has(table));
  const missingTriggers = REQUIRED_SAAS_TRIGGERS.filter((trigger) => !existingTriggers.has(trigger));
  return {
    requiredTables: REQUIRED_SAAS_TABLES,
    missingTables,
    requiredTriggers: REQUIRED_SAAS_TRIGGERS,
    missingTriggers,
    ready: missingTables.length === 0 && missingTriggers.length === 0,
  };
}
